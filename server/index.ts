import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDb, query } from './db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import axios from 'axios';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Initialize Database
initDb();

// --- Auth Routes ---
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];

    if (user && await bcrypt.compare(password, user.password)) {
      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        process.env.JWT_SECRET!,
        { expiresIn: '24h' }
      );
      res.json({ token, user: { id: user.id, username: user.username, role: user.role, name: user.name } });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});



app.post('/api/auth/forgot-password', async (req, res) => {
  const { username } = req.body;
  try {
    const userResult = await query('SELECT * FROM users WHERE username = $1', [username]);
    const user = userResult.rows[0];

    if (!user || !user.phone_number) {
      return res.status(404).json({ message: 'User not found or no phone number registered.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60000); // 10 mins

    await query('DELETE FROM otps WHERE username = $1', [username]);
    await query('INSERT INTO otps (username, code, expires_at) VALUES ($1, $2, $3)', [username, otp, expiresAt]);

    await sendSMS(user.phone_number, `Your GRA Health Portal password reset code is: ${otp}. It expires in 10 minutes.`);

    res.json({ message: 'OTP sent to registered phone number.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  const { username, code, newPassword } = req.body;
  try {
    const otpResult = await query('SELECT * FROM otps WHERE username = $1 AND code = $2 AND expires_at > NOW()', [username, code]);
    
    if (otpResult.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired OTP.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await query('UPDATE users SET password = $1 WHERE username = $2', [hashedPassword, username]);
    await query('DELETE FROM otps WHERE username = $1', [username]);

    res.json({ message: 'Password reset successful.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// --- Settings Routes ---
app.get('/api/settings', async (req, res) => {
  try {
    const result = await query('SELECT * FROM settings');
    const settings = result.rows.reduce((acc: any, row: any) => {
      acc[row.key] = row.value;
      return acc;
    }, {});
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.patch('/api/settings', async (req, res) => {
  const updates = req.body;
  try {
    for (const [key, value] of Object.entries(updates)) {
      await query(
        'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2',
        [key, value]
      );
    }
    res.json({ message: 'Settings updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// --- SMS Utility ---
async function sendSMS(recipient: string, message: string) {
  try {
    const settingsResult = await query('SELECT * FROM settings');
    const settings = settingsResult.rows.reduce((acc: any, row: any) => {
      acc[row.key] = row.value;
      return acc;
    }, {});

    const { sms_base_url, sms_sender_id, sms_api_key } = settings;

    if (!sms_base_url) {
      console.warn('SMS Base URL not configured. Skipping SMS.');
      return;
    }

    // Format phone number to international standard (e.g., 050 -> 23350)
    let formattedRecipient = recipient.replace(/[^0-9+]/g, '');
    if (formattedRecipient.startsWith('0')) {
      formattedRecipient = '233' + formattedRecipient.substring(1);
    } else if (formattedRecipient.startsWith('+')) {
      formattedRecipient = formattedRecipient.substring(1);
    }

    console.log(`[SMS SEND] Attempting to send to ${formattedRecipient} via ${sms_base_url}`);

    await axios.post(sms_base_url, {
      sender: sms_sender_id,
      recipients: [formattedRecipient],
      message: message
    }, {
      headers: {
        'Authorization': `Bearer ${sms_api_key}`
      }
    }).then(res => {
      console.log('[SMS SUCCESS]', res.data);
    }).catch(err => {
      console.error('[SMS ERROR]', err.response?.data || err.message);
    });

    await query('INSERT INTO sms_logs (recipient, message, status) VALUES ($1, $2, $3)', [
      recipient, message, 'sent'
    ]);
  } catch (err) {
    console.error('Error in sendSMS utility:', err);
  }
}

// --- User Management Routes ---
app.get('/api/users', async (req, res) => {
  try {
    const result = await query('SELECT id, username, role, name, phone_number FROM users ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/users', async (req, res) => {
  const { username, password, role, name, phone_number } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const userResult = await query(
      'INSERT INTO users (username, password, role, name, phone_number) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, role, name, phone_number',
      [username, hashedPassword, role, name, phone_number]
    );
    const newUser = userResult.rows[0];

    // If role is doctor, create doctor profile automatically
    if (role === 'doctor') {
      await query(
        'INSERT INTO doctors (user_id, name, specialization) VALUES ($1, $2, $3)',
        [newUser.id, name, 'General Physician']
      );
    }

    res.status(201).json(newUser);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  const { username, role, name, phone_number, password } = req.body;
  try {
    let result;
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      result = await query(
        'UPDATE users SET username = $1, role = $2, name = $3, phone_number = $4, password = $5 WHERE id = $6 RETURNING id, username, role, name, phone_number',
        [username, role, name, phone_number, hashedPassword, id]
      );
    } else {
      result = await query(
        'UPDATE users SET username = $1, role = $2, name = $3, phone_number = $4 WHERE id = $5 RETURNING id, username, role, name, phone_number',
        [username, role, name, phone_number, id]
      );
    }
    
    // If role changed to doctor and they don't have a profile, create one
    if (role === 'doctor' && result.rows[0]) {
      const docCheck = await query('SELECT * FROM doctors WHERE user_id = $1', [id]);
      if (docCheck.rows.length === 0) {
        await query(
          'INSERT INTO doctors (user_id, name, specialization) VALUES ($1, $2, $3)',
          [id, name, 'General Physician']
        );
      }
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    await query('DELETE FROM users WHERE id = $1', [req.params.id]);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// --- Appointment Routes ---
app.get('/api/appointments', async (req, res) => {
  try {
    const result = await query(`
      SELECT a.*, d.name as doctor_name 
      FROM appointments a 
      LEFT JOIN doctors d ON a.doctor_id = d.id 
      ORDER BY a.preferred_date DESC, a.preferred_time DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/appointments', async (req, res) => {
  const { 
    fullName, phoneNumber, email, staffId, department, 
    reason, preferredDate, preferredTime, priority, notes, doctor_id 
  } = req.body;
  
  try {
    // 1. Check if patient is restricted
    const patientResult = await query('SELECT * FROM patients WHERE staff_id = $1', [staffId]);
    let patient = patientResult.rows[0];

    if (patient && patient.is_restricted) {
      return res.status(403).json({ message: 'Booking restricted due to repeated no-shows.' });
    }

    // 2. Register patient if not exists
    if (!patient) {
      const newPatient = await query(`
        INSERT INTO patients (staff_id, full_name, email, phone_number, department)
        VALUES ($1, $2, $3, $4, $5) RETURNING *
      `, [staffId, fullName, email, phoneNumber, department]);
      patient = newPatient.rows[0];
    }

    const appointmentId = 'APT-' + Math.random().toString(36).substring(2, 9).toUpperCase();

    const result = await query(`
      INSERT INTO appointments (
        appointment_id, patient_id, full_name, phone_number, email, staff_id, 
        department, notes, preferred_date, preferred_time, priority, doctor_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [
      appointmentId, patient.id, fullName, phoneNumber, email, staffId, 
      department, reason + (notes ? ' | ' + notes : ''), preferredDate, preferredTime, priority, doctor_id
    ]);

    // Real SMS Sending
    await sendSMS(phoneNumber, `Your appointment ${appointmentId} is booked for ${preferredDate} at ${preferredTime}.`);
    
    
    // Admin Alert
    console.log(`Admin Alert: New appointment ${appointmentId} booked by ${fullName}.`);
    await query('INSERT INTO notifications (message) VALUES ($1)', [
      `New appointment booked: ${appointmentId} by ${fullName}`
    ]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.patch('/api/appointments/:id', async (req, res) => {
  const { id } = req.params;
  const { preferred_date, preferred_time, notes, doctor_id, priority, status } = req.body;
  try {
    const finalDoctorId = doctor_id === '' ? null : doctor_id;

    const result = await query(
      `UPDATE appointments 
       SET preferred_date = COALESCE($1, preferred_date),
           preferred_time = COALESCE($2, preferred_time),
           notes = COALESCE($3, notes),
           doctor_id = $4,
           priority = COALESCE($5, priority),
           status = COALESCE($6::varchar, status),
           completed_at = CASE WHEN $6::varchar = 'completed' THEN CURRENT_TIMESTAMP ELSE completed_at END
       WHERE id = $7 RETURNING *`,
      [preferred_date, preferred_time, notes, finalDoctorId, priority, status, id]
    );
    const apt = result.rows[0];
    // Trigger SMS Alerts
    if (apt) {
      if (status === 'approved') {
        const docResult = await query('SELECT name FROM doctors WHERE id = $1', [apt.doctor_id]);
        const doctorName = docResult.rows[0]?.name || 'a Physician';
        const dateStr = apt.preferred_date ? new Date(apt.preferred_date).toLocaleDateString() : 'the scheduled date';
        const msg = `PRIME: Your appointment ${apt.appointment_id} has been APPROVED with ${doctorName} for ${dateStr}. Call +233200024081 for enquiries. See you soon!`;
        await sendSMS(apt.phone_number, msg).catch(e => console.error('SMS Error in Edit/Approve:', e));
      } else if (status === 'completed') {
        const docResult = await query('SELECT name FROM doctors WHERE id = $1', [apt.doctor_id]);
        const doctorName = docResult.rows[0]?.name || 'our team';
        const msg = `PRIME: Your appointment ${apt.appointment_id} with ${doctorName} has been marked as COMPLETED. Call +233200024081 for enquiries. Thank you for choosing PRIME!`;
        await sendSMS(apt.phone_number, msg).catch(e => console.error('SMS Error in Edit/Complete:', e));
      } else if (status === 'cancelled') {
        const msg = `PRIME: Your appointment ${apt.appointment_id} has been CANCELLED. Call +233200024081 for enquiries. Please contact us to reschedule.`;
        await sendSMS(apt.phone_number, msg).catch(e => console.error('SMS Error in Edit/Cancel:', e));
      }
    }

    res.json(apt);
  } catch (err) {
    console.error('Error in edit appointment:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.patch('/api/appointments/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const result = await query(
      `UPDATE appointments 
       SET status = $1::varchar, 
           completed_at = CASE WHEN $1::varchar = 'completed' THEN CURRENT_TIMESTAMP ELSE completed_at END 
       WHERE id = $2 RETURNING *`,
      [status, id]
    );
    const apt = result.rows[0];
    console.log(`[STATUS UPDATE] Appointment ${id} status set to ${status}. Data:`, apt ? 'found' : 'not found');

    // Status SMS Alerts
    if (apt) {
      if (status === 'approved') {
        console.log(`[APPROVAL SMS] Preparing SMS for ${apt.phone_number}...`);
        const docResult = await query('SELECT name FROM doctors WHERE id = $1', [apt.doctor_id]);
        const doctorName = docResult.rows[0]?.name || 'a Physician';
        const dateStr = apt.preferred_date ? new Date(apt.preferred_date).toLocaleDateString() : 'the scheduled date';
        const msg = `PRIME: Your appointment ${apt.appointment_id} has been APPROVED with ${doctorName} for ${dateStr}. Call +233200024081 for enquiries. See you soon!`;
        await sendSMS(apt.phone_number, msg).catch(e => console.error('SMS Error in Status/Approve:', e));
      } else if (status === 'completed') {
        const docResult = await query('SELECT name FROM doctors WHERE id = $1', [apt.doctor_id]);
        const doctorName = docResult.rows[0]?.name || 'our team';
        const msg = `PRIME: Your appointment ${apt.appointment_id} with ${doctorName} has been marked as COMPLETED. Call +233200024081 for enquiries. Thank you for choosing PRIME!`;
        await sendSMS(apt.phone_number, msg).catch(e => console.error('SMS Error in Status/Complete:', e));
      } else if (status === 'cancelled') {
        const msg = `PRIME: Your appointment ${apt.appointment_id} has been CANCELLED. Call +233200024081 for enquiries.`;
        await sendSMS(apt.phone_number, msg).catch(e => console.error('SMS Error in Status/Cancel:', e));
      }
    }

    res.json(apt);
  } catch (err) {
    console.error('Error updating status:', err);
    res.status(500).json({ message: 'Server error', error: String(err) });
  }
});

app.patch('/api/appointments/:id/no-show', async (req, res) => {
  const { id } = req.params;
  try {
    // Mark as missed
    await query("UPDATE appointments SET status = 'missed' WHERE id = $1", [id]);
    
    // Increment no-show count for patient
    const aptResult = await query('SELECT patient_id FROM appointments WHERE id = $1', [id]);
    const patientId = aptResult.rows[0]?.patient_id;
    
    if (patientId) {
      const updateResult = await query(`
        UPDATE patients 
        SET no_show_count = no_show_count + 1,
            is_restricted = CASE WHEN no_show_count + 1 >= 3 THEN TRUE ELSE FALSE END
        WHERE id = $1 RETURNING *
      `, [patientId]);
      
      res.json({ message: 'Marked as no-show', patient: updateResult.rows[0] });
    } else {
      res.json({ message: 'Marked as no-show' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// --- Notification Routes ---
app.get('/api/notifications', async (req, res) => {
  try {
    const result = await query('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 10');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.patch('/api/notifications/read', async (req, res) => {
  try {
    await query('UPDATE notifications SET is_read = TRUE');
    res.json({ message: 'Notifications marked as read' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// --- Doctor Routes ---
app.get('/api/doctors', async (req, res) => {
  try {
    const result = await query('SELECT * FROM doctors ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/doctors', async (req, res) => {
  const { name, specialization, slot_duration, working_days, start_time, end_time, is_active } = req.body;
  try {
    const result = await query(`
      INSERT INTO doctors (name, specialization, slot_duration, working_days, start_time, end_time, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
    `, [name, specialization, slot_duration, working_days, start_time, end_time, is_active ?? true]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/doctors/:id', async (req, res) => {
  const { id } = req.params;
  const { name, specialization, slot_duration, working_days, start_time, end_time, is_active } = req.body;
  try {
    const result = await query(`
      UPDATE doctors 
      SET name = $1, specialization = $2, slot_duration = $3, working_days = $4, start_time = $5, end_time = $6, is_active = $7
      WHERE id = $8 RETURNING *
    `, [name, specialization, slot_duration, working_days, start_time, end_time, is_active, id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.patch('/api/doctors/:id/status', async (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body;
  try {
    const result = await query(
      'UPDATE doctors SET is_active = $1 WHERE id = $2 RETURNING *',
      [is_active, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// --- Analytics Routes ---
app.get('/api/analytics/dashboard', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Stats
    const statsResult = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE preferred_date = $1) as today,
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'completed') as completed
      FROM appointments
    `, [today]);

    // Weekly Trends
    const trendsResult = await query(`
      SELECT 
        to_char(preferred_date, 'Dy') as day,
        COUNT(*) as count
      FROM appointments
      WHERE preferred_date > CURRENT_DATE - INTERVAL '7 days'
      GROUP BY preferred_date
      ORDER BY preferred_date
    `);

    // Doctor Workload
    const workloadResult = await query(`
      SELECT 
        d.name,
        COUNT(a.id) as count
      FROM doctors d
      LEFT JOIN appointments a ON d.id = a.doctor_id AND a.preferred_date = $1
      WHERE d.is_active = TRUE
      GROUP BY d.id, d.name
    `, [today]);

    // No-Show Stats
    const noShowResult = await query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'missed') as missed_total,
        COUNT(DISTINCT patient_id) FILTER (WHERE status = 'missed') as repeated_offenders
      FROM appointments
    `);
    
    // Peak Hours
    const peakHoursResult = await query(`
      SELECT 
        extract(hour from preferred_time) as hour,
        COUNT(*) as count
      FROM appointments
      WHERE preferred_date = $1
      GROUP BY hour
      ORDER BY count DESC
      LIMIT 1
    `, [today]);

    let peakRange = 'No Data'; // Improved fallback
    if (peakHoursResult.rows.length > 0) {
      const peakHour = parseInt(peakHoursResult.rows[0].hour);
      peakRange = `${peakHour.toString().padStart(2, '0')}:00 - ${(peakHour + 2).toString().padStart(2, '0')}:00`;
    }

    // Wait Time Distribution
    const waitTimeResult = await query(`
      SELECT 
        COUNT(*) FILTER (WHERE wait_mins < 15) as under_15,
        COUNT(*) FILTER (WHERE wait_mins >= 15 AND wait_mins <= 30) as between_15_30,
        COUNT(*) FILTER (WHERE wait_mins > 30) as over_30,
        COUNT(*) as total
      FROM (
        SELECT 
          EXTRACT(EPOCH FROM (completed_at - (preferred_date + preferred_time))) / 60 as wait_mins
        FROM appointments
        WHERE status = 'completed' AND completed_at IS NOT NULL
      ) as sub
    `);

    let waitDistribution = [
      { label: 'Under 15m', val: 0, color: 'bg-green-500' },
      { label: '15 - 30m', val: 0, color: 'bg-amber-500' },
      { label: 'Over 30m', val: 0, color: 'bg-red-500' }
    ];

    if (waitTimeResult.rows[0].total > 0 && parseInt(waitTimeResult.rows[0].total) > 0) {
      const total = parseInt(waitTimeResult.rows[0].total);
      waitDistribution = [
        { label: 'Under 15m', val: Math.round((parseInt(waitTimeResult.rows[0].under_15) / total) * 100), color: 'bg-green-500' },
        { label: '15 - 30m', val: Math.round((parseInt(waitTimeResult.rows[0].between_15_30) / total) * 100), color: 'bg-amber-500' },
        { label: 'Over 30m', val: Math.round((parseInt(waitTimeResult.rows[0].over_30) / total) * 100), color: 'bg-red-500' }
      ];
    } else {
      // Real empty state instead of dummy data
      waitDistribution = [
        { label: 'Under 15m', val: 0, color: 'bg-green-500' },
        { label: '15 - 30m', val: 0, color: 'bg-amber-500' },
        { label: 'Over 30m', val: 0, color: 'bg-red-500' }
      ];
    }
    
    // Satisfaction (Simulated based on completion rate for now)
    const completionRate = statsResult.rows[0].total > 0 
      ? (statsResult.rows[0].completed / statsResult.rows[0].total) 
      : 0.95;
    const satisfaction = (4.0 + (completionRate * 1.0)).toFixed(1);

    res.json({
      stats: statsResult.rows[0],
      trends: trendsResult.rows,
      workload: workloadResult.rows,
      noShow: noShowResult.rows[0],
      peakHours: peakRange,
      waitDistribution,
      satisfaction
    });
  } catch (err: any) {
    console.error(err);
    import('fs').then(fs => fs.writeFileSync('error_log.txt', String(err) + '\n' + String(err.stack)));
    res.status(500).json({ message: 'Server error', error: String(err) });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
