// Worker API URL
const WORKER_URL = 'https://driver-auth-worker.blackcarpetridesharelogistics.workers.dev';

// Function to fetch and display the initial setup/login form
async function showInitialForms() {
    try {
        const loadingMessage = document.getElementById('loading-message');
        const setupForm = document.getElementById('setup-form');
        const loginForm = document.getElementById('login-form');
        
        loadingMessage.style.display = 'block';
        setupForm.style.display = 'none';
        loginForm.style.display = 'none';

        const response = await fetch(`${WORKER_URL}/api/auth/status`);
        const data = await response.json();
        
        loadingMessage.style.display = 'none';

        if (data.isAdminSetup) {
            loginForm.style.display = 'block';
        } else {
            setupForm.style.display = 'block';
        }

    } catch (error) {
        console.error('Error fetching admin status:', error);
        alert('Could not connect to the server. Please check your worker deployment.');
        document.getElementById('loading-message').textContent = 'Error: Could not connect to the server.';
    }
}

// Function to handle admin setup
async function handleSetup(event) {
    event.preventDefault();
    const username = document.getElementById('setup-username').value;
    const password = document.getElementById('setup-password').value;

    try {
        const response = await fetch(`${WORKER_URL}/api/admin/setup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();
        if (response.ok) {
            alert(data.message);
            showInitialForms(); // Switch to login form
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error('Error during admin setup:', error);
        alert('Failed to set up admin. Network error.');
    }
}

// Function to handle admin login
async function handleLogin(event) {
    event.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    try {
        const response = await fetch(`${WORKER_URL}/api/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();
        if (response.ok) {
            alert(data.message);
            localStorage.setItem('adminToken', data.token);
            // Redirect to admin dashboard
            window.location.href = '/admin-dashboard.html'; // Assuming you have a dashboard
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error('Error during admin login:', error);
        alert('Failed to login. Network error.');
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Check if a token exists to bypass the login page
    if (localStorage.getItem('adminToken')) {
        // Redirect to admin dashboard
        window.location.href = '/admin-dashboard.html';
        return;
    }
    
    showInitialForms();
    
    document.getElementById('setup-form').addEventListener('submit', handleSetup);
    document.getElementById('login-form').addEventListener('submit', handleLogin);
});
