// Outgoing email (password resets). Configure SMTP in backend/.env:
//   SMTP_HOST, SMTP_PORT (465 or 587), SMTP_USER, SMTP_PASS, MAIL_FROM
// Without it nothing is sent and the message is only logged - the API still
// answers normally so it never reveals whether an email address exists.
const logger = require('../utils/logger');

let transport = null;
function getTransport() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) return null;
  if (!transport) {
    const nodemailer = require('nodemailer');
    const port = Number(process.env.SMTP_PORT || 465);
    transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transport;
}

function isConfigured() { return !!getTransport(); }

async function send({ to, subject, text, html }) {
  const t = getTransport();
  if (!t) {
    logger.warn({ to, subject }, 'Email not sent: SMTP is not configured');
    return false;
  }
  await t.sendMail({ from: process.env.MAIL_FROM || `Happy Hour <${process.env.SMTP_USER}>`, to, subject, text, html });
  return true;
}

module.exports = { send, isConfigured };
