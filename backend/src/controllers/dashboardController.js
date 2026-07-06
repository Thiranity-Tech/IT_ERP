const prisma = require("../prisma/client");
const { ROLES } = require("../constants/roles");
const { PROJECT_STATUS_GROUPS, serializeProject } = require("../services/projectStatus");

const dashboardUserSelect = {
  id: true,
  employeeId: true,
  name: true,
  email: true
};

const getRequester = async (req) =>
  prisma.user.findUnique({
    where: {
      id: req.user.userId
    },
    select: {
      roleId: true,
      teamId: true,
      departmentId: true,
      team: {
        select: {
          departmentId: true
        }
      }
    }
  });

const getDepartmentId = (user) => user?.departmentId || user?.team?.departmentId || null;

const getSupportWhereForRole = async (req, requester, departmentId) => {
  if (req.user.roleId >= ROLES.ADMIN) {
    return {};
  }

  if (req.user.roleId === ROLES.USER) {
    return {
      OR: [
        { assignedToId: req.user.userId },
        {
          project: {
            tasks: {
              some: {
                userId: req.user.userId
              }
            }
          }
        }
      ]
    };
  }

  if (requester?.roleId === ROLES.TEAM_LEAD && requester.teamId) {
    return {
      OR: [
        { assignedToId: req.user.userId },
        {
          assignedTo: {
            teamId: requester.teamId
          }
        },
        {
          project: {
            tasks: {
              some: {
                user: {
                  teamId: requester.teamId
                }
              }
            }
          }
        }
      ]
    };
  }

  if (!departmentId) {
    return { id: -1 };
  }

  return {
    OR: [
      {
        project: {
          departmentId
        }
      },
      {
        assignedTo: {
          departmentId
        }
      },
      {
        assignedTo: {
          team: {
            departmentId
          }
        }
      }
    ]
  };
};

const getDashboardScope = async (req) => {
  if (req.user.roleId >= ROLES.ADMIN) {
    return {
      userWhere: {},
      projectWhere: {},
      leaveWhere: {},
      supportWhere: {}
    };
  }

  if (req.user.roleId === ROLES.USER) {
    return {
      userWhere: {
        id: req.user.userId
      },
      projectWhere: {
        tasks: {
          some: {
            userId: req.user.userId
          }
        }
      },
      leaveWhere: {
        userId: req.user.userId
      },
      supportWhere: await getSupportWhereForRole(req, null, null)
    };
  }

  const requester = await getRequester(req);

  if (!requester) {
    return {
      userWhere: { id: -1 },
      projectWhere: { id: -1 },
      leaveWhere: { id: -1 },
      supportWhere: { id: -1 }
    };
  }

  if (requester.roleId === ROLES.TEAM_LEAD && requester.teamId) {
    return {
      userWhere: {
        teamId: requester.teamId
      },
      projectWhere: {
        tasks: {
          some: {
            user: {
              teamId: requester.teamId
            }
          }
        }
      },
      leaveWhere: {
        user: {
          teamId: requester.teamId
        }
      },
      supportWhere: await getSupportWhereForRole(req, requester, getDepartmentId(requester))
    };
  }

  const departmentId = getDepartmentId(requester);

  if (!departmentId) {
    return {
      userWhere: { id: -1 },
      projectWhere: { id: -1 },
      leaveWhere: { id: -1 }
    };
  }

  return {
    userWhere: {
      OR: [
        { departmentId },
        {
          team: {
            departmentId
          }
        }
      ]
    },
    projectWhere: {
      departmentId
    },
    leaveWhere: {
      user: {
        is: {
          OR: [
            { departmentId },
            {
              team: {
                departmentId
              }
            }
          ]
        }
      }
    },
    supportWhere: await getSupportWhereForRole(req, requester, departmentId)
  };
};

const getPayrollWhere = (scope) =>
  Object.keys(scope.userWhere).length ? { user: { is: scope.userWhere } } : {};

const OPEN_TICKET_STATUSES = [
  "NEW",
  "SUBMITTED_FOR_APPROVAL",
  "APPROVED",
  "IN_PROGRESS",
  "ASSIGNED",
  "WORKING",
  "WAITING",
  "TESTING",
  "READY_FOR_DELIVERY"
];

