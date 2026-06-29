const prisma = require("../prisma/client");

const getDepartments = async (req, res) => {
  try {
    const departments = await prisma.department.findMany({
      orderBy: {
        id: "asc"
      }
    });

    res.json(departments);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};
const getDepartmentById = async (req, res) => {
  try {
    const department = await prisma.department.findUnique({
      where: {
        id: Number(req.params.id)
      }
    });

    res.json(department);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};
const createDepartment = async (req, res) => {
  try {
    const name = req.body.name?.trim();

    if (!name) {
      return res.status(400).json({
        error: "Department name is required."
      });
    }

    const department = await prisma.department.create({
      data: { name }
    });

    res.status(201).json(department);
  } catch (error) {
    if (error?.code === "P2002") {
      return res.status(409).json({
        error: "Department name already exists."
      });
    }

    res.status(500).json({
      error: error.message
    });
  }
};
const updateDepartment = async (req, res) => {
  try {
    const name = req.body.name?.trim();

    if (!name) {
      return res.status(400).json({
        error: "Department name is required."
      });
    }

    const department = await prisma.department.update({
      where: {
        id: Number(req.params.id)
      },
      data: {
        name
      }
    });

    res.json(department);
  } catch (error) {
    if (error?.code === "P2002") {
      return res.status(409).json({
        error: "Department name already exists."
      });
    }

    res.status(500).json({
      error: error.message
    });
  }
};
const deleteDepartment = async (req, res) => {
  try {
    const departmentId = Number(req.params.id);
    const [teamsCount, usersCount, projectsCount] = await Promise.all([
      prisma.team.count({ where: { departmentId } }),
      prisma.user.count({ where: { departmentId } }),
      prisma.project.count({ where: { departmentId } })
    ]);

    if (teamsCount || usersCount || projectsCount) {
      return res.status(409).json({
        error: "Department cannot be deleted because it still has teams, users, or projects. Reassign them first."
      });
    }

    await prisma.department.delete({
      where: {
        id: departmentId
      }
    });

    res.json({
      message: "Department deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};
module.exports = {
  getDepartments,
  createDepartment,
  getDepartmentById,
  updateDepartment,
  deleteDepartment
};
