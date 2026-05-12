require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
    try {
        const prodRes = await pool.query("SELECT id, barcode, name FROM products WHERE name = 'Test Medicine'");
        console.log("Products found:", prodRes.rows);

        for (const prod of prodRes.rows) {
            const batchRes = await pool.query("SELECT * FROM product_batches WHERE product_barcode = $1", [prod.barcode]);
            console.log(`Batches for product ${prod.barcode}:`, batchRes.rows);
        }
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}
run();
