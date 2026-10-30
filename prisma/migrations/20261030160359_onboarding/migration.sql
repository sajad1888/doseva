-- CreateEnum
CREATE TYPE "Role" AS ENUM ('PATIENT', 'PATIENT_WITH_CAREGIVER', 'CAREGIVER');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "birthDate" TEXT,
ADD COLUMN     "companionPhone" TEXT,
ADD COLUMN     "fullName" TEXT,
ADD COLUMN     "onboardedAt" TIMESTAMP(3),
ADD COLUMN     "role" "Role";
