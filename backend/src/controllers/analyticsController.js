const prisma = require("../prisma/client");
const { ROLES } = require("../constants/roles");
const { PROJECT_STATUS_GROUPS } = require("../services/projectStatus");
const ANNUAL_LEAVE_ALLOWANCE_DAYS = 12;

const toDateKey = (date) => date.toISOString().slice(0, 10);

const inclusiveDays = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  return Math.max(1, Math.floor((end - start) / 86400000) + 1);
};

const roundToOne = (value) => Math.round(value * 10) / 10;
const safeSlug = (value) =>
  String(value || "item")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "item";

const getRequester = async (req) =>
  prisma.user.findUnique({
    where: {
      id: req.user.userId
    },
    select: {
      departmentId: true,
      team: {
        select: {
          departmentId: true
        }
      }
    }
  });

const getDepartmentId = (user) => user?.departmentId || user?.team?.departmentId || null;

const getAnalyticsScope = async (req) => {
  if (req.user.roleId >= ROLES.ADMIN) {
    return {
      userWhere: {},
      projectWhere: {},
      attendanceWhere: {},
      leaveWhere: {}
    };
  }

  const requester = await getRequester(req);
  const departmentId = getDepartmentId(requester);

  if (!departmentId) {
    return {
      userWhere: { id: -1 },
      projectWhere: { id: -1 },
      attendanceWhere: { id: -1 },
      leaveWhere: { id: -1 }
    };
  }

  const userDepartmentWhere = {
    OR: [
      { departmentId },
      {
        team: {
          departmentId
        }
      }
    ]
  };

  return {
    userWhere: userDepartmentWhere,
    projectWhere: {
      departmentId
    },
    attendanceWhere: {
      user: {
        is: userDepartmentWhere
      }
    },
    leaveWhere: {
      user: {
        is: userDepartmentWhere
      }
    }
  };
};

const getPayrollWhere = (scope) =>
  Object.keys(scope.userWhere).length ? { user: { is: scope.userWhere } } : {};

