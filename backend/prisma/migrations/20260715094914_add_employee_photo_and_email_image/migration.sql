-- AlterTable
ALTER TABLE "announcement_employees" ADD COLUMN     "photoKey" TEXT,
ADD COLUMN     "photoUrl" TEXT;

-- AlterTable
ALTER TABLE "announcements" ADD COLUMN     "emailImageUrl" TEXT;
