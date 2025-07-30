// driver.js - JavaScript code for your frontend

// IMPORTANT: This is your actual Cloudflare Worker URL.
// It is: https://driver-auth-worker.blackcarpetridesharelogistics.workers.dev
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
        console.log(`Attempting to fetch admin status from: ${API_BASE_URL}/api/auth/status`); // Log the URL being called
        const response = await fetch(`${API_BASE_URL}/api/auth/status`);
        if (!response.ok) {
            // If the response is not OK (e.g., 404, 500, or network error),
            // it means the worker couldn't process the request or respond properly.
            // This is where 'Failed to fetch' comes from if the fetch() itself failed.
            const errorText = await response.text(); // Get raw error if possible
            throw new Error(`API status check failed: ${response.status} ${response.statusText} - ${errorText}`);
        }
        const data = await response.json();
        isAdmin = data.isAdminSetup;

        if (isAdmin) {
            showSection('adminLoginSection'); // Or a general login, if initial setup is done
            document.getElementById('adminLoginButton').style.display = 'block'; // Make admin button visible if needed
            document.getElementById('initialAdminSetupForm').style.display = 'none'; // Hide setup if admin exists
            console.log("Admin is already set up. Showing admin login.");
            // Potentially show a "Login as Admin" option or redirect
        } else {
            showSection('initialAdminSetupSection'); // Show initial setup form
            document.getElementById('adminLoginButton').style.display = 'none'; // Hide admin login until setup
            console.log("Admin is NOT set up. Showing initial admin setup form.");
        }
    } catch (error) {
        console.error("Error during admin status check:", error);
        displayMessage("Network or API Error: Failed to fetch admin status. Please try again. " + error.message, true);
        // Default to showing driver login if API call fails, or a specific error page
        showSection('driverLoginSection'); // Show driver login section if API call fails
        // Ensure admin login button is initially disabled/hidden on error
        const adminLoginBtn = document.getElementById('adminLoginButton');
        if (adminLoginBtn) adminLoginBtn.disabled = true;
    }
}


// --- Event Listeners and Initial Load ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded fired."); // Check if this logs
    checkAdminStatus(); // Initial check on page load
});

// Example of how other forms/buttons would call the API
// You'll need to add event listeners for your actual form submissions and buttons.

// Example: Initial Admin Setup Form Submission
document.getElementById('initialAdminSetupForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
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
        } else {
            displayMessage(data.message || 'Driver login failed.', true);
        }
    } catch (error) {
        console.error("Error during driver login:", error);
        displayMessage("Network or API Error during driver login: " + error.message, true);
    }
});


// Add similar event listeners for admin login, and any other forms/buttons you have.
// Ensure your HTML elements have the correct IDs for the JS to find them (e.g., 'driverLoginForm', 'driverIdInput', 'adminLoginButton', 'initialAdminSetupForm', 'adminUsername', 'adminPassword').
