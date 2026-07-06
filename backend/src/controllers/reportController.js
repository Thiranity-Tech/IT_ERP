const prisma = require("../prisma/client");

const getReports = async (req, res) => {
  try {
    const reports = await prisma.report.findMany();

    res.json(reports);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};
const createReport = async (req, res) => {
  try {
    if (!req.body.title || !req.file) {
      return res.status(400).json({
        error: "Report title and file are required."
      });
    }

    const report = await prisma.report.create({
      data: {
        title: req.body.title,
        fileUrl: req.file.path
      }
    });

    res.status(201).json(report);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};
const getReportById = async (req, res) => {
  try {
    const report = await prisma.report.findUnique({
      where: {
        id: Number(req.params.id)
      }
    });

    res.json(report);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};
const updateReport = async (req, res) => {
  try {
    const { title, fileUrl } = req.body;

    const report = await prisma.report.update({
      where: {
        id: Number(req.params.id)
      },
      data: {
        title,
        fileUrl
      }
    });

    res.json(report);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};
const deleteReport = async (req, res) => {
  try {
    await prisma.report.delete({
      where: {
        id: Number(req.params.id)
      }
    });

    res.json({
      message: "Report deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};
module.exports = {
  getReports,
  createReport,
  getReportById,
  updateReport,
  deleteReport
};