const getProjectPriorityAnalytics = async (req, res) => {
  try {
    const scope = await getAnalyticsScope(req);
    const high = await prisma.project.count({
      where: { ...scope.projectWhere, priority: "High" }
    });

    const medium = await prisma.project.count({
      where: { ...scope.projectWhere, priority: "Medium" }
    });

    const low = await prisma.project.count({
      where: { ...scope.projectWhere, priority: "Low" }
    });

    res.json({
      high,
      medium,
      low
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};
const getLeaveStatusAnalytics = async (req, res) => {
  try {
    const scope = await getAnalyticsScope(req);
    const pending = await prisma.leaveRequest.count({
      where: {
        ...scope.leaveWhere,
        status: "PENDING"
      }
    });

    const approved = await prisma.leaveRequest.count({
      where: {
        ...scope.leaveWhere,
        status: "APPROVED"
      }
    });

    const rejected = await prisma.leaveRequest.count({
      where: {
        ...scope.leaveWhere,
        status: "REJECTED"
      }
    });

    res.json({
      pending,
      approved,
      rejected
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};
const getTicketStatusAnalytics = async (req, res) => {
  try {
    const statuses = [
      "NEW",
      "SUBMITTED_FOR_APPROVAL",
      "APPROVED",
      "IN_PROGRESS",
      "RESOLVED",
      "CLOSED",
      "REJECTED"
    ];

    const counts = await Promise.all(
      statuses.map((status) =>
        prisma.supportTicket.count({
          where: {
            status
          }
        })
      )
    );

    res.json(
      statuses.reduce((memo, status, index) => {
        memo[status.toLowerCase()] = counts[index];
        return memo;
      }, {})
    );
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};
const getPayrollSummaryAnalytics = async (req, res) => {
  try {
    const scope = await getAnalyticsScope(req);
    const payrollWhere = getPayrollWhere(scope);
    const payrollCount = await prisma.payroll.count({
      where: payrollWhere
    });

    const totalSalary = await prisma.payroll.aggregate({
      where: payrollWhere,
      _sum: {
        finalSalary: true
      }
    });

    const averageSalary = await prisma.payroll.aggregate({
      where: payrollWhere,
      _avg: {
        finalSalary: true
      }
    });

    const totalIncentives = await prisma.payroll.aggregate({
      where: payrollWhere,
      _sum: {
        incentiveAmount: true
      }
    });

    const totalLossOfPay = await prisma.payroll.aggregate({
      where: payrollWhere,
      _sum: {
        lossOfPay: true
      }
    });

    res.json({
      payrollCount,
      totalSalary: totalSalary._sum.finalSalary || 0,
      averageSalary: averageSalary._avg.finalSalary || 0,
      totalIncentives: totalIncentives._sum.incentiveAmount || 0,
      totalLossOfPay: totalLossOfPay._sum.lossOfPay || 0
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};
const getAttendanceAnalytics = async (req, res) => {
  try {
    const scope = await getAnalyticsScope(req);
    const currentYear = new Date().getFullYear();
    const yearStart = new Date(`${currentYear}-01-01T00:00:00.000Z`);
    const yearEnd = new Date(`${currentYear}-12-31T23:59:59.999Z`);

    const personalLeaveAllowance =
      req.user.roleId === ROLES.SUPER_ADMIN ? 0 : ANNUAL_LEAVE_ALLOWANCE_DAYS;

    const [totalEmployees, attendances, approvedLeaves] = await Promise.all([
      prisma.user.count({
        where: scope.userWhere
      }),
      prisma.attendance.findMany({
        where: {
          ...scope.attendanceWhere,
          date: {
            gte: yearStart,
            lte: yearEnd
          }
        },
        select: {
          date: true,
          checkIn: true,
          lateMinutes: true,
          overtimeMinutes: true,
          status: true
        },
        orderBy: {
          date: "asc"
        }
      }),
      prisma.leaveRequest.findMany({
        where: {
          userId: req.user.userId,
          status: "APPROVED",
          approvedById: {
            not: null
          },
          startDate: {
            lte: yearEnd
          },
          endDate: {
            gte: yearStart
          }
        },
        select: {
          startDate: true,
          endDate: true
        }
      })
    ]);

    const workingDays = new Set();
    const trendByDate = new Map();

    let presentRecords = 0;
    let lateArrivals = 0;
    let overtimeEntries = 0;
    let totalLateMinutes = 0;
    let totalOvertimeMinutes = 0;

    attendances.forEach((attendance) => {
      const dateKey = toDateKey(attendance.date);
      workingDays.add(dateKey);

      if (!trendByDate.has(dateKey)) {
        trendByDate.set(dateKey, {
          date: dateKey,
          lateArrivals: 0,
          overtimeEntries: 0,
          overtimeHours: 0
        });
      }

      const trend = trendByDate.get(dateKey);
      const status = String(attendance.status || "").toUpperCase();

      if (status === "PRESENT" || attendance.checkIn) {
        presentRecords += 1;
      }

      if (attendance.lateMinutes > 0) {
        lateArrivals += 1;
        totalLateMinutes += attendance.lateMinutes;
        trend.lateArrivals += 1;
      }

      if (attendance.overtimeMinutes > 0) {
        overtimeEntries += 1;
        totalOvertimeMinutes += attendance.overtimeMinutes;
        trend.overtimeEntries += 1;
        trend.overtimeHours += roundToOne(attendance.overtimeMinutes / 60);
      }
    });

    const totalWorkingDays = workingDays.size;
    const expectedAttendance = totalEmployees * totalWorkingDays;
    const attendancePercentage =
      expectedAttendance > 0
        ? roundToOne((presentRecords / expectedAttendance) * 100)
        : 0;

    const leaveDaysTaken = approvedLeaves.reduce(
      (total, leave) => total + inclusiveDays(leave.startDate, leave.endDate),
      0
    );
    const leaveAllowanceDays = personalLeaveAllowance;
    const remainingLeaveDays = Math.max(0, leaveAllowanceDays - leaveDaysTaken);
    const attendanceTrend = Array.from(trendByDate.values())
      .slice(-14)
      .map((item) => ({
        ...item,
        overtimeHours: roundToOne(item.overtimeHours)
      }));

    res.json({
      year: currentYear,
      totalEmployees,
      totalRecords: attendances.length,
      presentRecords,
      totalWorkingDays,
      attendancePercentage,
      annualLeaveAllowanceDays: ANNUAL_LEAVE_ALLOWANCE_DAYS,
      leaveAllowanceDays,
      leaveDaysTaken,
      remainingLeaveDays,
      lateArrivals,
      overtimeEntries,
      totalLateMinutes,
      totalOvertimeMinutes,
      totalOvertimeHours: roundToOne(totalOvertimeMinutes / 60),
      attendanceTrend
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};
const getClientAnalytics = async (req, res) => {
  try {
    const totalClients = await prisma.client.count();

    const totalTickets = await prisma.supportTicket.count();

    const ticketsPerClient = await prisma.client.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            tickets: true
          }
        }
      }
    });

    res.json({
      totalClients,
      totalTickets,
      ticketsPerClient
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};
const getMonthlyPayrollAnalytics = async (req, res) => {
  try {
    const scope = await getAnalyticsScope(req);
    const payrollByMonth = await prisma.payroll.groupBy({
      by: ["month"],
      where: getPayrollWhere(scope),
      _sum: {
        finalSalary: true,
        incentiveAmount: true,
        lossOfPay: true
      },
      orderBy: {
        month: "asc"
      }
    });

    res.json(payrollByMonth);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};
const getProjectStatusAnalytics = async (req, res) => {
  try {
    const scope = await getAnalyticsScope(req);
    const active = await prisma.project.count({
      where: {
        ...scope.projectWhere,
        status: {
          in: PROJECT_STATUS_GROUPS.active
        }
      }
    });

    const completed = await prisma.project.count({
      where: {
        ...scope.projectWhere,
        status: {
          in: PROJECT_STATUS_GROUPS.completed
        }
      }
    });

    const pending = await prisma.project.count({
      where: {
        ...scope.projectWhere,
        status: {
          in: PROJECT_STATUS_GROUPS.pending
        }
      }
    });

    res.json({
      active,
      completed,
      pending
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};
const getUserRoleAnalytics = async (req, res) => {
  try {
    const roleStats = await prisma.role.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            users: true
          }
        }
      }
    });

    res.json(roleStats);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};
const getTeamAnalytics = async (req, res) => {
  try {
    const teamStats = await prisma.team.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            users: true
          }
        }
      }
    });

    res.json(teamStats);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};
const getAnalyticsOverview = async (req, res) => {
  try {
    const scope = await getAnalyticsScope(req);
    const totalEmployees = await prisma.user.count({
      where: scope.userWhere
    });
    const totalProjects = await prisma.project.count({
      where: scope.projectWhere
    });
    const totalClients = await prisma.client.count();
    const totalTickets = await prisma.supportTicket.count();
    const totalPayrollRecords = await prisma.payroll.count({
      where: getPayrollWhere(scope)
    });

    res.json({
      totalEmployees,
      totalProjects,
      totalClients,
      totalTickets,
      totalPayrollRecords
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

const getEmployeeAnalytics = async (req, res) => {
  try {
    const { employeeId } = req.params;

    if (!employeeId) {
      return res.status(400).json({
        error: "Employee ID is required."
      });
    }

    const employee = await prisma.user.findUnique({
      where: {
        employeeId
      },
      include: {
        role: true,
        department: true,
        team: {
          include: {
            department: true
          }
        }
      }
    });

    if (!employee) {
      return res.status(404).json({
        error: "Employee not found."
      });
    }

    const scope = await getAnalyticsScope(req);
    if (req.user.roleId < ROLES.ADMIN) {
      const visibleEmployee = await prisma.user.findFirst({
        where: {
          AND: [
            { id: employee.id },
            scope.userWhere
          ]
        }
      });

      if (!visibleEmployee) {
        return res.status(403).json({
          error: "You can only view employee analytics in your scope."
        });
      }
    }

    const currentYear = new Date().getFullYear();
    const yearStart = new Date(`${currentYear}-01-01T00:00:00.000Z`);
    const yearEnd = new Date(`${currentYear}-12-31T23:59:59.999Z`);

    const [
      attendanceRecords,
      leaveRequests,
      payrollRecords,
      assignedTickets,
      tasks
    ] = await Promise.all([
      prisma.attendance.findMany({
        where: {
          userId: employee.id,
          date: {
            gte: yearStart,
            lte: yearEnd
          }
        },
        select: {
          date: true,
          status: true,
          lateMinutes: true,
          overtimeMinutes: true,
          checkIn: true
        }
      }),
      prisma.leaveRequest.findMany({
        where: {
          userId: employee.id,
          startDate: {
            lte: yearEnd
          },
          endDate: {
            gte: yearStart
          }
        },
        select: {
          status: true,
          startDate: true,
          endDate: true
        }
      }),
      prisma.payroll.findMany({
        where: {
          userId: employee.id,
          month: {
            gte: `${currentYear}-01`,
            lte: `${currentYear}-12`
          }
        },
        select: {
          finalSalary: true,
          month: true
        }
      }),
      prisma.supportTicket.findMany({
        where: {
          OR: [
            { assignedToId: employee.id },
            {
              project: {
                tasks: {
                  some: {
                    userId: employee.id
                  }
                }
              }
            }
          ]
        },
        select: {
          id: true,
          status: true,
          title: true,
          priority: true
        }
      }),
      prisma.task.findMany({
        where: {
          userId: employee.id
        },
        orderBy: [
          {
            assignedAt: "desc"
          },
          {
            id: "desc"
          }
        ],
        select: {
          id: true,
          status: true,
          projectId: true,
          assignedAt: true,
          completedAt: true,
          createdAt: true
        }
      })
    ]);

    const attendanceStats = attendanceRecords.reduce(
      (stats, record) => {
        const status = String(record.status || "").toUpperCase();
        if (status === "PRESENT" || record.checkIn) {
          stats.present += 1;
        }
        if (status === "ABSENT") {
          stats.absent += 1;
        }
        if ((record.lateMinutes || 0) > 0) {
          stats.lateArrivals += 1;
          stats.totalLateMinutes += record.lateMinutes || 0;
        }
        if ((record.overtimeMinutes || 0) > 0) {
          stats.overtimeEntries += 1;
          stats.totalOvertimeMinutes += record.overtimeMinutes || 0;
        }
        return stats;
      },
      {
        present: 0,
        absent: 0,
        lateArrivals: 0,
        overtimeEntries: 0,
        totalLateMinutes: 0,
        totalOvertimeMinutes: 0
      }
    );

    const leaveStats = leaveRequests.reduce(
      (stats, leave) => {
        const status = String(leave.status || "").toUpperCase();
        stats.total += 1;
        stats[status.toLowerCase()] = (stats[status.toLowerCase()] || 0) + 1;
        return stats;
      },
      {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0
      }
    );

    const payrollStats = payrollRecords.reduce(
      (stats, payroll) => {
        stats.totalSalary += payroll.finalSalary || 0;
        return stats;
      },
      {
        totalSalary: 0
      }
    );

    const ticketStats = assignedTickets.reduce(
      (stats, ticket) => {
        const status = String(ticket.status || "").toUpperCase();
        stats.total += 1;
        stats[status.toLowerCase()] = (stats[status.toLowerCase()] || 0) + 1;
        return stats;
      },
      {
        total: 0,
        new: 0,
        submitted_for_approval: 0,
        approved: 0,
        rejected: 0,
        in_progress: 0,
        assigned: 0,
        working: 0,
        waiting: 0,
        testing: 0,
        ready_for_delivery: 0,
        resolved: 0,
        closed: 0
      }
    );

    const projectIds = [...new Set(tasks.map((task) => task.projectId).filter(Boolean))];
    const employeeArchiveFolder = `docs/archives/employees/${employee.employeeId}-${safeSlug(employee.name)}`;
    const completedTaskRecords = tasks.filter((task) => String(task.status || "").toUpperCase() === "COMPLETED");
    const latestCompletedTask = [...completedTaskRecords].sort(
      (a, b) => new Date(b.completedAt || b.createdAt || 0) - new Date(a.completedAt || a.createdAt || 0)
    )[0] || null;

    res.json({
      employee: {
        id: employee.id,
        employeeId: employee.employeeId,
        name: employee.name,
        email: employee.email,
        phone: employee.phone,
        designation: employee.designation,
        salary: employee.salary,
        role: employee.role?.name,
        department: employee.department?.name || employee.team?.department?.name || "-",
        team: employee.team?.name || "-"
      },
      attendance: {
        records: attendanceRecords.length,
        ...attendanceStats,
        totalOvertimeHours: roundToOne(attendanceStats.totalOvertimeMinutes / 60)
      },
      leaves: {
        ...leaveStats,
        totalDays: leaveRequests.reduce(
          (total, leave) => total + inclusiveDays(leave.startDate, leave.endDate),
          0
        )
      },
      payroll: {
        records: payrollRecords.length,
        totalSalary: roundToOne(payrollStats.totalSalary),
        latestMonth: payrollRecords[0]?.month || null,
        latestSalary: payrollRecords[0]?.finalSalary || 0
      },
      tasks: {
        total: tasks.length,
        completed: tasks.filter((task) => String(task.status || "").toUpperCase() === "COMPLETED").length,
        pending: tasks.filter((task) => String(task.status || "").toUpperCase() !== "COMPLETED").length,
        projectCount: projectIds.length,
        archived: completedTaskRecords.length,
        lastAssignedAt: tasks[0]?.assignedAt || null,
        lastCompletedAt: latestCompletedTask?.completedAt || null
      },
      archives: {
        employeeFolder: employeeArchiveFolder,
        taskFolder: `${employeeArchiveFolder}/tasks`,
        taskArchiveCount: completedTaskRecords.length,
        taskArchiveLabel: latestCompletedTask
          ? `${latestCompletedTask.id}-${String(latestCompletedTask.status || "").toLowerCase()}`
          : null
      },
      tickets: ticketStats
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};
module.exports = {
  getProjectPriorityAnalytics,
  getLeaveStatusAnalytics,
  getTicketStatusAnalytics,
  getPayrollSummaryAnalytics,
  getAttendanceAnalytics,
  getClientAnalytics,
  getMonthlyPayrollAnalytics,
  getProjectStatusAnalytics,
  getUserRoleAnalytics,
  getTeamAnalytics,
  getAnalyticsOverview,
  getEmployeeAnalytics
};
