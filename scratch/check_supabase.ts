import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

async function checkSchema() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to Supabase');

    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);

    console.log('\nTables found:');
    const tables = tablesResult.rows.map(r => r.table_name);
    console.log(tables.join(', '));

    for (const table of tables) {
      console.log(`\n--- Columns for ${table} ---`);
      const columnsResult = await client.query(`
        SELECT column_name, data_type, character_maximum_length
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position
      `, [table]);
      
      columnsResult.rows.forEach(col => {
        console.log(`${col.column_name}: ${col.data_type}${col.character_maximum_length ? '(' + col.character_maximum_length + ')' : ''}`);
      });
    }

  } catch (err) {
    console.error('Error checking schema:', err);
  } finally {
    await client.end();
  }
}

checkSchema();
