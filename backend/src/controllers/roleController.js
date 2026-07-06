const prisma = require("../prisma/client");
const { DEFAULT_ROLES } = require("../constants/roles");

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

module.exports = { getRoles };
