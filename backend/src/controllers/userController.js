const bcrypt = require("bcrypt");
const prisma = require("../prisma/client");
const {
  ROLES,
  roleRequiresDepartment,
  roleRequiresTeam
} = require("../constants/roles");
const {
  notifyUser,
  getRoleName,
  describeTeam
} = require("../services/notificationService");

const userInclude = {
  role: true,
  team: {
    include: {
      department: true
    }
  },
  department: true,
};

const withoutPassword = (user) => {
  if (!user) return user;
  const { password, ...userData } = user;
  return userData;
};

const normalizeAssignment = (roleId, teamId, departmentId) => {
  if (roleRequiresTeam(roleId)) {
    if (!teamId) {
      throw new Error("Team is required for User and Team Lead roles.");
    }

    return {
      teamId: Number(teamId),
      departmentId: null
    };
  }

  if (roleRequiresDepartment(roleId)) {
    if (!departmentId) {
      throw new Error("Department is required for Manager role.");
    }

    return {
      teamId: null,
      departmentId: Number(departmentId)
    };
  }

  return {
    teamId: null,
    departmentId: null
  };
};

const isDuplicateError = (error) => error?.code === "P2002";

const getUserScope = async (req) => {
  if (!req.user || req.user.roleId >= ROLES.ADMIN) {
    return {};
  }

  const requester = await prisma.user.findUnique({
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

  if (!requester) return { id: -1 };

  if (requester.roleId === ROLES.TEAM_LEAD && requester.teamId) {
    return { teamId: requester.teamId };
  }

  const departmentId = requester.departmentId || requester.team?.departmentId;

  if (departmentId) {
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
  }

  return { id: -1 };
};

const getUsers = async (req, res) => {
  try {
    const where = await getUserScope(req);
    const users = await prisma.user.findMany({
      where,
      include: userInclude,
      orderBy: [
        {
          roleId: "desc"
        },
        {
          id: "asc"
        }
      ]
    });

    res.json(users.map(withoutPassword));
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

const createUser = async (req, res) => {
  try {
    const {
      employeeId,
      name,
      email,
      phone,
      designation,
      salary,
      baseSalary,
      password,
      roleId,
      teamId,
      departmentId
    } = req.body;

    if (!employeeId || !name || !email || !password || !roleId) {
      return res.status(400).json({
        error: "Employee ID, name, email, password, and role are required."
      });
    }

    const numericRoleId = Number(roleId);
    const assignment = normalizeAssignment(numericRoleId, teamId, departmentId);
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          employeeId,
          name,
          email,
          phone: phone || null,
          designation: designation || null,
          salary:
            salary === "" || salary === undefined || salary === null
              ? (baseSalary === "" || baseSalary === undefined || baseSalary === null ? null : Number(baseSalary))
              : Number(salary),
          password: hashedPassword,
          roleId: numericRoleId,
          teamId: assignment.teamId,
          departmentId: assignment.departmentId
        },
        include: userInclude
      });

      if (createdUser.teamId) {
        await notifyUser(
          tx,
          createdUser.id,
          createdUser.roleId === ROLES.TEAM_LEAD
            ? `You have been assigned as Team Lead for ${describeTeam(createdUser)}.`
            : `You have been added to ${describeTeam(createdUser)}.`
        );
      } else if (createdUser.roleId === ROLES.TEAM_LEAD) {
        await notifyUser(
          tx,
          createdUser.id,
          "You have been assigned as Team Lead."
        );
      }

      return createdUser;
    });

    res.status(201).json(withoutPassword(user));
  } catch (error) {
    if (isDuplicateError(error)) {
      return res.status(409).json({
        error: "Employee ID or email already exists."
      });
    }

    if (error.message.includes("required")) {
      return res.status(400).json({
        error: error.message
      });
    }

    res.status(500).json({
      error: error.message
    });
  }
};
const getUserById = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: Number(req.params.id)
      },
      include: userInclude
    });

    res.json(withoutPassword(user));
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: error.message
    });
  }
};
const updateUser = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      designation,
      salary,
      baseSalary,
      roleId,
      teamId,
      departmentId
    } = req.body;

    if (!name || !email || !roleId) {
      return res.status(400).json({
        error: "Name, email, and role are required."
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        id: Number(req.params.id)
      },
      include: userInclude
    });

    if (!existingUser) {
      return res.status(404).json({
        error: "User not found."
      });
    }

    const numericRoleId = Number(roleId);
    const assignment = normalizeAssignment(numericRoleId, teamId, departmentId);

    const user = await prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: {
          id: Number(req.params.id)
        },
        data: {
          name,
          email,
          phone: phone || null,
          designation: designation || null,
          salary:
            salary === "" || salary === undefined || salary === null
              ? (baseSalary === "" || baseSalary === undefined || baseSalary === null ? null : Number(baseSalary))
              : Number(salary),
          roleId: numericRoleId,
          teamId: assignment.teamId,
          departmentId: assignment.departmentId
        },
        include: userInclude
      });

      const roleChanged = Number(existingUser.roleId) !== numericRoleId;
      const teamChanged = Number(existingUser.teamId || 0) !== Number(assignment.teamId || 0);

      if (roleChanged && numericRoleId === ROLES.TEAM_LEAD) {
        await notifyUser(
          tx,
          updatedUser.id,
          `You have been promoted to Team Lead${updatedUser.team?.name ? ` for ${updatedUser.team.name}` : ""}.`
        );
      } else if (roleChanged) {
        await notifyUser(
          tx,
          updatedUser.id,
          `Your role has been updated to ${getRoleName(numericRoleId)}.`
        );
      }

      if (teamChanged && updatedUser.teamId) {
        await notifyUser(
          tx,
          updatedUser.id,
          `You have been added to ${describeTeam(updatedUser)}.`
        );
      }

      return updatedUser;
    });

    res.json(withoutPassword(user));
  } catch (error) {
    if (isDuplicateError(error)) {
      return res.status(409).json({
        error: "Email already exists."
      });
    }

    if (error.message.includes("required")) {
      return res.status(400).json({
        error: error.message
      });
    }

    res.status(500).json({
      error: error.message
    });
  }
};
const deleteUser = async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const forceDelete = String(req.query.force || "").toLowerCase() === "true";
    const [tasksCount, attendanceCount, leaveCount, payrollCount, incentiveCount, notificationCount, scrumCount, noteCount, assignedTicketsCount] =
      await Promise.all([
        prisma.task.count({ where: { userId } }),
        prisma.attendance.count({ where: { userId } }),
        prisma.leaveRequest.count({ where: { userId } }),
        prisma.payroll.count({ where: { userId } }),
        prisma.incentive.count({ where: { userId } }),
        prisma.notification.count({ where: { userId } }),
        prisma.dailyScrum.count({ where: { userId } }),
        prisma.projectNote.count({ where: { userId } }),
        prisma.supportTicket.count({ where: { assignedToId: userId } })
      ]);

    const dependentCount =
      tasksCount +
      attendanceCount +
      leaveCount +
      payrollCount +
      incentiveCount +
      notificationCount +
      scrumCount +
      noteCount +
      assignedTicketsCount;

    if (dependentCount > 0 && !forceDelete) {
      return res.status(409).json({
        error:
          "This user cannot be deleted because related records still exist. Reassign or remove the linked tasks, attendance, leave requests, payrolls, incentives, notifications, daily scrums, notes, or tickets first."
      });
    }

    if (dependentCount > 0 && forceDelete) {
      await prisma.$transaction(async (tx) => {
        await Promise.all([
          tx.task.deleteMany({ where: { userId } }),
          tx.attendance.deleteMany({ where: { userId } }),
          tx.leaveRequest.deleteMany({ where: { userId } }),
          tx.payroll.deleteMany({ where: { userId } }),
          tx.incentive.deleteMany({ where: { userId } }),
          tx.notification.deleteMany({ where: { userId } }),
          tx.dailyScrum.deleteMany({ where: { userId } }),
          tx.projectNote.deleteMany({ where: { userId } })
        ]);
      });
    }

    await prisma.user.delete({
      where: {
        id: userId
      }
    });

    res.json({
      message: "User deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};
const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    const scope = await getUserScope(req);

    const users = await prisma.user.findMany({
      where: {
        AND: [
          scope,
          {
            OR: [
              {
                name: {
                  contains: q
                }
              },
              {
                email: {
                  contains: q
                }
              }
            ]
          }
        ]
      },
      orderBy: [
        {
          roleId: "desc"
        },
        {
          id: "asc"
        }
      ]
    });

    res.json(users.map(withoutPassword));
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};
module.exports = { getUsers, createUser, getUserById, updateUser, deleteUser, searchUsers };
