require('dotenv').config();
const { Pool } = require('pg');
const axios = require('axios');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const BASE_URL = 'http://localhost:5008';

async function run() {
    console.log("🚀 Verifying Batch-Specific Scanning and Deduction...");

    try {
        const barcode = 'VERIFY-BARCODE';
        const batchNum = 'BATCH-XYZ-' + Date.now();
        const tenantId = 1;

        // 1. Setup Test Product and Batch
        await pool.query(`
            INSERT INTO products (barcode, name, price, stock, tenant_id)
            VALUES ($1, 'Batch Test Drug', 50.00, 10, $2)
            ON CONFLICT DO NOTHING
        `, [barcode, tenantId]);

        await pool.query(`
            INSERT INTO product_batches (product_barcode, batch_number, quantity, branch_id, tenant_id, status)
            VALUES ($1, $2, 10, 1, $3, 'Active')
            ON CONFLICT DO NOTHING
        `, [barcode, batchNum, tenantId]);

        const batchRes = await pool.query("SELECT id FROM product_batches WHERE batch_number = $1", [batchNum]);
        const batchId = batchRes.rows[0].id;
        console.log(`✅ Test Batch Created: ${batchNum} (ID: ${batchId})`);

        // 2. Login
        const loginRes = await axios.post(`${BASE_URL}/login`, {
            email: 'ceo@faithway.com',
            password: 'Faith2026'
        });
        const headers = { Authorization: `Bearer ${loginRes.data.token}` };

        // 3. Test Scan API
        console.log(`🔍 Testing Scan API for Batch Number: ${batchNum}`);
        const scanRes = await axios.get(`${BASE_URL}/api/scan/${batchNum}`, { headers });

        if (scanRes.data.type === 'batch' && scanRes.data.batch.id === batchId) {
            console.log("✅ Scan API correctly identified the specific batch.");
        } else {
            console.error("❌ Scan API failed to identify batch!", scanRes.data);
        }

        // 4. Test Transaction Deduction (Specific Batch)
        console.log("📦 Performing sale for specific batch...");
        await axios.post(`${BASE_URL}/api/transactions`, {
            items: [{
                id: scanRes.data.product.id,
                barcode: barcode,
                name: 'Batch Test Drug',
                qty: 2,
                price: 50,
                batch_id: batchId // <--- This is the key!
            }],
            total: 100,
            paymentMethod: 'cash'
        }, { headers });

        const finalBatch = await pool.query("SELECT quantity FROM product_batches WHERE id = $1", [batchId]);
        console.log(`📊 Batch Quantity after sale: ${finalBatch.rows[0].quantity} (Expected: 8)`);

        if (finalBatch.rows[0].quantity == 8) {
            console.log("✅ Specific Batch Deduction Verified!");
        } else {
            console.error("❌ Specific Batch Deduction Failed!");
        }

        // Cleanup
        await pool.query("DELETE FROM product_batches WHERE batch_number = $1", [batchNum]);
        console.log("🗑️ Test data cleaned up.");

    } catch (err) {
        console.error("❌ Verification failed:", err.response?.data || err.message);
    } finally {
        await pool.end();
    }
}

run();
