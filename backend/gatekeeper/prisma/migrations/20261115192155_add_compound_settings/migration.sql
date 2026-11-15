-- CreateTable
CREATE TABLE "compound_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "max_active_passes_per_unit_per_day" INTEGER,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "compound_settings_pkey" PRIMARY KEY ("id")
);
