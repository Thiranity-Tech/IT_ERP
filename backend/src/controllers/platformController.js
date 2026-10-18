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
    const durationMonths = Number(req.body.durationMonths);
    if (!id || !["TRIAL", "ACTIVE", "BLOCKED"].includes(status)) {
      return res.status(400).json({ message: "A valid workspace status is required." });
    }
    const hasMonths = Number.isInteger(durationMonths) && durationMonths >= 1;
    const hasDays = Number.isInteger(durationDays) && durationDays >= 1;
    if (status !== "BLOCKED" && !hasMonths && !hasDays) {
      return res.status(400).json({ message: "Duration must be at least one month or one day." });
    }
    const end = new Date();
    if (status === "BLOCKED") {
      end.setTime(0);
    } else if (hasMonths) {
      end.setMonth(end.getMonth() + durationMonths);
    } else {
      end.setDate(end.getDate() + durationDays);
    }
    const company = await prisma.company.update({
      where: { id },
      data: status === "TRIAL"
        ? { status, trialEndsAt: end, accessEndsAt: null }
        : status === "BLOCKED"
          ? { status, trialEndsAt: null, accessEndsAt: null }
          : { status, accessEndsAt: end }
    });
    res.json(company);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { listCompanies, updateCompanyAccess };
