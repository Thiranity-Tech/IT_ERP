const prisma = require("../prisma/client");
const { ROLES } = require("../constants/roles");
const { parseNotificationMessage } = require("../services/notificationService");

const canManageNotification = (req, notification) =>
  notification.userId === req.user.userId || req.user.roleId >= ROLES.ADMIN;

const resolveNotificationTargetPath = (payload) => {
  if (payload?.targetPath) {
    return payload.targetPath;
  }

  const text = String(payload?.text || "").toLowerCase();

  if (text.includes("leave")) return "/leave-requests";
  if (text.includes("support ticket")) return "/support-tickets";
  if (text.includes("payroll")) return "/payroll";
  if (text.includes("attendance")) return "/attendance";
  if (text.includes("project")) return "/projects";
  if (text.includes("user") || text.includes("team")) return "/users";

  return "/notifications";
};

const decorateNotification = (notification) => ({
  ...notification,
  ...parseNotificationMessage(notification?.message),
  targetPath: resolveNotificationTargetPath(parseNotificationMessage(notification?.message))
});

const getNotifications = async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: {
        userId: req.user.userId
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
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    res.json(notifications.map(decorateNotification));
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

const createNotification = async (req, res) => {
  try {
    const { message, userId } = req.body;

    const notification = await prisma.notification.create({
      data: {
        message,
        userId: Number(userId)
      }
    });

    res.status(201).json(decorateNotification(notification));
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

const getNotificationById = async (req, res) => {
  try {
    const notification = await prisma.notification.findUnique({
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

    if (!notification) {
      return res.status(404).json({
        error: "Notification not found."
      });
    }

    if (!canManageNotification(req, notification)) {
      return res.status(403).json({
        error: "You can only view your own notifications."
      });
    }

    res.json(decorateNotification(notification));
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

const updateNotification = async (req, res) => {
  try {
    const existing = await prisma.notification.findUnique({
      where: {
        id: Number(req.params.id)
      }
    });

    if (!existing) {
      return res.status(404).json({
        error: "Notification not found."
      });
    }

    if (!canManageNotification(req, existing)) {
      return res.status(403).json({
        error: "You can only update your own notifications."
      });
    }

    const { message, isRead } = req.body;

    const notification = await prisma.notification.update({
      where: {
        id: Number(req.params.id)
      },
      data: {
        message,
        isRead
      }
    });

    res.json(decorateNotification(notification));
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

const deleteNotification = async (req, res) => {
  try {
    const existing = await prisma.notification.findUnique({
      where: {
        id: Number(req.params.id)
      }
    });

    if (!existing) {
      return res.status(404).json({
        error: "Notification not found."
      });
    }

    if (!canManageNotification(req, existing)) {
      return res.status(403).json({
        error: "You can only delete your own notifications."
      });
    }

    await prisma.notification.delete({
      where: {
        id: Number(req.params.id)
      }
    });

    res.json({
      message: "Notification deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

const markAsRead = async (req, res) => {
  try {
    const existing = await prisma.notification.findUnique({
      where: {
        id: Number(req.params.id)
      }
    });

    if (!existing) {
      return res.status(404).json({
        error: "Notification not found."
      });
    }

    if (!canManageNotification(req, existing)) {
      return res.status(403).json({
        error: "You can only update your own notifications."
      });
    }

    await prisma.notification.delete({
      where: {
        id: Number(req.params.id)
      },
    });

    res.json({
      message: "Notification viewed and removed.",
      targetPath: resolveNotificationTargetPath(existing.message)
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

module.exports = {
  getNotifications,
  createNotification,
  getNotificationById,
  updateNotification,
  deleteNotification,
  markAsRead
};
