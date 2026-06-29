const prisma = require("../prisma/client");
const { ROLES } = require("../constants/roles");
const XLSX = require("xlsx");

const getRequester = async (req) =>
  prisma.user.findUnique({
    where: {
      id: req.user.userId
    },
    select: {
      departmentId: true,
      team: {
        select: {
          departmentId: true
        }
      }
    }
  });

const getDepartmentId = (user) => user?.departmentId || user?.team?.departmentId || null;

const getAttendanceScope = async (req) => {
  if (req.user.roleId === ROLES.USER) {
    return {
      userId: req.user.userId
    };
  }

  if (req.user.roleId >= ROLES.ADMIN) {
    return {};
  }

  const requester = await getRequester(req);
  const departmentId = getDepartmentId(requester);

  if (!departmentId) {
    return {
      id: -1
    };
  }

  return {
    user: {
      OR: [
        { departmentId },
        {
          team: {
            departmentId
          }
        }
      ]
    }
  };
};

const canManageAttendanceForUser = async (req, userId) => {
  if (req.user.roleId >= ROLES.ADMIN) return true;

  const [requester, target] = await Promise.all([
    getRequester(req),
    prisma.user.findUnique({
      where: {
        id: Number(userId)
      },
      select: {
        departmentId: true,
        team: {
          select: {
            departmentId: true
          }
        }
      }
    })
  ]);

  return Boolean(getDepartmentId(requester) && getDepartmentId(requester) === getDepartmentId(target));
};

