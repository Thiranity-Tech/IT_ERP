const prisma = require("../prisma/client");
const { DEFAULT_ROLES } = require("../constants/roles");
const { ROLES } = require("../constants/roles");

const ensureDefaultRoles = async () => {
  await Promise.all(
    DEFAULT_ROLES.map((role) =>
      prisma.role.upsert({
        where: { id: role.id },
        update: { name: role.name },
        create: role
      })
    )
  );
};

const getRoles = async (req, res) => {
  try {
    await ensureDefaultRoles();

    const roles = await prisma.role.findMany({
      orderBy: {
        id: "asc"
      }
    });

    res.json(roles);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

const updateRoleBaseSalary = async (req, res) => {
  try {
    if (req.user?.roleId !== ROLES.SUPER_ADMIN) {
      return res.status(403).json({
        error: "Only super admins can manage role base salaries."
      });
    }

    const roleId = Number(req.params.id);
    const { baseSalary } = req.body;
    const parsedSalary = baseSalary === "" || baseSalary === undefined || baseSalary === null ? 0 : Number(baseSalary);

    if (Number.isNaN(parsedSalary) || parsedSalary < 0) {
      return res.status(400).json({
        error: "Base salary must be a valid non-negative number."
      });
    }

    const role = await prisma.role.update({
      where: { id: roleId },
      data: { baseSalary: parsedSalary }
    });

    res.json(role);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

module.exports = { getRoles, updateRoleBaseSalary };
