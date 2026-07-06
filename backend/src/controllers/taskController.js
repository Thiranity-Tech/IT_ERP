const prisma = require("../prisma/client");
const { ROLES } = require("../constants/roles");
const {
  notifyUser
} = require("../services/notificationService");
const {
  archiveCompletedTask
} = require("../services/archiveService");

const getRequester = async (req) =>
  prisma.user.findUnique({
    where: {
      id: req.user.userId
    },
    select: {
      id: true,
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

const getTaskScope = async (req) => {
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
    return { id: -1 };
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
        user: {
          departmentId
        }
      },
      {
        user: {
          team: {
            departmentId
          }
        }
      }
    ]
  };
};

const ensureTaskAssignmentAllowed = async (req, projectId, userId) => {
  if (req.user.roleId >= ROLES.ADMIN) return;

  const requester = await getRequester(req);
  const [project, assignee] = await Promise.all([
    prisma.project.findUnique({
      where: {
        id: Number(projectId)
      },
      select: {
        departmentId: true
      }
    }),
    prisma.user.findUnique({
      where: {
        id: Number(userId)
      },
      select: {
        teamId: true,
        departmentId: true,
        team: {
          select: {
            departmentId: true
          }
        }
      }
    })
  ]);

  if (!requester || !project || !assignee) {
    throw new Error("Project or assigned user was not found.");
  }

  if (requester.roleId === ROLES.TEAM_LEAD) {
    const requesterDepartmentId = getDepartmentId(requester);
    if (assignee.teamId !== requester.teamId || project.departmentId !== requesterDepartmentId) {
      throw new Error("Team Leads can assign tasks only inside their team and department.");
    }

    return;
  }

  const requesterDepartmentId = getDepartmentId(requester);
  const assigneeDepartmentId = getDepartmentId(assignee);

  if (!requesterDepartmentId || project.departmentId !== requesterDepartmentId || assigneeDepartmentId !== requesterDepartmentId) {
    throw new Error("Managers can assign tasks only inside their department.");
  }
};

const getTasks = async (req, res) => {
  try {
    const where = await getTaskScope(req);

    const tasks = await prisma.task.findMany({
      where,
      include: {
        project: true,
        user: {
          select: {
            id: true,
            employeeId: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        id: "asc"
      }
    });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};
const createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      status,
      deadline,
      projectId,
      userId
    } = req.body;

    if (!title || !status || !deadline || !projectId || !userId) {
      return res.status(400).json({
        error: "Title, status, deadline, project, and assigned user are required."
      });
    }

    await ensureTaskAssignmentAllowed(req, projectId, userId);

    const task = await prisma.$transaction(async (tx) => {
      const createdTask = await tx.task.create({
        data: {
          title,
          description,
          status,
          deadline: new Date(deadline),
          assignedAt: new Date(),
          completedAt: String(status || "").toUpperCase() === "COMPLETED" ? new Date() : null,
          projectId: Number(projectId),
          userId: Number(userId)
        }
      });

      await notifyUser(
        tx,
        Number(userId),
        `You have been assigned task "${title}".`
      );

      if (String(status || "").toUpperCase() === "COMPLETED") {
        try {
          await archiveCompletedTask(tx, createdTask.id);
        } catch (archiveError) {
          console.warn("Task archive failed:", archiveError.message);
        }
      }

      return createdTask;
    });

    res.status(201).json(task);
  } catch (error) {
    if (error.message.includes("assign tasks") || error.message.includes("was not found")) {
      return res.status(403).json({
        error: error.message
      });
    }

    res.status(500).json({
      error: error.message
    });
  }
};
const getTaskById = async (req, res) => {
  try {
    const task = await prisma.task.findUnique({
      where: {
        id: Number(req.params.id)
      },
      include: {
        project: true,
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

    if (!task) {
      return res.status(404).json({
        error: "Task not found."
      });
    }

    const scope = await getTaskScope(req);
    const visibleTask = await prisma.task.findFirst({
      where: {
        id: task.id,
        ...scope
      }
    });

    if (!visibleTask) {
      return res.status(403).json({
        error: "You can only view tasks in your scope."
      });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};
const updateTask = async (req, res) => {
  try {
    const {
      title,
      description,
      status,
      deadline,
      projectId,
      userId
    } = req.body;

    if (!title || !status || !deadline || !projectId || !userId) {
      return res.status(400).json({
        error: "Title, status, deadline, project, and assigned user are required."
      });
    }

    await ensureTaskAssignmentAllowed(req, projectId, userId);

    const scope = await getTaskScope(req);
    const existing = await prisma.task.findFirst({
      where: {
        id: Number(req.params.id),
        ...scope
      }
    });

    if (!existing) {
      return res.status(403).json({
        error: "You can update only tasks in your scope."
      });
    }

    const task = await prisma.$transaction(async (tx) => {
      const updatedTask = await tx.task.update({
        where: {
          id: Number(req.params.id)
        },
        data: {
          title,
          description,
          status,
          deadline: new Date(deadline),
          assignedAt: Number(existing.userId) !== Number(userId) ? new Date() : existing.assignedAt,
          completedAt:
            String(status || "").toUpperCase() === "COMPLETED"
              ? existing.completedAt || new Date()
              : existing.completedAt,
          projectId: Number(projectId),
          userId: Number(userId)
        }
      });

      if (String(status || "").toUpperCase() === "COMPLETED" && String(existing.status || "").toUpperCase() !== "COMPLETED") {
        try {
          await archiveCompletedTask(tx, updatedTask.id);
        } catch (archiveError) {
          console.warn("Task archive failed:", archiveError.message);
        }
      }

      if (Number(existing.userId) !== Number(userId)) {
        await notifyUser(
          tx,
          Number(userId),
          `You have been assigned task "${title}".`
        );
      }

      return updatedTask;
    });

    res.json(task);
  } catch (error) {
    if (error.message.includes("assign tasks") || error.message.includes("was not found")) {
      return res.status(403).json({
        error: error.message
      });
    }

    res.status(500).json({
      error: error.message
    });
  }
};
const deleteTask = async (req, res) => {
  try {
    const scope = await getTaskScope(req);
    const existing = await prisma.task.findFirst({
      where: {
        id: Number(req.params.id),
        ...scope
      }
    });

    if (!existing) {
      return res.status(403).json({
        error: "You can delete only tasks in your scope."
      });
    }

    await prisma.task.delete({
      where: {
        id: Number(req.params.id)
      }
    });

    res.json({
      message: "Task deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};
module.exports = {
  getTasks,
  createTask,
  getTaskById,
  updateTask,
  deleteTask
};
