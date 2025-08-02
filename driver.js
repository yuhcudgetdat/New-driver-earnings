// Worker API URL - **Make sure this is the correct URL for your deployed worker**
const workerUrl = 'https://driver-auth-worker.blackcarpetridesharelogistics.workers.dev';

// Function to handle API requests
async function makeApiRequest(endpoint, method = 'GET', data = null, token = null) {
    const headers = {
        'Content-Type': 'application/json'
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
        method: method,
        headers: headers
    };

    if (data) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(`${workerUrl}${endpoint}`, options);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Error: ${response.status} - ${errorText}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error during API request:', error);
        alert(`Could not connect to server: ${error.message}`);
        return null;
    }
}

// Global state
let currentDriver = null;
let adminToken = null;

// Utility functions
function showSection(sectionId) {
    document.querySelectorAll('main > section').forEach(section => {
        section.style.display = 'none';
    });
    document.getElementById(sectionId).style.display = 'block';
}

function renderDriverDashboard() {
    showSection('driver-dashboard');
    document.getElementById('welcome-message').textContent = `Welcome, ${currentDriver.fullName}!`;
    document.getElementById('driver-info').innerHTML = `
        <p>Driver ID: ${currentDriver.id}</p>
        <p>Full Name: ${currentDriver.fullName}</p>
        <p>Whatsapp Phone: ${currentDriver.whatsappPhone || 'N/A'}</p>
        <p>Vehicle Type & Color: ${currentDriver.vehicleTypeColor || 'N/A'}</p>
        <p>License Plate: ${currentDriver.licensePlate || 'N/A'}</p>
        <p>Drivers License Number: ${currentDriver.driversLicenseNumber || 'N/A'}</p>
        <p>Insurance Number: ${currentDriver.insuranceNumber || 'N/A'}</p>
    `;
    loadNotes();
    loadRidesAndEarnings();
    loadCommissions();
}

function renderAdminDashboard() {
    showSection('admin-dashboard');
    loadDriversForAdmin();
}

function loadRidesAndEarnings() {
    const ridesTableBody = document.querySelector('#rides-table tbody');
    ridesTableBody.innerHTML = ''; 
    if (currentDriver && currentDriver.rides && currentDriver.rides.length > 0) {
        currentDriver.rides.forEach(ride => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${ride.date}</td>
                <td>${ride.origin}</td>
                <td>${ride.destination}</td>
                <td>$${ride.fare}</td>
            `;
            ridesTableBody.appendChild(row);
        });
    } else {
        ridesTableBody.innerHTML = '<tr><td colspan="4">No rides recorded yet.</td></tr>';
    }
}

async function loadCommissions() {
    if (!currentDriver) return;
    const commissionData = await makeApiRequest(`/api/driver/commissions?driverId=${currentDriver.id}`);
    const commissionSection = document.getElementById('commissions-info');
    if (commissionData && commissionData.commissionDue !== undefined) {
        commissionSection.innerHTML = `
            <h3>Your Commission</h3>
            <p>Commission Due: $${commissionData.commissionDue}</p>
            <p>Due Date: ${commissionData.commissionDueDate}</p>
        `;
    } else {
        commissionSection.innerHTML = '<p>No commission information available.</p>';
    }
}

async function loadLeaderboard() {
    const leaderboardData = await makeApiRequest('/api/leaderboard');
    const leaderboardContainer = document.getElementById('leaderboard-container');
    leaderboardContainer.innerHTML = ''; 

    if (leaderboardData && leaderboardData.leaderboard) {
        leaderboardData.leaderboard.forEach((driver, index) => {
            const place = index + 1;
            const rankClass = `rank-${place}`;
            const card = document.createElement('div');
            card.className = `leaderboard-card ${rankClass}`;
            card.innerHTML = `
                <div class="rank">${place}</div>
                <div class="name">${driver.fullName}</div>
                <div class="rides">${driver.rides} rides</div>
            `;
            leaderboardContainer.appendChild(card);
        });
    } else {
        leaderboardContainer.innerHTML = '<p>Error loading leaderboard.</p>';
    }
}

async function loadNotes() {
    const notesData = await makeApiRequest('/api/notes/get');
    if (notesData) {
        document.getElementById('notes-content').textContent = notesData.notes;
    } else {
        document.getElementById('notes-content').textContent = 'Could not load notes.';
    }
}

async function checkAdminStatus() {
    try {
        const response = await fetch(`${workerUrl}/api/auth/status`);
        if (!response.ok) {
            throw new Error('Failed to fetch admin status');
        }
        const data = await response.json();
        if (data.isAdminSetup) {
            showSection('login-form');
        } else {
            showSection('admin-setup');
        }
    } catch (error) {
        console.error('Error checking admin status:', error);
        alert('Could not connect to server. Please check your internet connection and try again.');
    }
}

// Event Listeners
document.getElementById('admin-setup-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('setup-username').value;
    const password = document.getElementById('setup-password').value;
    const result = await makeApiRequest('/api/admin/setup', 'POST', { username, password });
    if (result) {
        alert(result.message);
        checkAdminStatus();
    }
});

document.getElementById('admin-login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('admin-email').value;
    const password = document.getElementById('admin-password').value;
    const result = await makeApiRequest('/api/admin/login', 'POST', { username: email, password });
    if (result && result.token) {
        adminToken = result.token;
        alert(result.message);
        renderAdminDashboard();
    } else {
        alert('Admin Login failed.');
    }
});

document.getElementById('driver-login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const driverId = document.getElementById('driver-id').value;
    const result = await makeApiRequest('/api/driver-login', 'POST', { driverId });
    if (result && result.driverId) {
        const driverData = await makeApiRequest(`/api/driver/profile?driverId=${result.driverId}`);
        if (driverData && driverData.driver) {
            currentDriver = driverData.driver;
            renderDriverDashboard();
        } else {
            alert('Failed to load driver data.');
        }
    } else {
        alert('Driver Login failed: Invalid Driver ID.');
    }
});

document.getElementById('logout-btn').addEventListener('click', () => {
    currentDriver = null;
    showSection('login-form');
});

document.getElementById('admin-logout-btn').addEventListener('click', () => {
    adminToken = null;
    showSection('login-form');
});

// Admin-specific functions
async function loadDriversForAdmin() {
    if (!adminToken) return;
    const drivers = await makeApiRequest('/api/admin/drivers', 'GET', null, adminToken);
    const driverList = document.getElementById('driver-list');
    driverList.innerHTML = '';
    if (drivers && drivers.drivers) {
        drivers.drivers.forEach(driver => {
            const li = document.createElement('li');
            li.textContent = `${driver.fullName} (${driver.id})`;
            driverList.appendChild(li);
        });
    }
}

// Add event listeners for navigation buttons
document.getElementById('rides-earnings-btn').addEventListener('click', () => {
    showSection('driver-rides');
    loadRidesAndEarnings();
});

document.getElementById('my-profile-btn').addEventListener('click', () => {
    showSection('driver-profile');
});

document.getElementById('commissions-btn').addEventListener('click', () => {
    showSection('driver-commissions');
    loadCommissions();
});

document.getElementById('leaderboard-btn').addEventListener('click', () => {
    showSection('leaderboard');
    loadLeaderboard();
});

// Initial check on page load
document.addEventListener('DOMContentLoaded', checkAdminStatus);
