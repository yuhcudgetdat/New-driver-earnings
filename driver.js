// Function to show the initial admin setup form
async function showAdminSetup() {
    const response = await fetch('https://driver-auth-worker.blackcarpetridesharelogistics.workers.dev/api/auth/status');
    const data = await response.json();
    if (data.isAdminSetup) {
        document.getElementById('setup-form').style.display = 'none';
        document.getElementById('login-form').style.display = 'block';
    } else {
        document.getElementById('setup-form').style.display = 'block';
        document.getElementById('login-form').style.display = 'none';
    }
}

// Function to handle form submissions
async function handleFormSubmission(event) {
    event.preventDefault();
    const formId = event.target.id;
    let url = '';
    let body = {};
    if (formId === 'setup-form') {
        url = 'https://driver-auth-worker.blackcarpetridesharelogistics.workers.dev/api/admin/setup';
        const username = document.getElementById('setup-username').value;
        const password = document.getElementById('setup-password').value;
        body = { username, password };
    } else if (formId === 'login-form') {
        url = 'https://driver-auth-worker.blackcarpetridesharelogistics.workers.dev/api/admin/login';
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        body = { username, password };
    }

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const error = await response.json();
            alert(error.message);
            return;
        }

        const data = await response.json();
        if (formId === 'setup-form') {
            alert('Admin account created successfully!');
            showAdminSetup(); // Switch to login form
        } else if (formId === 'login-form') {
            alert('Login successful!');
            localStorage.setItem('adminToken', data.token);
            // Redirect or show admin dashboard
            window.location.href = '/admin-dashboard.html'; // Assuming you have a dashboard
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Could not connect to the server. Please try again later.');
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Show the appropriate form on page load
    showAdminSetup();

    // Attach event listeners to the forms
    const setupForm = document.getElementById('setup-form');
    if (setupForm) {
        setupForm.addEventListener('submit', handleFormSubmission);
    }

    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleFormSubmission);
    }
});
