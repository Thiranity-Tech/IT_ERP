const bcrypt = require("bcrypt");
const prisma = require("../src/prisma/client");
const { ROLES } = require("../src/constants/roles");

const demoPassword = "admin123";

const hashPassword = async () => bcrypt.hash(demoPassword, 10);

const main = async () => {
  const password = await hashPassword();

  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "Notification",
      "ProjectNote",
      "DailyScrum",
      "Incentive",
      "Payroll",
      "LeaveRequest",
      "Attendance",
      "Task",
      "SupportTicket",
      "Project",
      "Team",
      "User",
      "Client",
      "Department",
      "OfficeSetting",
      "Role"
    RESTART IDENTITY CASCADE;
  `);

  await prisma.$transaction(async (tx) => {
    await tx.role.createMany({
      data: [
        { id: ROLES.USER, name: "User" },
        { id: ROLES.TEAM_LEAD, name: "Team Lead" },
        { id: ROLES.MANAGER, name: "Manager" },
        { id: ROLES.ADMIN, name: "Admin" },
        { id: ROLES.SUPER_ADMIN, name: "Super Admin" }
      ]
    });

    const departments = await Promise.all([
      tx.department.create({ data: { name: "Engineering" } }),
      tx.department.create({ data: { name: "HR" } }),
      tx.department.create({ data: { name: "Finance" } }),
      tx.department.create({ data: { name: "CRM" } }),
      tx.department.create({ data: { name: "Sales" } })
    ]);

    const departmentByName = Object.fromEntries(departments.map((department) => [department.name, department]));

    const teams = await Promise.all([
      tx.team.create({ data: { name: "Platform", departmentId: departmentByName.Engineering.id } }),
      tx.team.create({ data: { name: "QA", departmentId: departmentByName.Engineering.id } }),
      tx.team.create({ data: { name: "Delivery", departmentId: departmentByName.Engineering.id } }),
      tx.team.create({ data: { name: "HR Ops", departmentId: departmentByName.HR.id } }),
      tx.team.create({ data: { name: "Finance Ops", departmentId: departmentByName.Finance.id } }),
      tx.team.create({ data: { name: "CRM Ops", departmentId: departmentByName.CRM.id } }),
      tx.team.create({ data: { name: "Sales Ops", departmentId: departmentByName.Sales.id } })
    ]);

    const teamByName = Object.fromEntries(teams.map((team) => [team.name, team]));

    const users = await Promise.all([
      tx.user.create({
        data: {
          employeeId: "SA001",
          name: "Super Admin",
          email: "superadmin@erp.com",
          password,
          roleId: ROLES.SUPER_ADMIN
        }
      }),
      tx.user.create({
        data: {
          employeeId: "AD001",
          name: "Admin User",
          email: "admin@erp.com",
          password,
          roleId: ROLES.ADMIN
        }
      }),
      tx.user.create({
        data: {
          employeeId: "M001",
          name: "Delete Manager",
          email: "delete.manager@erp.com",
          designation: "Operations Manager",
          password,
          roleId: ROLES.MANAGER,
          departmentId: departmentByName.Finance.id
        }
      }),
      tx.user.create({
        data: {
          employeeId: "M002",
          name: "Engineering Manager",
          email: "eng.manager@erp.com",
          designation: "Engineering Manager",
          password,
          roleId: ROLES.MANAGER,
          departmentId: departmentByName.Engineering.id
        }
      }),
      tx.user.create({
        data: {
          employeeId: "TL001",
          name: "Team Lead One",
          email: "lead@erp.com",
          designation: "Team Lead",
          password,
          roleId: ROLES.TEAM_LEAD,
          teamId: teamByName.Delivery.id
        }
      }),
      tx.user.create({
        data: {
          employeeId: "DEV001",
          name: "Developer One",
          email: "dev@erp.com",
          designation: "Software Developer",
          password,
          roleId: ROLES.USER,
          teamId: teamByName.Platform.id
        }
      }),
      tx.user.create({
        data: {
          employeeId: "QA001",
          name: "QA Tester",
          email: "qa@erp.com",
          designation: "QA Engineer",
          password,
          roleId: ROLES.USER,
          teamId: teamByName.QA.id
        }
      }),
      tx.user.create({
        data: {
          employeeId: "HR001",
          name: "HR Executive",
          email: "hr@erp.com",
          designation: "HR Executive",
          password,
          roleId: ROLES.USER,
          teamId: teamByName["HR Ops"].id
        }
      }),
      tx.user.create({
        data: {
          employeeId: "FIN001",
          name: "Finance Executive",
          email: "finance@erp.com",
          designation: "Finance Executive",
          password,
          roleId: ROLES.USER,
          teamId: teamByName["Finance Ops"].id
        }
      }),
      tx.user.create({
        data: {
          employeeId: "CRM001",
          name: "CRM Executive",
          email: "crm@erp.com",
          designation: "CRM Executive",
          password,
          roleId: ROLES.USER,
          teamId: teamByName["CRM Ops"].id
        }
      }),
      tx.user.create({
        data: {
          employeeId: "SAL001",
          name: "Sales Executive",
          email: "sales@erp.com",
          designation: "Sales Executive",
          password,
          roleId: ROLES.USER,
          teamId: teamByName["Sales Ops"].id
        }
      })
    ]);

    const userByEmployeeId = Object.fromEntries(users.map((user) => [user.employeeId, user]));

    const clients = await Promise.all([
      tx.client.create({
        data: {
          name: "Acme Corp",
          contactPerson: "Alice Green",
          email: "alice@acme.com",
          phone: "9876543210"
        }
      }),
      tx.client.create({
        data: {
          name: "Beta LLC",
          contactPerson: "Bob Stone",
          email: "bob@beta.com",
          phone: "9123456780"
        }
      })
    ]);

    const clientByName = Object.fromEntries(clients.map((client) => [client.name, client]));

    const projects = await Promise.all([
      tx.project.create({
        data: {
          name: "ERP Revamp",
          clientName: "Acme Corp",
          description: "Internal ERP workflow upgrade.",
          startDate: new Date("2026-06-01T00:00:00.000Z"),
          deadline: new Date("2026-07-31T00:00:00.000Z"),
          priority: "High",
          status: "Active",
          departmentId: departmentByName.Engineering.id
        }
      }),
      tx.project.create({
        data: {
          name: "Client Support Portal",
          clientName: "Beta LLC",
          description: "Support and CRM portal improvements.",
          startDate: new Date("2026-06-05T00:00:00.000Z"),
          deadline: new Date("2026-08-15T00:00:00.000Z"),
          priority: "Medium",
          status: "Pending",
          departmentId: departmentByName.CRM.id
        }
      })
    ]);

    const projectByName = Object.fromEntries(projects.map((project) => [project.name, project]));

    await Promise.all([
      tx.task.create({
        data: {
          title: "Build authentication screens",
          description: "Add login and password reset UI.",
          status: "Assigned",
          deadline: new Date("2026-07-01T00:00:00.000Z"),
          projectId: projectByName["ERP Revamp"].id,
          userId: userByEmployeeId.DEV001.id
        }
      }),
      tx.task.create({
        data: {
          title: "Prepare QA regression pack",
          description: "Document regression cases for the ERP revamp.",
          status: "Ready for Testing",
          deadline: new Date("2026-07-03T00:00:00.000Z"),
          projectId: projectByName["ERP Revamp"].id,
          userId: userByEmployeeId.QA001.id
        }
      }),
      tx.task.create({
        data: {
          title: "CRM ticket triage",
          description: "Review incoming support requests.",
          status: "Working",
          deadline: new Date("2026-07-02T00:00:00.000Z"),
          projectId: projectByName["Client Support Portal"].id,
          userId: userByEmployeeId.CRM001.id
        }
      })
    ]);

    await Promise.all([
      tx.attendance.create({
        data: {
          date: new Date("2026-06-24"),
          checkIn: new Date("2026-06-24T09:05:00.000Z"),
          checkOut: new Date("2026-06-24T18:15:00.000Z"),
          lateMinutes: 5,
          overtimeMinutes: 15,
          status: "PRESENT",
          remarks: "Regular workday",
          userId: userByEmployeeId.DEV001.id
        }
      }),
      tx.attendance.create({
        data: {
          date: new Date("2026-06-24"),
          checkIn: new Date("2026-06-24T09:00:00.000Z"),
          checkOut: new Date("2026-06-24T18:00:00.000Z"),
          lateMinutes: 0,
          overtimeMinutes: 0,
          status: "PRESENT",
          remarks: "QA sprint support",
          userId: userByEmployeeId.QA001.id
        }
      })
    ]);

    await Promise.all([
      tx.leaveRequest.create({
        data: {
          leaveType: "Casual Leave",
          reason: "Family work",
          startDate: new Date("2026-06-28T00:00:00.000Z"),
          endDate: new Date("2026-06-29T00:00:00.000Z"),
          status: "PENDING",
          userId: userByEmployeeId.DEV001.id
        }
      }),
      tx.leaveRequest.create({
        data: {
          leaveType: "Sick Leave",
          reason: "Flu",
          startDate: new Date("2026-06-20T00:00:00.000Z"),
          endDate: new Date("2026-06-21T00:00:00.000Z"),
          status: "APPROVED",
          userId: userByEmployeeId.QA001.id,
          approvedById: userByEmployeeId.M002.id
        }
      })
    ]);

    await Promise.all([
      tx.incentive.create({
        data: {
          amount: 2500,
          reason: "Excellent delivery",
          userId: userByEmployeeId.DEV001.id
        }
      }),
      tx.incentive.create({
        data: {
          amount: 1500,
          reason: "Bug-free sprint",
          userId: userByEmployeeId.QA001.id
        }
      })
    ]);

    await Promise.all([
      tx.dailyScrum.create({
        data: {
          yesterday: "Completed login screens.",
          today: "Working on task details page.",
          blockers: "Need API fields for notifications.",
          userId: userByEmployeeId.DEV001.id
        }
      }),
      tx.dailyScrum.create({
        data: {
          yesterday: "Prepared regression scenarios.",
          today: "Executing QA cycle.",
          blockers: "Waiting on build sign-off.",
          userId: userByEmployeeId.QA001.id
        }
      })
    ]);

    await Promise.all([
      tx.projectNote.create({
        data: {
          note: "Initial architecture reviewed.",
          projectId: projectByName["ERP Revamp"].id,
          userId: userByEmployeeId.TL001.id
        }
      }),
      tx.projectNote.create({
        data: {
          note: "Client portal scope frozen for sprint 1.",
          projectId: projectByName["Client Support Portal"].id,
          userId: userByEmployeeId.CRM001.id
        }
      })
    ]);

    await Promise.all([
      tx.supportTicket.create({
        data: {
          title: "Login page not loading",
          description: "Client reports a blank login page.",
          priority: "High",
          category: "Bug",
          sourceChannel: "Email",
          status: "SUBMITTED_FOR_APPROVAL",
          clientId: clientByName["Acme Corp"].id,
          assignedToId: userByEmployeeId.CRM001.id,
          projectId: projectByName["Client Support Portal"].id
        }
      }),
      tx.supportTicket.create({
        data: {
          title: "Add invoice export",
          description: "Client wants invoices exported as PDF.",
          priority: "Medium",
          category: "Feature",
          sourceChannel: "Portal",
          status: "IN_PROGRESS",
          clientId: clientByName["Beta LLC"].id,
          assignedToId: userByEmployeeId.TL001.id,
          projectId: projectByName["ERP Revamp"].id
        }
      })
    ]);

    await Promise.all([
      tx.payroll.create({
        data: {
          month: "2026-06",
          attendancePercentage: 95,
          overtimeAmount: 1200,
          incentiveAmount: 2500,
          lossOfPay: 0,
          finalSalary: 51200,
          userId: userByEmployeeId.DEV001.id
        }
      }),
      tx.payroll.create({
        data: {
          month: "2026-06",
          attendancePercentage: 100,
          overtimeAmount: 0,
          incentiveAmount: 1500,
          lossOfPay: 0,
          finalSalary: 41500,
          userId: userByEmployeeId.QA001.id
        }
      })
    ]);

    await Promise.all([
      tx.notification.create({
        data: {
          message: "Welcome to the ERP demo workspace.",
          userId: userByEmployeeId.DEV001.id
        }
      }),
      tx.notification.create({
        data: {
          message: "Your leave request is waiting for approval.",
          userId: userByEmployeeId.DEV001.id
        }
      }),
      tx.notification.create({
        data: {
          message: "CRM ticket Login page not loading is ready for review.",
          userId: userByEmployeeId.CRM001.id
        }
      })
    ]);

    await tx.officeSetting.create({
      data: {
        officeStart: "09:00",
        officeEnd: "18:00",
        graceMinutes: 10
      }
    });
  });

  console.log("Demo seed completed successfully.");
};

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
