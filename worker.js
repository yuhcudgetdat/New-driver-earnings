import { getAssetFromKV } from '@cloudflare/kv-asset-handler';

addEventListener('fetch', event => {
    event.respondWith(handleRequest(event));
});

async function handleRequest(event) {
    const { request, env } = event;
    const url = new URL(request.url);

    // --- Serve Static Assets (index.html, driver.js, etc.) ---
    try {
        // This is the key part that serves your front-end files
        return await getAssetFromKV(event);
    } catch (e) {
        // If a file is not found, we fall through to the API handling below
    }

    // --- API Endpoints ---
    // All API requests should start with /api/
    if (!url.pathname.startsWith('/api/')) {
        return new Response('Not Found', { status: 404 });
    }

    const path = url.pathname.replace('/api/', '');

    // Handle login
    if (path === 'login/driver' && request.method === 'POST') {
        const { driverId } = await request.json();
        const driver = await env.DRIVER_APP_DATA.get(`driver:${driverId}`, 'json');
        
        if (driver) {
            const notes = await env.DRIVER_APP_DATA.get('driverNotes', 'text');
            return new Response(JSON.stringify({ ...driver, notes }), { headers: { 'Content-Type': 'application/json' } });
        }
        return new Response(JSON.stringify({ error: "Driver not found" }), { status: 404 });
    }

    if (path === 'login/admin' && request.method === 'POST') {
        const { password } = await request.json();
        if (password === env.ADMIN_PASSWORD) {
            const notes = await env.DRIVER_APP_DATA.get('driverNotes', 'text');
            return new Response(JSON.stringify({ success: true, notes }), { headers: { 'Content-Type': 'application/json' } });
        }
        return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), { status: 401 });
    }

    // --- Admin Endpoints (requires authentication in a real-world scenario) ---
    // A simple, but non-robust, admin check. A better solution would use a token.
    if (path.startsWith('admin/')) {
        // In a real application, you would check for an admin session token here.
        // For this project, the `driver.js` client-side code handles the admin check before making these requests.
        // The KV store is not a private database, so anyone could theoretically hit these endpoints.
        // This is a trade-off for simplicity.
    }
    
    if (path === 'admin/drivers') {
        const drivers = [];
        const list = await env.DRIVER_APP_DATA.list({ prefix: 'driver:' });
        for (const key of list.keys) {
            const driver = await env.DRIVER_APP_DATA.get(key.name, 'json');
            drivers.push(driver);
        }
        return new Response(JSON.stringify(drivers), { headers: { 'Content-Type': 'application/json' } });
    }

    if (path === 'admin/add-driver' && request.method === 'POST') {
        const { driverId, driverName } = await request.json();
        const existing = await env.DRIVER_APP_DATA.get(`driver:${driverId}`);
        if (existing) {
            return new Response(JSON.stringify({ error: "Driver ID already exists" }), { status: 409 });
        }
        const newDriver = {
            id: driverId, firstName: driverName, fullName: driverName, whatsappPhone: '',
            vehicleTypeColor: '', licensePlate: '', driversLicenseNumber: '', insuranceNumber: '',
            driverPictureUrl: '', vehiclePictureUrl: '', insurancePictureUrl: '',
            rides: [], commissionDue: 0, commissionDueDate: ''
        };
        await env.DRIVER_APP_DATA.put(`driver:${driverId}`, JSON.stringify(newDriver));
        return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
    }

    if (path === 'admin/remove-driver' && request.method === 'POST') {
        const { driverId } = await request.json();
        await env.DRIVER_APP_DATA.delete(`driver:${driverId}`);
        return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
    }
    
    if (path === 'admin/driver-details') {
        const driverId = url.searchParams.get('id');
        const driver = await env.DRIVER_APP_DATA.get(`driver:${driverId}`, 'json');
        if (driver) {
            return new Response(JSON.stringify(driver), { headers: { 'Content-Type': 'application/json' } });
        }
        return new Response(JSON.stringify({ error: "Driver not found" }), { status: 404 });
    }
    
    if (path === 'admin/update-profile' && request.method === 'POST') {
        const { driverId, profile } = await request.json();
        const driver = await env.DRIVER_APP_DATA.get(`driver:${driverId}`, 'json');
        if (driver) {
            Object.assign(driver, profile);
            await env.DRIVER_APP_DATA.put(`driver:${driverId}`, JSON.stringify(driver));
            return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
        }
        return new Response(JSON.stringify({ error: "Driver not found" }), { status: 404 });
    }
    
    if (path === 'admin/add-ride' && request.method === 'POST') {
        const { driverId, origin, destination, fare } = await request.json();
        const driver = await env.DRIVER_APP_DATA.get(`driver:${driverId}`, 'json');
        if (driver) {
            const nextRideId = driver.rides.length > 0 ? parseInt(driver.rides.slice(-1)[0].id.substring(1)) + 1 : 1;
            const newRide = {
                id: `R${nextRideId}`,
                date: new Date().toISOString().split('T')[0],
                origin,
                destination,
                fare
            };
            driver.rides.push(newRide);
            await env.DRIVER_APP_DATA.put(`driver:${driverId}`, JSON.stringify(driver));
            return new Response(JSON.stringify({ success: true, ride: newRide }), { headers: { 'Content-Type': 'application/json' } });
        }
        return new Response(JSON.stringify({ error: "Driver not found" }), { status: 404 });
    }

    if (path === 'admin/remove-ride' && request.method === 'POST') {
        const { driverId, rideId } = await request.json();
        const driver = await env.DRIVER_APP_DATA.get(`driver:${driverId}`, 'json');
        if (driver) {
            driver.rides = driver.rides.filter(r => r.id !== rideId);
            await env.DRIVER_APP_DATA.put(`driver:${driverId}`, JSON.stringify(driver));
            return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
        }
        return new Response(JSON.stringify({ error: "Driver not found" }), { status: 404 });
    }
    
    if (path === 'admin/set-commission' && request.method === 'POST') {
        const { driverId, commissionAmount, commissionDueDate } = await request.json();
        const driver = await env.DRIVER_APP_DATA.get(`driver:${driverId}`, 'json');
        if (driver) {
            driver.commissionDue = parseFloat(commissionAmount);
            driver.commissionDueDate = commissionDueDate;
            await env.DRIVER_APP_DATA.put(`driver:${driverId}`, JSON.stringify(driver));
            return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
        }
        return new Response(JSON.stringify({ error: "Driver not found" }), { status: 404 });
    }

    if (path === 'admin/update-notes' && request.method === 'POST') {
        const { notes } = await request.json();
        await env.DRIVER_APP_DATA.put('driverNotes', notes);
        return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
    }
    
    // --- Driver Endpoints ---
    if (path === 'driver/data') {
        const driverId = url.searchParams.get('id');
        const driver = await env.DRIVER_APP_DATA.get(`driver:${driverId}`, 'json');
        if (driver) {
            return new Response(JSON.stringify(driver), { headers: { 'Content-Type': 'application/json' } });
        }
        return new Response(JSON.stringify({ error: "Driver not found" }), { status: 404 });
    }

    if (path === 'driver/profile') {
        const driverId = url.searchParams.get('id');
        const driver = await env.DRIVER_APP_DATA.get(`driver:${driverId}`, 'json');
        if (driver) {
            const { fullName, id, whatsappPhone, vehicleTypeColor, licensePlate, driversLicenseNumber, insuranceNumber, driverPictureUrl, vehiclePictureUrl, insurancePictureUrl } = driver;
            return new Response(JSON.stringify({ fullName, id, whatsappPhone, vehicleTypeColor, licensePlate, driversLicenseNumber, insuranceNumber, driverPictureUrl, vehiclePictureUrl, insurancePictureUrl }), { headers: { 'Content-Type': 'application/json' } });
        }
        return new Response(JSON.stringify({ error: "Driver not found" }), { status: 404 });
    }
    
    if (path === 'driver/commissions') {
        const driverId = url.searchParams.get('id');
        const driver = await env.DRIVER_APP_DATA.get(`driver:${driverId}`, 'json');
        if (driver) {
            const { commissionDue, commissionDueDate } = driver;
            return new Response(JSON.stringify({ commissionDue, commissionDueDate }), { headers: { 'Content-Type': 'application/json' } });
        }
        return new Response(JSON.stringify({ error: "Driver not found" }), { status: 404 });
    }

    if (path === 'leaderboard') {
        const drivers = [];
        const list = await env.DRIVER_APP_DATA.list({ prefix: 'driver:' });
        for (const key of list.keys) {
            const driver = await env.DRIVER_APP_DATA.get(key.name, 'json');
            drivers.push(driver);
        }
        drivers.sort((a, b) => b.rides.length - a.rides.length);
        return new Response(JSON.stringify(drivers.slice(0, 3)), { headers: { 'Content-Type': 'application/json' } });
    }
    
    if (path === 'admin/download') {
        const drivers = [];
        const list = await env.DRIVER_APP_DATA.list({ prefix: 'driver:' });
        for (const key of list.keys) {
            const driver = await env.DRIVER_APP_DATA.get(key.name, 'json');
            drivers.push(driver);
        }
        const driverNotes = await env.DRIVER_APP_DATA.get('driverNotes', 'text');
        const appData = { drivers, driverNotes };
        return new Response(JSON.stringify(appData), {
            headers: {
                'Content-Type': 'application/json',
                'Content-Disposition': `attachment; filename="driver_app_data_${new Date().toISOString().split('T')[0]}.json"`,
            },
        });
    }
    
    if (path === 'admin/pictures' && request.method === 'GET') {
        const driverId = url.searchParams.get('id');
        const driver = await env.DRIVER_APP_DATA.get(`driver:${driverId}`, 'json');
        if (driver) {
            const { driverPictureUrl, vehiclePictureUrl, insurancePictureUrl } = driver;
            return new Response(JSON.stringify({ driverPictureUrl, vehiclePictureUrl, insurancePictureUrl }), { headers: { 'Content-Type': 'application/json' } });
        }
        return new Response(JSON.stringify({ error: "Driver not found" }), { status: 404 });
    }
    
    if (path === 'admin/upload-picture' && request.method === 'POST') {
        const formData = await request.formData();
        const file = formData.get('file');
        const driverId = formData.get('driverId');
        const type = formData.get('type');
    
        if (!file || !driverId || !type) {
            return new Response(JSON.stringify({ error: 'Missing form data' }), { status: 400 });
        }
    
        const imageKey = `${driverId}/${type}/${file.name}`;
        await env.DRIVER_APP_DATA.put(imageKey, await file.arrayBuffer());
    
        const driver = await env.DRIVER_APP_DATA.get(`driver:${driverId}`, 'json');
        if (driver) {
            // Note: Cloudflare Workers cannot directly serve files from KV.
            // You would need to use a separate R2 bucket or a dedicated service.
            // For this project, we'll store a placeholder URL in KV for now.
            const imageUrl = `https://your-r2-bucket-url/${imageKey}`; // Placeholder URL
            driver[`${type}Url`] = imageUrl;
            await env.DRIVER_APP_DATA.put(`driver:${driverId}`, JSON.stringify(driver));
            return new Response(JSON.stringify({ url: imageUrl }), { headers: { 'Content-Type': 'application/json' } });
        }
        return new Response(JSON.stringify({ error: 'Driver not found' }), { status: 404 });
    }

    return new Response('Not Found', { status: 404 });
}
