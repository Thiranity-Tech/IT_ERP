const prisma = require("../prisma/client");
const { ROLES } = require("../constants/roles");
const {
  requireProjectStatus,
  serializeProject
} = require("../services/projectStatus");
const {
  archiveCompletedProject
} = require("../services/archiveService");

const projectInclude = {
  department: true,
  _count: {
    select: {
      tasks: true
    }
  }
};

const getRequesterDepartmentId = async (req) => {
  if (!req.user || req.user.roleId >= ROLES.ADMIN) {
    return null;
  }

  const requester = await prisma.user.findUnique({
    where: {
      id: req.user.userId
    },
    select: {
      departmentId: true,
      team: {
        select: {
          departmentId: true
        }
      }
    }
  });

  return requester?.departmentId || requester?.team?.departmentId || -1;
};

const getProjects = async (req, res) => {
  try {
    const departmentId = await getRequesterDepartmentId(req);
    const where =
      departmentId === null
        ? undefined
        : { departmentId };

    const projects = await prisma.project.findMany({
      where,
      include: projectInclude,
      orderBy: {
        deadline: "asc"
      }
    });

    res.json(projects.map(serializeProject));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const createProject = async (req, res) => {
  try {
    const {
      name,
      clientName,
      description,
      startDate,
      deadline,
      priority,
      status,
      departmentId
    } = req.body;

    if (!name || !clientName || !startDate || !deadline || !priority || !status || !departmentId) {
      return res.status(400).json({
        error: "Project name, client, department, start date, deadline, priority, and status are required."
      });
    }

    const requesterDepartmentId = await getRequesterDepartmentId(req);
    if (requesterDepartmentId === -1) {
      return res.status(403).json({
        error: "Your account is not assigned to a department."
      });
    }

    if (requesterDepartmentId && Number(departmentId) !== requesterDepartmentId) {
      return res.status(403).json({
        error: "Managers can create projects only for their own department."
      });
    }

    const normalizedStatus = requireProjectStatus(status);

    const project = await prisma.project.create({
      data: {
        name,
        clientName,
        description,
        startDate: new Date(startDate),
        deadline: new Date(deadline),
        priority,
        status: normalizedStatus,
        departmentId: Number(departmentId)
      },
      include: projectInclude
    });

    if (normalizedStatus === "Completed") {
      try {
        await archiveCompletedProject(prisma, project.id);
      } catch (archiveError) {
        console.warn("Project archive failed:", archiveError.message);
      }
    }

    res.status(201).json(serializeProject(project));
  } catch (error) {
    res.status(error.message.includes("Project status") ? 400 : 500).json({
      error: error.message
    });
  }
};
const getProjectById = async (req, res) => {
  try {
    const project = await prisma.project.findUnique({
      where: {
        id: Number(req.params.id),
      },
      include: projectInclude
    });

    if (!project) {
      return res.status(404).json({
        error: "Project not found",
      });
    }

    const departmentId = await getRequesterDepartmentId(req);
    if (departmentId === -1) {
      return res.status(403).json({
        error: "Your account is not assigned to a department."
      });
    }

    if (departmentId !== null && Number(project.departmentId || 0) !== departmentId) {
      return res.status(403).json({
        error: "You can only view projects in your department."
      });
    }

    res.json(serializeProject(project));
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};
const updateProject = async (req, res) => {
  try {
    const {
      name,
      clientName,
      description,
      startDate,
      deadline,
      priority,
      status,
      departmentId
    } = req.body;

    const requesterDepartmentId = await getRequesterDepartmentId(req);
    if (requesterDepartmentId === -1) {
      return res.status(403).json({
        error: "Your account is not assigned to a department."
      });
    }

    const existingProject = await prisma.project.findUnique({
      where: {
        id: Number(req.params.id)
      }
    });

    if (!existingProject) {
      return res.status(404).json({
        error: "Project not found"
      });
    }

    if (requesterDepartmentId && Number(existingProject.departmentId || departmentId) !== requesterDepartmentId) {
      return res.status(403).json({
        error: "Managers can update projects only for their own department."
      });
    }

    const normalizedStatus = requireProjectStatus(status);

    const project = await prisma.project.update({
      where: {
        id: Number(req.params.id)
      },
      data: {
        name,
        clientName,
        description,
        startDate: new Date(startDate),
        deadline: new Date(deadline),
        priority,
        status: normalizedStatus,
        departmentId: departmentId ? Number(departmentId) : null
      },
      include: projectInclude
    });

    if (normalizedStatus === "Completed" && serializeProject(existingProject).status !== "Completed") {
      try {
        await archiveCompletedProject(prisma, project.id);
      } catch (archiveError) {
        console.warn("Project archive failed:", archiveError.message);
      }
    }

    res.json(serializeProject(project));
  } catch (error) {
    res.status(error.message.includes("Project status") ? 400 : 500).json({
      error: error.message
    });
  }
};
const deleteProject = async (req, res) => {
  try {
    const projectId = Number(req.params.id);
    const requesterDepartmentId = await getRequesterDepartmentId(req);
    const project = await prisma.project.findUnique({
      where: {
        id: projectId
      }
    });

    if (!project) {
      return res.status(404).json({
        error: "Project not found"
      });
    }

    if (requesterDepartmentId !== null && requesterDepartmentId !== -1 && Number(project.departmentId || 0) !== requesterDepartmentId) {
      return res.status(403).json({
        error: "Managers can delete projects only for their own department."
      });
    }

    await prisma.task.deleteMany({
      where: {
        projectId,
      },
    });

    await prisma.projectNote.deleteMany({
      where: {
        projectId,
      },
    });

    await prisma.project.delete({
      where: {
        id: projectId,
      },
    });

    res.json({
      message: "Project deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};
const searchProjects = async (req, res) => {
  try {
    const { q } = req.query;
    const departmentId = await getRequesterDepartmentId(req);

    const projects = await prisma.project.findMany({
      where: {
        ...(departmentId === null ? {} : { departmentId }),
        OR: [
          {
            name: {
              contains: q
            }
          },
          {
            clientName: {
              contains: q
            }
          }
        ]
      },
      include: projectInclude
    });

    res.json(projects.map(serializeProject));
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};
module.exports = { getProjects, createProject,getProjectById, updateProject, deleteProject, searchProjects };
