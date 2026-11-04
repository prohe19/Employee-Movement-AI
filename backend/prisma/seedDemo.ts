import { PrismaClient, type MovementType, type AnnouncementStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

/**
 * Demo-data seeder for showing off the dashboard. Generates ~45 realistic employee
 * movement announcements across the last 12 months (varied companies, sites,
 * departments, job-scale changes, statuses and upcoming effective dates).
 *
 * Idempotent: every announcement it makes has a "DEMO/" number and is deleted +
 * recreated on each run, so it never piles up or touches your real data.
 *
 *   npm run seed:demo          # add/refresh demo data
 *   npm run seed:demo -- --clear   # remove demo data and exit
 */

const prisma = new PrismaClient();

// Small deterministic RNG so runs are reproducible.
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(20261104);
const pick = <T>(arr: T[]): T => arr[Math.floor(rnd() * arr.length)];
const chance = (p: number) => rnd() < p;

const COMPANIES = [
  "PT Indo Tambangraya Megah, Tbk",
  "PT Indominco Mandiri",
  "PT Trubaindo Coal Mining",
  "PT Kitadin",
  "PT Jorong Barutama Greston",
  "PT Bharinto Ekatama",
  "PT Tambang Raya Usaha Tama",
  "PT Energi Batubara Perkasa",
  "PT Graha Panca Karsa",
  "PT Nusa Persada Resources",
];
const LOCATIONS = [
  "Jakarta",
  "Balikpapan",
  "Samarinda",
  "Bontang",
  "Sangatta",
  "Tenggarong",
  "Melak",
  "Embalut",
  "Tanjung Enim",
  "Jorong",
  "Berau",
  "Bharinto",
];
const DEPARTMENTS = [
  "Operations",
  "Mining Engineering",
  "Plant & Maintenance",
  "HSE",
  "Human Resources",
  "Finance & Accounting",
  "Supply Chain",
  "Information Technology",
  "Geology & Exploration",
  "External Relations",
];
const DIVISIONS = ["Operations", "Corporate Services", "Technical", "Commercial"];
const POSITIONS: Record<string, string[]> = {
  low: ["Officer", "Supervisor", "Engineer", "Analyst", "Foreman"],
  mid: ["Senior Engineer", "Section Head", "Superintendent", "Senior Analyst"],
  high: ["Manager", "Deputy Manager", "Department Head"],
  exec: ["General Manager", "Division Head", "Director"],
};
const FIRST = [
  "Budi", "Siti", "Agus", "Dewi", "Rizki", "Putri", "Andi", "Wayan", "Hendra", "Maya",
  "Fajar", "Indah", "Dimas", "Rina", "Yoga", "Lestari", "Bagus", "Sari", "Eko", "Nurul",
  "Arif", "Ratna", "Joko", "Mega", "Taufik", "Citra", "Rudi", "Ayu", "Gilang", "Fitri",
];
const LAST = [
  "Santoso", "Wijaya", "Pratama", "Lestari", "Nugroho", "Halim", "Saputra", "Kusuma",
  "Hartono", "Permata", "Siregar", "Maulana", "Anggraini", "Firmansyah", "Puspita", "Hidayat",
];

function titleFor(): string {
  return pick(["Mr.", "Mr.", "Mr.", "Ms.", "Mrs."]);
}
function name(): string {
  return `${pick(FIRST)} ${pick(LAST)}`;
}
function positionForJs(js: number): string {
  if (js >= 18) return pick(POSITIONS.exec);
  if (js >= 15) return pick(POSITIONS.high);
  if (js >= 12) return pick(POSITIONS.mid);
  return pick(POSITIONS.low);
}

const STATUSES: AnnouncementStatus[] = [
  "Draft",
  "RequiresReview",
  "ReadyToGenerate",
  "Finalized",
  "Published",
];

async function clearDemo() {
  const demo = await prisma.announcement.findMany({
    where: { number: { startsWith: "DEMO/" } },
    select: { id: true },
  });
  const ids = demo.map((d) => d.id);
  if (ids.length) {
    await prisma.announcementEmployee.deleteMany({ where: { announcementId: { in: ids } } });
    await prisma.announcement.deleteMany({ where: { id: { in: ids } } });
  }
  return ids.length;
}

async function main() {
  const clearOnly = process.argv.includes("--clear");
  const removed = await clearDemo();
  if (clearOnly) {
    console.log(`Removed ${removed} demo announcement(s). Done.`);
    return;
  }

  // Ensure the admin exists (as a fallback creator).
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@itmg.co.id";
  let admin = await prisma.user.findFirst({ where: { email: adminEmail } });
  if (!admin) admin = await prisma.user.findFirst();
  if (!admin) {
    admin = await prisma.user.create({
      data: {
        fullName: "HR Communication Admin",
        username: "hr_admin",
        email: adminEmail,
        passwordHash: await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!", 12),
        role: "admin",
      },
    });
  }

  // A handful of demo HR contributors so the "who entered the data" chart is populated.
  const hash = await bcrypt.hash("DemoUser123!", 12);
  const demoPeople = [
    { fullName: "Razani Putra", username: "razani" },
    { fullName: "Astagina Dewi", username: "astagina" },
    { fullName: "Bimo Nugroho", username: "bimo" },
    { fullName: "Nadia Salsabila", username: "nadia" },
  ];
  const creators = [admin];
  for (const person of demoPeople) {
    const u = await prisma.user.upsert({
      where: { username: person.username },
      update: {},
      create: { fullName: person.fullName, username: person.username, email: `${person.username}@itmg.co.id`, passwordHash: hash, role: "hr_user" },
    });
    creators.push(u);
  }
  const signatory = await prisma.signatory.findFirst({ where: { isActive: true } });

  const now = new Date();
  const TOTAL = 46;
  let created = 0;

  for (let i = 0; i < TOTAL; i++) {
    // Spread announcement dates across the last 12 months; a few land in the future.
    const future = chance(0.18);
    const dayOffset = future
      ? Math.floor(rnd() * 28) + 1 // 1..28 days ahead
      : -Math.floor(rnd() * 360); // within the last ~12 months
    const announcementDate = new Date(now.getTime() + dayOffset * 24 * 60 * 60 * 1000);

    const movementType: MovementType = chance(0.7) ? "Transfer" : "Assignment";

    // Status skews toward finalized/published for past items; drafts for future ones.
    const status: AnnouncementStatus = future
      ? pick<AnnouncementStatus>(["Draft", "RequiresReview", "ReadyToGenerate"])
      : chance(0.72)
        ? pick<AnnouncementStatus>(["Finalized", "Published"])
        : pick(STATUSES);

    const empCount = chance(0.55) ? 1 : chance(0.6) ? 2 : 3;
    const employees = [];
    for (let j = 0; j < empCount; j++) {
      const currentJs = 8 + Math.floor(rnd() * 10); // 8..17
      // ~45% promotion, ~45% lateral, ~10% down
      const r = rnd();
      const newJs = r < 0.45 ? Math.min(20, currentJs + 1 + Math.floor(rnd() * 2)) : r < 0.9 ? currentJs : Math.max(6, currentJs - 1);

      const fromCompany = pick(COMPANIES);
      let toCompany = fromCompany;
      if (movementType === "Transfer" && chance(0.65)) {
        do toCompany = pick(COMPANIES);
        while (toCompany === fromCompany && COMPANIES.length > 1);
      }
      const fromLoc = pick(LOCATIONS);
      let toLoc = fromLoc;
      do toLoc = pick(LOCATIONS);
      while (toLoc === fromLoc && LOCATIONS.length > 1);
      const fromDept = pick(DEPARTMENTS);
      const toDept = chance(0.5) ? pick(DEPARTMENTS) : fromDept;

      const effectiveDate = new Date(announcementDate.getTime() + (3 + Math.floor(rnd() * 25)) * 24 * 60 * 60 * 1000);
      const isAssignment = movementType === "Assignment";

      employees.push({
        title: titleFor(),
        employeeName: name(),
        movementType,
        currentJs,
        newJs,
        currentPosition: positionForJs(currentJs),
        newPosition: positionForJs(newJs),
        currentDepartment: fromDept,
        newDepartment: toDept,
        currentDivision: pick(DIVISIONS),
        newDivision: pick(DIVISIONS),
        currentCompany: fromCompany,
        newCompany: toCompany,
        currentLocation: fromLoc,
        newLocation: toLoc,
        effectiveDate: isAssignment ? null : effectiveDate,
        assignmentStartDate: isAssignment ? effectiveDate : null,
        assignmentEndDate: isAssignment
          ? new Date(effectiveDate.getTime() + (180 + Math.floor(rnd() * 360)) * 24 * 60 * 60 * 1000)
          : null,
      });
    }

    const seq = String(i + 1).padStart(3, "0");
    const mm = String(announcementDate.getUTCMonth() + 1).padStart(2, "0");
    await prisma.announcement.create({
      data: {
        number: `DEMO/${seq}/A/ITM/HR/${mm}/${announcementDate.getUTCFullYear()}`,
        announcementDate,
        city: pick(["Jakarta", "Balikpapan", "Samarinda"]),
        movementType,
        status,
        createdBy: pick(creators).id,
        signatoryId: signatory?.id ?? null,
        notes: "[demo data]",
        employees: { create: employees },
      },
    });
    created++;
  }

  console.log(`Demo seed complete: created ${created} announcements (removed ${removed} prior demo rows).`);
  console.log(`To remove demo data:  npm run seed:demo -- --clear`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
