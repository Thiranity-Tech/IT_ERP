const prisma = require("../prisma/client");
const { ROLES } = require("../constants/roles");

const eventUserSelect = {
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
      departmentId: true,
      teamId: true,
      department: {
        select: {
          name: true
        }
      },
      team: {
        select: {
          departmentId: true,
          department: {
            select: {
              name: true
            }
          }
        }
      }
    }
  });

const getDepartmentId = (user) => user?.departmentId || user?.team?.departmentId || null;
const getDepartmentName = (user) => user?.department?.name || user?.team?.department?.name || "";

const canAccessTicket = async (req, ticketId) => {
  const ticket = await prisma.supportTicket.findUnique({
    where: {
      id: Number(ticketId)
    },
    select: {
      id: true,
      project: {
        select: {
          departmentId: true
        }
      },
      assignedTo: {
        select: {
          departmentId: true,
          teamId: true
        }
      }
    }
  });

  if (!ticket) return false;
  if (req.user.roleId >= ROLES.ADMIN) return true;

  const requester = await getRequester(req);
  if (!requester) return false;

  if (requester.roleId === ROLES.TEAM_LEAD && requester.teamId) {
    return ticket.assignedTo?.teamId === requester.teamId;
  }

  const departmentId = getDepartmentId(requester);
  if (!departmentId) return false;

  return ticket.project?.departmentId === departmentId || ticket.assignedTo?.departmentId === departmentId;
};

const getSupportTicketEvents = async (req, res) => {
  try {
    const { ticketId } = req.params;

    if (!(await canAccessTicket(req, ticketId))) {
      return res.status(403).json({
        error: "You can only view ticket activity in your scope."
      });
    }

    const events = await prisma.supportTicketEvent.findMany({
      where: {
        ticketId: Number(ticketId)
      },
      include: {
        user: {
          select: eventUserSelect
        }
      },
      orderBy: {
        createdAt: "asc"
      }
    });

    res.json(events);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

module.exports = {
  getSupportTicketEvents
};
