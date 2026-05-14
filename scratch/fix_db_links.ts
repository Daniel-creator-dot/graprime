import { initDb, query } from '../server/db.js';

async function fixLinks() {
  await initDb();
  const res = await query('SELECT id, meeting_link FROM appointments WHERE meeting_link IS NOT NULL');
  
  for (const row of res.rows) {
    const link = row.meeting_link;
    // Replace all existing meet.google.com links with Jitsi
    if (link.includes('meet.google.com')) {
      const chars = 'abcdefghijklmnopqrstuvwxyz';
      const getChars = (len: number) => Array.from({length: len}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
      const newLink = `https://meet.jit.si/graprime-telemed-${getChars(3)}-${getChars(4)}-${getChars(3)}`;
      
      await query('UPDATE appointments SET meeting_link = $1 WHERE id = $2', [newLink, row.id]);
      console.log(`Updated link for appointment ${row.id}: ${link} -> ${newLink}`);
    }
  }
  console.log('Done');
  process.exit(0);
}

fixLinks().catch(console.error);
