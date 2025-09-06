/* eslint-env node */
/* global process */
import nodemailer from 'nodemailer';

// Create transport from env or use ethereal fallback in development
function createTransport() {
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  // Fallback: JSON transport (logs to console), safe for dev
  return nodemailer.createTransport({ jsonTransport: true });
}

const transporter = createTransport();

async function sendMail({ to, subject, text, html, from }) {
  const mailFrom = from || process.env.MAIL_FROM || 'no-reply@example.com';
  const info = await transporter.sendMail({ from: mailFrom, to, subject, text, html });
  return info;
}

export { sendMail, sendMail as sendEmail };
