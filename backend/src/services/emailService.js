const nodemailer = require("nodemailer");

const isDevEmailMode = () =>
  String(process.env.EMAIL_DEV_MODE || "").toLowerCase() === "true";

const parseSender = (from) => {
  const raw = String(from || "").trim();
  const match = raw.match(/^(.+?)\s*<([^>]+)>$/);

  if (match) {
    return { name: match[1].trim(), email: match[2].trim() };
  }

  return { name: "IT ERP", email: raw };
};

const buildEmailTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = String(process.env.SMTP_SECURE || "").toLowerCase() === "true";
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass
    }
  });
};

const sendViaBrevoApi = async ({ destination, subject, text, html }) => {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    return false;
  }

  const sender = parseSender(process.env.SMTP_FROM || process.env.SMTP_USER);
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": apiKey,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      sender,
      to: [{ email: destination }],
      subject,
      textContent: text,
      htmlContent: html
    })
  });

  if (!response.ok) {
    let detail = `Brevo API request failed (${response.status})`;
    try {
      const body = await response.json();
      detail = body.message || body.error || detail;
    } catch (error) {
      // keep default detail
    }

    if (isDevEmailMode() && /not yet activated|permission_denied/i.test(detail)) {
      return "dev-fallback";
    }

    throw new Error(detail);
  }

  return true;
};

const sendViaSmtp = async ({ destination, subject, text, html }) => {
  const transporter = buildEmailTransporter();
  if (!transporter) {
    return false;
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: destination,
    subject,
    text,
    html
  });

  return true;
};

const withTimeout = (promise, ms = 15000) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Delivery timed out")), ms)
    )
  ]);

const sendEmail = async ({ destination, subject, text, html }) => {
  if (!destination) {
    throw new Error("Email destination is required");
  }

  const hasBrevoApi = Boolean(process.env.BREVO_API_KEY);
  const hasSmtp = Boolean(
    process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
  );

  if (!hasBrevoApi && !hasSmtp) {
    throw new Error("Email delivery is not configured");
  }

  try {
    if (hasBrevoApi) {
      const result = await withTimeout(sendViaBrevoApi({ destination, subject, text, html }));
      if (result === "dev-fallback") {
        return "dev-fallback";
      }
      return;
    }

    await withTimeout(sendViaSmtp({ destination, subject, text, html }));
  } catch (error) {
    const message = String(error?.message || error);
    if (/ECONNREFUSED|ETIMEDOUT|ENOTFOUND/i.test(message)) {
      throw new Error(
        "Unable to reach the email server. Use BREVO_API_KEY for HTTPS delivery if SMTP ports are blocked."
      );
    }
    throw error;
  }
};

const sendPasswordResetPin = async ({ destination, pin, employeeId }) => {
  const subject = "Your IT ERP password reset code";
  const text = `Your password reset code for employee ${employeeId} is ${pin}. It expires in 10 minutes.`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5;">
      <h2>IT ERP Password Reset</h2>
      <p>Your verification code is:</p>
      <div style="font-size: 28px; font-weight: bold; letter-spacing: 4px;">${pin}</div>
      <p>This code expires in 10 minutes.</p>
    </div>
  `;

  if (isDevEmailMode()) {
    console.log(
      `[EMAIL_DEV_MODE] Password reset for ${employeeId} -> ${destination}: ${pin}`
    );
  }

  const result = await sendEmail({ destination, subject, text, html });
  if (result === "dev-fallback") {
    console.log(
      `[EMAIL_DEV_MODE] Brevo relay inactive; using console code for ${employeeId}: ${pin}`
    );
  }
};

module.exports = {
  sendEmail,
  sendPasswordResetPin
};
