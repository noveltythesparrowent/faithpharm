/**
 * seed-ceo.js
 * Run once: node seed-ceo.js
 * Creates the CEO user account in the Supabase database.
 * Uses direct connection (port 5432) which works from localhost.
 */
require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// Build direct connection from the pooler URL credentials
// Pooler (port 6543) only works from Vercel — direct (port 5432) works locally
const DIRECT_URL = 'postgresql://postgres:Ko34gct8mLZWDPZ4@db.nswrizhoncaqbpyasxda.supabase.co:5432/postgres';

const pool = new Pool({
    connectionString: DIRECT_URL,
    ssl: { rejectUnauthorized: false }
});

async function seed() {
    try {
        console.log('Connecting to database...');

        // 1. Ensure tenants table and default tenant exist
        await pool.query(`
            CREATE TABLE IF NOT EXISTS tenants (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                subscription_status VARCHAR(50) DEFAULT 'Active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        await pool.query(`
            INSERT INTO tenants (id, name) VALUES (1, 'Faith Pharmacy') ON CONFLICT (id) DO NOTHING;
        `);
        console.log('✅ Tenants table ready');

        // 2. Ensure users table exists with required columns
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(50) DEFAULT 'cashier',
                status VARCHAR(20) DEFAULT 'Active',
                store_id INTEGER,
                store_location VARCHAR(255),
                tenant_id INTEGER DEFAULT 1,
                deleted_at TIMESTAMPTZ,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Users table ready');

        // 3. Hash the password
        const password = 'Faith2026';
        const hashed = await bcrypt.hash(password, 12);
        console.log('✅ Password hashed');

        // 4. Insert CEO user (or update if already exists)
        const result = await pool.query(`
            INSERT INTO users (name, email, password, role, status, tenant_id)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (email) DO UPDATE SET
                password = EXCLUDED.password,
                role = EXCLUDED.role,
                status = EXCLUDED.status,
                deleted_at = NULL
            RETURNING id, name, email, role
        `, ['CEO', 'ceo@faithway.com', hashed, 'ceo', 'Active', 1]);

        console.log('✅ CEO user created/updated:', result.rows[0]);
        console.log('\n🎉 Done! You can now login with:');
        console.log('   Email:    ceo@faithway.com');
        console.log('   Password: Faith2026');

    } catch (err) {
        console.error('❌ Seed error:', err.message);
    } finally {
        await pool.end();
    }
}

seed();
