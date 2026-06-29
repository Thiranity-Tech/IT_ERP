const prisma = require("../prisma/client");
const { ROLES } = require("../constants/roles");

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

const getScrumScope = async (req) => {
  if (req.user.roleId >= ROLES.ADMIN) {
    return {};
  }

  if (req.user.roleId === ROLES.USER) {
    return {
      userId: req.user.userId
    };
  }

  const requester = await getRequester(req);

  if (!requester) {
    return {
      id: -1
    };
  }

  if (requester.roleId === ROLES.TEAM_LEAD && requester.teamId) {
    return {
      user: {
        teamId: requester.teamId
      }
    };
  }

  const departmentId = getDepartmentId(requester);

  if (!departmentId) {
    return {
      id: -1
    };
  }

  return {
    user: {
      OR: [
        { departmentId },
        {
          team: {
            departmentId
          }
        }
      ]
    }
  };
};

const getDailyScrums = async (req, res) => {
  try {
    const where = await getScrumScope(req);
    const scrums = await prisma.dailyScrum.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            employeeId: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.json(scrums);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};
const createDailyScrum = async (req, res) => {
  try {
    const {
      yesterday,
      today,
      blockers,
      userId
    } = req.body;

    const targetUserId = Number(userId);
    const targetUser = await prisma.user.findUnique({
      where: {
        id: targetUserId
      },
      select: {
        id: true,
        teamId: true,
        departmentId: true,
        team: {
          select: {
            departmentId: true
          }
        }
      }
    });

    if (!targetUser) {
      return res.status(404).json({
        error: "User not found."
      });
    }

    const requester = req.user.roleId >= ROLES.ADMIN ? null : await getRequester(req);
    const requesterDepartmentId = getDepartmentId(requester);
    const targetDepartmentId = getDepartmentId(targetUser);

    const allowed =
      req.user.roleId >= ROLES.ADMIN ||
      (req.user.roleId === ROLES.USER && targetUserId === req.user.userId) ||
      (requester?.roleId === ROLES.TEAM_LEAD && requester.teamId && targetUser.teamId === requester.teamId) ||
      (requesterDepartmentId && targetDepartmentId === requesterDepartmentId);

    if (!allowed) {
      return res.status(403).json({
        error: "You can create daily scrum only for users in your scope."
      });
    }

    const scrum = await prisma.dailyScrum.create({
      data: {
        yesterday,
        today,
        blockers,
        userId: targetUserId
      }
    });

    res.status(201).json(scrum);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};
const getDailyScrumById = async (req, res) => {
  try {
    const scrum = await prisma.dailyScrum.findUnique({
      where: {
        id: Number(req.params.id)
      },
      include: {
        user: {
          select: {
            id: true,
            employeeId: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!scrum) {
      return res.status(404).json({
        error: "Daily scrum not found."
      });
    }

    const scope = await getScrumScope(req);
    const visibleScrum = await prisma.dailyScrum.findFirst({
      where: {
        id: scrum.id,
        ...scope
      }
    });

    if (!visibleScrum) {
      return res.status(403).json({
        error: "You can only view daily scrums in your scope."
      });
    }

    res.json(scrum);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};
const updateDailyScrum = async (req, res) => {
  try {
    const {
      yesterday,
      today,
      blockers,
      userId
    } = req.body;

    const existing = await prisma.dailyScrum.findUnique({
      where: {
        id: Number(req.params.id)
      }
    });

    if (!existing) {
      return res.status(404).json({
        error: "Daily scrum not found."
      });
    }

    const scope = await getScrumScope(req);
    const visibleScrum = await prisma.dailyScrum.findFirst({
      where: {
        id: existing.id,
        ...scope
      }
    });

    if (!visibleScrum) {
      return res.status(403).json({
        error: "You can only update daily scrums in your scope."
      });
    }

    const scrum = await prisma.dailyScrum.update({
      where: {
        id: Number(req.params.id)
      },
      data: {
        yesterday,
        today,
        blockers,
        userId: Number(userId)
      }
    });

    res.json(scrum);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};
const deleteDailyScrum = async (req, res) => {
  try {
    const existing = await prisma.dailyScrum.findUnique({
      where: {
        id: Number(req.params.id)
      }
    });

    if (!existing) {
      return res.status(404).json({
        error: "Daily scrum not found."
      });
    }

    const scope = await getScrumScope(req);
    const visibleScrum = await prisma.dailyScrum.findFirst({
      where: {
        id: existing.id,
        ...scope
      }
    });

    if (!visibleScrum) {
      return res.status(403).json({
        error: "You can only delete daily scrums in your scope."
      });
    }

    await prisma.dailyScrum.delete({
      where: {
        id: Number(req.params.id)
      }
    });

    res.json({
      message: "Daily scrum deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};
module.exports = {
  getDailyScrums,
  createDailyScrum,
  getDailyScrumById,
  updateDailyScrum,
  deleteDailyScrum
};
