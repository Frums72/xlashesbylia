require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');
const { requireAuth } = require('./middleware/auth');
const { initDatabase } = require('./db/connection');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
const corsOptions = {
  origin: function(origin, callback) {
    // Allow all origins including undefined (for same-origin requests)
    callback(null, true);
  },
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Session
app.set('trust proxy', 1); // Trust Railway proxy
app.use(session({
  secret: process.env.SESSION_SECRET || 'lashes-by-lia-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Allow cookies in HTTP for development
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Static files
app.use(express.static(path.join(__dirname, '../public')));
app.use('/assets', express.static(path.join(__dirname, '../assets')));
app.use('/docs', express.static(path.join(__dirname, '../docs')));

// Serve root-level CSS and JS used by the original website
app.get('/styles.css', (req, res) => {
  res.sendFile(path.join(__dirname, '../styles.css'));
});
app.get('/public.js', (req, res) => {
  res.sendFile(path.join(__dirname, '../public.js'));
});
app.get('/dashboard.js', (req, res) => {
  res.sendFile(path.join(__dirname, '../dashboard.js'));
});
app.get('/dashboard-finalize.js', (req, res) => {
  res.sendFile(path.join(__dirname, '../dashboard-finalize.js'));
});
app.get('/dashboard-polish.js', (req, res) => {
  res.sendFile(path.join(__dirname, '../dashboard-polish.js'));
});
app.get('/dashboard-free-slots.js', (req, res) => {
  res.sendFile(path.join(__dirname, '../dashboard-free-slots.js'));
});

// Health check for Railway
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Dashboard PHP API compatibility layer
app.use('/dashboard-api.php', express.json(), (req, res) => {
  const action = req.query.action;
  const pool = require('./db/connection').pool;
  
  // Session check
  if (action === 'session') {
    if (!req.session.userId) {
      return res.json({ ok: false });
    }
    return res.json({
      ok: true,
      currentUser: {
        id: req.session.userId,
        email: req.session.userEmail,
        name: req.session.userName,
        role: req.session.role
      },
      state: {}
    });
  }
  
  // Login
  if (action === 'login' && req.method === 'POST') {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.json({ ok: false, message: 'Email and password required' });
    }
    return pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()])
      .then(result => {
        if (result.rows.length === 0) {
          return res.json({ ok: false, message: 'Invalid credentials' });
        }
        const user = result.rows[0];
        if (user.approval_status !== 'approved') {
          return res.json({ ok: false, message: 'Account not approved' });
        }
        return require('bcryptjs').compare(password, user.password_hash)
          .then(valid => {
            if (!valid) {
              return res.json({ ok: false, message: 'Invalid credentials' });
            }
            req.session.userId = user.id;
            req.session.userEmail = user.email;
            req.session.userName = user.name;
            req.session.role = user.role;
            return res.json({
              ok: true,
              currentUser: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                firstName: user.first_name,
                lastName: user.last_name
              }
            });
          });
      })
      .catch(err => {
        console.error('Login error:', err);
        return res.json({ ok: false, message: 'Server error' });
      });
  }
  
  // Logout
  if (action === 'logout' && req.method === 'POST') {
    req.session.destroy();
    return res.json({ ok: true });
  }
  
  // Default - redirect to login
  return res.json({ ok: false, message: 'Not authenticated' });
});

