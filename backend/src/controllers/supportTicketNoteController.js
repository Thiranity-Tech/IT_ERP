const prisma = require("../prisma/client");
const { ROLES } = require("../constants/roles");

const noteUserSelect = {
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
const isCrmMember = (user) =>
  Boolean(user) && (user.roleId >= ROLES.SUPER_ADMIN || getDepartmentName(user).toUpperCase() === "CRM");

const canAccessTicket = async (req, ticketId) => {
  const ticket = await prisma.supportTicket.findUnique({
    where: {
      id: Number(ticketId)
    },
    select: {
      id: true,
      projectId: true,
      assignedToId: true,
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

  return (
    ticket.project?.departmentId === departmentId ||
    ticket.assignedTo?.departmentId === departmentId
  );
};

const getSupportTicketNotes = async (req, res) => {
  try {
    const { ticketId } = req.params;

    if (!(await canAccessTicket(req, ticketId))) {
      return res.status(403).json({
        error: "You can only view notes for tickets in your scope."
      });
    }

    const notes = await prisma.supportTicketNote.findMany({
      where: {
        ticketId: Number(ticketId)
      },
      include: {
        user: {
          select: noteUserSelect
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    res.json(notes);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

const createSupportTicketNote = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { note } = req.body;

    if (!note || !String(note).trim()) {
      return res.status(400).json({
        error: "Note text is required."
      });
    }

    if (!(await canAccessTicket(req, ticketId))) {
      return res.status(403).json({
        error: "You can only add notes to tickets in your scope."
      });
    }

    const requester = await getRequester(req);
    if (!isCrmMember(requester)) {
      return res.status(403).json({
        error: "Only CRM department users can add support ticket notes."
      });
    }

    const created = await prisma.supportTicketNote.create({
      data: {
        ticketId: Number(ticketId),
        userId: req.user.userId,
        note: String(note).trim()
      },
      include: {
        user: {
          select: noteUserSelect
        }
      }
    });

    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

const deleteSupportTicketNote = async (req, res) => {
  try {
    const note = await prisma.supportTicketNote.findUnique({
      where: {
        id: Number(req.params.id)
      }
    });

    if (!note) {
      return res.status(404).json({
        error: "Support ticket note not found."
      });
    }

    if (!(await canAccessTicket(req, note.ticketId))) {
      return res.status(403).json({
        error: "You can only delete notes for tickets in your scope."
      });
    }

    const requester = await getRequester(req);
    if (!isCrmMember(requester) && note.userId !== req.user.userId) {
      return res.status(403).json({
        error: "You can only delete your own support ticket notes."
      });
    }

    await prisma.supportTicketNote.delete({
      where: {
        id: note.id
      }
    });

    res.json({
      message: "Support ticket note deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

module.exports = {
  getSupportTicketNotes,
  createSupportTicketNote,
  deleteSupportTicketNote
};