const parseDateCell = (value) => {
  if (!value) return null;

  if (value instanceof Date) {
    return value;
  }

  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (!parsed) return null;

    return new Date(
      Date.UTC(
        parsed.y,
        parsed.m - 1,
        parsed.d,
        parsed.H || 0,
        parsed.M || 0,
        Math.floor(parsed.S || 0)
      )
    );
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const getOfficeTiming = async () => {
  const officeSetting = await prisma.officeSetting.findFirst();

  return {
    officeStartTime: officeSetting?.officeStart || "09:00",
    officeEndTime: officeSetting?.officeEnd || "18:00",
    graceMinutes: Number.isFinite(Number(officeSetting?.graceMinutes))
      ? Number(officeSetting.graceMinutes)
      : 10
  };
};

const getDateKey = (date) => {
  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return {
    year: parsed.getFullYear(),
    month: String(parsed.getMonth() + 1).padStart(2, "0"),
    day: String(parsed.getDate()).padStart(2, "0"),
    date
  };
};

const calculateAttendanceMetrics = ({
  date,
  checkIn,
  checkOut,
  status,
  officeStartTime,
  officeEndTime,
  graceMinutes
}) => {
  const normalizedStatus = String(status || "").trim().toUpperCase();
  const hasCheckTimes = Boolean(checkIn || checkOut);
  const dateParts = getDateKey(date);

  if (!dateParts) {
    return {
      lateMinutes: 0,
      overtimeMinutes: 0,
      status: normalizedStatus || (hasCheckTimes ? "PRESENT" : "ABSENT")
    };
  }

  const dateStr = `${dateParts.year}-${dateParts.month}-${dateParts.day}`;
  const officeStart = new Date(`${dateStr}T${officeStartTime}:00`);
  const officeEnd = new Date(`${dateStr}T${officeEndTime}:00`);
  const allowedCheckIn = new Date(officeStart.getTime() + graceMinutes * 60000);

  let lateMinutes = 0;
  let overtimeMinutes = 0;

  if (checkIn && checkIn > allowedCheckIn) {
    lateMinutes = Math.floor((checkIn - allowedCheckIn) / 60000);
  }

  if (checkOut && checkOut > officeEnd) {
    overtimeMinutes = Math.floor((checkOut - officeEnd) / 60000);
  }

  return {
    lateMinutes,
    overtimeMinutes,
    status: hasCheckTimes ? "PRESENT" : normalizedStatus || "ABSENT"
  };
};

const getAttendances = async (req, res) => {
  try {
    const where = await getAttendanceScope(req);

    const attendances = await prisma.attendance.findMany({
  where,
  include: {
    user: {
      select: {
        id: true,
        employeeId: true,
        name: true,
        email: true,
        roleId: true,
        teamId: true
      }
    }
  }
});

res.json(attendances);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};
const createAttendance = async (req, res) => {
  try {
    const {
      date,
      checkIn,
      checkOut,
      status,
      remarks,
      userId
    } = req.body;

    if (!(await canManageAttendanceForUser(req, userId))) {
      return res.status(403).json({
        error: "Managers can create attendance only for their own department."
      });
    }

    const { officeStartTime, officeEndTime, graceMinutes } = await getOfficeTiming();
    const checkInDate = checkIn ? new Date(checkIn) : null;
    const checkOutDate = checkOut ? new Date(checkOut) : null;
    const metrics = calculateAttendanceMetrics({
      date: new Date(date),
      checkIn: checkInDate,
      checkOut: checkOutDate,
      status,
      officeStartTime,
      officeEndTime,
      graceMinutes
    });

    const attendance = await prisma.attendance.create({
      data: {
        date: new Date(date),
        checkIn: checkInDate,
        checkOut: checkOutDate,
        lateMinutes: metrics.lateMinutes,
        overtimeMinutes: metrics.overtimeMinutes,
        status: metrics.status,
        remarks,
        userId: Number(userId)
      }
    });

    res.status(201).json(attendance);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};
const getAttendanceById = async (req, res) => {
  try {
    const attendance = await prisma.attendance.findUnique({
      where: {
        id: Number(req.params.id)
      },
      include: {
        user: {
          select: {
            id: true,
            employeeId: true,
            name: true,
            email: true,
            roleId: true,
            teamId: true
          }
        }
      }
    });

    if (!attendance) {
      return res.status(404).json({
        error: "Attendance record not found."
      });
    }

    const scope = await getAttendanceScope(req);
    const visibleAttendance = await prisma.attendance.findFirst({
      where: {
        id: attendance.id,
        ...scope
      }
    });

    if (!visibleAttendance) {
      return res.status(403).json({
        error: "You can only view attendance in your scope."
      });
    }

    res.json(attendance);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};
const updateAttendance = async (req, res) => {
  try {
    const {
      date,
      checkIn,
      checkOut,
      status,
      remarks,
      userId
    } = req.body;

    if (!(await canManageAttendanceForUser(req, userId))) {
      return res.status(403).json({
        error: "Managers can update attendance only for their own department."
      });
    }

    const { officeStartTime, officeEndTime, graceMinutes } = await getOfficeTiming();
    const checkInDate = checkIn ? new Date(checkIn) : null;
    const checkOutDate = checkOut ? new Date(checkOut) : null;
    const metrics = calculateAttendanceMetrics({
      date: new Date(date),
      checkIn: checkInDate,
      checkOut: checkOutDate,
      status,
      officeStartTime,
      officeEndTime,
      graceMinutes
    });

    const attendance = await prisma.attendance.update({
      where: {
        id: Number(req.params.id)
      },
      data: {
        date: new Date(date),
        checkIn: checkInDate,
        checkOut: checkOutDate,
        lateMinutes: metrics.lateMinutes,
        overtimeMinutes: metrics.overtimeMinutes,
        status: metrics.status,
        remarks,
        userId: Number(userId)
      }
    });

    res.json(attendance);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};
const deleteAttendance = async (req, res) => {
  try {
    const scope = await getAttendanceScope(req);
    const existing = await prisma.attendance.findFirst({
      where: {
        id: Number(req.params.id),
        ...scope
      }
    });

    if (!existing) {
      return res.status(403).json({
        error: "You can delete attendance only in your scope."
      });
    }

    await prisma.attendance.delete({
      where: {
        id: Number(req.params.id)
      }
    });

    res.json({
      message: "Attendance deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};
const uploadAttendanceExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: "Attendance file is required."
      });
    }

    const workbook = XLSX.readFile(req.file.path);

    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const rows = XLSX.utils.sheet_to_json(sheet);

    const { officeStartTime, officeEndTime, graceMinutes } = await getOfficeTiming();

    for (const row of rows) {
      const user = await prisma.user.findUnique({
        where: {
          employeeId: row.employeeId,
        },
        select: {
          id: true,
          departmentId: true,
          team: {
            select: {
              departmentId: true
            }
          }
        }
      });

      if (!user) continue;
      if (!(await canManageAttendanceForUser(req, user.id))) continue;

      const parsedDate = parseDateCell(row.date);
      if (!parsedDate) continue;

      const formattedDate = new Date(
        Date.UTC(
          parsedDate.getUTCFullYear(),
          parsedDate.getUTCMonth(),
          parsedDate.getUTCDate()
        )
      );

      const existingAttendance =
        await prisma.attendance.findFirst({
          where: {
            userId: user.id,
            date: formattedDate,
          },
        });

      if (existingAttendance) continue;

      const checkIn = parseDateCell(row.checkIn);
      const checkOut = parseDateCell(row.checkOut);

      const metrics = calculateAttendanceMetrics({
        date: formattedDate,
        checkIn,
        checkOut,
        officeStartTime,
        officeEndTime,
        graceMinutes,
        status: "PRESENT"
      });

      await prisma.attendance.create({
        data: {
          date: formattedDate,
          checkIn,
          checkOut,
          lateMinutes: metrics.lateMinutes,
          overtimeMinutes: metrics.overtimeMinutes,
          status: metrics.status,
          remarks: null,
          userId: user.id,
        },
      });
    }

    res.json({
      message: "Attendance uploaded successfully",
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};
const getAttendanceReport = async (req, res) => {
  try {
    const where = await getAttendanceScope(req);

    const report = await prisma.attendance.findMany({
      where,
      include: {
        user: {
          select: {
            employeeId: true,
            name: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    res.json(report);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};
module.exports = {
  getAttendances,
  createAttendance,
  getAttendanceById,
  updateAttendance,
  deleteAttendance,
  getAttendanceReport,
  uploadAttendanceExcel
};
