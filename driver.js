// driver.js - JavaScript code for your frontend

// IMPORTANT: This is your actual Cloudflare Worker URL.
// From your screenshots, this is: https://driver-auth-worker.blackcarpetridesharelogistics.workers.dev
const API_BASE_URL = 'https://driver-auth-worker.blackcarpetridesharelogistics.workers.dev';

let loggedInDriverId = null;
let isAdmin = false; // Initial state: assume not admin
let userToken = null; // Store JWT token if implemented (e.g., for admin)

// --- Utility Functions ---

/**
 * Displays messages to the user in the designated alert box.
 * @param {string} message - The message to display.
 * @param {boolean} isError - True if it's an error message, false for success/info.
 */
function displayMessage(message, isError = false) {
    const alertBox = document.getElementById('apiResponseAlert');
    if (alertBox) {
        alertBox.textContent = message;
        alertBox.className = isError ? 'alert alert-danger' : 'alert alert-success';
        alertBox.style.display = 'block';
        // Optional: Hide after a few seconds if it's not an error
        if (!isError) {
            setTimeout(() => {
                alertBox.style.display = 'none';
                alertBox.textContent = '';
            }, 5000); // Hide after 5 seconds
        }
    } else {
        // Fallback to browser alert if HTML element not found
        if (isError) {
            console.error("Error: " + message);
            alert("Error: " + message);
        } else {
            console.log("Info: " + message);
            alert(message);
        }
    }
}

/**
 * Hides all app sections and shows only the specified one.
 * @param {string} sectionId - The ID of the section to show.
 */
function showSection(sectionId) {
    document.querySelectorAll('.app-section').forEach(section => {
        section.style.display = 'none';
    });
    // Special handling for the main login forms wrapper
    const loginFormsWrapper = document.getElementById('loginFormsWrapper');
    if (loginFormsWrapper) {
        loginFormsWrapper.style.display = 'none';
    }

    const sectionToShow = document.getElementById(sectionId);
    if (sectionToShow) {
        sectionToShow.style.display = 'block';
    } else {
        console.error(`Section with ID "${sectionId}" not found.`);
    }
    displayMessage(''); // Clear any previous messages when changing sections
}

/**
 * Checks if an admin account is already set up via the backend.
 * This determines whether to show initial setup or default login view.
 */
async function checkAdminStatus() {
    try {
        console.log(`Attempting to fetch admin status from: ${API_BASE_URL}/api/auth/status`);
        const response = await fetch(`${API_BASE_URL}/api/auth/status`);

        if (!response.ok) {
            // If the response is not OK (e.g., 404, 500), the worker might be running but returned an error.
            const errorText = await response.text();
            throw new Error(`API status check failed: ${response.status} ${response.statusText} - ${errorText}`);
        }
        const data = await response.json();
        isAdmin = data.isAdminSetup; // Update global isAdmin flag

        if (!isAdmin) {
            // Admin is NOT set up, so directly show the initial admin setup form
            showSection('initialAdminSetupSection');
            console.log("Admin is NOT set up. Showing initial admin setup form.");
            // Hide the main login forms wrapper if setup is needed
            document.getElementById('loginFormsWrapper').style.display = 'none';
        } else {
            // Admin is already set up. Keep the default login view (both forms visible).
            // No need to call showSection for driverLoginSection/adminLoginSection as they are default.
            console.log("Admin is already set up. Keeping both login forms visible.");
            document.getElementById('loginFormsWrapper').style.display = 'flex'; // Ensure wrapper is visible
        }
    } catch (error) {
        console.error("Error during admin status check:", error);
        displayMessage("Network or API Error: Failed to fetch admin status. Please try again. " + error.message, true);
        // If API call fails, assume we stay on the default login view (both forms)
        // and let the user try. The worker might be down or misconfigured.
        document.getElementById('loginFormsWrapper').style.display = 'flex'; // Ensure forms are visible even on error
    }
}

// --- Event Listeners and Initial Load ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded fired.");
    checkAdminStatus(); // Initial check on page load to determine setup status

    // Attach all form submission listeners
    setupFormListeners();

    // Attach all modal and logout button listeners
    setupButtonListeners();
});

/**
 * Attaches event listeners for all form submissions.
 */
