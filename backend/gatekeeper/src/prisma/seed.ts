// Seeds the database with 1 admin, 2 guards, 2 buildings, 10 units, 5
// residents, and a handful of guest passes + access logs covering every
// status (active, used, expired, revoked) so the app looks populated and
// demo-able immediately after a fresh deploy.
//
// Lives under src/ (not prisma/) so it's compiled by the normal `nest build`
// alongside the rest of the app — running it straight from source via
// ts-node fails to resolve the generated Prisma client's nodenext-style
// import specifiers, the same issue worked around for the e2e tests. Run it
// from the compiled output instead: see docs/seed.md or the README for the
// exact command.
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import { DenyReason, PassType, ScanResult } from '../generated/prisma/enums';
import { cairoDayBounds } from '../shared/utils/cairo-time';
import { Role } from '../users/role.enum';

const SALT_ROUNDS = 10;
const SEED_PASSWORD = 'Password123!';
const DAY_MS = 24 * 60 * 60_000;

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: mustGetEnv('DATABASE_URL') }),
});

function mustGetEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required env var ${key}`);
  }
  return value;
}

function generateToken(): string {
  return randomBytes(24).toString('base64url');
}

async function createUser(
  email: string,
  passwordHash: string,
  fullName: string,
  role: Role,
) {
  return prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, passwordHash, fullName, role },
  });
}

async function main() {
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, SALT_ROUNDS);
  const { start: todayStart } = cairoDayBounds(new Date());

  // ---- users --------------------------------------------------------

  const admin = await createUser(
    'admin@gatekeeper.test',
    passwordHash,
    'Amina Hassan',
    Role.Admin,
  );
  const [guard1, guard2] = await Promise.all([
    createUser('guard1@gatekeeper.test', passwordHash, 'Karim Fathy', Role.Guard),
    createUser('guard2@gatekeeper.test', passwordHash, 'Mostafa Adel', Role.Guard),
  ]);
  const residentNames = [
    'Nour Ibrahim',
    'Youssef Mansour',
    'Mariam Tarek',
    'Sara El-Sayed',
    'Hassan Gaber',
  ];
  const residents = await Promise.all(
    residentNames.map((fullName, i) =>
      createUser(`resident${i + 1}@gatekeeper.test`, passwordHash, fullName, Role.Resident),
    ),
  );

  // ---- buildings + units ----------------------------------------------

  const buildingNames = ['Sunrise Tower', 'Marina Residences'];
  const buildings = await Promise.all(
    buildingNames.map((name) =>
      prisma.building.upsert({ where: { name }, update: {}, create: { name } }),
    ),
  );

  const units = await Promise.all(
    buildings.flatMap((building, buildingIndex) =>
      Array.from({ length: 5 }, (_, unitIndex) => {
        const number = `${buildingIndex + 1}0${unitIndex + 1}`;
        return prisma.unit.upsert({
          where: { buildingId_number: { buildingId: building.id, number } },
          update: {},
          create: { buildingId: building.id, number, floor: buildingIndex + 1 },
        });
      }),
    ),
  );

  // residents[0] has two units (belongs to more than one, per the brief);
  // the rest get one each. Two units (the last two) are left resident-free.
  const residentUnits: Array<{ residentIndex: number; unitIndex: number }> = [
    { residentIndex: 0, unitIndex: 0 },
    { residentIndex: 0, unitIndex: 5 },
    { residentIndex: 1, unitIndex: 1 },
    { residentIndex: 2, unitIndex: 2 },
    { residentIndex: 3, unitIndex: 6 },
    { residentIndex: 4, unitIndex: 7 },
  ];
  await Promise.all(
    residentUnits.map(({ residentIndex, unitIndex }) =>
      prisma.unitResident.upsert({
        where: {
          userId_unitId: {
            userId: residents[residentIndex].id,
            unitId: units[unitIndex].id,
          },
        },
        update: {},
        create: { userId: residents[residentIndex].id, unitId: units[unitIndex].id },
      }),
    ),
  );

  // ---- guest passes + access logs --------------------------------------
  // One of each status (active, used, expired, revoked) plus a recurring
  // pass, so every part of the UI has something to show.

  const activePass = await prisma.guestPass.create({
    data: {
      unitId: units[0].id,
      createdById: residents[0].id,
      guestName: 'Ahmed Hassan',
      type: PassType.one_time,
      token: generateToken(),
      validFrom: new Date(todayStart.getTime() + 2 * 60 * 60_000),
      validUntil: new Date(todayStart.getTime() + 20 * 60 * 60_000),
    },
  });

  const usedPassToken = generateToken();
  const usedPass = await prisma.guestPass.create({
    data: {
      unitId: units[0].id,
      createdById: residents[0].id,
      guestName: 'Laila Said',
      type: PassType.one_time,
      token: usedPassToken,
      validFrom: new Date(todayStart.getTime() - DAY_MS + 9 * 60 * 60_000),
      validUntil: new Date(todayStart.getTime() - DAY_MS + 18 * 60 * 60_000),
      usedAt: new Date(todayStart.getTime() - DAY_MS + 9.5 * 60 * 60_000),
    },
  });

  const expiredPass = await prisma.guestPass.create({
    data: {
      unitId: units[1].id,
      createdById: residents[1].id,
      guestName: 'Omar Khaled',
      type: PassType.one_time,
      token: generateToken(),
      validFrom: new Date(todayStart.getTime() - 3 * DAY_MS + 10 * 60 * 60_000),
      validUntil: new Date(todayStart.getTime() - 3 * DAY_MS + 16 * 60 * 60_000),
    },
  });

  const revokedPass = await prisma.guestPass.create({
    data: {
      unitId: units[2].id,
      createdById: residents[2].id,
      guestName: 'Dina Farouk',
      type: PassType.one_time,
      token: generateToken(),
      validFrom: new Date(todayStart.getTime() + 60 * 60_000),
      validUntil: new Date(todayStart.getTime() + 12 * 60 * 60_000),
      revokedAt: new Date(todayStart.getTime() - 60 * 60_000),
      revokedById: residents[2].id,
    },
  });

  const recurringPass = await prisma.guestPass.create({
    data: {
      unitId: units[6].id,
      createdById: residents[3].id,
      guestName: 'Cleaning Service',
      type: PassType.recurring,
      token: generateToken(),
      validFrom: todayStart,
      validUntil: new Date(todayStart.getTime() + 60 * DAY_MS),
      daysOfWeek: [0, 1, 2, 3, 4], // Sunday-Thursday
      dailyStartMin: 480, // 08:00
      dailyEndMin: 1020, // 17:00
    },
  });

  const expiredRecurringPass = await prisma.guestPass.create({
    data: {
      unitId: units[7].id,
      createdById: residents[4].id,
      guestName: 'Old Gardener',
      type: PassType.recurring,
      token: generateToken(),
      validFrom: new Date(todayStart.getTime() - 90 * DAY_MS),
      validUntil: new Date(todayStart.getTime() - 30 * DAY_MS),
      daysOfWeek: [1, 3], // Monday, Wednesday
      dailyStartMin: 420,
      dailyEndMin: 660,
    },
  });

  await prisma.accessLog.createMany({
    data: [
      {
        passId: usedPass.id,
        unitId: units[0].id,
        guardId: guard1.id,
        result: ScanResult.allowed,
        guestName: usedPass.guestName,
        scannedAt: usedPass.usedAt!,
      },
      {
        passId: usedPass.id,
        unitId: units[0].id,
        guardId: guard2.id,
        result: ScanResult.denied,
        reason: DenyReason.already_used,
        guestName: usedPass.guestName,
        scannedAt: new Date(usedPass.usedAt!.getTime() + 15 * 60_000),
      },
      {
        passId: expiredPass.id,
        unitId: units[1].id,
        guardId: guard1.id,
        result: ScanResult.denied,
        reason: DenyReason.expired,
        guestName: expiredPass.guestName,
        scannedAt: new Date(todayStart.getTime() - 2 * DAY_MS),
      },
      {
        passId: revokedPass.id,
        unitId: units[2].id,
        guardId: guard2.id,
        result: ScanResult.denied,
        reason: DenyReason.revoked,
        guestName: revokedPass.guestName,
        scannedAt: new Date(todayStart.getTime() + 2 * 60 * 60_000),
      },
      {
        passId: recurringPass.id,
        unitId: units[6].id,
        guardId: guard1.id,
        result: ScanResult.allowed,
        guestName: recurringPass.guestName,
        scannedAt: new Date(todayStart.getTime() + 9 * 60 * 60_000),
      },
      {
        passId: null,
        unitId: null,
        guardId: guard1.id,
        result: ScanResult.denied,
        reason: DenyReason.invalid_token,
        guestName: null,
        scannedAt: new Date(todayStart.getTime() + 11 * 60 * 60_000),
      },
    ],
  });

  console.log('Seed complete:');
  console.log(`  Admin:     admin@gatekeeper.test / ${SEED_PASSWORD}`);
  console.log(`  Guards:    guard1@gatekeeper.test, guard2@gatekeeper.test / ${SEED_PASSWORD}`);
  console.log(`  Residents: resident1..resident5@gatekeeper.test / ${SEED_PASSWORD}`);
  console.log(`  Buildings: ${buildings.map((b) => b.name).join(', ')}`);
  console.log(`  Units:     ${units.length}`);
  console.log(`  Passes:    active=${activePass.id}, used=${usedPass.id}, expired=${expiredPass.id}, revoked=${revokedPass.id}, recurring=${recurringPass.id}, expiredRecurring=${expiredRecurringPass.id}`);
  console.log(`  Also: ${admin.email} is the bootstrap admin.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
