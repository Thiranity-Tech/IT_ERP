const prisma = require("../prisma/client");

module.exports = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { isPlatformAdmin: true }
    });
    if (!user?.isPlatformAdmin) {
      return res.status(403).json({ message: "Platform administrator access is required." });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
