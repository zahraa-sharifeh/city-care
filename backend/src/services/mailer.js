const nodemailer = require("nodemailer");

let cachedTransporter = null;
let warnedMissingConfig = false;

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buildStatusEmailContent({ citizenName, category, previousStatusLabel, statusLabel, statusNote, reportId }) {
  const safeCitizenName = escapeHtml(citizenName || "Citizen");
  const safeCategory = escapeHtml(category || "Report");
  const safePrevious = escapeHtml(previousStatusLabel || "Submitted");
  const safeNext = escapeHtml(statusLabel || "Updated");
  const safeNote = escapeHtml(statusNote || "");
  const safeReportId = escapeHtml(reportId || "");

  const text = [
    `Hello ${citizenName || "Citizen"},`,
    "",
    `Your report "${category}" moved from ${previousStatusLabel} to ${statusLabel}.`,
    statusNote ? `Admin note: ${statusNote}` : "",
    reportId ? `Report ID: ${reportId}` : "",
    "",
    "Thank you for helping improve your city.",
  ]
    .filter(Boolean)
    .join("\n");

  const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; line-height: 1.5; color: #1f2937; max-width: 640px; margin: 0 auto; padding: 18px;">
      <h2 style="margin: 0 0 12px; color: #166088;">Report status update</h2>
      <p style="margin: 0 0 10px;">Hello ${safeCitizenName},</p>
      <p style="margin: 0 0 12px;">
        Your report <strong>"${safeCategory}"</strong> moved from
        <strong>${safePrevious}</strong> to <strong>${safeNext}</strong>.
      </p>
      ${
        safeNote
          ? `<div style="margin: 0 0 12px; padding: 10px 12px; border-radius: 8px; background: #f3f4f6; border: 1px solid #e5e7eb;">
               <strong>Admin note:</strong> ${safeNote}
             </div>`
          : ""
      }
      ${safeReportId ? `<p style="margin: 0 0 12px;"><strong>Report ID:</strong> ${safeReportId}</p>` : ""}
      <p style="margin: 0;">Thank you for helping improve your city.</p>
    </div>
  `;

  return { text, html };
}

function getEmailConfig() {
  const host = process.env.SMTP_HOST || "";
  const port = Number(process.env.SMTP_PORT || 0);
  const user = process.env.SMTP_USER || "";
  const pass = process.env.SMTP_PASS || "";
  const secure = String(process.env.SMTP_SECURE || "false").toLowerCase() === "true";
  const from = process.env.MAIL_FROM || user;
  const enabled = String(process.env.EMAIL_NOTIFICATIONS_ENABLED || "false").toLowerCase() === "true";
  const previewMode = String(process.env.EMAIL_PREVIEW_MODE || "false").toLowerCase() === "true";

  const isValid = enabled && host && port > 0 && user && pass && from;
  return { enabled, isValid, host, port, user, pass, secure, from, previewMode };
}

function getTransporter() {
  if (cachedTransporter) return cachedTransporter;
  const cfg = getEmailConfig();
  if (!cfg.isValid) return null;
  cachedTransporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: { user: cfg.user, pass: cfg.pass },
  });
  return cachedTransporter;
}

async function sendStatusEmail({ to, citizenName, category, previousStatusLabel, statusLabel, statusNote, reportId }) {
  if (!to) return { sent: false, reason: "missing-recipient" };
  const cfg = getEmailConfig();
  if (cfg.previewMode) {
    const subject = `Report update: ${category} is now ${statusLabel}`;
    const { text, html } = buildStatusEmailContent({
      citizenName,
      category,
      previousStatusLabel,
      statusLabel,
      statusNote,
      reportId,
    });
    console.log(
      [
        "EMAIL_PREVIEW_MODE active (email not sent)",
        `To: ${to}`,
        `Subject: ${subject}`,
        "Text:",
        text,
        "HTML:",
        html,
      ].join("\n")
    );
    return { sent: false, preview: true };
  }

  if (!cfg.isValid) {
    if (!warnedMissingConfig && cfg.enabled) {
      warnedMissingConfig = true;
      console.warn("Email notifications enabled but SMTP config is incomplete. Skipping email sending.");
    }
    return { sent: false, reason: "disabled-or-misconfigured" };
  }

  const transporter = getTransporter();
  if (!transporter) return { sent: false, reason: "transporter-unavailable" };

  const subject = `Report update: ${category} is now ${statusLabel}`;
  const { text, html } = buildStatusEmailContent({
    citizenName,
    category,
    previousStatusLabel,
    statusLabel,
    statusNote,
    reportId,
  });

  await transporter.sendMail({
    from: cfg.from,
    to,
    subject,
    text,
    html,
  });
  return { sent: true };
}

module.exports = { sendStatusEmail };
