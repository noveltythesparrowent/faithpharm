require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
    const branchName = 'Amasaman';
    const tenantId = 1;
    const res = await pool.query(`
        SELECT p.barcode, p.name,
            COALESCE((p.stock_levels->>$1)::int, 0) as stock,
            p.reorder_level
        FROM products p
        WHERE p.tenant_id = $2
    `, [branchName, tenantId]);
    console.log("Query Results:", res.rows);
    await pool.end();
}
run();
