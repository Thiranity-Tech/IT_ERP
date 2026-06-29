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

const getUserWhere = async (req) => {
  if (req.user.roleId >= ROLES.ADMIN) {
    return {};
  }

  if (req.user.roleId === ROLES.USER) {
    return { id: req.user.userId };
  }

  const requester = await getRequester(req);

  if (!requester) {
    return { id: -1 };
  }

  if (requester.roleId === ROLES.TEAM_LEAD && requester.teamId) {
    return { teamId: requester.teamId };
  }

  const departmentId = getDepartmentId(requester);
  if (!departmentId) {
    return { id: -1 };
  }

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

const getProjectWhere = async (req) => {
  if (req.user.roleId >= ROLES.ADMIN) {
    return {};
  }

  if (req.user.roleId === ROLES.USER) {
    return {
      tasks: {
        some: {
          userId: req.user.userId
        }
      }
    };
  }

  const requester = await getRequester(req);
  if (!requester) {
    return { id: -1 };
  }

  if (requester.roleId === ROLES.TEAM_LEAD && requester.teamId) {
    return {
      tasks: {
        some: {
          user: {
            teamId: requester.teamId
          }
        }
      }
    };
  }

  const departmentId = getDepartmentId(requester);
  if (!departmentId) {
    return { id: -1 };
  }

  return { departmentId };
};

const getSupportWhere = async (req) => {
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

  const requester = await getRequester(req);
  if (!requester) {
    return { id: -1 };
  }

  if (requester.roleId === ROLES.TEAM_LEAD && requester.teamId) {
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

const globalSearch = async (req, res) => {
  try {
    const { q } = req.query;
    const [userWhere, projectWhere, supportWhere] = await Promise.all([
      getUserWhere(req),
      getProjectWhere(req),
      getSupportWhere(req)
    ]);

    const users = await prisma.user.findMany({
      where: {
        AND: [
          userWhere,
          {
            OR: [
              { name: { contains: q } },
              { email: { contains: q } }
            ]
          }
        ]
      }
    });

    const projects = await prisma.project.findMany({
      where: {
        AND: [
          projectWhere,
          {
            OR: [
              {
                name: {
                  contains: q,
                  mode: "insensitive"
                }
              },
              {
                clientName: {
                  contains: q,
                  mode: "insensitive"
                }
              }
            ]
          }
        ]
      }
    });

    const clients = await prisma.client.findMany({
      where: {
        name: {
          contains: q
        }
      }
    });

    const tickets = await prisma.supportTicket.findMany({
      where: {
        AND: [
          supportWhere,
          {
            OR: [
              {
                title: {
                  contains: q
                }
              },
              {
                status: {
                  contains: q
                }
              },
              {
                category: {
                  contains: q
                }
              }
            ]
          }
        ]
      }
    });

    res.json({
      totalResults:
        users.length +
        projects.length +
        clients.length +
        tickets.length,
      users,
      projects,
      clients,
      tickets
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

module.exports = {
  globalSearch
};
