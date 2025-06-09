const pg = require('pg');

async function checkTable() {
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    const columns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'form_steps'
      ORDER BY ordinal_position
    `);
    
    console.log('Form steps table structure:');
    columns.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type}`);
    });
    
    await client.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkTable();