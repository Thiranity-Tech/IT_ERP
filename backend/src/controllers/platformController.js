const prisma = require("../prisma/client");

const listCompanies = async (req, res) => {
  try {
    const companies = await prisma.company.findMany({
      include: { _count: { select: { users: true } } },
      orderBy: { createdAt: "desc" }
    });
    res.json(companies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateCompanyAccess = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const status = String(req.body.status || "").toUpperCase();
    const durationDays = Number(req.body.durationDays);
    if (!id || !["TRIAL", "ACTIVE", "BLOCKED"].includes(status)) {
      return res.status(400).json({ message: "A valid workspace status is required." });
    }
    if (status !== "BLOCKED" && (!Number.isInteger(durationDays) || durationDays < 1)) {
      return res.status(400).json({ message: "Duration must be at least one day." });
    }
    const end = status === "BLOCKED" ? null : new Date(Date.now() + durationDays * 86400000);
    const company = await prisma.company.update({
      where: { id },
      data: status === "TRIAL"
        ? { status, trialEndsAt: end, accessEndsAt: null }
        : { status, accessEndsAt: end }
    });
    res.json(company);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { listCompanies, updateCompanyAccess };
