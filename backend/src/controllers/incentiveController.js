const prisma = require("../prisma/client");
const { ROLES, PAYROLL_MANAGER_ROLE_IDS } = require("../constants/roles");
const { notifyUser } = require("../services/notificationService");

const incentiveInclude = {
  user: {
    select: {
      id: true,
      employeeId: true,
      name: true,
      email: true,
      roleId: true,
      teamId: true,
      departmentId: true
    }
  }
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

const getIncentiveScope = async (req) => {
  const userWhere = await getScopedUserWhere(req);
  return Object.keys(userWhere).length ? { user: userWhere } : {};
};

const ensureManager = (req) => {
  if (req.user.roleId < ROLES.MANAGER) {
    const error = new Error("Only managers, admins, and super admins can manage incentives.");
    error.status = 403;
    throw error;
  }
};

const getIncentives = async (req, res) => {
  try {
    const where = await getIncentiveScope(req);
    const incentives = await prisma.incentive.findMany({
      where,
      include: incentiveInclude,
      orderBy: {
        createdAt: "desc"
      }
    });

    res.json(incentives);
  } catch (error) {
    res.status(error.status || 500).json({
      error: error.message
    });
  }
};

const createIncentive = async (req, res) => {
  try {
    ensureManager(req);

    const { amount, reason, userId } = req.body;

    if (!amount || !reason || !userId) {
      return res.status(400).json({
        error: "Amount, reason, and employee are required."
      });
    }

    const userWhere = await getScopedUserWhere(req);
    const targetUser = await prisma.user.findFirst({
      where: {
        AND: [
          { id: Number(userId) },
          userWhere
        ]
      }
    });

    if (!targetUser) {
      return res.status(403).json({
        error: "Employee is outside your incentive scope."
      });
    }

    const incentive = await prisma.$transaction(async (tx) => {
      const createdIncentive = await tx.incentive.create({
        data: {
          amount: Number(amount),
          reason,
          userId: Number(userId)
        },
        include: incentiveInclude
      });

      await notifyUser(
        tx,
        Number(userId),
        `You have been given an incentive of ${Number(amount)} for ${reason}.`
      );

      return createdIncentive;
    });

    res.status(201).json(incentive);
  } catch (error) {
    res.status(error.status || 500).json({
      error: error.message
    });
  }
};

const getIncentiveById = async (req, res) => {
  try {
    const where = await getIncentiveScope(req);
    const incentive = await prisma.incentive.findFirst({
      where: {
        AND: [
          { id: Number(req.params.id) },
          where
        ]
      },
      include: incentiveInclude
    });

    if (!incentive) {
      return res.status(404).json({
        error: "Incentive not found."
      });
    }

    res.json(incentive);
  } catch (error) {
    res.status(error.status || 500).json({
      error: error.message
    });
  }
};

const updateIncentive = async (req, res) => {
  try {
    ensureManager(req);

    const existing = await getIncentiveByIdRecord(req, req.params.id);
    const { amount, reason, userId } = req.body;

    const targetUser = await prisma.user.findFirst({
      where: {
        AND: [
          { id: Number(userId) },
          await getScopedUserWhere(req)
        ]
      }
    });

    if (!targetUser) {
      return res.status(403).json({
        error: "Employee is outside your incentive scope."
      });
    }

    const incentive = await prisma.$transaction(async (tx) => {
      const updatedIncentive = await tx.incentive.update({
        where: {
          id: existing.id
        },
        data: {
          amount: Number(amount),
          reason,
          userId: Number(userId)
        },
        include: incentiveInclude
      });

      await notifyUser(
        tx,
        Number(userId),
        `Your incentive has been updated to ${Number(amount)} for ${reason}.`
      );

      return updatedIncentive;
    });

    res.json(incentive);
  } catch (error) {
    res.status(error.status || 500).json({
      error: error.message
    });
  }
};

const deleteIncentive = async (req, res) => {
  try {
    ensureManager(req);

    const existing = await getIncentiveByIdRecord(req, req.params.id);

    await prisma.incentive.delete({
      where: {
        id: existing.id
      }
    });

    res.json({
      message: "Incentive deleted successfully"
    });
  } catch (error) {
    res.status(error.status || 500).json({
      error: error.message
    });
  }
};

const getIncentiveByIdRecord = async (req, id) => {
  const where = await getIncentiveScope(req);
  const incentive = await prisma.incentive.findFirst({
    where: {
      AND: [
        { id: Number(id) },
        where
      ]
    }
  });

  if (!incentive) {
    const error = new Error("Incentive not found.");
    error.status = 404;
    throw error;
  }

  return incentive;
};

module.exports = {
  getIncentives,
  createIncentive,
  getIncentiveById,
  updateIncentive,
  deleteIncentive
};