function setupFormListeners() {
    // Initial Admin Setup Form Submission
    document.getElementById('initialAdminSetupForm')?.addEventListener('submit', async (event) => {
        event.preventDefault();
        displayMessage('Setting up admin...', false);
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
                displayMessage(data.message || 'Admin setup successful! Please log in.');
                isAdmin = true; // Update global status
                showSection('loginFormsWrapper'); // Go back to the main login page
            } else {
                displayMessage(data.message || 'Admin setup failed.', true);
            }
        } catch (error) {
            console.error("Error during admin setup:", error);
            displayMessage("Network or API Error during admin setup: " + error.message, true);
        }
    });

    // Driver Login Form Submission
    document.getElementById('driverLoginForm')?.addEventListener('submit', async (event) => {
        event.preventDefault();
        displayMessage('Logging in driver...', false);
        const driverId = document.getElementById('driverIdInput').value;

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
                document.getElementById('loggedInDriverDisplayName').textContent = driverId; // Update display name
                showSection('driverDashboard'); // Show driver dashboard
                // TODO: Implement fetching and displaying driver notes here
                fetchDriverNotes(driverId); // Call a function to load notes
            } else {
                displayMessage(data.message || 'Driver login failed.', true);
            }
        } catch (error) {
            console.error("Error during driver login:", error);
            displayMessage("Network or API Error during driver login: " + error.message, true);
        }
    });

    // Admin Login Form Submission
    document.getElementById('adminLoginForm')?.addEventListener('submit', async (event) => {
        event.preventDefault();
        displayMessage('Logging in admin...', false);
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
                userToken = data.token; // Store the JWT token from the response
                showSection('adminDashboard'); // Show admin dashboard
                // TODO: Implement fetching and displaying drivers to manage here
                fetchDriversForAdmin(); // Call a function to load drivers
            } else {
                displayMessage(data.message || 'Admin login failed.', true);
            }
        } catch (error) {
            console.error("Error during admin login:", error);
            displayMessage("Network or API Error during admin login: " + error.message, true);
        }
    });

    // New Note Form Submission (Driver Dashboard)
    document.getElementById('newNoteForm')?.addEventListener('submit', async (event) => {
        event.preventDefault();
        displayMessage('Saving note...', false);
        const noteContent = document.getElementById('noteContent').value;

        if (!loggedInDriverId) {
            displayMessage('Error: Not logged in as a driver to add notes.', true);
            return;
        }

        try {
            // Note: You might need to send a driver-specific token for authorization here if implemented
            const response = await fetch(`${API_BASE_URL}/api/notes/add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // 'Authorization': `Bearer ${driverToken}` // If you implement driver tokens
                },
                body: JSON.stringify({ driverId: loggedInDriverId, content: noteContent })
            });
            const data = await response.json();
            if (response.ok) {
                displayMessage(data.message || 'Note added successfully!');
                document.getElementById('noteContent').value = ''; // Clear form
                document.getElementById('addNoteModal').style.display = 'none'; // Close modal
                fetchDriverNotes(loggedInDriverId); // Refresh driver notes
            } else {
                displayMessage(data.message || 'Failed to add note.', true);
            }
        } catch (error) {
            console.error("Error adding note:", error);
            displayMessage("Network or API Error adding note: " + error.message, true);
        }
    });

    // New Driver Form Submission (Admin Dashboard)
    document.getElementById('newDriverForm')?.addEventListener('submit', async (event) => {
        event.preventDefault();
        displayMessage('Adding driver...', false);
        const newDriverId = document.getElementById('newDriverId').value;
        const newDriverName = document.getElementById('newDriverName').value;

        if (!isAdmin || !userToken) { // Ensure admin is logged in and has a token
            displayMessage('Error: Admin not authorized or logged in to add drivers.', true);
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/add-driver`, {
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
                fetchDriversForAdmin(); // Refresh admin's list of drivers
            } else {
                displayMessage(data.message || 'Failed to add driver.', true);
            }
        } catch (error) {
            console.error("Error adding driver:", error);
            displayMessage("Network or API Error adding driver: " + error.message, true);
        }
    });
}

/**
 * Attaches event listeners for all buttons (logout, modals).
 */
