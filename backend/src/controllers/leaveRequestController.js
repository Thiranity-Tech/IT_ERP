const prisma = require("../prisma/client");
const {
  ROLES,
  canApproveLeaveFor,
  canSubmitLeave
} = require("../constants/roles");
const {
  notifyUsers,
  getLeaveRequestRecipients,
  describeUser,
  getRoleName
} = require("../services/notificationService");
const { archiveLeaveRequest } = require("../services/archiveService");

const leaveUserSelect = {
  id: true,
  employeeId: true,
  name: true,
  email: true,
  roleId: true,
  teamId: true,
  departmentId: true,
  role: {
    select: {
      id: true,
      name: true
    }
  },
  team: {
    select: {
      id: true,
      name: true,
      departmentId: true,
      department: {
        select: {
          id: true,
          name: true
        }
      }
    }
  },
  department: {
    select: {
      id: true,
      name: true
    }
  }
};

const getRequester = async (req) =>
  prisma.user.findUnique({
    where: {
      id: req.user.userId
    },
    select: {
      id: true,
      name: true,
      roleId: true,
      teamId: true,
      departmentId: true,
      team: {
        select: {
          id: true,
          name: true,
          departmentId: true
        }
      }
    }
  });

const getDepartmentId = (user) => user?.departmentId || user?.team?.departmentId || null;

const getLeaveScope = async (req) => {
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

const canAccessLeave = async (req, leaveId) => {
  const scope = await getLeaveScope(req);
  const leave = await prisma.leaveRequest.findFirst({
    where: {
      id: Number(leaveId),
      ...scope
    }
  });

  return Boolean(leave);
};

const getLeaveRequests = async (req, res) => {
  try {
    const where = await getLeaveScope(req);

    const leaves = await prisma.leaveRequest.findMany({
      where,
      include: {
        user: {
          select: leaveUserSelect
        }
      },
      orderBy: {
        id: "asc"
      }
    });

    res.json(leaves);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};
const createLeaveRequest = async (req, res) => {
  try {
    const {
      leaveType,
      reason,
      startDate,
      endDate
    } = req.body;

    if (!canSubmitLeave(req.user.roleId)) {
      return res.status(403).json({
        error: "Super Admin does not create leave requests."
      });
    }

    if (!leaveType || !reason || !startDate || !endDate) {
      return res.status(400).json({
        error: "Leave type, reason, start date, and end date are required."
      });
    }

    const requester = await getRequester(req);

    if (!requester) {
      return res.status(404).json({
        error: "Requester not found."
      });
    }

    const leaveRequest = await prisma.$transaction(async (tx) => {
      const createdLeaveRequest = await tx.leaveRequest.create({
        data: {
          leaveType,
          reason,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          status: "PENDING",
          userId: req.user.userId
        }
      });

      const recipients = await getLeaveRequestRecipients(tx, requester);
      const targetLabel =
        requester.roleId === ROLES.USER
          ? "team lead"
          : requester.roleId === ROLES.TEAM_LEAD
            ? "manager"
            : "super admin";

      await notifyUsers(
        tx,
        recipients,
        {
          text: `${describeUser(requester)} submitted a ${leaveType} leave request for ${targetLabel} review.`,
          targetPath: `/leave-requests/${createdLeaveRequest.id}`,
          recordType: "leave-request",
          recordId: createdLeaveRequest.id
        }
      );

      return createdLeaveRequest;
    });

    res.status(201).json(leaveRequest);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};
const getLeaveRequestById = async (req, res) => {
  try {
    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: {
        id: Number(req.params.id)
      },
      include: {
        user: {
          select: leaveUserSelect
        }
      }
    });

    if (!leaveRequest) {
      return res.status(404).json({
        error: "Leave request not found."
      });
    }

    if (!(await canAccessLeave(req, req.params.id))) {
      return res.status(403).json({
        error: "You can only view leave requests in your scope."
      });
    }

    res.json(leaveRequest);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};
const updateLeaveStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ["APPROVED", "REJECTED", "PENDING"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        error: "Status must be APPROVED, REJECTED, or PENDING."
      });
    }

    const existing = await prisma.leaveRequest.findUnique({
      where: {
        id: Number(req.params.id)
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            roleId: true
          }
        }
      }
    });

    if (!existing) {
      return res.status(404).json({
        error: "Leave request not found."
      });
    }

    if (!(await canAccessLeave(req, req.params.id))) {
      return res.status(403).json({
        error: "You can approve or reject only leave requests in your scope."
      });
    }

    if (!canApproveLeaveFor(req.user.roleId, req.user.userId, existing.user.roleId, existing.user.id)) {
      return res.status(403).json({
        error: "Only a higher role can approve or reject this leave request."
      });
    }

    const leaveRequest = await prisma.$transaction(async (tx) => {
      const updatedLeaveRequest = await tx.leaveRequest.update({
        where: {
          id: Number(req.params.id)
        },
        data: {
          status,
          approvedById: status === "PENDING" ? null : req.user.userId
        }
      });

      if (status !== "PENDING") {
        await notifyUsers(
          tx,
          [existing.user.id],
          {
            text: `Your leave request was ${status.toLowerCase()} by a ${getRoleName(req.user.roleId)}.`,
            targetPath: `/leave-requests/${updatedLeaveRequest.id}`,
            recordType: "leave-request",
            recordId: updatedLeaveRequest.id
          }
        );
      }

      if (status === "APPROVED") {
        try {
          await archiveLeaveRequest(tx, updatedLeaveRequest.id);
        } catch (archiveError) {
          console.warn("Leave archive failed:", archiveError.message);
        }
      }

      return updatedLeaveRequest;
    });

    res.json(leaveRequest);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};
const updateLeaveRequest = async (req, res) => {
  try {
    const {
      leaveType,
      reason,
      startDate,
      endDate
    } = req.body;

    const existing = await prisma.leaveRequest.findUnique({
      where: {
        id: Number(req.params.id)
      }
    });

    if (!existing) {
      return res.status(404).json({
        error: "Leave request not found."
      });
    }

    if (existing.userId !== req.user.userId) {
      return res.status(403).json({
        error: "You can only edit your own leave requests."
      });
    }

    if (existing.status !== "PENDING") {
      return res.status(400).json({
        error: "Only pending leave requests can be edited."
      });
    }

    const leaveRequest = await prisma.leaveRequest.update({
      where: {
        id: Number(req.params.id)
      },
      data: {
        leaveType,
        reason,
        startDate: new Date(startDate),
        endDate: new Date(endDate)
      }
    });

    res.json(leaveRequest);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};
const deleteLeaveRequest = async (req, res) => {
  try {
    const existing = await prisma.leaveRequest.findUnique({
      where: {
        id: Number(req.params.id)
      }
    });

    if (!existing) {
      return res.status(404).json({
        error: "Leave request not found."
      });
    }

    if (existing.userId !== req.user.userId) {
      return res.status(403).json({
        error: "You can only delete your own leave requests."
      });
    }

    if (existing.status !== "PENDING") {
      return res.status(400).json({
        error: "Only pending leave requests can be deleted."
      });
    }

    await prisma.leaveRequest.delete({
      where: {
        id: Number(req.params.id)
      }
    });

    res.json({
      message: "Leave request deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};
module.exports = {
  getLeaveRequests,
  createLeaveRequest,
  getLeaveRequestById,
  updateLeaveStatus,
  updateLeaveRequest,
  deleteLeaveRequest
};
