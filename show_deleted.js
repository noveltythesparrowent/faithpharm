require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function showDeleted() {
    const tables = [
        { table: 'products',    cols: 'name, barcode, category, deleted_at' },
        { table: 'customers',   cols: 'name, phone, email, account_number, deleted_at' },
        { table: 'categories',  cols: 'name, description, deleted_at' },
        { table: 'suppliers',   cols: 'name, contact_person, phone, deleted_at' },
        { table: 'promotions',  cols: 'code, discount_percentage, deleted_at' },
        { table: 'tax_rules',   cols: 'name, rate, deleted_at' },
        { table: 'branches',    cols: 'name, location, deleted_at' },
        { table: 'users',       cols: 'name, email, role, deleted_at' },
    ];

    let totalDeleted = 0;

    for (const { table, cols } of tables) {
        try {
            const res = await pool.query(
                `SELECT ${cols} FROM ${table} WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC`
            );
            if (res.rows.length > 0) {
                console.log(`\n━━━ ${table.toUpperCase()} (${res.rows.length} deleted) ━━━`);
                res.rows.forEach(row => {
                    const { deleted_at, ...rest } = row;
                    const deletedDate = new Date(deleted_at).toLocaleString();
                    console.log(`  [${deletedDate}]`, JSON.stringify(rest));
                });
                totalDeleted += res.rows.length;
            } else {
                console.log(`\n━━━ ${table.toUpperCase()} — none deleted ━━━`);
            }
        } catch (err) {
            console.log(`\n━━━ ${table.toUpperCase()} — error: ${err.message} ━━━`);
        }
    }

    console.log(`\n✅ Total soft-deleted records: ${totalDeleted}`);
    await pool.end();
}

showDeleted().catch(console.error);
