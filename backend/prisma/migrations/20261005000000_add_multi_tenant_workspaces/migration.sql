-- Shared-link SaaS workspaces. Existing records remain readable by the
-- platform administrator; new company records are always scoped by companyId.
CREATE TABLE "Company" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "emailDomain" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'TRIAL',
    "trialEndsAt" TIMESTAMP(3) NOT NULL,
    "accessEndsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Company_emailDomain_key" ON "Company"("emailDomain");

ALTER TABLE "User" ADD COLUMN "companyId" INTEGER;
ALTER TABLE "User" ADD COLUMN "isPlatformAdmin" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "isWorkspaceOwner" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Department" ADD COLUMN "companyId" INTEGER;
ALTER TABLE "Team" ADD COLUMN "companyId" INTEGER;
ALTER TABLE "Project" ADD COLUMN "companyId" INTEGER;
ALTER TABLE "Task" ADD COLUMN "companyId" INTEGER;
ALTER TABLE "Attendance" ADD COLUMN "companyId" INTEGER;
ALTER TABLE "OfficeSetting" ADD COLUMN "companyId" INTEGER;
ALTER TABLE "LeaveRequest" ADD COLUMN "companyId" INTEGER;
ALTER TABLE "Payroll" ADD COLUMN "companyId" INTEGER;
ALTER TABLE "Incentive" ADD COLUMN "companyId" INTEGER;
ALTER TABLE "Client" ADD COLUMN "companyId" INTEGER;
ALTER TABLE "SupportTicket" ADD COLUMN "companyId" INTEGER;
ALTER TABLE "Notification" ADD COLUMN "companyId" INTEGER;
ALTER TABLE "SupportTicketNote" ADD COLUMN "companyId" INTEGER;
ALTER TABLE "SupportTicketEvent" ADD COLUMN "companyId" INTEGER;
ALTER TABLE "DailyScrum" ADD COLUMN "companyId" INTEGER;
ALTER TABLE "Report" ADD COLUMN "companyId" INTEGER;
ALTER TABLE "ProjectNote" ADD COLUMN "companyId" INTEGER;
ALTER TABLE "PasswordResetRequest" ADD COLUMN "companyId" INTEGER;

ALTER TABLE "Department" DROP CONSTRAINT IF EXISTS "Department_name_key";
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_employeeId_key";
CREATE UNIQUE INDEX "Department_companyId_name_key" ON "Department"("companyId", "name");
CREATE UNIQUE INDEX "User_companyId_employeeId_key" ON "User"("companyId", "employeeId");
CREATE INDEX "User_companyId_idx" ON "User"("companyId");

ALTER TABLE "User" ADD CONSTRAINT "User_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
