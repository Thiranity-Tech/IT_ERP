const prisma = require("../prisma/client");
const { ROLES } = require("../constants/roles");
const {
  notifyUsers,
  notifyUser,
  getUsersByRoleScope
} = require("../services/notificationService");
const { archiveSupportTicket } = require("../services/archiveService");

const CRM_REVIEWER_ROLE_IDS = [ROLES.MANAGER];
const SUPPORT_TICKET_STATUSES = new Set([
  "NEW",
  "WAITING_FOR_CLIENT",
  "SUBMITTED_FOR_APPROVAL",
  "APPROVED",
  "REJECTED",
  "IN_PROGRESS",
  "ASSIGNED",
  "WORKING",
  "WAITING",
  "TESTING",
  "READY_FOR_DELIVERY",
  "RESOLVED",
  "CLOSED"
]);

const supportTicketInclude = {
  client: true,
  assignedTo: {
    select: {
      id: true,
      employeeId: true,
      name: true,
      email: true
    }
  },
  project: true
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
const isCrmManager = (user) =>
  Boolean(user) && (user.roleId >= ROLES.SUPER_ADMIN || (user.roleId === ROLES.MANAGER && getDepartmentName(user).toUpperCase() === "CRM"));
const isFinalSupportStatus = (status) => ["RESOLVED", "CLOSED"].includes(String(status || "").toUpperCase());
const isWorkInProgressStatus = (status) =>
  ["APPROVED", "ASSIGNED", "WORKING", "WAITING", "TESTING", "READY_FOR_DELIVERY"].includes(
    String(status || "").toUpperCase()
  );
const isClosedSupportStatus = (status) => ["RESOLVED", "CLOSED"].includes(String(status || "").toUpperCase());
const createTicketEvent = (tx, data) =>
  tx.supportTicketEvent.create({
    data: {
      ticketId: data.ticketId,
      userId: data.userId,
      action: data.action,
      detail: data.detail || null,
      fromStatus: data.fromStatus || null,
      toStatus: data.toStatus || null
    }
  });

const getCrmDepartmentId = async () => {
  const crmDepartment = await prisma.department.findFirst({
    where: {
      name: {
        equals: "CRM",
        mode: "insensitive"
      }
    },
    select: {
      id: true
    }
  });

  return crmDepartment?.id || null;
};

const getSupportScope = async (req) => {
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

const notifyCRMReviewers = async (client, message) =>
  notifyUsers(
    client,
    await getUsersByRoleScope(client, {
      roleIds: CRM_REVIEWER_ROLE_IDS,
      departmentId: await getCrmDepartmentId()
    }),
    message
  );

const getSupportTickets = async (req, res) => {
  try {
    const where = await getSupportScope(req);
    const tickets = await prisma.supportTicket.findMany({
      where,
      include: supportTicketInclude,
      orderBy: {
        createdAt: "desc"
      }
    });

    res.json(tickets);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

const createSupportTicket = async (req, res) => {
  try {
    const {
      title,
      description,
      clientId,
      priority = "Low",
      category = "Support",
      sourceChannel = "Portal",
      assignedToId = null,
      projectId = null
    } = req.body;

    const requester = await prisma.user.findUnique({
      where: {
        id: req.user.userId
      },
      select: {
        roleId: true,
        departmentId: true,
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

    if (!isCrmMember(requester)) {
      return res.status(403).json({
        error: "Only CRM department users can create support tickets."
      });
    }

    if (!title || !clientId) {
      return res.status(400).json({
        error: "Title and client are required."
      });
    }

    const normalizedStatus = "SUBMITTED_FOR_APPROVAL";

    if (!SUPPORT_TICKET_STATUSES.has(normalizedStatus)) {
      return res.status(400).json({
        error: `Status must be one of: ${[...SUPPORT_TICKET_STATUSES].join(", ")}.`
      });
    }

    const ticket = await prisma.$transaction(async (tx) => {
      const createdTicket = await tx.supportTicket.create({
        data: {
          title,
          description: description || null,
          status: normalizedStatus,
          priority,
          category,
          sourceChannel,
          rejectionReason: null,
          clientId: Number(clientId),
          assignedToId: assignedToId ? Number(assignedToId) : null,
          projectId: projectId ? Number(projectId) : null
        },
        include: supportTicketInclude
      });

      await notifyCRMReviewers(
        tx,
        {
          text: `New support ticket "${title}" has been created with status ${normalizedStatus}.`,
          targetPath: `/support-tickets/${createdTicket.id}`,
          recordType: "support-ticket",
          recordId: createdTicket.id
        }
      );

      await tx.supportTicketNote.create({
        data: {
          ticketId: createdTicket.id,
          userId: req.user.userId,
          note: `Ticket created with status ${normalizedStatus}.`
        }
      });

      await createTicketEvent(tx, {
        ticketId: createdTicket.id,
        userId: req.user.userId,
        action: "CREATED",
        detail: `Ticket created with status ${normalizedStatus}.`,
        toStatus: normalizedStatus
      });

      if (createdTicket.assignedToId) {
        await notifyUser(
          tx,
          createdTicket.assignedToId,
          `You have been assigned support ticket "${title}".`
        );
      }

      try {
        await archiveSupportTicket(tx, createdTicket.id, {
          action: "created",
          creatorId: req.user.userId
        });
      } catch (archiveError) {
        console.warn("Support ticket archive failed:", archiveError.message);
      }

      return createdTicket;
    });

    res.status(201).json(ticket);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

const getSupportTicketById = async (req, res) => {
  try {
    const ticket = await prisma.supportTicket.findUnique({
      where: {
        id: Number(req.params.id)
      },
      include: supportTicketInclude
    });

    if (!ticket) {
      return res.status(404).json({
        error: "Support ticket not found."
      });
    }

    const scope = await getSupportScope(req);
    const visibleTicket = await prisma.supportTicket.findFirst({
      where: {
        id: ticket.id,
        ...scope
      }
    });

    if (!visibleTicket) {
      return res.status(403).json({
        error: "You can only view support tickets in your scope."
      });
    }

    res.json(ticket);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

const updateSupportTicket = async (req, res) => {
  try {
    const existing = await prisma.supportTicket.findUnique({
      where: {
        id: Number(req.params.id)
      }
    });

    if (!existing) {
      return res.status(404).json({
        error: "Support ticket not found."
      });
    }

    const scope = await getSupportScope(req);
    const visibleTicket = await prisma.supportTicket.findFirst({
      where: {
        id: existing.id,
        ...scope
      }
    });

    if (!visibleTicket) {
      return res.status(403).json({
        error: "You can only update support tickets in your scope."
      });
    }

    const requester = await getRequester(req);
    if (!isCrmMember(requester)) {
      return res.status(403).json({
        error: "Only CRM department users can update support tickets."
      });
    }

    const {
      title,
      description,
      status,
      clientId,
      priority,
      category,
      sourceChannel,
      rejectionReason,
      assignedToId,
      projectId
    } = req.body;

    const nextStatus = status ? String(status).toUpperCase() : existing.status;
    if (!SUPPORT_TICKET_STATUSES.has(nextStatus)) {
      return res.status(400).json({
        error: `Status must be one of: ${[...SUPPORT_TICKET_STATUSES].join(", ")}.`
      });
    }

    if (existing.status === "SUBMITTED_FOR_APPROVAL" && !["APPROVED", "REJECTED"].includes(nextStatus)) {
      return res.status(400).json({
        error: "Submitted tickets can only move to Approved or Rejected."
      });
    }

    if (existing.status === "APPROVED" && nextStatus !== "IN_PROGRESS") {
      return res.status(400).json({
        error: "Approved tickets should be moved to In Progress before completion."
      });
    }

    if (isWorkInProgressStatus(existing.status) && nextStatus !== "IN_PROGRESS") {
      return res.status(400).json({
        error: "Work tickets can only move to In Progress before they are closed."
      });
    }

    if (existing.status === "IN_PROGRESS" && !isClosedSupportStatus(nextStatus)) {
      return res.status(400).json({
        error: "In progress tickets can only be marked Completed or Resolved."
      });
    }

    if (isFinalSupportStatus(existing.status)) {
      return res.status(400).json({
        error: "Completed tickets cannot be changed."
      });
    }

    if (nextStatus === "REJECTED" && !rejectionReason && existing.status !== "REJECTED") {
      return res.status(400).json({
        error: "Rejection reason is required when closing a ticket as rejected."
      });
    }

    const statusChangedToFinal = ["APPROVED", "REJECTED"].includes(nextStatus) && existing.status !== nextStatus;
    if (statusChangedToFinal && !isCrmManager(requester)) {
      return res.status(403).json({
        error: "Only the CRM manager can approve or reject support tickets."
      });
    }

    const nextAssignedToId =
      assignedToId === undefined ? existing.assignedToId : assignedToId ? Number(assignedToId) : null;

    const ticket = await prisma.$transaction(async (tx) => {
      const updatedTicket = await tx.supportTicket.update({
        where: {
          id: Number(req.params.id)
        },
        data: {
          title,
          description,
          status: nextStatus,
          clientId: clientId ? Number(clientId) : existing.clientId,
          priority: priority || existing.priority,
          category: category || existing.category,
          sourceChannel: sourceChannel || existing.sourceChannel,
          rejectionReason: rejectionReason === undefined ? existing.rejectionReason : rejectionReason,
          assignedToId: nextAssignedToId,
          projectId: projectId === undefined ? existing.projectId : projectId ? Number(projectId) : null
        },
        include: supportTicketInclude
      });

      if (existing.status !== nextStatus) {
        await notifyCRMReviewers(
          tx,
          {
            text: `Support ticket "${updatedTicket.title}" moved to ${nextStatus}.`,
            targetPath: `/support-tickets/${updatedTicket.id}`,
            recordType: "support-ticket",
            recordId: updatedTicket.id
          }
        );

        await tx.supportTicketNote.create({
          data: {
            ticketId: updatedTicket.id,
            userId: req.user.userId,
            note: `Status changed from ${existing.status} to ${nextStatus}.`
          }
        });

        await createTicketEvent(tx, {
          ticketId: updatedTicket.id,
          userId: req.user.userId,
          action: "STATUS_CHANGED",
          detail: `Status changed from ${existing.status} to ${nextStatus}.`,
          fromStatus: existing.status,
          toStatus: nextStatus
        });
      }

      if (nextAssignedToId && Number(existing.assignedToId) !== Number(nextAssignedToId)) {
        await notifyUser(
          tx,
          Number(nextAssignedToId),
          `You have been assigned support ticket "${updatedTicket.title}".`
        );

        await createTicketEvent(tx, {
          ticketId: updatedTicket.id,
          userId: req.user.userId,
          action: "ASSIGNED",
          detail: `Assigned to user ${nextAssignedToId}.`,
          fromStatus: existing.status,
          toStatus: nextStatus
        });
      }

      if (nextStatus === "REJECTED" && rejectionReason) {
        await notifyCRMReviewers(
          tx,
          {
            text: `Support ticket "${updatedTicket.title}" was rejected: ${rejectionReason}.`,
            targetPath: `/support-tickets/${updatedTicket.id}`,
            recordType: "support-ticket",
            recordId: updatedTicket.id
          }
        );

        await createTicketEvent(tx, {
          ticketId: updatedTicket.id,
          userId: req.user.userId,
          action: "REJECTED",
          detail: rejectionReason,
          fromStatus: existing.status,
          toStatus: nextStatus
        });
      }

      if (isFinalSupportStatus(nextStatus)) {
        try {
          await archiveSupportTicket(tx, updatedTicket.id, {
            action: nextStatus === "CLOSED" ? "completed" : "resolved",
            performedById: req.user.userId
          });
        } catch (archiveError) {
          console.warn("Support ticket archive failed:", archiveError.message);
        }
      }

      return updatedTicket;
    });

    res.json(ticket);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

const deleteSupportTicket = async (req, res) => {
  try {
    const existing = await prisma.supportTicket.findUnique({
      where: {
        id: Number(req.params.id)
      }
    });

    if (!existing) {
      return res.status(404).json({
        error: "Support ticket not found."
      });
    }

    const scope = await getSupportScope(req);
    const visibleTicket = await prisma.supportTicket.findFirst({
      where: {
        id: existing.id,
        ...scope
      }
    });

    if (!visibleTicket) {
      return res.status(403).json({
        error: "You can only delete support tickets in your scope."
      });
    }

    const requester = await getRequester(req);
    if (!isCrmMember(requester)) {
      return res.status(403).json({
        error: "Only CRM department users can delete support tickets."
      });
    }

    if (isFinalSupportStatus(existing.status)) {
      return res.status(400).json({
        error: "Completed support tickets are archived and cannot be deleted."
      });
    }

    await prisma.supportTicket.delete({
      where: {
        id: Number(req.params.id)
      }
    });

    res.json({
      message: "Support ticket deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

const searchSupportTickets = async (req, res) => {
  try {
    const { q } = req.query;
    const scope = await getSupportScope(req);

    const tickets = await prisma.supportTicket.findMany({
      where: {
        AND: [
          scope,
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
              },
              {
                priority: {
                  contains: q
                }
              }
            ]
          }
        ]
      },
      include: supportTicketInclude
    });

    res.json(tickets);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

module.exports = {
  getSupportTickets,
  createSupportTicket,
  getSupportTicketById,
  updateSupportTicket,
  deleteSupportTicket,
  searchSupportTickets
};
