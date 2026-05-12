require('dotenv').config();
const { Pool } = require('pg');
const axios = require('axios');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const BASE_URL = 'http://localhost:5008';

async function run() {
    console.log("🚀 Starting verification of batch and stock fixes...");

    try {
        // 1. Setup Test Data
        const barcode = 'TEST-BATCH-' + Date.now();
        const tenantId = 1;
        const branchId1 = 1; // Amasaman
        const branchId2 = 2; // Suppose there's another

        // Ensure branch 2 exists for testing
        await pool.query("INSERT INTO branches (id, name, location) VALUES (2, 'Accra Branch', 'Accra') ON CONFLICT (id) DO NOTHING");

        await pool.query(`
            INSERT INTO products (barcode, name, category, price, stock, stock_levels, tenant_id, reorder_level)
            VALUES ($1, 'Test Medicine', 'General', 10.00, 20, '{"Amasaman": 10, "Accra Branch": 10}', $2, 15)
        `, [barcode, tenantId]);

        // Batch A: Late arrival (created later), Early expiry
        // Batch B: Early arrival (created earlier), Late expiry
        await pool.query(`
            INSERT INTO product_batches (product_barcode, batch_number, expiry_date, quantity, branch_id, status)
            VALUES ($1, 'BATCH-B', CURRENT_DATE + INTERVAL '1 year', 5, 1, 'Active')
        `, [barcode]);

        await pool.query(`
            INSERT INTO product_batches (product_barcode, batch_number, expiry_date, quantity, branch_id, status)
            VALUES ($1, 'BATCH-A', CURRENT_DATE + INTERVAL '1 month', 5, 1, 'Active')
        `, [barcode]);

        console.log("✅ Test product and batches created.");

        // 2. Login as CEO
        const loginRes = await axios.post(`${BASE_URL}/login`, {
            email: 'ceo@faithway.com',
            password: 'Faith2026'
        });
        const token = loginRes.data.token;
        const headers = { Authorization: `Bearer ${token}` };

        // 3. Perform a sale and verify FEFO
        // We sell 3 units. It should take from BATCH-A (expires in 1 month) even though BATCH-B was added first.
        console.log("📦 Performing sale of 3 units...");
        await axios.post(`${BASE_URL}/api/transactions`, {
            items: [{ barcode, name: 'Test Medicine', qty: 3, price: 10, id: (await pool.query("SELECT id FROM products WHERE barcode = $1", [barcode])).rows[0].id }],
            total: 30,
            paymentMethod: 'cash'
        }, { headers });

        const batchARes = await pool.query("SELECT quantity FROM product_batches WHERE batch_number = 'BATCH-A' AND product_barcode = $1", [barcode]);
        const batchBRes = await pool.query("SELECT quantity FROM product_batches WHERE batch_number = 'BATCH-B' AND product_barcode = $1", [barcode]);

        console.log(`📊 Batch A (Early Expiry) Qty: ${batchARes.rows[0].quantity} (Expected: 2)`);
        console.log(`📊 Batch B (Late Expiry) Qty: ${batchBRes.rows[0].quantity} (Expected: 5)`);

        if (batchARes.rows[0].quantity == 2 && batchBRes.rows[0].quantity == 5) {
            console.log("✅ FEFO Logic Verified: Deducted from earliest expiry batch.");
        } else {
            console.error("❌ FEFO Logic Failed!");
        }

        // 4. Verify Branch isolation
        // Sale in Amasaman should NOT affect batches in Accra Branch if we had some there.
        // (Our sale was in Amasaman by default for admin)

        const prodCheck = await pool.query("SELECT stock_levels FROM products WHERE barcode = $1", [barcode]);
        console.log("🔍 Product stock levels after sale:", prodCheck.rows[0].stock_levels);

        // 5. Verify Low Stock Report (Branch-Specific)
        console.log("📋 Checking Low Stock Report for Amasaman (ID: 1)...");
        const lowStockRes = await axios.get(`${BASE_URL}/api/reports/low-stock/1`, { headers });
        console.log("🔍 Low Stock Report first 3 items:", JSON.stringify(lowStockRes.data.slice(0, 3), null, 2));
        const testProdReport = lowStockRes.data.find(p => p.barcode === barcode);

        if (testProdReport) {
            console.log(`✅ Low Stock Report Verified: Product found with stock ${testProdReport.stock} and shortage ${testProdReport.shortage}`);
        } else {
            console.error("❌ Low Stock Report Failed: Product not found in report.");
        }

        /* Cleanup commented out for debugging
        await pool.query("DELETE FROM product_batches WHERE product_barcode = $1", [barcode]);
        await pool.query("DELETE FROM products WHERE barcode = $1", [barcode]);
        console.log("🗑️ Test data cleaned up.");
        */

    } catch (err) {
        console.error("❌ Error during verification:", err.response?.data || err.message);
    } finally {
        await pool.end();
    }
}

run();
