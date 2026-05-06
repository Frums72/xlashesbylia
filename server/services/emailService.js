'use strict';

/**
 * Email service for Lashes by Lia
 * Uses nodemailer when SMTP credentials are configured.
 * Falls back to console logging in demo/development mode.
 */

let transporter = null;

function isDemoMode() {
  return !process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS;
}

async function getTransporter() {
  if (transporter) return transporter;
  try {
    const nodemailer = require('nodemailer');
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: parseInt(process.env.SMTP_PORT || '587', 10) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    return transporter;
  } catch (err) {
    console.warn('[EmailService] nodemailer not available:', err.message);
    return null;
  }
}

async function sendMail({ to, subject, html, text }) {
  if (isDemoMode()) {
    console.log('[EmailService] Demo mode – E-Mail nicht gesendet:');
    console.log(`  An: ${to}`);
    console.log(`  Betreff: ${subject}`);
    console.log(`  Text: ${text || '(nur HTML)'}`);
    return { ok: true, demo: true };
  }

  try {
    const transport = await getTransporter();
    if (!transport) {
      console.warn('[EmailService] Kein Transporter verfügbar – E-Mail übersprungen.');
      return { ok: false, error: 'Kein Transporter' };
    }
    const from = process.env.SMTP_FROM || process.env.SMTP_USER;
    const info = await transport.sendMail({ from, to, subject, html, text });
    console.log(`[EmailService] E-Mail gesendet an ${to}: ${info.messageId}`);
    return { ok: true, messageId: info.messageId };
  } catch (err) {
    console.error('[EmailService] Fehler beim Senden:', err.message);
    return { ok: false, error: err.message };
  }
}

/**
 * Sends a registration confirmation email to the new user.
 */
async function sendRegistrationConfirmation({ email, firstName, lastName }) {
  const name = [firstName, lastName].filter(Boolean).join(' ') || email;
  return sendMail({
    to: email,
    subject: 'Deine Registrierung bei Lashes by Lia',
    text: `Hallo ${firstName || name},\n\ndeine Registrierung bei Lashes by Lia wurde empfangen. Dein Konto wird jetzt persönlich geprüft und anschließend freigeschaltet.\n\nDu erhältst eine weitere E-Mail, sobald dein Konto freigegeben wurde.\n\nViele Grüße,\nJulia – Lashes by Lia`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;">
        <h2 style="color:#231f1c;">Hallo ${firstName || name}!</h2>
        <p>Deine Registrierung bei <strong>Lashes by Lia</strong> wurde empfangen.</p>
        <p>Dein Konto wird jetzt persönlich geprüft und anschließend freigeschaltet. Du erhältst eine weitere E-Mail, sobald du dich anmelden kannst.</p>
        <p style="color:#888;font-size:0.9em;">Viele Grüße,<br>Julia – Lashes by Lia</p>
      </div>
    `
  });
}

/**
 * Sends an approval notification email when an account is approved.
 */
async function sendApprovalNotification({ email, firstName, lastName }) {
  const name = [firstName, lastName].filter(Boolean).join(' ') || email;
  return sendMail({
    to: email,
    subject: 'Dein Konto bei Lashes by Lia wurde freigeschaltet',
    text: `Hallo ${firstName || name},\n\ndein Konto bei Lashes by Lia wurde freigeschaltet. Du kannst dich jetzt anmelden.\n\nViele Grüße,\nJulia – Lashes by Lia`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;">
        <h2 style="color:#231f1c;">Willkommen, ${firstName || name}!</h2>
        <p>Dein Konto bei <strong>Lashes by Lia</strong> wurde freigeschaltet.</p>
        <p>Du kannst dich jetzt mit deiner E-Mail-Adresse und deinem Passwort anmelden.</p>
        <p style="color:#888;font-size:0.9em;">Viele Grüße,<br>Julia – Lashes by Lia</p>
      </div>
    `
  });
}

/**
 * Sends a password reset email with a temporary token/link.
 */
async function sendPasswordReset({ email, firstName, resetToken }) {
  const name = firstName || email;
  const baseUrl = process.env.APP_URL || 'https://lashes-by-lia.de';
  const resetLink = `${baseUrl}/dashboard?reset=${encodeURIComponent(resetToken)}`;
  return sendMail({
    to: email,
    subject: 'Passwort zurücksetzen – Lashes by Lia',
    text: `Hallo ${name},\n\ndu hast eine Anfrage zum Zurücksetzen deines Passworts gestellt.\n\nDein temporärer Reset-Code lautet: ${resetToken}\n\nFalls du diese Anfrage nicht gestellt hast, kannst du diese E-Mail ignorieren.\n\nViele Grüße,\nJulia – Lashes by Lia`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;">
        <h2 style="color:#231f1c;">Passwort zurücksetzen</h2>
        <p>Hallo ${name},</p>
        <p>du hast eine Anfrage zum Zurücksetzen deines Passworts gestellt.</p>
        <p>Dein temporärer Reset-Code lautet:</p>
        <p style="font-size:1.4em;font-weight:bold;letter-spacing:2px;color:#231f1c;">${resetToken}</p>
        <p style="color:#888;font-size:0.9em;">Falls du diese Anfrage nicht gestellt hast, kannst du diese E-Mail ignorieren.</p>
        <p style="color:#888;font-size:0.9em;">Viele Grüße,<br>Julia – Lashes by Lia</p>
      </div>
    `
  });
}

/**
 * Sends an appointment reminder email.
 */
async function sendAppointmentReminder({ email, firstName, service, date, time, message }) {
  const name = firstName || email;
  const reminderText = message || `Hallo! Das ist deine Erinnerung an deinen Termin bei Lashes by Lia. Wenn du Rückfragen hast, melde dich gerne kurz zurück.`;
  return sendMail({
    to: email,
    subject: `Terminerinnerung: ${service} am ${date}`,
    text: `Hallo ${name},\n\n${reminderText}\n\nDein Termin: ${service} am ${date} um ${time} Uhr.\n\nViele Grüße,\nJulia – Lashes by Lia`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;">
        <h2 style="color:#231f1c;">Terminerinnerung</h2>
        <p>Hallo ${name},</p>
        <p>${reminderText}</p>
        <div style="background:#f8f0e9;border-radius:8px;padding:16px;margin:16px 0;">
          <strong>${service}</strong><br>
          ${date} um ${time} Uhr
        </div>
        <p style="color:#888;font-size:0.9em;">Viele Grüße,<br>Julia – Lashes by Lia</p>
      </div>
    `
  });
}

module.exports = {
  sendRegistrationConfirmation,
  sendApprovalNotification,
  sendPasswordReset,
  sendAppointmentReminder,
  sendMail,
  isDemoMode
};
