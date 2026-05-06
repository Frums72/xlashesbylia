const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Initialize database tables
async function initDatabase() {
  const client = await pool.connect();
  try {
    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'customer',
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        name VARCHAR(255),
        phone VARCHAR(50),
        birthdate DATE,
        address TEXT,
        instagram VARCHAR(100),
        whatsapp VARCHAR(50),
        contact_hint VARCHAR(255),
        approval_status VARCHAR(20) DEFAULT 'pending',
        approved_at TIMESTAMP,
        approved_by VARCHAR(255),
        dashboard_state JSONB,
        deleted_at TIMESTAMP,
        deleted_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP,
        last_active TIMESTAMP,
        online BOOLEAN DEFAULT false,
        documents JSONB DEFAULT '{}',
        settings JSONB DEFAULT '{}'
      )
    `);

    // Add missing columns to existing users table (idempotent migrations)
    const alterColumns = [
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS birthdate DATE",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS instagram VARCHAR(100)",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(50)",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS contact_hint VARCHAR(255)",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'pending'",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS approved_by VARCHAR(255)",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS dashboard_state JSONB",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(255)"
    ];
    for (const sql of alterColumns) {
      await client.query(sql);
    }
    // Ensure approval_status default is set correctly for existing rows
    await client.query(`
      ALTER TABLE users ALTER COLUMN approval_status SET DEFAULT 'pending'
    `);

    // Customers table (separate from users for booking system)
    await client.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        name VARCHAR(255),
        email VARCHAR(255),
        phone VARCHAR(50),
        whatsapp VARCHAR(50),
        instagram VARCHAR(100),
        birthdate DATE,
        address TEXT,
        documents JSONB DEFAULT '{}',
        registration_note TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_edited TIMESTAMP,
        deleted_at TIMESTAMP,
        created_by INTEGER REFERENCES users(id)
      )
    `);

    // Appointments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS appointments (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES customers(id),
        user_id INTEGER REFERENCES users(id),
        service VARCHAR(255),
        date DATE NOT NULL,
        time TIME NOT NULL,
        end_time TIME,
        status VARCHAR(20) DEFAULT 'open',
        note TEXT,
        needs_reconfirm BOOLEAN DEFAULT false,
        updated_by VARCHAR(255),
        updated_by_role VARCHAR(20),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP
      )
    `);
    
    // Add missing columns to appointments
    const apptAlters = [
      "ALTER TABLE appointments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
      "ALTER TABLE appointments ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP"
    ];
    for (const sql of apptAlters) {
      await client.query(sql);
    }

    // Tasks table
    await client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        note TEXT,
        status VARCHAR(20) DEFAULT 'open',
        created_by INTEGER REFERENCES users(id),
        created_by_name VARCHAR(255),
        completed_by INTEGER REFERENCES users(id),
        completed_by_name VARCHAR(255),
        reminder_at TIMESTAMP,
        reminder JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP
      )
    `);

    // Settings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS settings (
        key VARCHAR(255) PRIMARY KEY,
        value JSONB,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create default admin user if not exists
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('Julia2026!', 10);
    
    const adminExists = await client.query(
      "SELECT id FROM users WHERE email = 'julia@lashes-by-lia.de'"
    );
    
    if (adminExists.rows.length === 0) {
      await client.query(`
        INSERT INTO users (email, password_hash, role, first_name, last_name, name, phone, approval_status, approved_at, approved_by)
        VALUES ('julia@lashes-by-lia.de', $1, 'admin', 'Julia', 'Edmaier', 'Julia Edmaier', '0170 2454353', 'approved', CURRENT_TIMESTAMP, 'System')
      `, [hashedPassword]);
      console.log('Admin user created: julia@lashes-by-lia.de');
    } else {
      // Ensure existing admin has correct role and approved status
      await client.query(`
        UPDATE users SET role = 'admin', approval_status = 'approved', approved_at = COALESCE(approved_at, CURRENT_TIMESTAMP), approved_by = COALESCE(approved_by, 'System')
        WHERE email = 'julia@lashes-by-lia.de'
      `);
    }

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { pool, initDatabase };
