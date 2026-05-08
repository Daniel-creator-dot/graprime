import { query } from '../server/db';

async function check() {
  try {
    const res = await query(`
      SELECT column_name, data_type, character_maximum_length 
      FROM information_schema.columns 
      WHERE table_name = 'appointments' AND column_name = 'who_is_coming'
    `);
    console.log('Column info:', JSON.stringify(res.rows, null, 2));
    
    const lastAppt = await query(`
      SELECT id, who_is_coming FROM appointments ORDER BY id DESC LIMIT 1
    `);
    console.log('Last appointment:', JSON.stringify(lastAppt.rows, null, 2));
    
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

check();
