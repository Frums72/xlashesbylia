const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../db/connection');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// ============== CUSTOMERS ==============

// Get customers
router.get('/customers', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM customers WHERE deleted_at IS NULL ORDER BY name ASC'
    );
    // Convert to dashboard format
    const customers = result.rows.map(c => ({
      id: String(c.id),
      role: 'customer',
      approvalStatus: 'approved',
      approvedAt: c.created_at,
      approvedBy: 'Admin',
      firstName: c.first_name || '',
      lastName: c.last_name || '',
      name: c.name || '',
      email: c.email || '',
      phone: c.phone || '',
      whatsapp: c.whatsapp || '',
      instagram: c.instagram || '',
      birthdate: c.birthdate || '',
      address: c.address || '',
      avatar: '',
      documents: c.documents || {},
      createdAt: c.created_at,
      lastEdited: c.last_edited || c.created_at,
      online: false
    }));
    res.json(customers);
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Create customer
router.post('/customers', requireAdmin, async (req, res) => {
  try {
    const { firstName, lastName, name, email, phone, whatsapp, instagram, birthdate, address, documents, password } = req.body;
    
    const fullName = name || `${firstName || ''} ${lastName || ''}`.trim();
    const result = await pool.query(`
      INSERT INTO customers (first_name, last_name, name, email, phone, whatsapp, instagram, birthdate, address, documents, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [firstName, lastName, fullName, email, phone, whatsapp, instagram, birthdate || null, address, JSON.stringify(documents || {}), req.session.userId]);

    const customer = result.rows[0];

    // Also create user account if password provided
    if(password && email){
      const hashedPassword = await bcrypt.hash(password, 10);
      await pool.query(`
        INSERT INTO users (email, password_hash, first_name, last_name, name, phone, role, approval_status, approved_at, approved_by)
        VALUES ($1, $2, $3, $4, $5, $6, 'customer', 'approved', CURRENT_TIMESTAMP, $7)
        ON CONFLICT (email) DO NOTHING
      `, [email.toLowerCase(), hashedPassword, firstName, lastName, fullName, phone, req.session.userName || 'Admin']);
    }

    // Return in dashboard format
    res.json({
      id: String(customer.id),
      role: 'customer',
      approvalStatus: 'approved',
      approvedAt: customer.created_at,
      approvedBy: 'Admin',
      firstName: customer.first_name || '',
      lastName: customer.last_name || '',
      name: customer.name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      whatsapp: customer.whatsapp || '',
      instagram: customer.instagram || '',
      birthdate: customer.birthdate || '',
      address: customer.address || '',
      avatar: '',
      documents: customer.documents || {},
      createdAt: customer.created_at,
      lastEdited: customer.last_edited || customer.created_at,
      online: false
    });
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Update customer
router.put('/customers/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, name, email, phone, whatsapp, instagram, birthdate, address, documents } = req.body;
    
    const result = await pool.query(`
      UPDATE customers 
      SET first_name = $1, last_name = $2, name = $3, email = $4, phone = $5, whatsapp = $6, instagram = $7, 
          birthdate = $8, address = $9, documents = $10, last_edited = CURRENT_TIMESTAMP
      WHERE id = $11
      RETURNING *
    `, [firstName, lastName, name || `${firstName} ${lastName}`, email, phone, whatsapp, instagram, birthdate, address, JSON.stringify(documents || {}), id]);

    const customer = result.rows[0];

    // Return in dashboard format
    res.json({
      id: String(customer.id),
      role: 'customer',
      approvalStatus: 'approved',
      approvedAt: customer.created_at,
      approvedBy: 'Admin',
      firstName: customer.first_name || '',
      lastName: customer.last_name || '',
      name: customer.name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      whatsapp: customer.whatsapp || '',
      instagram: customer.instagram || '',
      birthdate: customer.birthdate || '',
      address: customer.address || '',
      avatar: '',
      documents: customer.documents || {},
      createdAt: customer.created_at,
      lastEdited: customer.last_edited || customer.created_at,
      online: false
    });
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete customer (soft delete)
router.delete('/customers/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(
      'UPDATE customers SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============== APPOINTMENTS ==============

// Helper to normalize appointment row from DB to camelCase
function normalizeAppointment(row) {
  return {
    id: String(row.id),
    customerId: String(row.customer_id || row.user_id || ''),
    service: row.service || '',
    date: row.date || '',
    time: row.time || '',
    endTime: row.end_time || '',
    note: row.note || '',
    status: row.status || 'open',
    needsReconfirm: !!row.needs_reconfirm,
    updatedBy: row.updated_by || '',
    updatedByRole: row.updated_by_role || '',
    updatedAt: row.updated_at || row.created_at || ''
  };
}

// Get appointments
router.get('/appointments', async (req, res) => {
  try {
    // Use simple query without complex joins to avoid FK issues
    let query = 'SELECT * FROM appointments WHERE 1=1';
    let params = [];
    
    // Non-admins only see their own appointments
    if (req.session.role !== 'admin') {
      query += ' AND user_id = $1';
      params.push(req.session.userId);
    }
    
    query += ' ORDER BY date ASC, time ASC';
    
    const result = await pool.query(query, params);
    res.json(result.rows.map(normalizeAppointment));
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Create appointment
router.post('/appointments', async (req, res) => {
  try {
    const { customerId, service, date, time, endTime, note, status } = req.body;
    
    const result = await pool.query(`
      INSERT INTO appointments (customer_id, user_id, service, date, time, end_time, note, status, needs_reconfirm, updated_by, updated_by_role)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [customerId, req.session.userId, service, date, time, endTime, note, status || 'open', true, req.session.userName, req.session.role]);

    res.json(normalizeAppointment(result.rows[0]));
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update appointment
router.put('/appointments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { service, date, time, endTime, note, status, needsReconfirm } = req.body;
    
    const result = await pool.query(`
      UPDATE appointments 
      SET service = $1, date = $2, time = $3, end_time = $4, note = $5, status = $6, needs_reconfirm = $7, 
          updated_by = $8, updated_by_role = $9, updated_at = CURRENT_TIMESTAMP
      WHERE id = $10
      RETURNING *
    `, [service, date, time, endTime, note, status, needsReconfirm, req.session.userName, req.session.role, id]);

    res.json(normalizeAppointment(result.rows[0]));
  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete appointment
router.delete('/appointments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM appointments WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete appointment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============== TASKS ==============

// Get tasks
router.get('/tasks', async (req, res) => {
  try {
    let query = 'SELECT * FROM tasks';
    let params = [];
    
    // Non-admins only see their own tasks
    if (req.session.role !== 'admin') {
      query += ' WHERE created_by = $1';
      params.push(req.session.userId);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create task
router.post('/tasks', async (req, res) => {
  try {
    const { title, note, reminderAt, reminder } = req.body;
    
    const result = await pool.query(`
      INSERT INTO tasks (title, note, reminder_at, reminder, created_by, created_by_name)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [title, note, reminderAt, JSON.stringify(reminder || {}), req.session.userId, req.session.userName]);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Complete task
router.put('/tasks/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      UPDATE tasks 
      SET status = 'done', completed_by = $1, completed_by_name = $2, completed_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `, [req.session.userId, req.session.userName, id]);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Complete task error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete task
router.delete('/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============== SETTINGS ==============

// Get settings
router.get('/settings', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM settings');
    const settings = {};
    result.rows.forEach(row => {
      settings[row.key] = row.value;
    });
    res.json(settings);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update settings
router.put('/settings', requireAdmin, async (req, res) => {
  try {
    const settings = req.body;
    
    for (const [key, value] of Object.entries(settings)) {
      await pool.query(`
        INSERT INTO settings (key, value, updated_at)
        VALUES ($1, $2, CURRENT_TIMESTAMP)
        ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP
      `, [key, JSON.stringify(value)]);
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Save dashboard state
router.post('/save-state', requireAuth, async (req, res) => {
  try {
    const { state } = req.body;
    if (!state) {
      return res.status(400).json({ ok: false, message: 'No state provided' });
    }

    const result = await pool.query(
      'UPDATE users SET dashboard_state = $1, last_active = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [JSON.stringify(state), req.session.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ ok: false, message: 'User not found' });
    }

    const user = result.rows[0];
    return res.json({
      ok: true,
      message: 'State saved successfully',
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
  } catch (error) {
    console.error('Save state error:', error);
    return res.status(500).json({ ok: false, message: 'Server error' });
  }
});

module.exports = router;
