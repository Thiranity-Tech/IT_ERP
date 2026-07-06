const fs = require("fs/promises");
const path = require("path");

const archiveRoot = path.join(__dirname, "..", "..", "..", "docs", "archives");

const safeSlug = (value) =>
  String(value || "item")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "item";

const writeJson = async (filePath, data) => {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
};

const buildEmployeeFolder = (employee) =>
  path.join(
    archiveRoot,
    "employees",
    `${employee.employeeId}-${safeSlug(employee.name)}`
  );

const archiveEmployeeRecord = async (prisma, userId, section, record, recordLabel) => {
  const employee = await prisma.user.findUnique({
    where: {
      id: Number(userId)
    },
    include: {
      role: true,
      department: true,
      team: {
        include: {
          department: true
        }
      }
    }
  });

  if (!employee || !record) {
    return null;
  }

  const folder = path.join(
    buildEmployeeFolder(employee),
    section,
    `${record.id}-${safeSlug(recordLabel)}`
  );

  await writeJson(path.join(folder, "manifest.json"), {
    archivedAt: new Date().toISOString(),
    type: section,
    employeeId: employee.employeeId,
    employeeName: employee.name,
    recordId: record.id
  });
  await writeJson(path.join(folder, `${section}.json`), {
    employee,
    record
  });

  return folder;
};

const archiveCompletedProject = async (prisma, projectId) => {
  const project = await prisma.project.findUnique({
    where: {
      id: Number(projectId)
    },
    include: {
      department: true,
      tasks: {
        include: {
          user: {
            select: {
              id: true,
              employeeId: true,
              name: true,
              email: true,
              roleId: true,
              designation: true
            }
          }
        }
      },
      projectNotes: {
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
      }
    }
  });

  if (!project) {
    return null;
  }

  const folderName = `${project.id}-${safeSlug(project.name)}`;
  const folder = path.join(archiveRoot, "projects", folderName);

  await writeJson(path.join(folder, "manifest.json"), {
    archivedAt: new Date().toISOString(),
    type: "project",
    projectId: project.id,
    projectName: project.name
  });
  await writeJson(path.join(folder, "project.json"), project);

  return folder;
};

const archiveLeaveRequest = async (prisma, leaveRequestId) => {
  const leaveRequest = await prisma.leaveRequest.findUnique({
    where: {
      id: Number(leaveRequestId)
    },
    include: {
      user: {
        include: {
          role: true,
          department: true,
          team: {
            include: {
              department: true
            }
          }
        }
      }
    }
  });

  if (!leaveRequest) {
    return null;
  }

  return archiveEmployeeRecord(
    prisma,
    leaveRequest.userId,
    "leave-requests",
    leaveRequest,
    `${leaveRequest.leaveType}-${leaveRequest.status}`
  );
};

const archiveSupportTicket = async (prisma, ticketId, context = {}) => {
  const ticket = await prisma.supportTicket.findUnique({
    where: {
      id: Number(ticketId)
    },
    include: {
      client: true,
      assignedTo: {
        select: {
          id: true,
          employeeId: true,
          name: true,
          email: true,
          designation: true
        }
      },
      project: true
    }
  });

  if (!ticket) {
    return null;
  }

  const folder = path.join(
    archiveRoot,
    "support-tickets",
    `${ticket.id}-${safeSlug(ticket.title)}`
  );

  await writeJson(path.join(folder, "manifest.json"), {
    archivedAt: new Date().toISOString(),
    type: "support-ticket",
    ticketId: ticket.id,
    ticketTitle: ticket.title,
    status: ticket.status,
    ...context
  });
  await writeJson(path.join(folder, "support-ticket.json"), {
    ticket,
    context
  });

  const ownerId = context.creatorId || null;
  if (ownerId) {
    const owner = await prisma.user.findUnique({
      where: {
        id: Number(ownerId)
      },
      select: {
        id: true,
        employeeId: true,
        name: true
      }
    });

    if (owner) {
      const ownerFolder = path.join(
        archiveRoot,
        "employees",
        `${owner.employeeId}-${safeSlug(owner.name)}`,
        "support-tickets",
        `${ticket.id}-${safeSlug(ticket.title)}`
      );

      await writeJson(path.join(ownerFolder, "manifest.json"), {
        archivedAt: new Date().toISOString(),
        type: "support-ticket",
        ticketId: ticket.id,
        ticketTitle: ticket.title,
        status: ticket.status,
        ownerId: owner.id
      });
      await writeJson(path.join(ownerFolder, "support-ticket.json"), {
        ticket,
        context,
        owner
      });
    }
  }

  return folder;
};

const archiveCompletedTask = async (prisma, taskId) => {
  const task = await prisma.task.findUnique({
    where: {
      id: Number(taskId)
    },
    include: {
      project: {
        include: {
          department: true
        }
      },
      user: {
        select: {
          id: true,
          employeeId: true,
          name: true,
          email: true,
          roleId: true,
          designation: true
        }
      }
    }
  });

  if (!task) {
    return null;
  }

  const folderName = `${task.id}-${safeSlug(task.title)}`;
  const folder = path.join(archiveRoot, "tasks", folderName);
  const employeeFolder = path.join(
    buildEmployeeFolder(task.user),
    "tasks",
    folderName
  );

  await writeJson(path.join(folder, "manifest.json"), {
    archivedAt: new Date().toISOString(),
    type: "task",
    taskId: task.id,
    taskTitle: task.title,
    employeeId: task.user.employeeId,
    assignedAt: task.assignedAt,
    completedAt: task.completedAt || new Date().toISOString()
  });
  await writeJson(path.join(folder, "task.json"), task);

  await writeJson(path.join(employeeFolder, "manifest.json"), {
    archivedAt: new Date().toISOString(),
    type: "task",
    taskId: task.id,
    taskTitle: task.title,
    employeeId: task.user.employeeId,
    assignedAt: task.assignedAt,
    completedAt: task.completedAt || new Date().toISOString()
  });
  await writeJson(path.join(employeeFolder, "task.json"), task);

  return folder;
};

module.exports = {
  archiveCompletedProject,
  archiveCompletedTask,
  archiveLeaveRequest,
  archiveSupportTicket
};
