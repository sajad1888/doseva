-- CreateEnum
CREATE TYPE "MedicineForm" AS ENUM ('TABLET', 'CAPSULE', 'SYRUP', 'DROP', 'INJECTION', 'SACHET');

-- AlterTable
ALTER TABLE "Medicine" ADD COLUMN     "form" "MedicineForm" NOT NULL DEFAULT 'TABLET',
ADD COLUMN     "intervalDays" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "memberId" TEXT,
ALTER COLUMN "stock" DROP NOT NULL,
ALTER COLUMN "stock" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "Medicine_memberId_idx" ON "Medicine"("memberId");

-- AddForeignKey
ALTER TABLE "Medicine" ADD CONSTRAINT "Medicine_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "FamilyMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;
