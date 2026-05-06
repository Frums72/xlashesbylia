const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { pool } = require('../db/connection');
const emailService = require('../services/emailService');

const router = express.Router();

// In-memory store for password reset tokens (keyed by token -> { userId, email, expires })
// In production, use a database table or Redis for persistence across restarts.
const resetTokens = new Map();

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Check approval status
    if (user.approval_status !== 'approved') {
      return res.status(403).json({ error: 'Account not approved yet' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await pool.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP, last_active = CURRENT_TIMESTAMP, online = true WHERE id = $1',
      [user.id]
    );

    // Set session
    req.session.userId = user.id;
    req.session.userEmail = user.email;
    req.session.userName = user.name;
    req.session.role = user.role;

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        firstName: user.first_name,
        lastName: user.last_name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ success: true });
  });
});

// Check session
router.get('/me', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ authenticated: false });
  }

  try {
    const result = await pool.query(
      'SELECT id, email, name, role, phone, first_name, last_name FROM users WHERE id = $1',
      [req.session.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ authenticated: false });
    }

    const user = result.rows[0];
    res.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        firstName: user.first_name,
        lastName: user.last_name
      }
    });
  } catch (error) {
    console.error('Session check error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, birthdate, contactHint, note } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'E-Mail und Passwort sind erforderlich' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Das Passwort muss mindestens 8 Zeichen lang sein' });
    }

    const name = [firstName, lastName].filter(Boolean).join(' ').trim() || email;
    const hash = await bcrypt.hash(password, 10);

    await pool.query(
      `INSERT INTO users
        (email, password_hash, role, first_name, last_name, name, phone, birthdate, contact_hint, approval_status)
       VALUES ($1, $2, 'customer', $3, $4, $5, $6, $7, $8, 'pending')`,
      [
        email.toLowerCase(),
        hash,
        firstName || '',
        lastName || '',
        name,
        phone || null,
        birthdate || null,
        contactHint || null
      ]
    );

    // Send confirmation email (non-blocking)
    emailService.sendRegistrationConfirmation({ email, firstName, lastName }).catch(err => {
      console.error('Registration email error:', err.message);
    });

    res.json({ success: true, message: 'Registrierung erfolgreich. Dein Konto wird geprüft.' });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Diese E-Mail-Adresse ist bereits registriert' });
    }
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registrierung fehlgeschlagen' });
  }
});

// Request password reset
router.post('/request-password-reset', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'E-Mail-Adresse erforderlich' });
    }

    const result = await pool.query(
      'SELECT id, email, first_name FROM users WHERE LOWER(email) = LOWER($1)',
      [email]
    );

    // Always respond with success to prevent email enumeration
    if (result.rows.length === 0) {
      return res.json({ success: true, message: 'Wenn ein Konto existiert, wird ein Reset-Link verschickt.' });
    }

    const user = result.rows[0];
    const token = crypto.randomBytes(32).toString('hex');
    const expires = Date.now() + 60 * 60 * 1000; // 1 hour
    resetTokens.set(token, { userId: user.id, email: user.email, expires });

    // Send reset email (non-blocking)
    emailService.sendPasswordReset({
      email: user.email,
      firstName: user.first_name,
      resetToken: token
    }).catch(err => {
      console.error('Password reset email error:', err.message);
    });

    res.json({ success: true, message: 'Wenn ein Konto existiert, wird ein Reset-Link verschickt.' });
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// Confirm password reset
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token und neues Passwort erforderlich' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Das Passwort muss mindestens 8 Zeichen lang sein' });
    }

    const entry = resetTokens.get(token);
    if (!entry || entry.expires < Date.now()) {
      resetTokens.delete(token);
      return res.status(400).json({ error: 'Der Reset-Link ist ungültig oder abgelaufen' });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [hash, entry.userId]
    );
    resetTokens.delete(token);

    res.json({ success: true, message: 'Passwort erfolgreich zurückgesetzt' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// Approve user (admin only)
router.post('/approve-user', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Nicht angemeldet' });
  }
  try {
    const adminResult = await pool.query('SELECT role FROM users WHERE id = $1', [req.session.userId]);
    if (!adminResult.rows.length || adminResult.rows[0].role !== 'admin') {
      return res.status(403).json({ error: 'Keine Berechtigung' });
    }

    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'userId erforderlich' });
    }

    const result = await pool.query(
      `UPDATE users
       SET approval_status = 'approved', approved_at = CURRENT_TIMESTAMP, approved_by = $1
       WHERE id = $2
       RETURNING email, first_name, last_name`,
      [req.session.userName || 'Admin', userId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }

    const user = result.rows[0];
    // Send approval notification (non-blocking)
    emailService.sendApprovalNotification({
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name
    }).catch(err => {
      console.error('Approval email error:', err.message);
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Approve user error:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// Password reset request
router.post('/forgot', async (req, res) => {
  const { email } = req.body;
  if(!email){
    return res.status(400).json({ success: false, message: 'E-Mail erforderlich' });
  }
  try{
    const result = await pool.query('SELECT id, email, first_name FROM users WHERE LOWER(email) = LOWER($1)', [email]);
    if(result.rows.length === 0){
      return res.json({ success: true, message: 'Wenn ein Konto existiert, wird ein Reset-Link verschickt.' });
    }
    const user = result.rows[0];
    const token = crypto.randomBytes(32).toString('hex');
    resetTokens.set(token, { userId: user.id, email: user.email, expires: Date.now() + 3600000 });
    emailService.sendMail({
      to: user.email,
      subject: 'Passwort zurücksetzen - Lashes by Lia',
      text: `Um dein Passwort zurückzusetzen, klicke auf folgenden Link: ${process.env.APP_URL || 'https://lashesbylia-production.up.railway.app'}/dashboard?reset=${token}`
    }).catch(err => console.error('Reset email error:', err.message));
    res.json({ success: true, message: 'Wenn ein Konto existiert, wird ein Reset-Link verschickt.' });
  }catch(error){
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Serverfehler' });
  }
});

// Password reset update
router.post('/reset', async (req, res) => {
  const { token, password } = req.body;
  if(!token || !password){
    return res.status(400).json({ success: false, message: 'Token und Passwort erforderlich' });
  }
  const tokenData = resetTokens.get(token);
  if(!tokenData || tokenData.expires < Date.now()){
    return res.status(400).json({ success: false, message: 'Token abgelaufen oder ungültig' });
  }
  try{
    const hash = await bcrypt.hash(password, 10);
    await pool.query('UPDATE users SET password_hash = $1, last_active = CURRENT_TIMESTAMP WHERE id = $2', [hash, tokenData.userId]);
    resetTokens.delete(token);
    res.json({ success: true, message: 'Passwort erfolgreich zurückgesetzt.' });
  }catch(error){
    console.error('Reset update error:', error);
    res.status(500).json({ success: false, message: 'Serverfehler' });
  }
});

module.exports = router;
