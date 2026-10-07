const jwt = require("jsonwebtoken");
const prisma = require("../prisma/client");
const tenantContext = require("../services/tenantContext");

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      message: "Token missing"
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { companyId: true, isPlatformAdmin: true, company: true }
    });
    if (!user) return res.status(401).json({ message: "User not found" });
    if (!user.isPlatformAdmin && !user.companyId) {
      return res.status(403).json({
        message: "This account is not assigned to a company workspace. Contact the platform administrator."
      });
    }
    if (!user.isPlatformAdmin && user.company) {
      const expiresAt = user.company.status === "TRIAL" ? user.company.trialEndsAt : user.company.accessEndsAt;
      if (user.company.status === "BLOCKED" || !expiresAt || expiresAt < new Date()) {
        return res.status(403).json({ message: "This workspace is inactive. Contact the platform administrator to renew access." });
      }
    }
    req.user = { ...decoded, companyId: user.companyId, isPlatformAdmin: user.isPlatformAdmin };
    // Bind the workspace to this request's async call chain before Express
    // dispatches the remaining middleware and controller.
    tenantContext.enter({ companyId: user.companyId, isPlatformAdmin: user.isPlatformAdmin });
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid token"
    });
  }
};

module.exports = authMiddleware;
