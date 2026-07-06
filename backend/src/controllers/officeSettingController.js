const prisma = require("../prisma/client");

const createOfficeSetting = async (req, res) => {
  try {
    const { officeStart, officeEnd, graceMinutes } = req.body;

    if (!officeStart || !officeEnd) {
      return res.status(400).json({
        message: "Office start and office end are required",
      });
    }

    const parsedGraceMinutes = Number(graceMinutes);
    if (!Number.isFinite(parsedGraceMinutes) || parsedGraceMinutes < 0) {
      return res.status(400).json({
        message: "Grace minutes must be a non-negative number",
      });
    }

    const existingSetting = await prisma.officeSetting.findFirst({
      orderBy: {
        id: "desc",
      },
    });

    const setting = existingSetting
      ? await prisma.officeSetting.update({
          where: {
            id: existingSetting.id,
          },
          data: {
            officeStart,
            officeEnd,
            graceMinutes: parsedGraceMinutes,
          },
        })
      : await prisma.officeSetting.create({
          data: {
            officeStart,
            officeEnd,
            graceMinutes: parsedGraceMinutes,
          },
        });

    res.status(201).json(setting);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

const getOfficeSetting = async (req, res) => {
  try {
    const setting = await prisma.officeSetting.findFirst({
      orderBy: {
        id: "desc",
      },
    });

    res.json(
      setting || {
        officeStart: "09:00",
        officeEnd: "18:00",
        graceMinutes: 10,
      }
    );
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

module.exports = {
  createOfficeSetting,
  getOfficeSetting,
};
