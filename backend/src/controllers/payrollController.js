const prisma = require("../prisma/client");
const { ROLES } = require("../constants/roles");
const {
  notifyUser
} = require("../services/notificationService");

const payrollInclude = {
  user: {
    select: {
      id: true,
      employeeId: true,
      name: true,
      email: true,
      designation: true,
      salary: true,
      role: true,
      department: true,
      team: {
        include: {
          department: true
        }
      }
    }
  }
};

const roundMoney = (value) => Math.round((Number(value) || 0) * 100) / 100;

const parseMoney = (value, fallback = 0) => {
  if (value === undefined || value === null || value === "") return fallback;
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw new Error("Payroll amounts must be valid numbers.");
  }
  return parsed;
};

const monthRange = (month) => {
  if (!/^\d{4}-\d{2}$/.test(String(month || ""))) {
    throw new Error("Month must be in YYYY-MM format.");
  }

  const [year, monthNumber] = month.split("-").map(Number);
  const start = new Date(Date.UTC(year, monthNumber - 1, 1));
  const end = new Date(Date.UTC(year, monthNumber, 0, 23, 59, 59, 999));

  return { start, end };
};

const getWeekdaysInMonth = (start, end) => {
  let days = 0;
  const cursor = new Date(start);

  while (cursor <= end) {
    const day = cursor.getUTCDay();
    if (day !== 0 && day !== 6) days += 1;
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return days;
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

const getScopedUserWhere = async (req) => {
  if (req.user.roleId >= ROLES.ADMIN) return {};

  if (req.user.roleId === ROLES.USER) {
    return { id: req.user.userId };
  }

  const requester = await getRequester(req);
  if (!requester) return { id: -1 };

  if (requester.roleId === ROLES.TEAM_LEAD && requester.teamId) {
    return { teamId: requester.teamId };
  }

  const departmentId = getDepartmentId(requester);
  if (!departmentId) return { id: -1 };

  return {
    OR: [
      { departmentId },
      {
        team: {
          departmentId
        }
      }
    ]
  };
};

const getScopedPayrollWhere = async (req) => {
  const userWhere = await getScopedUserWhere(req);
  return Object.keys(userWhere).length ? { user: userWhere } : {};
};

const ensurePayrollManager = (req) => {
  if (req.user.roleId !== ROLES.SUPER_ADMIN) {
    const error = new Error("Only super admins can manage payroll.");
    error.status = 403;
    throw error;
  }
};

const ensureUserInScope = async (req, userId) => {
  const userWhere = await getScopedUserWhere(req);
  const user = await prisma.user.findFirst({
    where: {
      AND: [
        { id: Number(userId) },
        userWhere
      ]
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

  if (!user) {
    const error = new Error("Employee is outside your payroll scope.");
    error.status = 403;
    throw error;
  }

  return user;
};

const ensureBaseSalary = (user) => {
  const baseSalary = roundMoney(user?.salary || 0);
  if (baseSalary <= 0) {
    const error = new Error("Employee salary must be set by the super admin before generating payroll.");
    error.status = 400;
    throw error;
  }

  return baseSalary;
};

const calculatePayroll = async (user, month, overrides = {}) => {
  const { start, end } = monthRange(month);
  const baseSalary = ensureBaseSalary(user);
  const workingDays = getWeekdaysInMonth(start, end);
  const hourlyRate = workingDays > 0 ? baseSalary / workingDays / 8 : 0;

  const [attendanceRecords, incentives] = await Promise.all([
    prisma.attendance.findMany({
      where: {
        userId: user.id,
        date: {
          gte: start,
          lte: end
        }
      },
      select: {
        status: true,
        checkIn: true,
        overtimeMinutes: true
      }
    }),
    prisma.incentive.findMany({
      where: {
        userId: user.id,
        createdAt: {
          gte: start,
          lte: end
        }
      },
      select: {
        amount: true
      }
    })
  ]);

  const presentDays = attendanceRecords.filter((record) => {
    const status = String(record.status || "").toUpperCase();
    return status === "PRESENT" || Boolean(record.checkIn);
  }).length;
  const absentDays = attendanceRecords.filter(
    (record) => String(record.status || "").toUpperCase() === "ABSENT"
  ).length;
  const overtimeMinutes = attendanceRecords.reduce(
    (total, record) => total + (record.overtimeMinutes || 0),
    0
  );
  const recordedIncentives = incentives.reduce(
    (total, incentive) => total + (incentive.amount || 0),
    0
  );

  const attendancePercentage =
    workingDays > 0 ? Math.round((presentDays / workingDays) * 1000) / 10 : 0;
  const overtimeAmount =
    overrides.overtimeAmount !== undefined
      ? parseMoney(overrides.overtimeAmount)
      : roundMoney((overtimeMinutes / 60) * hourlyRate * 1.5);
  const incentiveAmount =
    overrides.incentiveAmount !== undefined
      ? parseMoney(overrides.incentiveAmount)
      : 0;
  const lossOfPay =
    overrides.lossOfPay !== undefined
      ? parseMoney(overrides.lossOfPay)
      : roundMoney(absentDays * (workingDays > 0 ? baseSalary / workingDays : 0));
  const finalSalary = roundMoney(baseSalary + overtimeAmount + incentiveAmount - lossOfPay);

  return {
      data: {
        month,
        baseSalary,
        attendancePercentage,
        overtimeAmount,
        incentiveAmount,
        lossOfPay,
      finalSalary,
      userId: user.id
    },
    details: {
      baseSalary,
      workingDays,
      presentDays,
      absentDays,
      overtimeMinutes,
      recordedIncentives,
      incentivePolicy: "Manual payroll incentive only"
    }
  };
};

const getPayrolls = async (req, res) => {
  try {
    const where = await getScopedPayrollWhere(req);
    const payrolls = await prisma.payroll.findMany({
      where,
      include: payrollInclude,
      orderBy: [
        { month: "desc" },
        { id: "desc" }
      ]
    });

    res.json(payrolls);
  } catch (error) {
    res.status(error.status || 500).json({
      error: error.message
    });
  }
};

const getPayrollSummary = async (req, res) => {
  try {
    const where = await getScopedPayrollWhere(req);
    const [payrollCount, salary, incentives, lossOfPay, averageSalary, latestPayroll] =
      await Promise.all([
        prisma.payroll.count({ where }),
        prisma.payroll.aggregate({
          where,
          _sum: {
            finalSalary: true
          }
        }),
        prisma.payroll.aggregate({
          where,
          _sum: {
            incentiveAmount: true
          }
        }),
        prisma.payroll.aggregate({
          where,
          _sum: {
            lossOfPay: true
          }
        }),
        prisma.payroll.aggregate({
          where,
          _avg: {
            finalSalary: true
          }
        }),
        prisma.payroll.findFirst({
          where,
          orderBy: [
            { month: "desc" },
            { id: "desc" }
          ],
          include: payrollInclude
        })
      ]);

    res.json({
      payrollCount,
      totalSalaryPaid: roundMoney(salary._sum.finalSalary || 0),
      totalIncentives: roundMoney(incentives._sum.incentiveAmount || 0),
      totalLossOfPay: roundMoney(lossOfPay._sum.lossOfPay || 0),
      averageSalary: roundMoney(averageSalary._avg.finalSalary || 0),
      latestPayroll
    });
  } catch (error) {
    res.status(error.status || 500).json({
      error: error.message
    });
  }
};

const createPayroll = async (req, res) => {
  try {
    ensurePayrollManager(req);

    const {
      month,
      attendancePercentage,
      overtimeAmount,
      incentiveAmount,
      lossOfPay,
      userId
    } = req.body;

    if (!month || !userId) {
      return res.status(400).json({
        error: "Month and employee are required."
      });
    }

    monthRange(month);
    const user = await ensureUserInScope(req, userId);
    const baseSalary = ensureBaseSalary(user);
    const finalSalary = roundMoney(
      baseSalary +
      parseMoney(overtimeAmount) +
      parseMoney(incentiveAmount) -
      parseMoney(lossOfPay)
    );

    const payroll = await prisma.payroll.create({
      data: {
        month,
        baseSalary,
        attendancePercentage: parseMoney(attendancePercentage),
        overtimeAmount: parseMoney(overtimeAmount),
        incentiveAmount: parseMoney(incentiveAmount),
        lossOfPay: parseMoney(lossOfPay),
        finalSalary,
        userId: Number(userId)
      },
      include: payrollInclude
    });

    await notifyUser(
      prisma,
      Number(userId),
      `Your payroll for ${month} has been prepared.`
    );

    res.status(201).json(payroll);
  } catch (error) {
    res.status(error.status || (error.message.includes("format") ? 400 : 500)).json({
      error: error.message
    });
  }
};

const generatePayroll = async (req, res) => {
  try {
    ensurePayrollManager(req);

    const { month, userId, overtimeAmount, incentiveAmount, lossOfPay } = req.body;

    if (!month || !userId) {
      return res.status(400).json({
        error: "Month and employee are required."
      });
    }

    const user = await ensureUserInScope(req, userId);
    const calculation = await calculatePayroll(user, month, {
      overtimeAmount,
      incentiveAmount,
      lossOfPay
    });

    const existingPayroll = await prisma.payroll.findFirst({
      where: {
        month,
        userId: user.id
      }
    });

    const payroll = existingPayroll
      ? await prisma.payroll.update({
          where: {
            id: existingPayroll.id
          },
          data: calculation.data,
          include: payrollInclude
        })
      : await prisma.payroll.create({
          data: calculation.data,
          include: payrollInclude
        });

    await notifyUser(
      prisma,
      user.id,
      `Your payroll for ${month} has been generated.`
    );

    res.status(existingPayroll ? 200 : 201).json({
      payroll,
      details: calculation.details
    });
  } catch (error) {
    const status =
      error.status || (error.message.includes("format") || error.message.includes("numbers") ? 400 : 500);

    res.status(status).json({
      error: error.message
    });
  }
};

const getPayrollById = async (req, res) => {
  try {
    const where = await getScopedPayrollWhere(req);
    const payroll = await prisma.payroll.findFirst({
      where: {
        AND: [
          { id: Number(req.params.id) },
          where
        ]
      },
      include: payrollInclude
    });

    if (!payroll) {
      return res.status(404).json({
        error: "Payroll record not found."
      });
    }

    res.json(payroll);
  } catch (error) {
    res.status(error.status || 500).json({
      error: error.message
    });
  }
};

const updatePayroll = async (req, res) => {
  try {
    ensurePayrollManager(req);

    const existing = await getVisiblePayroll(req, Number(req.params.id));
    const {
      month = existing.month,
      attendancePercentage = existing.attendancePercentage,
      overtimeAmount = existing.overtimeAmount,
      incentiveAmount = existing.incentiveAmount,
      lossOfPay = existing.lossOfPay,
      userId = existing.userId
    } = req.body;

    monthRange(month);
    const user = await ensureUserInScope(req, userId);
    const baseSalary = ensureBaseSalary(user);
    const finalSalary = roundMoney(
      baseSalary +
      parseMoney(overtimeAmount) +
      parseMoney(incentiveAmount) -
      parseMoney(lossOfPay)
    );

    const payroll = await prisma.payroll.update({
      where: {
        id: existing.id
      },
      data: {
        month,
        baseSalary,
        attendancePercentage: parseMoney(attendancePercentage),
        overtimeAmount: parseMoney(overtimeAmount),
        incentiveAmount: parseMoney(incentiveAmount),
        lossOfPay: parseMoney(lossOfPay),
        finalSalary,
        userId: Number(userId)
      },
      include: payrollInclude
    });

    res.json(payroll);
  } catch (error) {
    res.status(error.status || (error.message.includes("format") ? 400 : 500)).json({
      error: error.message
    });
  }
};

const deletePayroll = async (req, res) => {
  try {
    ensurePayrollManager(req);

    const payroll = await getVisiblePayroll(req, Number(req.params.id));

    await prisma.payroll.delete({
      where: {
        id: payroll.id
      }
    });

    res.json({
      message: "Payroll deleted successfully"
    });
  } catch (error) {
    res.status(error.status || 500).json({
      error: error.message
    });
  }
};

const getVisiblePayroll = async (req, id) => {
  const where = await getScopedPayrollWhere(req);
  const payroll = await prisma.payroll.findFirst({
    where: {
      AND: [
        { id },
        where
      ]
    }
  });

  if (!payroll) {
    const error = new Error("Payroll record not found.");
    error.status = 404;
    throw error;
  }

  return payroll;
};

module.exports = {
  getPayrolls,
  getPayrollSummary,
  createPayroll,
  generatePayroll,
  getPayrollById,
  updatePayroll,
  deletePayroll
};
