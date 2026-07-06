-- AlterTable
ALTER TABLE "Attendance" ADD COLUMN     "remarks" TEXT,
ADD COLUMN     "status" TEXT;

-- CreateTable
CREATE TABLE "OfficeSetting" (
    "id" SERIAL NOT NULL,
    "officeStart" TEXT NOT NULL,
    "officeEnd" TEXT NOT NULL,
    "graceMinutes" INTEGER NOT NULL DEFAULT 10,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OfficeSetting_pkey" PRIMARY KEY ("id")
);
