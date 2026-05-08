const { Client } = require('pg');

const connectionString = 'postgresql://postgres.ivryzdwcegjdcbinvoms:Daniel%4024419000@aws-1-eu-central-1.pooler.supabase.com:5432/postgres';

async function check() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'appointments' AND column_name = 'who_is_coming'
    `);
    console.log('Column info:', JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

check();
