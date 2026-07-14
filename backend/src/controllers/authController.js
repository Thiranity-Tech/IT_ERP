const prisma = require("../prisma/client");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { sendPasswordResetPin } = require("../services/emailService");
const { DEFAULT_ROLES, ROLES } = require("../constants/roles");

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

const generateResetPin = () => String(Math.floor(100000 + Math.random() * 900000));

const maskEmail = (email) => {
  if (!email) return "";
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const visible = local.slice(0, 2);
  return `${visible}${"*".repeat(Math.max(local.length - 2, 3))}@${domain}`;
};

const createSuperAdmin = async (req, res) => {
  try {
    await ensureDefaultRoles();

    const existingSuperAdmin = await prisma.user.findUnique({
      where: {
        employeeId: "SA001"
      }
    });

    if (existingSuperAdmin) {
      return res.status(409).json({
        message: "Super Admin already exists"
      });
    }

    const hashedPassword = await bcrypt.hash("admin123", 10);

    const superAdmin = await prisma.user.create({
      data: {
        employeeId: "SA001",
        name: "Super Admin",
        email: "superadmin@erp.com",
        password: hashedPassword,
        roleId: ROLES.SUPER_ADMIN
      }
    });

    res.status(201).json({
      message: "Super Admin created successfully",
      user: {
        id: superAdmin.id,
        employeeId: superAdmin.employeeId,
        name: superAdmin.name,
        email: superAdmin.email
      }
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};



const login = async (req, res) => {
  try {
    const employeeId = typeof req.body.employeeId === "string" ? req.body.employeeId.trim() : "";
    const password = typeof req.body.password === "string" ? req.body.password : "";

    if (!employeeId || !password) {
      return res.status(400).json({
        message: "Employee ID and password are required"
      });
    }

    const user = await prisma.user.findUnique({
      where: { employeeId },
      include: {
        role: true,
        department: true,
        team: {
          include: {
            department: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid password"
      });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        roleId: user.roleId
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful",
      token,
      roleId: user.roleId,
      roleName: user.role.name,
      userId: user.id,
      userName: user.name,
      departmentId: user.departmentId || user.team?.departmentId || null,
      departmentName: user.department?.name || user.team?.department?.name || null,
      teamId: user.teamId || null,
      teamName: user.team?.name || null
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "Current password and new password are required"
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: req.user.userId
      }
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    const isMatch = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isMatch) {
      return res.status(400).json({
        message: "Current password is incorrect"
      });
    }

    const hashedPassword = await bcrypt.hash(
      newPassword,
      10
    );

    await prisma.user.update({
      where: {
        id: user.id
      },
      data: {
        password: hashedPassword
      }
    });

    res.json({
      message: "Password changed successfully"
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};
const forgotPassword = async (req, res) => {
  try {
    const { employeeId, newPassword } = req.body;

    if (!employeeId || !newPassword) {
      return res.status(400).json({
        message: "Employee ID and new password are required"
      });
    }

    const user = await prisma.user.findUnique({
      where: { employeeId }
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { employeeId },
      data: { password: hashedPassword }
    });

    res.json({ message: "Password reset successful" });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

const requestPasswordReset = async (req, res) => {
  try {
    const employeeId = typeof req.body.employeeId === "string" ? req.body.employeeId.trim() : "";

    if (!employeeId) {
      return res.status(400).json({
        message: "Employee ID is required"
      });
    }

    const user = await prisma.user.findUnique({
      where: { employeeId }
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    const destination = user.email;

    if (!destination) {
      return res.status(400).json({
        message: "Email not found for this user"
      });
    }

    const pin = generateResetPin();
    const pinHash = await bcrypt.hash(pin, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const request = await prisma.passwordResetRequest.create({
      data: {
        employeeId,
        deliveryMethod: "email",
        destination,
        pinHash,
        expiresAt,
        userId: user.id
      }
    });

    try {
      await sendPasswordResetPin({
        destination,
        pin,
        employeeId
      });
    } catch (sendError) {
      await prisma.passwordResetRequest.delete({
        where: { id: request.id }
      });
      throw sendError;
    }

    res.status(201).json({
      message: `Verification code sent to ${maskEmail(destination)}`,
      requestId: request.id,
      deliveryMethod: "email",
      destination: maskEmail(destination),
      ...(String(process.env.EMAIL_DEV_MODE || "").toLowerCase() === "true"
        ? { devHint: "Check backend console for the reset code while Brevo is activating." }
        : {})
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

const verifyPasswordReset = async (req, res) => {
  try {
    const requestId = Number(req.body.requestId);
    const pin = typeof req.body.pin === "string" ? req.body.pin.trim() : "";

    if (!requestId || !pin) {
      return res.status(400).json({
        message: "Request ID and PIN are required"
      });
    }

    const request = await prisma.passwordResetRequest.findUnique({
      where: { id: requestId }
    });

    if (!request) {
      return res.status(404).json({
        message: "Reset request not found"
      });
    }

    if (request.expiresAt < new Date()) {
      return res.status(400).json({
        message: "Verification code has expired"
      });
    }

    const isMatch = await bcrypt.compare(pin, request.pinHash);
    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid verification code"
      });
    }

    await prisma.passwordResetRequest.update({
      where: { id: request.id },
      data: {
        verified: true,
        verifiedAt: new Date()
      }
    });

    res.json({
      message: "Verification successful"
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

const completePasswordReset = async (req, res) => {
  try {
    const requestId = Number(req.body.requestId);
    const newPassword = typeof req.body.newPassword === "string" ? req.body.newPassword : "";

    if (!requestId || !newPassword) {
      return res.status(400).json({
        message: "Request ID and new password are required"
      });
    }

    const request = await prisma.passwordResetRequest.findUnique({
      where: { id: requestId },
      include: { user: true }
    });

    if (!request) {
      return res.status(404).json({
        message: "Reset request not found"
      });
    }

    if (!request.verified) {
      return res.status(400).json({
        message: "Verification required before resetting password"
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: request.userId },
      data: {
        password: hashedPassword
      }
    });

    await prisma.passwordResetRequest.delete({
      where: { id: request.id }
    });

    res.json({
      message: "Password reset successful"
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};
module.exports = {
  createSuperAdmin,
  login,
  changePassword,
  forgotPassword,
  requestPasswordReset,
  verifyPasswordReset,
  completePasswordReset
};
