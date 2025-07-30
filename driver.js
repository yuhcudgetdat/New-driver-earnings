// driver.js - JavaScript code for your frontend

// IMPORTANT: This is your actual Cloudflare Worker URL.
// From your screenshots, this is: https://driver-auth-worker.blackcarpetridesharelogistics.workers.dev
const API_BASE_URL = 'https://driver-auth-worker.blackcarpetridesharelogistics.workers.dev';

let loggedInDriverId = null;
let isAdmin = false; // Initial state: assume not admin
let userToken = null; // Store JWT token if implemented

// --- Utility Functions ---

function displayMessage(message, isError = false) {
    const alertBox = document.getElementById('apiResponseAlert'); // Assuming you have an alert div in your HTML
    if (alertBox) {
        alertBox.textContent = message;
        alertBox.className = isError ? 'alert alert-danger' : 'alert alert-success';
        alertBox.style.display = 'block';
    } else {
        // Fallback for alerts if no specific alertBox element
        if (isError) {
            alert("Error: " + message);
        } else {
            alert(message);
        }
    }
    console.log(isError ? "Error: " : "Info: ", message);
}

function showSection(sectionId) {
    document.querySelectorAll('.app-section').forEach(section => {
        section.style.display = 'none';
    });
    document.getElementById(sectionId).style.display = 'block';
}

async function checkAdminStatus() {
    try {
        console.log(`Attempting to fetch admin status from: ${API_BASE_URL}/api/auth/status`);
        const response = await fetch(`${API_BASE_URL}/api/auth/status`);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API status check failed: ${response.status} ${response.statusText} - ${errorText}`);
        }
        const data = await response.json();
        isAdmin = data.isAdminSetup;

        if (isAdmin) {
            // Admin is set up, so show the driver login, but also make the 'Go to Admin Login' button visible
            showSection('driverLoginSection');
            const adminLoginBtn = document.getElementById('adminLoginButton');
            if (adminLoginBtn) {
                adminLoginBtn.style.display = 'block'; // Make the 'Go to Admin Login' button visible
                adminLoginBtn.disabled = false; // Ensure it's not disabled if previously set
            }
            console.log("Admin is already set up. Showing driver login with Admin Login button.");
        } else {
            // Admin is NOT set up, so directly show the initial admin setup form
            showSection('initialAdminSetupSection');
            // Hide the 'Go to Admin Login' button if admin is not set up, as it's not relevant yet
            const adminLoginBtn = document.getElementById('adminLoginButton');
            if (adminLoginBtn) {
                adminLoginBtn.style.display = 'none';
            }
            console.log("Admin is NOT set up. Showing initial admin setup form.");
        }
    } catch (error) {
        console.error("Error during admin status check:", error);
        displayMessage("Network or API Error: Failed to fetch admin status. Please try again. " + error.message, true);
        // Default to showing driver login if API call fails
        showSection('driverLoginSection');
        // If API call fails, assume admin status is unknown or not set up, hide/disable admin login button
        const adminLoginBtn = document.getElementById('adminLoginButton');
        if (adminLoginBtn) adminLoginBtn.style.display = 'none'; // Keep it hidden if there's an error
    }
}


// --- Event Listeners and Initial Load ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded fired.");
    checkAdminStatus(); // Initial check on page load

    // Add event listener for the "Go to Admin Login" button
    const adminLoginButton = document.getElementById('adminLoginButton');
    if (adminLoginButton) {
        adminLoginButton.addEventListener('click', () => {
            showSection('adminLoginSection');
            displayMessage(''); // Clear any previous messages
        });
    }
});

// Example: Initial Admin Setup Form Submission
document.getElementById('initialAdminSetupForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    displayMessage('Setting up admin...', false); // Provide immediate feedback
    const adminUsername = document.getElementById('adminUsername').value;
    const adminPassword = document.getElementById('adminPassword').value;

    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/setup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: adminUsername, password: adminPassword })
        });
        const data = await response.json();
        if (response.ok) {
            displayMessage(data.message || 'Admin setup successful!');
            isAdmin = true; // Update status
            showSection('adminLoginSection'); // Go to admin login after setup
        } else {
            displayMessage(data.message || 'Admin setup failed.', true);
        }
    } catch (error) {
            console.error("Error during admin setup:", error);
            displayMessage("Network or API Error during admin setup: " + error.message, true);
    }
});

// Example: Driver Login Form Submission
document.getElementById('driverLoginForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    displayMessage('Logging in driver...', false); // Provide immediate feedback
    const driverId = document.getElementById('driverIdInput').value; // Assuming ID is 'driverIdInput'

    try {
        const response = await fetch(`${API_BASE_URL}/api/driver-login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ driverId: driverId })
        });
        const data = await response.json();
        if (response.ok) {
            displayMessage(data.message || 'Driver login successful!');
            loggedInDriverId = driverId;
            showSection('driverDashboard'); // Show driver dashboard
            // TODO: Fetch and display driver notes here
        } else {
            displayMessage(data.message || 'Driver login failed.', true);
        }
    } catch (error) {
        console.error("Error during driver login:", error);
        displayMessage("Network or API Error during driver login: " + error.message, true);
    }
});

