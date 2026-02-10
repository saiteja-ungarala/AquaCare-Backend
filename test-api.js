// Quick Test script - All endpoints
const http = require('http');
const BASE_URL = 'http://localhost:3000/api';

function request(method, path, body = null, token = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(BASE_URL + path);
        const opt = {
            hostname: url.hostname, port: url.port,
            path: url.pathname + url.search, method,
            headers: { 'Content-Type': 'application/json' }
        };
        if (token) opt.headers['Authorization'] = `Bearer ${token}`;
        const req = http.request(opt, res => {
            let d = '';
            res.on('data', c => d += c);
            res.on('end', () => {
                try { resolve({ s: res.statusCode, b: JSON.parse(d) }); }
                catch { resolve({ s: res.statusCode, b: d }); }
            });
        });
        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function test() {
    console.log('=== ENDPOINT VERIFICATION ===\n');

    // 1. Store Categories
    const cat = await request('GET', '/store/categories');
    console.log('1. GET /store/categories:', cat.s === 200 ? '✅ PASS' : '❌ FAIL', `(${cat.s})`);
    if (cat.s === 200) console.log('   Data:', cat.b.data.length, 'categories\n');

    // 2. Store Products  
    const prod = await request('GET', '/store/products?sort=new&limit=3');
    console.log('2. GET /store/products?sort=new:', prod.s === 200 ? '✅ PASS' : '❌ FAIL', `(${prod.s})`);
    if (prod.s === 200) console.log('   Data:', prod.b.data.items.length, 'items, total:', prod.b.data.total, '\n');

    // 3. Product Detail
    const det = await request('GET', '/store/products/1');
    console.log('3. GET /store/products/1:', det.s === 200 ? '✅ PASS' : '❌ FAIL', `(${det.s})`);
    if (det.s === 200) console.log('   Product:', det.b.data.name, '\n');

    // 4. Signup new user
    const email = `test${Date.now()}@test.com`;
    const signup = await request('POST', '/auth/signup', {
        email, password: 'password123', full_name: 'Test User', role: 'customer', phone: '9999999999'
    });
    console.log('4. POST /auth/signup:', signup.s === 201 ? '✅ PASS' : '❌ FAIL', `(${signup.s})`);

    if (!signup.b.success || !signup.b.data?.accessToken) {
        console.log('   Error:', signup.b.message);
        return;
    }

    const token = signup.b.data.accessToken;
    console.log('   Token obtained ✓\n');

    // 5. Auth/me
    const me = await request('GET', '/auth/me', null, token);
    console.log('5. GET /auth/me:', me.s === 200 ? '✅ PASS' : '❌ FAIL', `(${me.s})`);
    if (me.s === 200) console.log('   User:', JSON.stringify(me.b.data.user), '\n');

    // 6. Get Cart (auto-create)
    const cart = await request('GET', '/cart', null, token);
    console.log('6. GET /cart:', cart.s === 200 ? '✅ PASS' : '❌ FAIL', `(${cart.s})\n`);

    // 7. Add item to cart with camelCase
    const add = await request('POST', '/cart/items', { itemType: 'product', productId: 1, qty: 2 }, token);
    console.log('7. POST /cart/items (camelCase):', add.s === 201 ? '✅ PASS' : '❌ FAIL', `(${add.s})`);
    if (add.s !== 201) console.log('   Error:', add.b.message, add.b.details);
    else console.log('   Items in cart:', add.b.data.items.length, '\n');

    // 8. Get orders
    const orders = await request('GET', '/orders', null, token);
    console.log('8. GET /orders:', orders.s === 200 ? '✅ PASS' : '❌ FAIL', `(${orders.s})\n`);

    // 9. Checkout without address (should fail)
    const checkout1 = await request('POST', '/orders/checkout', { paymentMethod: 'cod' }, token);
    console.log('9. POST /orders/checkout (no address):', checkout1.s === 400 ? '✅ PASS (expected 400)' : '❌ FAIL', `(${checkout1.s})`);
    if (checkout1.s === 400) console.log('   Error:', checkout1.b.message, '\n');

    // 10. Wallet checkout (should fail - insufficient balance)
    const checkout2 = await request('POST', '/orders/checkout', { addressId: 999, paymentMethod: 'wallet' }, token);
    console.log('10. POST /orders/checkout (wallet):', checkout2.s === 400 ? '✅ PASS (expected 400)' : '❌ FAIL', `(${checkout2.s})`);
    console.log('    Message:', checkout2.b.message, '\n');

    console.log('=== ALL TESTS COMPLETE ===');
}

test().catch(e => console.error('Error:', e));