// Contact form endpoint
app.post('/api/contact', async (req, res) => {
  const { name, email, phone, message } = req.body || {};
  if (!name || !email || !message) {
    return res.status(400).json({ ok: false, message: 'Bitte fülle alle Pflichtfelder aus.' });
  }
  // Basic email validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ ok: false, message: 'Bitte gib eine gültige E-Mail-Adresse ein.' });
  }
  try {
    const emailService = require('./services/emailService');
    // Send notification to studio owner
    await emailService.sendMail({
      to: process.env.CONTACT_EMAIL || 'info@lashes-by-lia.de',
      subject: `Neue Kontaktanfrage von ${name}`,
      text: `Name: ${name}\nE-Mail: ${email}\nTelefon: ${phone || 'nicht angegeben'}\n\nNachricht:\n${message}`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;">
          <h2 style="color:#231f1c;">Neue Kontaktanfrage</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>E-Mail:</strong> <a href="mailto:${email}">${email}</a></p>
          <p><strong>Telefon:</strong> ${phone || 'nicht angegeben'}</p>
          <hr style="border:none;border-top:1px solid #eee;margin:16px 0;">
          <p><strong>Nachricht:</strong></p>
          <p style="white-space:pre-wrap;">${message}</p>
        </div>
      `
    });
    // Send confirmation to sender
    await emailService.sendMail({
      to: email,
      subject: 'Deine Nachricht bei Lashes by Lia',
      text: `Hallo ${name},\n\nvielen Dank für deine Nachricht! Ich melde mich so schnell wie möglich bei dir.\n\nViele Grüße,\nJulia – Lashes by Lia`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;">
          <h2 style="color:#231f1c;">Danke für deine Nachricht!</h2>
          <p>Hallo ${name},</p>
          <p>ich habe deine Nachricht erhalten und melde mich so schnell wie möglich bei dir.</p>
          <p style="color:#888;font-size:0.9em;">Viele Grüße,<br>Julia – Lashes by Lia</p>
        </div>
      `
    });
    return res.json({ ok: true, message: 'Nachricht erfolgreich gesendet.' });
  } catch (err) {
    console.error('Contact form error:', err.message);
    return res.status(500).json({ ok: false, message: 'Serverfehler beim Senden. Bitte versuche es erneut.' });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);

// Dashboard state save/load (for dashboard.js compatibility)
app.post('/dashboard-api.php', express.json(), (req, res) => {
  const action = req.query.action;
  const pool = require('./db/connection').pool;
  
  // Session check
  if (action === 'session') {
    if (!req.session.userId) {
      return res.json({ ok: false });
    }
    return pool.query('SELECT * FROM users WHERE id = $1', [req.session.userId])
      .then(result => {
        if (result.rows.length === 0) {
          return res.json({ ok: false });
        }
        const user = result.rows[0];
        return res.json({
          ok: true,
          currentUser: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            firstName: user.first_name,
            lastName: user.last_name,
            phone: user.phone
          },
          state: user.dashboard_state ? JSON.parse(user.dashboard_state) : {}
        });
      });
  }
  
  // Save state
  if (action === 'save-state' && req.method === 'POST') {
    if (!req.session.userId) {
      return res.json({ ok: false, message: 'Not authenticated' });
    }
    
    try {
      const { state } = req.body;
      let stateJson = '{}';
      
      if (state) {
        try {
          stateJson = JSON.stringify(state);
        } catch (e) {
          stateJson = '{}';
        }
      }
      
      pool.query(
        'UPDATE users SET dashboard_state = $1, last_active = CURRENT_TIMESTAMP WHERE id = $2',
        [stateJson, req.session.userId]
      ).then(() => {
        res.json({ ok: true });
      }).catch(err => {
        console.error('Save state error:', err);
        res.json({ ok: false, message: 'Save failed: ' + err.message });
      });
    } catch (err) {
      console.error('Save state parse error:', err);
      res.json({ ok: false, message: 'Save failed' });
    }
    return;
  }
  
  // Login
  if (action === 'login' && req.method === 'POST') {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.json({ ok: false, message: 'Email and password required' });
    }
    return pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email])
      .then(result => {
        if (result.rows.length === 0) {
          return res.json({ ok: false, message: 'Invalid credentials' });
        }
        const user = result.rows[0];
        if (user.approval_status !== 'approved') {
          return res.json({ ok: false, message: user.approval_status === 'pending' ? 'Account pending approval' : 'Account rejected' });
        }
        return require('bcryptjs').compare(password, user.password_hash)
          .then(valid => {
            if (!valid) {
              return res.json({ ok: false, message: 'Invalid credentials' });
            }
            req.session.userId = user.id;
            req.session.userEmail = user.email;
            req.session.userName = user.name;
            req.session.role = user.role;
            return res.json({
              ok: true,
              currentUser: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                firstName: user.first_name,
                lastName: user.last_name,
                phone: user.phone
              },
              state: user.dashboard_state ? JSON.parse(user.dashboard_state) : {}
            });
          });
      });
  }
  
  // Logout
  if (action === 'logout' && req.method === 'POST') {
    req.session.destroy();
    return res.json({ ok: true });
  }
  
  // Register
  if (action === 'register' && req.method === 'POST') {
    const { email, password, firstName, lastName, phone, birthdate, contactHint } = req.body;
    if (!email || !password) {
      return res.json({ ok: false, message: 'Email and password required' });
    }
    const name = `${firstName || ''} ${lastName || ''}`.trim() || email;
    return require('bcryptjs').hash(password, 10)
      .then(hash => pool.query(
        'INSERT INTO users (email, password_hash, first_name, last_name, name, phone, birthdate, contact_hint, role, approval_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
        [email.toLowerCase(), hash, firstName || '', lastName || '', name, phone || null, birthdate || null, contactHint || null, 'customer', 'pending']
      ))
      .then(() => {
        // Send confirmation email (non-blocking)
        const emailService = require('./services/emailService');
        emailService.sendRegistrationConfirmation({ email, firstName, lastName }).catch(err => {
          console.error('Registration email error:', err.message);
        });
        return res.json({ ok: true, message: 'Registrierung erfolgreich. Dein Konto wird geprüft.' });
      })
      .catch(err => {
        if (err.code === '23505') {
          return res.json({ ok: false, message: 'Email already exists' });
        }
        console.error('Register error:', err);
        return res.json({ ok: false, message: 'Registration failed' });
      });
  }

  // Password reset request
  if (action === 'request-password-reset' && req.method === 'POST') {
    const { email } = req.body;
    if (!email) {
      return res.json({ ok: false, message: 'E-Mail-Adresse erforderlich' });
    }
    return pool.query('SELECT id, email, first_name FROM users WHERE LOWER(email) = LOWER($1)', [email])
      .then(result => {
        if (result.rows.length === 0) {
          return res.json({ ok: true, message: 'Wenn ein Konto existiert, wird ein Reset-Link verschickt.' });
        }
        const user = result.rows[0];
        const crypto = require('crypto');
        const token = crypto.randomBytes(32).toString('hex');
        const emailService = require('./services/emailService');
        emailService.sendPasswordReset({
          email: user.email,
          firstName: user.first_name,
          resetToken: token
        }).catch(err => console.error('Password reset email error:', err.message));
        return res.json({ ok: true, message: 'Wenn ein Konto existiert, wird ein Reset-Link verschickt.' });
      })
      .catch(err => {
        console.error('Password reset request error:', err);
        return res.json({ ok: false, message: 'Serverfehler' });
      });
  }
  
  // Save all data (users, appointments)
  if (action === 'save-data' && req.method === 'POST') {
    if (!req.session.userId) {
      return res.json({ ok: false, message: 'Not authenticated' });
    }
    const { users, appointments, settings } = req.body;
    
    // Save dashboard state
    return pool.query(
      'UPDATE users SET dashboard_state = $1, last_active = CURRENT_TIMESTAMP WHERE id = $2',
      [JSON.stringify({ users, appointments, settings }), req.session.userId]
    ).then(() => {
      // Create new customers if they don't exist
      if (users && Array.isArray(users)) {
        const newCustomers = users.filter(u => 
          u.role === 'customer' && 
          u.id && 
          !String(u.id).match(/^(admin|cust)-/)
        );
        
        const insertPromises = newCustomers.map(customer => {
          return pool.query(
            `INSERT INTO users (email, password_hash, first_name, last_name, name, phone, role, approval_status, dashboard_state)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             ON CONFLICT (email) DO UPDATE SET
               first_name = EXCLUDED.first_name,
               last_name = EXCLUDED.last_name,
               name = EXCLUDED.name,
               phone = EXCLUDED.phone`,
            [
              customer.email || '',
              customer.password_hash || '',
              customer.firstName || '',
              customer.lastName || '',
              customer.name || '',
              customer.phone || '',
              'customer',
              customer.approvalStatus || 'pending',
              JSON.stringify(customer)
            ]
          ).catch(err => {
            console.error('Error saving customer:', err);
            return null;
          });
        });
        
        return Promise.all(insertPromises);
      }
      return [];
    }).then(() => {
      // Save appointments
      if (appointments && Array.isArray(appointments)) {
        const apptPromises = appointments.slice(0, 50).map(appt => {
          return pool.query(
            `INSERT INTO appointments (user_id, service, date, time, note, status)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT DO NOTHING`,
            [
              appt.customerId || req.session.userId,
              appt.service || '',
              appt.date || new Date().toISOString().split('T')[0],
              appt.time || '09:00',
              appt.note || '',
              appt.status || 'pending'
            ]
          ).catch(err => {
            console.error('Error saving appointment:', err);
            return null;
          });
        });
        return Promise.all(apptPromises);
      }
      return [];
    }).then(() => {
      return res.json({ ok: true });
    }).catch(err => {
      console.error('Save data error:', err);
      return res.json({ ok: false, message: 'Save failed' });
    });
  }
  
  // Default
  return res.json({ ok: false, message: 'Unknown action' });
});

// Public pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin/dashboard.html'));
});

// Protected dashboard - serves from public folder for Railway caching
app.get('/dashboard', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin/dashboard.html'));
});

// Also serve without auth for testing
app.get('/dashboard.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin/dashboard.html'));
});

// All other public pages
app.get('/:page', (req, res) => {
  const page = req.params.page + '.html';
  const filePath = path.join(__dirname, '../public', page);
  res.sendFile(filePath, (err) => {
    if (err) res.redirect('/');
  });
});

// API catch-all for SPA-like behavior
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Initialize database then start server
initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Dashboard: http://localhost:${PORT}/dashboard`);
      console.log(`Login: http://localhost:${PORT}/login`);
    });
  })
  .catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });
