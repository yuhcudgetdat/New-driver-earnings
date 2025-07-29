// src/index.js

import { Router } from 'itty-router';
// You'll need to install these:
// npm install itty-router bcryptjs jose
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';

// Define your JWT Secret (Store this as an Environment Variable in Cloudflare Worker settings, NOT hardcoded)
// Example in wrangler.toml or Worker UI: JWT_SECRET="your_very_strong_secret_key"
const JWT_SECRET = new TextEncoder().encode(YOUR_JWT_SECRET_FROM_ENV_VAR); // env.JWT_SECRET

const router = Router();

// --- Helper Functions (inside your Worker) ---

// Validate JWT and check role
async function authenticate(request, env) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { authorized: false, status: 401, message: 'Unauthorized: No token provided.' };
    }

    const token = authHeader.split(' ')[1];
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET, {
            algorithms: ['HS256'],
        });
        request.user = payload; // Attach user info to request
        return { authorized: true, user: payload };
    } catch (e) {
        console.error("JWT verification failed:", e);
        return { authorized: false, status: 401, message: 'Unauthorized: Invalid or expired token.' };
    }
}

function authorize(request, requiredRole) {
    if (!request.user || request.user.role !== requiredRole) {
        return { authorized: false, status: 403, message: 'Forbidden: Insufficient permissions.' };
    }
    return { authorized: true };
}

// Function to get current settings (including adminPassword hash)
async function getSettings(env) {
    const { results } = await env.DB.prepare("SELECT * FROM settings WHERE id = 1").all();
    return results[0] || { id: 1, adminPasswordHash: null, driverNotes: "Welcome, drivers!" };
}

// Function to save settings
async function saveSettings(env, settings) {
    await env.DB.prepare(
        "INSERT OR REPLACE INTO settings (id, adminPasswordHash, driverNotes) VALUES (?1, ?2, ?3)"
    ).bind(1, settings.adminPasswordHash, settings.driverNotes)
    .run();
}

// Function to get all drivers
async function getAllDrivers(env) {
    const { results } = await env.DB.prepare("SELECT * FROM drivers").all();
    // For each driver, also fetch their rides, commissions, and pictures from other tables
    const driversWithDetails = await Promise.all(results.map(async (driver) => {
        const rides = (await env.DB.prepare("SELECT * FROM rides WHERE driverId = ?").bind(driver.id).all()).results;
        const commission = (await env.DB.prepare("SELECT * FROM commissions WHERE driverId = ?").bind(driver.id).all()).results[0];
        const pictures = (await env.DB.prepare("SELECT * FROM pictures WHERE driverId = ?").bind(driver.id).all()).results[0];
        return { ...driver, rides: rides || [], commission: commission || null, pictures: pictures || null };
    }));
    return driversWithDetails;
}


// --- API Endpoints ---

// Initial Admin Setup
router.post('/api/auth/setup-admin', async (request, env) => {
    const settings = await getSettings(env);
    if (settings.adminPasswordHash) {
        return new Response(JSON.stringify({ success: false, message: 'Admin password already set.' }), { status: 409, headers: { 'Content-Type': 'application/json' } });
    }

    const { password } = await request.json();
    if (!password) {
        return new Response(JSON.stringify({ success: false, message: 'Password is required.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const hashedPassword = await bcrypt.hash(password, 10); // Hash with salt rounds
    await saveSettings(env, { ...settings, adminPasswordHash: hashedPassword });

    return new Response(JSON.stringify({ success: true, message: 'Admin password set.' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
});

// Check Admin Setup Status
router.get('/api/auth/status', async (request, env) => {
    const settings = await getSettings(env);
    return new Response(JSON.stringify({ isAdminSetup: settings.adminPasswordHash !== null }), { status: 200, headers: { 'Content-Type': 'application/json' } });
});


// Login Endpoint
router.post('/api/auth/login', async (request, env) => {
    const { id, password, role } = await request.json();

    let user;
    let hashedPassword;

    if (role === 'admin') {
        const settings = await getSettings(env);
        hashedPassword = settings.adminPasswordHash;
    } else if (role === 'driver') {
        const { results } = await env.DB.prepare("SELECT * FROM drivers WHERE id = ?").bind(id).all();
        user = results[0];
        hashedPassword = user ? user.passwordHash : null;
    } else {
        return new Response(JSON.stringify({ message: 'Invalid role.' }), { status: 400 });
    }

    if (!hashedPassword || !(await bcrypt.compare(password, hashedPassword))) {
        return new Response(JSON.stringify({ message: 'Invalid credentials.' }), { status: 401 });
    }

    // Generate JWT
    const token = await new SignJWT({ id: role === 'driver' ? user.id : 'admin', role })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('1h') // Token expires in 1 hour
        .sign(JWT_SECRET);

    return new Response(JSON.stringify({ success: true, token, role, id: role === 'driver' ? user.id : 'admin' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
});

// Verify Token Endpoint (for re-authentication/session check)
router.post('/api/auth/verify-token', async (request, env) => {
    const { token } = await request.json();
    if (!token) {
        return new Response(JSON.stringify({ valid: false, message: 'No token provided.' }), { status: 400 });
    }
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET, { algorithms: ['HS256'] });
        return new Response(JSON.stringify({ valid: true, role: payload.role, id: payload.id }), { status: 200 });
    } catch (e) {
        return new Response(JSON.stringify({ valid: false, message: 'Invalid or expired token.' }), { status: 401 });
    }
});


// Middleware for Authentication
router.all('/api/*', async (request, env, next) => {
    if (request.url.includes('/api/auth/login') || request.url.includes('/api/auth/setup-admin') || request.url.includes('/api/auth/status') || request.url.includes('/api/auth/verify-token')) {
        // Allow auth endpoints to proceed without token check
        return next();
    }
    const authResult = await authenticate(request, env);
    if (!authResult.authorized) {
        return new Response(JSON.stringify({ message: authResult.message }), { status: authResult.status, headers: { 'Content-Type': 'application/json' } });
    }
    return next();
});

// --- DRIVER ENDPOINTS ---

// Get all drivers (Admin Only)
router.get('/api/drivers', async (request, env) => {
    const authResult = authorize(request, 'admin');
    if (!authResult.authorized) {
        return new Response(JSON.stringify({ message: authResult.message }), { status: authResult.status, headers: { 'Content-Type': 'application/json' } });
    }
    const drivers = await getAllDrivers(env);
    return new Response(JSON.stringify(drivers), { headers: { 'Content-Type': 'application/json' } });
});

// Get single driver (Admin or self-driver)
router.get('/api/drivers/:id', async (request, env) => {
    const driverId = request.params.id;
    // Authorize: Admin can view any driver, driver can only view their own profile
    if (request.user.role === 'driver' && request.user.id !== driverId) {
        return new Response(JSON.stringify({ message: 'Forbidden: Cannot view other driver profiles.' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }
    const { results } = await env.DB.prepare("SELECT * FROM drivers WHERE id = ?").bind(driverId).all();
    const driver = results[0];
    if (!driver) {
        return new Response(JSON.stringify({ message: 'Driver not found.' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }
    // Fetch related data
    driver.rides = (await env.DB.prepare("SELECT * FROM rides WHERE driverId = ?").bind(driverId).all()).results || [];
    driver.commission = (await env.DB.prepare("SELECT * FROM commissions WHERE driverId = ?").bind(driverId).all()).results[0] || null;
    driver.pictures = (await env.DB.prepare("SELECT * FROM pictures WHERE driverId = ?").bind(driverId).all()).results[0] || null;

    return new Response(JSON.stringify(driver), { headers: { 'Content-Type': 'application/json' } });
});


// Add new driver (Admin Only)
router.post('/api/drivers', async (request, env) => {
    const authResult = authorize(request, 'admin');
    if (!authResult.authorized) {
        return new Response(JSON.stringify({ message: authResult.message }), { status: authResult.status, headers: { 'Content-Type': 'application/json' } });
    }
    const { id, fullName, password } = await request.json();
    if (!id || !fullName || !password) {
        return new Response(JSON.stringify({ message: 'Missing required fields.' }), { status: 400 });
    }
    const existing = await env.DB.prepare("SELECT id FROM drivers WHERE id = ?").bind(id).first();
    if (existing) {
        return new Response(JSON.stringify({ message: 'Driver ID already exists.' }), { status: 409 });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    await env.DB.prepare("INSERT INTO drivers (id, fullName, passwordHash, whatsappPhone, vehicleTypeColor, licensePlate, driversLicenseNumber, insuranceNumber) VALUES (?1, ?2, ?3, '', '', '', '', '')")
        .bind(id, fullName, passwordHash).run();
    await env.DB.prepare("INSERT INTO commissions (driverId, amountDue, dueDate) VALUES (?1, ?2, ?3)").bind(id, 0, '').run();
    await env.DB.prepare("INSERT INTO pictures (driverId, driverPictureUrl, vehiclePictureUrl, insurancePictureUrl) VALUES (?1, ?2, ?3, ?4)").bind(id, '', '', '').run();

    return new Response(JSON.stringify({ success: true, message: 'Driver added.' }), { status: 201 });
});

// Update driver profile (Admin Only)
router.put('/api/drivers/:id', async (request, env) => {
    const authResult = authorize(request, 'admin');
    if (!authResult.authorized) {
        return new Response(JSON.stringify({ message: authResult.message }), { status: authResult.status, headers: { 'Content-Type': 'application/json' } });
    }
    const driverId = request.params.id;
    const { fullName, whatsappPhone, vehicleTypeColor, licensePlate, driversLicenseNumber, insuranceNumber } = await request.json();

    await env.DB.prepare(
        "UPDATE drivers SET fullName = ?1, whatsappPhone = ?2, vehicleTypeColor = ?3, licensePlate = ?4, driversLicenseNumber = ?5, insuranceNumber = ?6 WHERE id = ?7"
    ).bind(fullName, whatsappPhone, vehicleTypeColor, licensePlate, driversLicenseNumber, insuranceNumber, driverId).run();

    return new Response(JSON.stringify({ success: true, message: 'Driver profile updated.' }), { status: 200 });
});

// Delete driver (Admin Only)
router.delete('/api/drivers/:id', async (request, env) => {
    const authResult = authorize(request, 'admin');
    if (!authResult.authorized) {
        return new Response(JSON.stringify({ message: authResult.message }), { status: authResult.status, headers: { 'Content-Type': 'application/json' } });
    }
    const driverId = request.params.id;
    await env.DB.prepare("DELETE FROM drivers WHERE id = ?").bind(driverId).run();
    await env.DB.prepare("DELETE FROM rides WHERE driverId = ?").bind(driverId).run();
    await env.DB.prepare("DELETE FROM commissions WHERE driverId = ?").bind(driverId).run();
    await env.DB.prepare("DELETE FROM pictures WHERE driverId = ?").bind(driverId).run();
    return new Response(null, { status: 204 }); // No Content
});

// --- RIDES ENDPOINTS ---

// Add ride for driver (Admin Only)
router.post('/api/drivers/:id/rides', async (request, env) => {
    const authResult = authorize(request, 'admin');
    if (!authResult.authorized) {
        return new Response(JSON.stringify({ message: authResult.message }), { status: authResult.status, headers: { 'Content-Type': 'application/json' } });
    }
    const driverId = request.params.id;
    const { date, origin, destination, fare } = await request.json();
    const rideId = `R${Date.now()}`; // Simple unique ID for rides

    await env.DB.prepare("INSERT INTO rides (id, driverId, date, origin, destination, fare) VALUES (?1, ?2, ?3, ?4, ?5, ?6)")
        .bind(rideId, driverId, date, origin, destination, fare).run();
    return new Response(JSON.stringify({ success: true, message: 'Ride added.', rideId }), { status: 201 });
});

// Delete ride for driver (Admin Only)
router.delete('/api/drivers/:driverId/rides/:rideId', async (request, env) => {
    const authResult = authorize(request, 'admin');
    if (!authResult.authorized) {
        return new Response(JSON.stringify({ message: authResult.message }), { status: authResult.status, headers: { 'Content-Type': 'application/json' } });
    }
    const { driverId, rideId } = request.params;
    await env.DB.prepare("DELETE FROM rides WHERE driverId = ? AND id = ?").bind(driverId, rideId).run();
    return new Response(null, { status: 204 });
});

// --- COMMISSION ENDPOINTS ---

// Set driver commission (Admin Only)
router.put('/api/drivers/:id/commission', async (request, env) => {
    const authResult = authorize(request, 'admin');
    if (!authResult.authorized) {
        return new Response(JSON.stringify({ message: authResult.message }), { status: authResult.status, headers: { 'Content-Type': 'application/json' } });
    }
    const driverId = request.params.id;
    const { amountDue, dueDate } = await request.json();

    // Upsert logic: insert if not exists, update if exists
    await env.DB.prepare(
        "INSERT INTO commissions (driverId, amountDue, dueDate) VALUES (?1, ?2, ?3) ON CONFLICT(driverId) DO UPDATE SET amountDue = EXCLUDED.amountDue, dueDate = EXCLUDED.dueDate"
    ).bind(driverId, amountDue, dueDate).run();

    return new Response(JSON.stringify({ success: true, message: 'Commission updated.' }), { status: 200 });
});

// --- GENERAL SETTINGS ENDPOINTS ---

// Get general settings (Driver notes)
router.get('/api/settings', async (request, env) => {
    // Authenticated users can get settings
    const settings = await getSettings(env);
    return new Response(JSON.stringify({ driverNotes: settings.driverNotes }), { headers: { 'Content-Type': 'application/json' } });
});

// Update driver notes (Admin Only)
router.put('/api/settings/driver-notes', async (request, env) => {
    const authResult = authorize(request, 'admin');
    if (!authResult.authorized) {
        return new Response(JSON.stringify({ message: authResult.message }), { status: authResult.status, headers: { 'Content-Type': 'application/json' } });
    }
    const { notes } = await request.json();
    const settings = await getSettings(env);
    await saveSettings(env, { ...settings, driverNotes: notes });
    return new Response(JSON.stringify({ success: true, message: 'Driver notes updated.' }), { status: 200 });
});

// --- IMAGE UPLOAD ENDPOINT ---

router.post('/api/drivers/:id/upload-picture', async (request, env) => {
    const authResult = authorize(request, 'admin');
    if (!authResult.authorized) {
        return new Response(JSON.stringify({ message: authResult.message }), { status: authResult.status, headers: { 'Content-Type': 'application/json' } });
    }
    const driverId = request.params.id;
    const contentType = request.headers.get("content-type");

    if (!contentType || !contentType.includes("multipart/form-data")) {
        return new Response("Expected multipart/form-data", { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const pictureType = formData.get("pictureType"); // e.g., 'driverPicture', 'vehiclePicture', 'insurancePicture'

    if (!file || !file.name || !file.size || !pictureType) {
        return new Response("Missing file or pictureType", { status: 400 });
    }

    // Basic file type validation (optional but recommended)
    if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
        return new Response("Unsupported file type. Only JPG, PNG, GIF are allowed.", { status: 400 });
    }

    const uniqueFileName = `${driverId}-${pictureType}-${Date.now()}.${file.name.split('.').pop()}`;

    try {
        await env.BUCKET.put(uniqueFileName, file.stream());

        // Construct public URL (assuming your R2 bucket is public or uses a custom domain)
        // Public R2 buckets have a URL format like https://pub-<ACCOUNT_ID>.r2.dev/<BUCKET_NAME>/<OBJECT_KEY>
        const imageUrl = `https://pub-${env.CLOUDFLARE_ACCOUNT_ID}.r2.dev/${env.BUCKET_NAME_FROM_WRANGLER}/${uniqueFileName}`; // Get CLOUDFLARE_ACCOUNT_ID from env
        // The bucket name needs to be derived from the wrangler.toml binding or passed as env var
        // For simplicity, let's assume BUCKET_NAME_FROM_WRANGLER is set in env or derived.
        // Or you can hardcode the bucket's public domain if it's simpler to set up.

        // Retrieve existing picture URLs or initialize if not present
        const { results: existingPictures } = await env.DB.prepare("SELECT * FROM pictures WHERE driverId = ?").bind(driverId).all();
        let currentPictures = existingPictures[0] || { driverId: driverId, driverPictureUrl: '', vehiclePictureUrl: '', insurancePictureUrl: '' };

        // Update the specific picture URL
        if (pictureType === 'driverPicture') currentPictures.driverPictureUrl = imageUrl;
        else if (pictureType === 'vehiclePicture') currentPictures.vehiclePictureUrl = imageUrl;
        else if (pictureType === 'insurancePicture') currentPictures.insurancePictureUrl = imageUrl;

        // Save updated picture URLs to D1
        await env.DB.prepare(
            "INSERT INTO pictures (driverId, driverPictureUrl, vehiclePictureUrl, insurancePictureUrl) VALUES (?1, ?2, ?3, ?4) ON CONFLICT(driverId) DO UPDATE SET driverPictureUrl = EXCLUDED.driverPictureUrl, vehiclePictureUrl = EXCLUDED.vehiclePictureUrl, insurancePictureUrl = EXCLUDED.insurancePictureUrl"
        ).bind(driverId, currentPictures.driverPictureUrl, currentPictures.vehiclePictureUrl, currentPictures.insurancePictureUrl).run();


        return new Response(JSON.stringify({ success: true, message: 'Image uploaded and URL saved.', imageUrl }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    } catch (error) {
        console.error("R2 Upload Error:", error);
        return new Response(JSON.stringify({ success: false, message: `Failed to upload image: ${error.message}` }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
});


// --- ADMIN DATA MANAGEMENT ENDPOINTS ---
router.get('/api/admin/download-data', async (request, env) => {
    const authResult = authorize(request, 'admin');
    if (!authResult.authorized) {
        return new Response(JSON.stringify({ message: authResult.message }), { status: authResult.status, headers: { 'Content-Type': 'application/json' } });
    }
    const allDrivers = await getAllDrivers(env);
    const settings = await getSettings(env);
    return new Response(JSON.stringify({ drivers: allDrivers, settings: settings }), { headers: { 'Content-Type': 'application/json' } });
});

router.post('/api/admin/clear-all-data', async (request, env) => {
    const authResult = authorize(request, 'admin');
    if (!authResult.authorized) {
        return new Response(JSON.stringify({ message: authResult.message }), { status: authResult.status, headers: { 'Content-Type': 'application/json' } });
    }
    // Delete all data from tables (excluding settings if admin setup needs to persist)
    await env.DB.prepare("DELETE FROM drivers").run();
    await env.DB.prepare("DELETE FROM rides").run();
    await env.DB.prepare("DELETE FROM commissions").run();
    await env.DB.prepare("DELETE FROM pictures").run();
    // Reset admin password hash to null to force initial setup again
    await env.DB.prepare("UPDATE settings SET adminPasswordHash = NULL, driverNotes = 'Welcome, drivers!' WHERE id = 1").run();

    // Optionally, clear R2 bucket as well
    const listed = await env.BUCKET.list();
    await Promise.all(listed.objects.map(obj => env.BUCKET.delete(obj.key)));

    return new Response(JSON.stringify({ success: true, message: 'All data cleared.' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
});


// Global error handler for the router
router.all('*', () => new Response('Not Found.', { status: 404 }));

export default {
    async fetch(request, env, ctx) {
        // CORS Headers (essential for frontend to talk to Worker)
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*', // Or restrict to your Pages domain: 'https://your-pages-domain.pages.dev'
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        };

        // Handle preflight OPTIONS requests
        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders, status: 204 });
        }

        // Add CORS headers to all responses
        const response = await router.handle(request, env, ctx);
        for (const key in corsHeaders) {
            response.headers.set(key, corsHeaders[key]);
        }
        return response;
    },
};

// --- Database Schema (for D1) ---
// You'll need to create these tables in your D1 database.
// You can use the Cloudflare dashboard or `npx wrangler d1 execute blackcarpet-db --command "CREATE TABLE ..."`
/*
CREATE TABLE settings (
    id INTEGER PRIMARY KEY,
    adminPasswordHash TEXT,
    driverNotes TEXT
);

CREATE TABLE drivers (
    id TEXT PRIMARY KEY,
    fullName TEXT NOT NULL,
    passwordHash TEXT NOT NULL,
    whatsappPhone TEXT,
    vehicleTypeColor TEXT,
    licensePlate TEXT,
    driversLicenseNumber TEXT,
    insuranceNumber TEXT
);

CREATE TABLE rides (
    id TEXT PRIMARY KEY,
    driverId TEXT NOT NULL,
    date TEXT NOT NULL,
    origin TEXT NOT NULL,
    destination TEXT NOT NULL,
    fare REAL NOT NULL,
    FOREIGN KEY (driverId) REFERENCES drivers(id) ON DELETE CASCADE
);

CREATE TABLE commissions (
    driverId TEXT PRIMARY KEY,
    amountDue REAL NOT NULL,
    dueDate TEXT NOT NULL,
    FOREIGN KEY (driverId) REFERENCES drivers(id) ON DELETE CASCADE
);

CREATE TABLE pictures (
    driverId TEXT PRIMARY KEY,
    driverPictureUrl TEXT,
    vehiclePictureUrl TEXT,
    insurancePictureUrl TEXT,
    FOREIGN KEY (driverId) REFERENCES drivers(id) ON DELETE CASCADE
);

-- Initialize settings table (only once)
INSERT INTO settings (id, adminPasswordHash, driverNotes) VALUES (1, NULL, 'Welcome, drivers!');
*/