const getDashboard = async (req, res) => {
  try {
    const scope = await getDashboardScope(req);
    const payrollWhere = getPayrollWhere(scope);
    const totalEmployees = await prisma.user.count({
      where: scope.userWhere
    });

    const totalProjects = await prisma.project.count({
      where: scope.projectWhere
    });

    const activeProjects = await prisma.project.count({
      where: {
        ...scope.projectWhere,
        status: {
          in: PROJECT_STATUS_GROUPS.active
        }
      }
    });

    const pendingLeaves = await prisma.leaveRequest.count({
      where: {
        status: "PENDING",
        ...scope.leaveWhere
      }
    });

    const openTickets = await prisma.supportTicket.count({
      where: {
        status: {
          in: OPEN_TICKET_STATUSES
        },
        ...scope.supportWhere
      }
    });

    const totalPayrollRecords = await prisma.payroll.count({
      where: payrollWhere
    });

    const totalPayrollPaid = await prisma.payroll.aggregate({
      where: payrollWhere,
      _sum: {
        finalSalary: true
      }
    });

    const recentProjects = await prisma.project.findMany({
      where: scope.projectWhere,
      take: 5,
      orderBy: {
        id: "desc"
      }
    });

    const recentLeaves = await prisma.leaveRequest.findMany({
      where: scope.leaveWhere,
      take: 5,
      orderBy: {
        id: "desc"
      },
      include: {
        user: {
          select: dashboardUserSelect
        }
      }
    });

    const recentTickets = await prisma.supportTicket.findMany({
      where: scope.supportWhere,
      take: 5,
      orderBy: {
        id: "desc"
      },
      include: {
        client: true
      }
    });

    const recentPayrolls = await prisma.payroll.findMany({
      where: payrollWhere,
      take: 5,
      orderBy: [
        { month: "desc" },
        { id: "desc" }
      ],
      include: {
        user: {
          select: dashboardUserSelect
        }
      }
    });

    res.json({
      totalEmployees,
      totalProjects,
      activeProjects,
      pendingLeaves,
      openTickets,
      totalPayrollRecords,
      totalPayrollPaid: totalPayrollPaid._sum.finalSalary || 0,
      recentProjects: recentProjects.map(serializeProject),
      recentLeaves,
      recentTickets,
      recentPayrolls
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};
const getAttendanceStats = async (req, res) => {
  try {
    const totalAttendanceRecords = await prisma.attendance.count();

    const lateEmployees = await prisma.attendance.count({
      where: {
        lateMinutes: {
          gt: 0
        }
      }
    });

    const overtimeEmployees = await prisma.attendance.count({
      where: {
        overtimeMinutes: {
          gt: 0
        }
      }
    });

    const checkedInEmployees = await prisma.attendance.count({
      where: {
        checkIn: {
          not: null
        }
      }
    });

    res.json({
      totalAttendanceRecords,
      checkedInEmployees,
      lateEmployees,
      overtimeEmployees
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};
const getProjectStats = async (req, res) => {
  try {
    const totalProjects = await prisma.project.count();

    const activeProjects = await prisma.project.count({
      where: {
        status: {
          in: PROJECT_STATUS_GROUPS.active
        }
      }
    });

    const completedProjects = await prisma.project.count({
      where: {
        status: {
          in: PROJECT_STATUS_GROUPS.completed
        }
      }
    });

    const pendingProjects = await prisma.project.count({
      where: {
        status: {
          in: PROJECT_STATUS_GROUPS.pending
        }
      }
    });

    res.json({
      totalProjects,
      activeProjects,
      completedProjects,
      pendingProjects
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};
const getEmployeeStats = async (req, res) => {
  try {
    const totalEmployees = await prisma.user.count();

    const totalAttendanceRecords = await prisma.attendance.count();

    const totalLeaves = await prisma.leaveRequest.count();

    const totalIncentives = await prisma.incentive.count();

    res.json({
      totalEmployees,
      totalAttendanceRecords,
      totalLeaves,
      totalIncentives
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};
const getPayrollStats = async (req, res) => {
  try {
    const totalPayrollRecords = await prisma.payroll.count();

    const totalSalaryPaid = await prisma.payroll.aggregate({
      _sum: {
        finalSalary: true
      }
    });

    const averageSalary = await prisma.payroll.aggregate({
      _avg: {
        finalSalary: true
      }
    });

    res.json({
      totalPayrollRecords,
      totalSalaryPaid: totalSalaryPaid._sum.finalSalary || 0,
      averageSalary: averageSalary._avg.finalSalary || 0
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};
const getSupportStats = async (req, res) => {
  try {
    const scope = await getDashboardScope(req);
    const totalClients = await prisma.client.count();

    const totalTickets = await prisma.supportTicket.count({
      where: scope.supportWhere
    });

    const openTickets = await prisma.supportTicket.count({
      where: {
        status: {
          in: OPEN_TICKET_STATUSES
        },
        ...scope.supportWhere
      }
    });

    const closedTickets = await prisma.supportTicket.count({
      where: {
        status: "CLOSED",
        ...scope.supportWhere
      }
    });

    res.json({
      totalClients,
      totalTickets,
      openTickets,
      closedTickets
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};
const getReportStats = async (req, res) => {
  try {
    const totalReports = await prisma.report.count();

    const recentReports = await prisma.report.findMany({
      take: 5,
      orderBy: {
        uploadedAt: "desc"
      }
    });

    res.json({
      totalReports,
      recentReports
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};
module.exports = {
  getDashboard,
  getAttendanceStats,
  getProjectStats,
  getEmployeeStats,
  getPayrollStats,
  getSupportStats,
  getReportStats
};
