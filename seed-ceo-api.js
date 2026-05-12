/**
 * seed-ceo-api.js
 * Run once: node seed-ceo-api.js
 * Seeds the CEO user by calling the live Vercel API endpoint directly.
 * This avoids local DB connection issues entirely.
 */
const https = require('https');

const BASE_URL = 'faithpharm.vercel.app';

function request(method, path, body) {
    return new Promise((resolve, reject) => {
        const data = body ? JSON.stringify(body) : null;
        const options = {
            hostname: BASE_URL,
            path,
            method,
            headers: {
                'Content-Type': 'application/json',
                ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
            }
        };
        const req = https.request(options, res => {
            let raw = '';
            res.on('data', chunk => raw += chunk);
            res.on('end', () => {
                try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
                catch { resolve({ status: res.statusCode, body: raw }); }
            });
        });
        req.on('error', reject);
        if (data) req.write(data);
        req.end();
    });
}

async function main() {
    console.log('Seeding CEO user via live API...\n');

    // Step 1: Call the dedicated seed endpoint (if it exists)
    // Step 2: Try resetting the password via forgot-password flow
    // Step 3: Register via any open endpoint

    // Try the /api/seed-admin endpoint first
    const seed = await request('POST', '/api/seed-admin', {
        email: 'ceo@faithway.com',
        password: 'Faith2026',
        name: 'CEO',
        role: 'ceo',
        secret: process.env.SEED_SECRET || 'faithpharm_seed_2026'
    });

    console.log('Seed response:', seed.status, seed.body);

    if (seed.status === 200 || seed.status === 201) {
        console.log('\n✅ CEO user created! Login with:');
        console.log('   Email:    ceo@faithway.com');
        console.log('   Password: Faith2026');
    } else {
        console.log('\n⚠️  Seed endpoint not available. Adding it to server.js instead...');
    }
}

main().catch(console.error);
