import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/services/authService";

const prisma = new PrismaClient();

async function main() {
  await prisma.setting.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      numberingFormat: "{seq}/ A/ ITM/ HR/ {month}/ {year}",
      defaultCity: "Jakarta",
      defaultCompany: "PT Indo Tambangraya Megah, Tbk",
      dateFormat: "MMMM d, yyyy",
    },
  });

  const hrHead = await prisma.signatory.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Gunawan Wijaya",
      title: "Human Resources Head",
      jsMin: null,
      jsMax: 17,
      isActive: true,
    },
  });

  const presDir = await prisma.signatory.upsert({
    where: { id: "00000000-0000-0000-0000-000000000002" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000002",
      name: "Mulianto",
      title: "ITM President Director",
      jsMin: 18,
      jsMax: null,
      isActive: true,
    },
  });

  const template = await prisma.template.upsert({
    where: { code: "ITM-STANDARD-MOVEMENT" },
    update: {},
    create: {
      name: "ITM Standard — Employee Movement",
      code: "ITM-STANDARD-MOVEMENT",
      version: 1,
      companyScope: null,
      movementTypeScope: null,
      isActive: true,
      placeholders: {
        tokens: [
          "announcement_number",
          "announcement_title",
          "company_name",
          "employee_movement_sentence",
          "effective_date_sentence",
          "announcement_city",
          "announcement_date",
          "signature",
          "signatory_name",
          "signatory_title",
        ],
      },
    },
  });

  await prisma.setting.update({
    where: { id: 1 },
    data: { defaultTemplateId: template.id },
  });

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@itmg.co.id";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      fullName: "HR Communication Admin",
      username: "hr_admin",
      email: adminEmail,
      passwordHash: await hashPassword(adminPassword),
      role: "admin",
    },
  });

  console.log("Seed complete:");
  console.log(`  Signatories: ${hrHead.name} (JS<=17), ${presDir.name} (JS>17)`);
  console.log(`  Template: ${template.name}`);
  console.log(`  Admin login: ${adminEmail} / ${adminPassword} (change this password!)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
