import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const query = (text: string, params?: any[]) => pool.query(text, params);

export const initDb = async () => {
  try {
    // Create Users table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL,
        name VARCHAR(100),
        phone_number VARCHAR(20)
      );
    `);

    // Create default admin if no users exist
    const userCount = await query('SELECT COUNT(*) FROM users');
    if (parseInt(userCount.rows[0].count) === 0) {
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.default.hash('admin', 10);
      await query(
        'INSERT INTO users (username, password, role, name) VALUES ($1, $2, $3, $4)',
        ['admin', hashedPassword, 'admin', 'System Administrator']
      );
      console.log('Default admin user created (admin/admin)');
    }

    // Create Patients table
    await query(`
      CREATE TABLE IF NOT EXISTS patients (
        id SERIAL PRIMARY KEY,
        staff_id VARCHAR(50) UNIQUE,
        full_name VARCHAR(100) NOT NULL,
        email VARCHAR(100),
        phone_number VARCHAR(20) NOT NULL,
        nationwide_id VARCHAR(50),
        department VARCHAR(100),
        no_show_count INTEGER DEFAULT 0,
        is_restricted BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create Doctors table
    await query(`
      CREATE TABLE IF NOT EXISTS doctors (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        specialization VARCHAR(100),
        slot_duration INTEGER DEFAULT 15,
        is_active BOOLEAN DEFAULT TRUE,
        working_days TEXT[],
        start_time TIME DEFAULT '08:00',
        end_time TIME DEFAULT '17:00'
      );
    `);

    // Ensure user_id column exists (Migration)
    await query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='doctors' AND column_name='user_id') THEN
          ALTER TABLE doctors ADD COLUMN user_id INTEGER REFERENCES users(id);
        END IF;
      END $$;
    `);

    // Create Appointments table
    await query(`
      CREATE TABLE IF NOT EXISTS appointments (
        id SERIAL PRIMARY KEY,
        appointment_id VARCHAR(20) UNIQUE NOT NULL,
        patient_id INTEGER REFERENCES patients(id),
        full_name VARCHAR(100) NOT NULL, -- Fallback if not registered
        who_is_coming VARCHAR(100),
        email VARCHAR(100),
        phone_number VARCHAR(20) NOT NULL,
        staff_id VARCHAR(50),
        nationwide_id VARCHAR(50),
        department VARCHAR(100),
        service VARCHAR(100),
        doctor_id INTEGER REFERENCES doctors(id),
        preferred_date DATE NOT NULL,
        preferred_time TIME NOT NULL,
        status VARCHAR(20) DEFAULT 'pending', 
        priority VARCHAR(10) DEFAULT 'Medium',
        notes TEXT,
        internal_notes TEXT,
        queue_number INTEGER,
        completed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Ensure completed_at and nationwide_id exist (Migration)
    await query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='completed_at') THEN
          ALTER TABLE appointments ADD COLUMN completed_at TIMESTAMP;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='patients' AND column_name='nationwide_id') THEN
          ALTER TABLE patients ADD COLUMN nationwide_id VARCHAR(50);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='nationwide_id') THEN
          ALTER TABLE appointments ADD COLUMN nationwide_id VARCHAR(50);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='who_is_coming') THEN
          ALTER TABLE appointments ADD COLUMN who_is_coming VARCHAR(100);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='service') THEN
          ALTER TABLE appointments ADD COLUMN service VARCHAR(100);
        END IF;
      END $$;
    `);

    // Create SMS Logs table
    await query(`
      CREATE TABLE IF NOT EXISTS sms_logs (
        id SERIAL PRIMARY KEY,
        recipient VARCHAR(20) NOT NULL,
        message TEXT NOT NULL,
        status VARCHAR(20),
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create Notifications table
    await query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create Settings table
    await query(`
      CREATE TABLE IF NOT EXISTS settings (
        key VARCHAR(100) PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);

    // Initialize default settings if they don't exist
    const defaultSettings = [
      ['clinic_name', 'Customs Services Association - in partnership with Prime Care'],
      ['sms_base_url', 'https://www.inteksms.top/api/v1/messages/send'],
      ['sms_sender_id', 'Primecare'],
      ['sms_api_key', 'INTEK_C29C88.0e7310c3b08164b4773cc74d81ab234b203b38a42800120f']
    ];

    for (const [key, value] of defaultSettings) {
      await query(`
        INSERT INTO settings (key, value) 
        VALUES ($1, $2) 
        ON CONFLICT (key) DO NOTHING
      `, [key, value]);
    }

    // Create OTPs table
    await query(`
      CREATE TABLE IF NOT EXISTS otps (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) NOT NULL,
        code VARCHAR(6) NOT NULL,
        expires_at TIMESTAMP NOT NULL
      );
    `);

    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Error initializing database:', err);
  }
};

export default pool;
