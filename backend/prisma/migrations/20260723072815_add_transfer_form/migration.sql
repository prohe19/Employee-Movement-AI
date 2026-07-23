-- CreateTable
CREATE TABLE "transfer_forms" (
    "id" TEXT NOT NULL,
    "docNumber" TEXT,
    "transferType" TEXT,
    "movementType" "MovementType" NOT NULL DEFAULT 'Transfer',
    "title" TEXT,
    "employeeName" TEXT NOT NULL,
    "employeeId" TEXT,
    "levelJs" INTEGER,
    "levelJp" INTEGER,
    "positionFrom" TEXT,
    "positionTo" TEXT,
    "costCenterFrom" TEXT,
    "costCenterTo" TEXT,
    "sectionFrom" TEXT,
    "sectionTo" TEXT,
    "departmentFrom" TEXT,
    "departmentTo" TEXT,
    "divisionFrom" TEXT,
    "divisionTo" TEXT,
    "locationFrom" TEXT,
    "locationTo" TEXT,
    "companyFrom" TEXT,
    "companyTo" TEXT,
    "effectiveDate" TIMESTAMP(3),
    "vMpp" BOOLEAN NOT NULL DEFAULT false,
    "vOrgStructureJe" BOOLEAN NOT NULL DEFAULT false,
    "vCompetencyGap" BOOLEAN NOT NULL DEFAULT false,
    "vJpGap" BOOLEAN NOT NULL DEFAULT false,
    "vYearInPosition" BOOLEAN NOT NULL DEFAULT false,
    "vTransferReason" BOOLEAN NOT NULL DEFAULT false,
    "vOthers" BOOLEAN NOT NULL DEFAULT false,
    "pdfUrl" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transfer_forms_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "transfer_forms_createdAt_idx" ON "transfer_forms"("createdAt");

-- AddForeignKey
ALTER TABLE "transfer_forms" ADD CONSTRAINT "transfer_forms_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
