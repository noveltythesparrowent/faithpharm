require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
    try {
        console.log("Checking for 'Test Medicine'...");
        const res = await pool.query("SELECT id, barcode, name, deleted_at, tenant_id, stock FROM products WHERE name ILIKE $1", ['%Test Medicine%']);
        console.log("Products found:", res.rows);

        if (res.rows.length === 0) {
            console.log("No 'Test Medicine' found. It might have been permanently deleted.");
        } else {
            res.rows.forEach(p => {
                if (p.deleted_at) {
                    console.log(`Product ID ${p.id} is SOFT-DELETED (deleted_at: ${p.deleted_at})`);
                }
            });
        }

        console.log("\nChecking for active tenant...");
        const tenantRes = await pool.query("SELECT * FROM tenants");
        console.log("Tenants:", tenantRes.rows);

    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}
run();
