-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'resident', 'guard');

-- CreateEnum
CREATE TYPE "PassType" AS ENUM ('one_time', 'recurring');

-- CreateEnum
CREATE TYPE "ScanResult" AS ENUM ('allowed', 'denied');

-- CreateEnum
CREATE TYPE "DenyReason" AS ENUM ('invalid_token', 'revoked', 'already_used', 'expired', 'not_yet_valid', 'outside_time_window');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone" TEXT,
    "role" "Role" NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buildings" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "buildings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "units" (
    "id" UUID NOT NULL,
    "building_id" UUID NOT NULL,
    "number" TEXT NOT NULL,
    "floor" INTEGER,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unit_residents" (
    "user_id" UUID NOT NULL,
    "unit_id" UUID NOT NULL,
    "assigned_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "unit_residents_pkey" PRIMARY KEY ("user_id","unit_id")
);

-- CreateTable
CREATE TABLE "guest_passes" (
    "id" UUID NOT NULL,
    "unit_id" UUID NOT NULL,
    "created_by_id" UUID NOT NULL,
    "guest_name" TEXT NOT NULL,
    "type" "PassType" NOT NULL,
    "token" TEXT NOT NULL,
    "valid_from" TIMESTAMPTZ(3) NOT NULL,
    "valid_until" TIMESTAMPTZ(3) NOT NULL,
    "days_of_week" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "daily_start_min" INTEGER,
    "daily_end_min" INTEGER,
    "used_at" TIMESTAMPTZ(3),
    "revoked_at" TIMESTAMPTZ(3),
    "revoked_by_id" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "guest_passes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_logs" (
    "id" UUID NOT NULL,
    "pass_id" UUID,
    "unit_id" UUID,
    "guard_id" UUID NOT NULL,
    "result" "ScanResult" NOT NULL,
    "reason" "DenyReason",
    "guest_name" TEXT,
    "scanned_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "buildings_name_key" ON "buildings"("name");

-- CreateIndex
CREATE UNIQUE INDEX "units_building_id_number_key" ON "units"("building_id", "number");

-- CreateIndex
CREATE INDEX "unit_residents_unit_id_idx" ON "unit_residents"("unit_id");

-- CreateIndex
CREATE UNIQUE INDEX "guest_passes_token_key" ON "guest_passes"("token");

-- CreateIndex
CREATE INDEX "guest_passes_unit_id_valid_from_idx" ON "guest_passes"("unit_id", "valid_from");

-- CreateIndex
CREATE INDEX "guest_passes_valid_from_valid_until_idx" ON "guest_passes"("valid_from", "valid_until");

-- CreateIndex
CREATE INDEX "access_logs_scanned_at_idx" ON "access_logs"("scanned_at" DESC);

-- CreateIndex
CREATE INDEX "access_logs_unit_id_scanned_at_idx" ON "access_logs"("unit_id", "scanned_at");

-- CreateIndex
CREATE INDEX "access_logs_result_scanned_at_idx" ON "access_logs"("result", "scanned_at");

-- AddForeignKey
ALTER TABLE "units" ADD CONSTRAINT "units_building_id_fkey" FOREIGN KEY ("building_id") REFERENCES "buildings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unit_residents" ADD CONSTRAINT "unit_residents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unit_residents" ADD CONSTRAINT "unit_residents_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_passes" ADD CONSTRAINT "guest_passes_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_passes" ADD CONSTRAINT "guest_passes_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_passes" ADD CONSTRAINT "guest_passes_revoked_by_id_fkey" FOREIGN KEY ("revoked_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_logs" ADD CONSTRAINT "access_logs_pass_id_fkey" FOREIGN KEY ("pass_id") REFERENCES "guest_passes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_logs" ADD CONSTRAINT "access_logs_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_logs" ADD CONSTRAINT "access_logs_guard_id_fkey" FOREIGN KEY ("guard_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Hand-written CHECK constraints (Prisma's schema language can't express these)
ALTER TABLE "guest_passes"
  ADD CONSTRAINT "guest_passes_valid_range_chk" CHECK ("valid_until" > "valid_from"),
  ADD CONSTRAINT "guest_passes_daily_window_chk" CHECK (
    ("daily_start_min" IS NULL OR "daily_start_min" BETWEEN 0 AND 1439)
    AND ("daily_end_min" IS NULL OR "daily_end_min" BETWEEN 1 AND 1440)
    AND ("daily_start_min" IS NULL OR "daily_end_min" IS NULL OR "daily_end_min" > "daily_start_min")
  ),
  ADD CONSTRAINT "guest_passes_days_of_week_chk" CHECK ("days_of_week" <@ ARRAY[0,1,2,3,4,5,6]),
  ADD CONSTRAINT "guest_passes_recurring_chk" CHECK (
    "type" = 'one_time'
    OR (cardinality("days_of_week") > 0 AND "daily_start_min" IS NOT NULL AND "daily_end_min" IS NOT NULL)
  ),
  ADD CONSTRAINT "guest_passes_used_only_one_time_chk" CHECK ("used_at" IS NULL OR "type" = 'one_time');

ALTER TABLE "access_logs"
  ADD CONSTRAINT "access_logs_reason_chk" CHECK (
    ("result" = 'allowed' AND "reason" IS NULL) OR ("result" = 'denied' AND "reason" IS NOT NULL)
  );
