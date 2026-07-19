const prisma = require("../prisma/client");

const getTeams = async (req, res) => {
  try {
    const teams = await prisma.team.findMany({
      include: {
        department: true
      },
      orderBy: {
        id: "asc"
      }
    });

    res.json(teams);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const createTeam = async (req, res) => {
  try {
    const { name, departmentId } = req.body;
    const teamName = String(name || "").trim();
    const numericDepartmentId = Number(departmentId);

    if (!teamName || !numericDepartmentId) {
      return res.status(400).json({
        error: "Team name and department are required."
      });
    }

    const team = await prisma.team.create({
      data: {
        name: teamName,
        departmentId: numericDepartmentId
      }
    });

    res.status(201).json(team);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};
const getTeamById = async (req, res) => {
  try {
    const team = await prisma.team.findUnique({
      where: {
        id: Number(req.params.id)
      },
      include: {
        department: true
      }
    });

    res.json(team);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};
const updateTeam = async (req, res) => {
  try {
    const { name, departmentId } = req.body;
    const teamName = String(name || "").trim();
    const numericDepartmentId = Number(departmentId);

    if (!teamName || !numericDepartmentId) {
      return res.status(400).json({
        error: "Team name and department are required."
      });
    }

    const team = await prisma.team.update({
      where: {
        id: Number(req.params.id)
      },
      data: {
        name: teamName,
        departmentId: numericDepartmentId
      }
    });

    res.json(team);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};
const deleteTeam = async (req, res) => {
  try {
    const teamId = Number(req.params.id);
    const [usersCount, tasksCount] = await Promise.all([
      prisma.user.count({ where: { teamId } }),
      prisma.task.count({
        where: {
          user: {
            teamId
          }
        }
      })
    ]);

    if (usersCount || tasksCount) {
      return res.status(409).json({
        error: "Team cannot be deleted because users or tasks are still linked to it. Reassign them first."
      });
    }

    await prisma.team.delete({
      where: {
        id: teamId
      }
    });

    res.json({
      message: "Team deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};
module.exports = {
  getTeams,
  createTeam,
  getTeamById,
  updateTeam,
  deleteTeam
};
