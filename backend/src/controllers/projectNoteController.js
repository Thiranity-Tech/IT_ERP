const prisma = require("../prisma/client");
const { ROLES } = require("../constants/roles");
const projectNoteUserSelect = {
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

const getProjectScope = async (req) => {
  if (req.user.roleId >= ROLES.ADMIN) {
    return {};
  }

  if (req.user.roleId === ROLES.USER) {
    return {
      OR: [
        {
          userId: req.user.userId
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
      project: {
        tasks: {
          some: {
            user: {
              teamId: requester.teamId
            }
          }
        }
      }
    };
  }

  const departmentId = getDepartmentId(requester);
  if (!departmentId) {
    return { id: -1 };
  }

  return {
    project: {
      departmentId
    }
  };
};

const getProjectNotes = async (req, res) => {
  try {
    const where = await getProjectScope(req);
    const notes = await prisma.projectNote.findMany({
      where,
      include: {
        project: true,
        user: {
          select: projectNoteUserSelect
        }
      }
    });

    res.json(notes);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};
const createProjectNote = async (req, res) => {
  try {
    const { note, projectId, userId } = req.body;

    const project = await prisma.project.findUnique({
      where: {
        id: Number(projectId)
      },
      select: {
        departmentId: true
      }
    });

    if (!project) {
      return res.status(404).json({
        error: "Project not found."
      });
    }

    const requester = await getRequester(req);
    const requesterDepartmentId = getDepartmentId(requester);
    const allowed =
      req.user.roleId >= ROLES.ADMIN ||
      (req.user.roleId === ROLES.USER && Number(userId) === req.user.userId) ||
      (requester?.roleId === ROLES.TEAM_LEAD && requester.teamId && requesterDepartmentId === project.departmentId) ||
      (requesterDepartmentId && requesterDepartmentId === project.departmentId);

    if (!allowed) {
      return res.status(403).json({
        error: "You can create notes only in your project scope."
      });
    }

    const projectNote = await prisma.projectNote.create({
      data: {
        note,
        projectId: Number(projectId),
        userId: Number(userId)
      }
    });

    res.status(201).json(projectNote);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};
const getProjectNoteById = async (req, res) => {
  try {
    const note = await prisma.projectNote.findUnique({
      where: {
        id: Number(req.params.id)
      },
      include: {
        project: true,
        user: {
          select: projectNoteUserSelect
        }
      }
    });

    if (!note) {
      return res.status(404).json({
        error: "Project note not found."
      });
    }

    const scope = await getProjectScope(req);
    const visibleNote = await prisma.projectNote.findFirst({
      where: {
        id: note.id,
        ...scope
      }
    });

    if (!visibleNote) {
      return res.status(403).json({
        error: "You can only view project notes in your scope."
      });
    }

    res.json(note);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};
const updateProjectNote = async (req, res) => {
  try {
    const { note, projectId, userId } = req.body;

    const existing = await prisma.projectNote.findUnique({
      where: {
        id: Number(req.params.id)
      }
    });

    if (!existing) {
      return res.status(404).json({
        error: "Project note not found."
      });
    }

    const scope = await getProjectScope(req);
    const visibleNote = await prisma.projectNote.findFirst({
      where: {
        id: existing.id,
        ...scope
      }
    });

    if (!visibleNote) {
      return res.status(403).json({
        error: "You can only update project notes in your scope."
      });
    }

    const projectNote = await prisma.projectNote.update({
      where: {
        id: Number(req.params.id)
      },
      data: {
        note,
        projectId: Number(projectId),
        userId: Number(userId)
      }
    });

    res.json(projectNote);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};
const deleteProjectNote = async (req, res) => {
  try {
    const existing = await prisma.projectNote.findUnique({
      where: {
        id: Number(req.params.id)
      }
    });

    if (!existing) {
      return res.status(404).json({
        error: "Project note not found."
      });
    }

    const scope = await getProjectScope(req);
    const visibleNote = await prisma.projectNote.findFirst({
      where: {
        id: existing.id,
        ...scope
      }
    });

    if (!visibleNote) {
      return res.status(403).json({
        error: "You can only delete project notes in your scope."
      });
    }

    await prisma.projectNote.delete({
      where: {
        id: Number(req.params.id)
      }
    });

    res.json({
      message: "Project note deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};
module.exports = {
  getProjectNotes,
  createProjectNote,
  getProjectNoteById,
  updateProjectNote,
  deleteProjectNote
};
