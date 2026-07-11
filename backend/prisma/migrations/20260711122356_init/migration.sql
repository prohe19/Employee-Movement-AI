-- CreateEnum
CREATE TYPE "Role" AS ENUM ('hr_user', 'admin');

-- CreateEnum
CREATE TYPE "AnnouncementStatus" AS ENUM ('Draft', 'RequiresReview', 'ReadyToGenerate', 'Finalized', 'Published', 'Cancelled');

-- CreateEnum
CREATE TYPE "MovementType" AS ENUM ('Transfer', 'TemporaryAssignment', 'PermanentAssignment', 'Rotation', 'LateralMovement', 'ChangeOfPosition', 'ChangeOfLocation', 'ChangeOfCompany', 'ActingAssignment', 'EndOfAssignment', 'Other');

-- CreateEnum
CREATE TYPE "ExtractionConfidence" AS ENUM ('high', 'review', 'missing');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('pending', 'reviewed');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "googleSub" TEXT,
    "role" "Role" NOT NULL DEFAULT 'hr_user',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcements" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "announcementDate" TIMESTAMP(3) NOT NULL,
    "city" TEXT NOT NULL DEFAULT 'Jakarta',
    "templateId" TEXT,
    "movementType" "MovementType" NOT NULL,
    "status" "AnnouncementStatus" NOT NULL DEFAULT 'Draft',
    "narrationText" TEXT,
    "effectiveSentence" TEXT,
    "signatoryId" TEXT,
    "notes" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "pdfUrl" TEXT,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcement_employees" (
    "id" TEXT NOT NULL,
    "announcementId" TEXT NOT NULL,
    "employeeName" TEXT NOT NULL,
    "employeeId" TEXT,
    "movementType" "MovementType",
    "currentPosition" TEXT,
    "newPosition" TEXT,
    "currentJs" INTEGER,
    "newJs" INTEGER,
    "currentDepartment" TEXT,
    "newDepartment" TEXT,
    "currentDivision" TEXT,
    "newDivision" TEXT,
    "currentCostCenter" TEXT,
    "newCostCenter" TEXT,
    "currentCompany" TEXT,
    "newCompany" TEXT,
    "currentLocation" TEXT,
    "newLocation" TEXT,
    "effectiveDate" TIMESTAMP(3),
    "assignmentStartDate" TIMESTAMP(3),
    "assignmentEndDate" TIMESTAMP(3),

    CONSTRAINT "announcement_employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movement_forms" (
    "id" TEXT NOT NULL,
    "announcementId" TEXT,
    "fileUrl" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "pageCount" INTEGER,
    "extractionJson" JSONB,
    "extractionConfidence" DOUBLE PRECISION,
    "reviewStatus" "ReviewStatus" NOT NULL DEFAULT 'pending',
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movement_forms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "companyScope" TEXT,
    "movementTypeScope" "MovementType",
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "fileUrl" TEXT,
    "placeholders" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "signatories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "jsMin" INTEGER,
    "jsMax" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "signatureImageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "signatories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "numberingFormat" TEXT NOT NULL DEFAULT '{seq}/ A/ ITM/ HR/ {month}/ {year}',
    "defaultCity" TEXT NOT NULL DEFAULT 'Jakarta',
    "defaultCompany" TEXT NOT NULL DEFAULT 'PT Indo Tambangraya Megah, Tbk',
    "defaultTemplateId" TEXT,
    "dateFormat" TEXT NOT NULL DEFAULT 'MMMM d, yyyy',
    "retentionPolicy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_googleSub_key" ON "users"("googleSub");

-- CreateIndex
CREATE UNIQUE INDEX "announcements_number_key" ON "announcements"("number");

-- CreateIndex
CREATE INDEX "announcements_status_idx" ON "announcements"("status");

-- CreateIndex
CREATE INDEX "announcements_movementType_idx" ON "announcements"("movementType");

-- CreateIndex
CREATE UNIQUE INDEX "templates_code_key" ON "templates"("code");

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_signatoryId_fkey" FOREIGN KEY ("signatoryId") REFERENCES "signatories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcement_employees" ADD CONSTRAINT "announcement_employees_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "announcements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movement_forms" ADD CONSTRAINT "movement_forms_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "announcements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movement_forms" ADD CONSTRAINT "movement_forms_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