// Example: Admin Login Form Submission (NEW)
document.getElementById('adminLoginForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    displayMessage('Logging in admin...', false); // Provide immediate feedback
    const adminLoginUsername = document.getElementById('adminLoginUsername').value;
    const adminLoginPassword = document.getElementById('adminLoginPassword').value;

    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: adminLoginUsername, password: adminLoginPassword })
        });
        const data = await response.json();
        if (response.ok) {
            displayMessage(data.message || 'Admin login successful!');
            userToken = data.token; // Store the token
            showSection('adminDashboard'); // Show admin dashboard
            // TODO: Fetch and display drivers to manage here
        } else {
            displayMessage(data.message || 'Admin login failed.', true);
        }
    } catch (error) {
        console.error("Error during admin login:", error);
        displayMessage("Network or API Error during admin login: " + error.message, true);
    }
});


// Logout Button for Driver Dashboard
document.getElementById('logoutButton')?.addEventListener('click', () => {
    loggedInDriverId = null;
    userToken = null; // Clear token on logout
    isAdmin = false; // Reset admin status on logout
    displayMessage('Logged out successfully.');
    showSection('driverLoginSection'); // Go back to driver login
    checkAdminStatus(); // Re-run status check to determine initial view
});

// Logout Button for Admin Dashboard
document.getElementById('adminLogoutButton')?.addEventListener('click', () => {
    loggedInDriverId = null; // Clear driver state
    userToken = null; // Clear token on logout
    isAdmin = false; // Reset admin status on logout
    displayMessage('Admin logged out successfully.');
    showSection('driverLoginSection'); // Go back to driver login
    checkAdminStatus(); // Re-run status check to determine initial view
});

// Note: You will need to add event listeners for 'addNoteButton', 'newNoteForm',
// 'addDriverButton', 'newDriverForm', and 'close-button' (for modals)
// as well as the logic to handle those forms and display data.
// Ensure your HTML elements have the correct IDs.

// Example: Add Note Modal Close Button
document.querySelector('#addNoteModal .close-button')?.addEventListener('click', () => {
    document.getElementById('addNoteModal').style.display = 'none';
    displayMessage(''); // Clear any messages
});

// Example: Add Driver Modal Close Button
document.querySelector('#addDriverModal .close-button')?.addEventListener('click', () => {
    document.getElementById('addDriverModal').style.display = 'none';
    displayMessage(''); // Clear any messages
});

// Example: Show Add Note Modal
document.getElementById('addNoteButton')?.addEventListener('click', () => {
    document.getElementById('addNoteModal').style.display = 'flex'; // Use flex for centering
    displayMessage(''); // Clear any messages
});

// Example: Show Add Driver Modal
document.getElementById('addDriverButton')?.addEventListener('click', () => {
    document.getElementById('addDriverModal').style.display = 'flex'; // Use flex for centering
    displayMessage(''); // Clear any messages
});


// Example: New Note Form Submission (Placeholder - requires worker endpoint)
document.getElementById('newNoteForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    displayMessage('Saving note...', false);
    const noteContent = document.getElementById('noteContent').value;

    if (!loggedInDriverId) {
        displayMessage('Error: Not logged in as a driver.', true);
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/notes/add`, { // You'll need this endpoint in your worker
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Add Authorization header if your worker requires it (e.g., Bearer Token for driver)
            },
            body: JSON.stringify({ driverId: loggedInDriverId, content: noteContent })
        });
        const data = await response.json();
        if (response.ok) {
            displayMessage(data.message || 'Note added successfully!');
            document.getElementById('noteContent').value = ''; // Clear form
            document.getElementById('addNoteModal').style.display = 'none'; // Close modal
            // TODO: Refresh driver notes here
        } else {
            displayMessage(data.message || 'Failed to add note.', true);
        }
    } catch (error) {
        console.error("Error adding note:", error);
        displayMessage("Network or API Error adding note: " + error.message, true);
    }
});

// Example: New Driver Form Submission (Placeholder - requires worker endpoint)
document.getElementById('newDriverForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    displayMessage('Adding driver...', false);
    const newDriverId = document.getElementById('newDriverId').value;
    const newDriverName = document.getElementById('newDriverName').value;

    // Admin authorization check (You'll likely send a token with the request)
    if (!isAdmin || !userToken) { // Assuming admin is logged in and has a token
        displayMessage('Error: Admin not authorized to add drivers.', true);
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/add-driver`, { // You'll need this endpoint in your worker
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userToken}` // Send admin's JWT token
            },
            body: JSON.stringify({ driverId: newDriverId, driverName: newDriverName })
        });
        const data = await response.json();
        if (response.ok) {
            displayMessage(data.message || 'Driver added successfully!');
            document.getElementById('newDriverId').value = ''; // Clear form
            document.getElementById('newDriverName').value = '';
            document.getElementById('addDriverModal').style.display = 'none'; // Close modal
            // TODO: Refresh admin's list of drivers here
        } else {
            displayMessage(data.message || 'Failed to add driver.', true);
        }
    } catch (error) {
        console.error("Error adding driver:", error);
        displayMessage("Network or API Error adding driver: " + error.message, true);
    }
});