function setupButtonListeners() {
    // Logout Button for Driver Dashboard
    document.getElementById('logoutButton')?.addEventListener('click', () => {
        loggedInDriverId = null;
        userToken = null; // Clear token on logout
        isAdmin = false; // Reset admin status on logout (will be re-checked by checkAdminStatus)
        displayMessage('Logged out successfully.');
        showSection('loginFormsWrapper'); // Go back to the main login page
        checkAdminStatus(); // Re-run status check to determine initial view (e.g., if admin needs setup)
    });

    // Logout Button for Admin Dashboard
    document.getElementById('adminLogoutButton')?.addEventListener('click', () => {
        loggedInDriverId = null; // Clear driver state (just in case)
        userToken = null; // Clear token on logout
        isAdmin = false; // Reset admin status on logout
        displayMessage('Admin logged out successfully.');
        showSection('loginFormsWrapper'); // Go back to the main login page
        checkAdminStatus(); // Re-run status check to determine initial view
    });

    // Add Note Modal Button
    document.getElementById('addNoteButton')?.addEventListener('click', () => {
        document.getElementById('addNoteModal').style.display = 'flex'; // Use flex for centering
        displayMessage(''); // Clear any messages when opening modal
    });

    // Add Driver Modal Button
    document.getElementById('addDriverButton')?.addEventListener('click', () => {
        document.getElementById('addDriverModal').style.display = 'flex'; // Use flex for centering
        displayMessage(''); // Clear any messages when opening modal
    });

    // Close buttons for modals
    document.querySelectorAll('.modal .close-button').forEach(button => {
        button.addEventListener('click', (event) => {
            event.target.closest('.modal').style.display = 'none';
            displayMessage(''); // Clear any messages when closing modal
        });
    });

    // Close modal when clicking outside (optional, but good UX)
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.style.display = 'none';
                displayMessage(''); // Clear any messages
            }
        });
    });
}

// --- Data Fetching Functions (To be implemented with your worker endpoints) ---

/**
 * Fetches and displays notes for the logged-in driver.
 * Assumes a /api/driver/notes endpoint that returns { notes: [{id, content, timestamp}] }
 * @param {string} driverId
 */
async function fetchDriverNotes(driverId) {
    const notesList = document.getElementById('driverNotesList');
    if (!notesList) return;
    notesList.innerHTML = '<li>Loading notes...</li>'; // Clear and show loading

    try {
        const response = await fetch(`${API_BASE_URL}/api/driver/notes?driverId=${driverId}`);
        const data = await response.json();

        if (response.ok && data.notes) {
            notesList.innerHTML = ''; // Clear loading message
            if (data.notes.length === 0) {
                notesList.innerHTML = '<li>No notes found.</li>';
            } else {
                data.notes.forEach(note => {
                    const li = document.createElement('li');
                    li.textContent = `${new Date(note.timestamp).toLocaleString()}: ${note.content}`;
                    notesList.appendChild(li);
                });
            }
        } else {
            notesList.innerHTML = '<li>Error loading notes.</li>';
            displayMessage(data.message || 'Failed to load driver notes.', true);
        }
    } catch (error) {
        console.error("Error fetching driver notes:", error);
        notesList.innerHTML = '<li>Network error loading notes.</li>';
        displayMessage("Network error fetching driver notes: " + error.message, true);
    }
}

/**
 * Fetches and displays the list of drivers for the admin.
 * Assumes a /api/admin/drivers endpoint that returns { drivers: [{id, name}] }
 * This will require admin token for authorization.
 */
async function fetchDriversForAdmin() {
    const driversList = document.getElementById('adminDriversList');
    if (!driversList) return;
    driversList.innerHTML = '<li>Loading drivers...</li>'; // Clear and show loading

    if (!isAdmin || !userToken) {
        driversList.innerHTML = '<li>Not authorized to view drivers. Please log in as admin.</li>';
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/drivers`, {
            headers: {
                'Authorization': `Bearer ${userToken}` // Send admin's JWT token
            }
        });
        const data = await response.json();

        if (response.ok && data.drivers) {
            driversList.innerHTML = ''; // Clear loading message
            if (data.drivers.length === 0) {
                driversList.innerHTML = '<li>No drivers found.</li>';
            } else {
                data.drivers.forEach(driver => {
                    const li = document.createElement('li');
                    li.textContent = `${driver.driverId} (${driver.driverName || 'No Name'})`;
                    // You might add edit/delete buttons here later
                    driversList.appendChild(li);
                });
            }
        } else {
            driversList.innerHTML = '<li>Error loading drivers.</li>';
            displayMessage(data.message || 'Failed to load drivers for admin.', true);
        }
    } catch (error) {
        console.error("Error fetching drivers for admin:", error);
        driversList.innerHTML = '<li>Network error loading drivers.</li>';
        displayMessage("Network error fetching drivers for admin: " + error.message, true);
    }
}
