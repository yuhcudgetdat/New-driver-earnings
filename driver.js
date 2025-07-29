// --- JavaScript Code Starts Here ---
// !!! IMPORTANT: Replace this with your actual Cloudflare Worker URL !!!
// You'll get this URL after deploying your Worker (e.g., https://your-worker-name.your-username.workers.dev)
const API_BASE_URL = 'https://driver-auth-worker.blackcarpetridesharelogistics.workers.dev'; // Example

const WHATSAPP_NUMBER = '18683568145'; // Your WhatsApp Business number

let loggedInDriverId = null;
let isAdmin = false;
let userToken = null; // Store JWT token

// --- Utility Functions ---
function displayMessage(message, isError = false) {
    alert(message); // Simple alert for now
    if (isError) console.error(message);
    else console.log(message);
}

// Universal API Call Helper
async function apiCall(endpoint, method = 'GET', data = null, isFormData = false) {
    const headers = {};
    if (userToken) {
        headers['Authorization'] = `Bearer ${userToken}`;
    }

    const options = {
        method,
        headers: isFormData ? {} : { // FormData sets its own Content-Type, don't set JSON
            'Content-Type': 'application/json',
            ...headers
        },
    };

    if (data) {
        options.body = isFormData ? data : JSON.stringify(data);
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

        if (response.status === 401) { // Unauthorized
            displayMessage('Session expired or unauthorized. Please log in again.', true);
            logout();
            return null;
        }
        if (response.status === 403) { // Forbidden
            displayMessage('You do not have permission to perform this action.', true);
            return null;
        }

        if (!response.ok) {
            const errorData = await response.json(); // Attempt to read error message from backend
            throw new Error(errorData.message || `API error: ${response.status} ${response.statusText}`);
        }

        // Handle no content response (e.g., successful DELETE requests)
        if (response.status === 204) {
            return true; // Indicate success for no content
        }

        // Return JSON response for other successful requests
        return await response.json();
    } catch (error) {
        displayMessage(`Network or API Error: ${error.message}`, true);
        return null;
    }
}


function showSection(sectionId, updateNav = false) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
        section.style.display = 'none'; // Ensure it's hidden
    });
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        targetSection.style.display = 'block'; // Show it
    }


    if (updateNav) {
        document.querySelectorAll('.nav-button').forEach(button => {
            button.classList.remove('active');
        });
        const targetButton = Array.from(document.querySelectorAll('.nav-button')).find(btn =>
            btn.getAttribute('onclick') && btn.getAttribute('onclick').includes(`'${sectionId}'`)
        );
        if (targetButton) {
            targetButton.classList.add('active');
        }
    }
    // Logic to load data when sections are shown (now fetches from API)
    if (loggedInDriverId) {
        if (sectionId === 'rides-earnings') {
            loadDriverDashboard();
        } else if (sectionId === 'profile') {
            loadDriverProfile();
        } else if (sectionId === 'commissions') {
            loadDriverCommissions();
        } else if (sectionId === 'leaderboard') {
            updateLeaderboard();
        }
    }
    if (isAdmin && sectionId === 'admin-dashboard') {
        loadAdminDashboard();
    }
    loadDriverNotes(); // Always load notes
}

// --- Authentication Functions ---
async function checkAuthAndLoad() {
    try {
        // First, check if admin setup is required (from backend)
        const setupStatus = await apiCall('/auth/status'); // Worker will check if initial admin password is set

        if (setupStatus && setupStatus.isAdminSetup === false) {
            showSection('initial-admin-setup');
            document.getElementById('login-section').style.display = 'none';
            document.getElementById('admin-login-section').style.display = 'none';
            document.getElementById('driver-nav').style.display = 'none';
            document.getElementById('admin-nav').style.display = 'none';
        } else {
            // Admin is setup, now try to auto-login if token exists
            const storedToken = sessionStorage.getItem('userToken');
            if (storedToken) {
                userToken = storedToken;
                // Validate token with backend and get user info
                const authCheck = await apiCall('/auth/verify-token', 'POST', { token: storedToken }); // Backend verifies JWT validity
                if (authCheck && authCheck.valid) {
                    if (authCheck.role === 'admin') {
                        isAdmin = true;
                        loggedInDriverId = null;
                        showSection('admin-dashboard', true);
                        document.getElementById('login-section').style.display = 'none';
                        document.getElementById('admin-login-section').style.display = 'none';
                        document.getElementById('driver-nav').style.display = 'none';
                        document.getElementById('admin-nav').style.display = 'flex';
                    } else if (authCheck.role === 'driver' && authCheck.id) {
                        loggedInDriverId = authCheck.id;
                        isAdmin = false;
                        showSection('rides-earnings', true);
                        document.getElementById('login-section').style.display = 'none';
                        document.getElementById('admin-login-section').style.display = 'none';
                        document.getElementById('driver-nav').style.display = 'flex';
                        document.getElementById('admin-nav').style.display = 'none';
                    }
                    displayMessage(`Welcome back, ${authCheck.role}!`);
                } else {
                    // Token invalid or expired
                    sessionStorage.removeItem('userToken');
                    displayMessage('Your session has expired. Please log in.', true);
                    showSection('login-section');
                }
            } else {
                // No token, show driver login
                showSection('login-section');
                document.getElementById('initial-admin-setup').style.display = 'none';
                document.getElementById('admin-login-section').style.display = 'none';
                document.getElementById('driver-nav').style.display = 'none';
                document.getElementById('admin-nav').style.display = 'none';
            }
        }
    } catch (error) {
        displayMessage(`Failed to check initial setup or authenticate: ${error.message}`, true);
        showSection('login-section'); // Fallback to login in case of network issues with /auth/status
    }
    loadDriverNotes(); // Load notes regardless of login state
}


async function setInitialAdminPassword() {
    const password = document.getElementById('initial-admin-password').value;
    const confirmPassword = document.getElementById('confirm-initial-admin-password').value;

    if (!password || !confirmPassword) {
        displayMessage("Please enter and confirm the password.", true);
        return;
    }
    if (password !== confirmPassword) {
        displayMessage("Passwords do not match.", true);
        return;
    }

    const response = await apiCall('/auth/setup-admin', 'POST', { password });

    if (response && response.success) {
        displayMessage("Initial admin password set successfully! Please log in.");
        showSection('admin-login-section'); // Go to admin login
    }
}

async function loginDriver() {
    const driverId = document.getElementById('driver-id-input').value.trim();
    const password = prompt("Please enter your driver password:"); // For simplicity, prompting for password

    if (!driverId || !password) {
        displayMessage("Driver ID and password are required.", true);
        return;
    }

    const response = await apiCall('/auth/login', 'POST', { id: driverId, password, role: 'driver' });

    if (response && response.token) {
        userToken = response.token;
        sessionStorage.setItem('userToken', userToken); // Store token in sessionStorage
        loggedInDriverId = driverId;
        isAdmin = false;
        displayMessage(`Logged in as Driver: ${driverId}`);
        checkAuthAndLoad(); // Re-check auth state to load UI
    } else if (response && response.message) {
         displayMessage(response.message, true); // Display error from backend
    }
}

async function loginAdmin() {
    const password = document.getElementById('admin-password-input').value;

    const response = await apiCall('/auth/login', 'POST', { password, role: 'admin' });

    if (response && response.token) {
        userToken = response.token;
        sessionStorage.setItem('userToken', userToken); // Store token in sessionStorage
        isAdmin = true;
        loggedInDriverId = null;
        displayMessage("Logged in as Admin.");
        checkAuthAndLoad(); // Re-check auth state to load UI
    } else if (response && response.message) {
        displayMessage(response.message, true); // Display error from backend
    }
}

function logout() {
    userToken = null;
    loggedInDriverId = null;
    isAdmin = false;
    sessionStorage.removeItem('userToken'); // Clear token from session storage
    displayMessage("Logged out.");
    document.getElementById('driver-id-input').value = '';
    document.getElementById('admin-password-input').value = '';
    showSection('login-section');
    document.getElementById('driver-nav').style.display = 'none';
    document.getElementById('admin-nav').style.display = 'none';
}

function showAdminLogin() {
    document.getElementById('login-section').classList.remove('active');
    document.getElementById('admin-login-section').classList.add('active');
    document.getElementById('driver-id-input').value = '';
}

function showLogin() {
    document.getElementById('admin-login-section').classList.remove('active');
    document.getElementById('login-section').classList.add('active');
    document.getElementById('admin-password-input').value = '';
    document.getElementById('driver-nav').style.display = 'none';
    document.getElementById('admin-nav').style.display = 'none';
}


// --- Driver Dashboard Functions --- (All now use apiCall)
async function loadDriverDashboard() {
    if (!loggedInDriverId) return; // Ensure logged in

    const driverData = await apiCall(`/drivers/${loggedInDriverId}`); // Fetch specific driver data

    if (driverData) {
        const totalRides = driverData.rides ? driverData.rides.length : 0;
        const totalEarnings = driverData.rides ? driverData.rides.reduce((sum, ride) => sum + (ride.fare || 0), 0) : 0;

        document.getElementById('total-rides').textContent = totalRides;
        document.getElementById('total-earnings').textContent = `$${totalEarnings.toFixed(2)}`;

        const ridesTableBody = document.querySelector('#rides-table tbody');
        ridesTableBody.innerHTML = ''; // Clear previous entries

        if (driverData.rides) {
            driverData.rides.forEach(ride => {
                const row = ridesTableBody.insertRow();
                row.insertCell().textContent = ride.id; // Assuming ride has an 'id'
                row.insertCell().textContent = new Date(ride.date).toLocaleDateString();
                row.insertCell().textContent = ride.origin;
                row.insertCell().textContent = ride.destination;
                row.insertCell().textContent = `$${(ride.fare || 0).toFixed(2)}`;
            });
        }
        loadDriverCommissions(); // Also load commissions
    }
}

async function loadDriverProfile() {
    if (!loggedInDriverId) return;

    const driver = await apiCall(`/drivers/${loggedInDriverId}`);

    if (driver) {
        document.getElementById('profile-full-name').textContent = driver.fullName || 'N/A';
        document.getElementById('profile-id').textContent = driver.id; // Assuming driver has an 'id'
        document.getElementById('profile-whatsapp-phone').textContent = driver.whatsappPhone || 'N/A';
        document.getElementById('profile-vehicle-type-color').textContent = driver.vehicleTypeColor || 'N/A';
        document.getElementById('profile-license-plate').textContent = driver.licensePlate || 'N/A';
        document.getElementById('profile-drivers-license-number').textContent = driver.driversLicenseNumber || 'N/A';
        document.getElementById('profile-insurance-number').textContent = driver.insuranceNumber || 'N/A';

        // Handle images (URLs will come from R2 via Worker)
        const driverPicLink = document.getElementById('driver-picture-link');
        const driverPicImg = document.getElementById('profile-driver-picture');
        const driverPicPlaceholder = document.getElementById('profile-driver-picture-placeholder');

        if (driver.pictures && driver.pictures.driverPictureUrl) {
            driverPicImg.src = driver.pictures.driverPictureUrl;
            driverPicLink.href = driver.pictures.driverPictureUrl;
            driverPicLink.style.display = 'block';
            driverPicImg.style.display = 'block';
            driverPicPlaceholder.style.display = 'none';
        } else {
            driverPicLink.style.display = 'none';
            driverPicImg.style.display = 'none';
            driverPicPlaceholder.style.display = 'block';
        }

        const vehiclePicLink = document.getElementById('vehicle-picture-link');
        const vehiclePicImg = document.getElementById('profile-vehicle-picture');
        const vehiclePicPlaceholder = document.getElementById('profile-vehicle-picture-placeholder');
        if (driver.pictures && driver.pictures.vehiclePictureUrl) {
            vehiclePicImg.src = driver.pictures.vehiclePictureUrl;
            vehiclePicLink.href = driver.pictures.vehiclePictureUrl;
            vehiclePicLink.style.display = 'block';
            vehiclePicImg.style.display = 'block';
            vehiclePicPlaceholder.style.display = 'none';
        } else {
            vehiclePicLink.style.display = 'none';
            vehiclePicImg.style.display = 'none';
            vehiclePicPlaceholder.style.display = 'block';
        }

        const insurancePicLink = document.getElementById('insurance-picture-link');
        const insurancePicImg = document.getElementById('profile-insurance-picture');
        const insurancePicPlaceholder = document.getElementById('profile-insurance-picture-placeholder');
        if (driver.pictures && driver.pictures.insurancePictureUrl) {
            insurancePicImg.src = driver.pictures.insurancePictureUrl;
            insurancePicLink.href = driver.pictures.insurancePictureUrl;
            insurancePicLink.style.display = 'block';
            insurancePicImg.style.display = 'block';
            insurancePicPlaceholder.style.display = 'none';
        } else {
            insurancePicLink.style.display = 'none';
            insurancePicImg.style.display = 'none';
            insurancePicPlaceholder.style.display = 'block';
        }

    }
}

async function loadDriverCommissions() {
    if (!loggedInDriverId) return;

    const driver = await apiCall(`/drivers/${loggedInDriverId}`);

    if (driver && driver.commission) {
        document.getElementById('commission-amount').textContent = `$${driver.commission.amountDue ? driver.commission.amountDue.toFixed(2) : '0.00'}`;
        document.getElementById('commission-due-date').textContent = driver.commission.dueDate || 'N/A';

        const message = encodeURIComponent(`Hi, I'd like to inquire about paying my commission of $${driver.commission.amountDue ? driver.commission.amountDue.toFixed(2) : '0.00'} due on ${driver.commission.dueDate}. My Driver ID is ${driver.id}.`);
        document.getElementById('whatsapp-payment-link').href = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
    } else {
        document.getElementById('commission-amount').textContent = '$0.00';
        document.getElementById('commission-due-date').textContent = 'N/A';
        document.getElementById('whatsapp-payment-link').href = `https://wa.me/${WHATSAPP_NUMBER}`;
    }
}

async function updateLeaderboard() {
    const drivers = await apiCall('/drivers'); // Fetch all drivers
    if (!drivers) return;

    const leaderboard = drivers.map(driver => ({
        driverId: driver.id,
        fullName: driver.fullName || `Driver ${driver.id}`,
        totalRides: driver.rides ? driver.rides.length : 0
    })).sort((a, b) => b.totalRides - a.totalRides); // Sort descending by rides

    const leaderboardPlaces = document.querySelectorAll('.leaderboard-chart .place');

    leaderboardPlaces.forEach((placeElement, index) => {
        const rankSpan = placeElement.querySelector('.rank');
        const nameSpan = placeElement.querySelector('.driver-name');
        const ridesSpan = placeElement.querySelector('.rides');

        if (leaderboard[index]) {
            const driver = leaderboard[index];
            nameSpan.textContent = driver.fullName;
            ridesSpan.textContent = `${driver.totalRides} rides`;
            // Assign ranks specifically for top 3
            if (index === 0) rankSpan.textContent = '1st';
            else if (index === 1) rankSpan.textContent = '2nd';
            else if (index === 2) rankSpan.textContent = '3rd';
        } else {
            // Clear if not enough drivers
            nameSpan.textContent = 'N/A';
            ridesSpan.textContent = '0 rides';
            if (index === 0) rankSpan.textContent = '1st';
            else if (index === 1) rankSpan.textContent = '2nd';
            else if (index === 2) rankSpan.textContent = '3rd';
        }
    });
}

async function loadDriverNotes() {
    const settings = await apiCall('/settings'); // Fetch general settings
    if (settings && settings.driverNotes) {
        document.getElementById('driver-notes').textContent = settings.driverNotes;
        document.getElementById('admin-driver-notes').value = settings.driverNotes; // For admin panel
    } else {
        document.getElementById('driver-notes').textContent = "No current notes.";
        document.getElementById('admin-driver-notes').value = "No current notes.";
    }
}

// --- Admin Dashboard Functions --- (All now use apiCall)
async function loadAdminDashboard() {
    if (!isAdmin) return;
    populateDriverSelects();
    loadDriverNotes(); // Ensure admin notes are loaded
}

async function populateDriverSelects() {
    const drivers = await apiCall('/drivers'); // Fetch all drivers
    if (!drivers) return;

    const selects = [
        document.getElementById('select-driver-to-manage'),
        document.getElementById('select-driver-for-pictures'),
        document.getElementById('select-driver-for-rides'),
        document.getElementById('select-driver-for-commissions')
    ];

    selects.forEach(select => {
        const currentSelected = select.value; // Remember current selection
        select.innerHTML = '<option value="">-- Select Driver --</option>'; // Clear existing options
        drivers.forEach(driver => {
            const option = document.createElement('option');
            option.value = driver.id; // Use driver.id
            option.textContent = `${driver.fullName || 'Unnamed'} (${driver.id})`;
            select.appendChild(option);
        });
        select.value = currentSelected; // Restore selection
    });
}

async function addDriver() {
    const driverId = document.getElementById('add-driver-id').value.trim();
    const fullName = document.getElementById('add-driver-name').value.trim();
    const password = document.getElementById('add-driver-password').value.trim();

    if (!driverId || !fullName || !password) {
        displayMessage("Please fill in Driver ID, Full Name, and Password.", true);
        return;
    }

    const response = await apiCall('/drivers', 'POST', { id: driverId, fullName, password });

    if (response && response.success) {
        displayMessage(`Driver ${fullName} (${driverId}) added successfully!`);
        clearAddDriverForm();
        populateDriverSelects();
        updateLeaderboard(); // Leaderboard might need updating if a new driver affects rankings
    }
}

function clearAddDriverForm() {
    document.getElementById('add-driver-id').value = '';
    document.getElementById('add-driver-name').value = '';
    document.getElementById('add-driver-password').value = '';
}

async function removeDriver() {
    const driverId = document.getElementById('select-driver-to-manage').value;
    if (!driverId) {
        displayMessage("Please select a driver to remove.", true);
        return;
    }

    if (confirm(`Are you sure you want to remove driver ${driverId}? This action cannot be undone.`)) {
        const response = await apiCall(`/drivers/${driverId}`, 'DELETE');
        if (response) { // Response for DELETE might be true or empty object
            displayMessage(`Driver ${driverId} removed successfully.`);
            populateDriverSelects();
            clearEditDriverForm();
            updateLeaderboard();
        }
    }
}

async function loadDriverForEdit() {
    const driverId = document.getElementById('select-driver-to-manage').value;
    if (!driverId) {
        clearEditDriverForm();
        return;
    }

    const driver = await apiCall(`/drivers/${driverId}`);

    if (driver) {
        document.getElementById('edit-driver-full-name').value = driver.fullName || '';
        document.getElementById('edit-driver-whatsapp-phone').value = driver.whatsappPhone || '';
        document.getElementById('edit-driver-vehicle-type-color').value = driver.vehicleTypeColor || '';
        document.getElementById('edit-driver-license-plate').value = driver.licensePlate || '';
        document.getElementById('edit-driver-drivers-license-number').value = driver.driversLicenseNumber || '';
        document.getElementById('edit-driver-insurance-number').value = driver.insuranceNumber || '';
    } else {
        clearEditDriverForm();
    }
}

function clearEditDriverForm() {
    document.getElementById('edit-driver-full-name').value = '';
    document.getElementById('edit-driver-whatsapp-phone').value = '';
    document.getElementById('edit-driver-vehicle-type-color').value = '';
    document.getElementById('edit-driver-license-plate').value = '';
    document.getElementById('edit-driver-drivers-license-number').value = '';
    document.getElementById('edit-driver-insurance-number').value = '';
}

async function updateDriverProfile() {
    const driverId = document.getElementById('select-driver-to-manage').value;
    if (!driverId) {
        displayMessage("Please select a driver to update.", true);
        return;
    }

    const updatedData = {
        fullName: document.getElementById('edit-driver-full-name').value.trim(),
        whatsappPhone: document.getElementById('edit-driver-whatsapp-phone').value.trim(),
        vehicleTypeColor: document.getElementById('edit-driver-vehicle-type-color').value.trim(),
        licensePlate: document.getElementById('edit-driver-license-plate').value.trim(),
        driversLicenseNumber: document.getElementById('edit-driver-drivers-license-number').value.trim(),
        insuranceNumber: document.getElementById('edit-driver-insurance-number').value.trim()
    };

    const response = await apiCall(`/drivers/${driverId}`, 'PUT', updatedData);

    if (response && response.success) {
        displayMessage(`Driver ${driverId}'s profile updated successfully!`);
        populateDriverSelects(); // Re-populate to update names in selects if changed
    }
}


async function loadDriverPicturesForAdmin() {
    const driverId = document.getElementById('select-driver-for-pictures').value;
    // Clear all previews
    const previewIds = ['preview-driver-picture', 'preview-vehicle-picture', 'preview-insurance-picture'];
    previewIds.forEach(id => {
        document.getElementById(id).src = '';
        document.getElementById(id).style.display = 'none';
    });

    if (!driverId) return;

    const driver = await apiCall(`/drivers/${driverId}`);

    if (driver && driver.pictures) {
        if (driver.pictures.driverPictureUrl) {
            document.getElementById('preview-driver-picture').src = driver.pictures.driverPictureUrl;
            document.getElementById('preview-driver-picture').style.display = 'block';
        }
        if (driver.pictures.vehiclePictureUrl) {
            document.getElementById('preview-vehicle-picture').src = driver.pictures.vehiclePictureUrl;
            document.getElementById('preview-vehicle-picture').style.display = 'block';
        }
        if (driver.pictures.insurancePictureUrl) {
            document.getElementById('preview-insurance-picture').src = driver.pictures.insurancePictureUrl;
            document.getElementById('preview-insurance-picture').style.display = 'block';
        }
    }
}

function previewImage(event, previewId) {
    const reader = new FileReader();
    reader.onload = function() {
        const output = document.getElementById(previewId);
        output.src = reader.result;
        output.style.display = 'block';
    };
    if (event.target.files[0]) {
        reader.readAsDataURL(event.target.files[0]);
    } else {
        // Clear preview if no file selected
        document.getElementById(previewId).src = '';
        document.getElementById(previewId).style.display = 'none';
    }
}

async function uploadPicture(pictureType) {
    const driverId = document.getElementById('select-driver-for-pictures').value;
    if (!driverId) {
        displayMessage("Please select a driver first.", true);
        return;
    }

    let fileInputId;
    switch (pictureType) {
        case 'driverPicture': fileInputId = 'upload-driver-picture'; break;
        case 'vehiclePicture': fileInputId = 'upload-vehicle-picture'; break;
        case 'insurancePicture': fileInputId = 'upload-insurance-picture'; break;
        default: displayMessage("Invalid picture type.", true); return;
    }

    const fileInput = document.getElementById(fileInputId);
    if (!fileInput.files || fileInput.files.length === 0) {
        displayMessage("Please select a file to upload.", true);
        return;
    }

    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('pictureType', pictureType); // Send pictureType to backend

    // Send FormData with isFormData = true
    const response = await apiCall(`/drivers/${driverId}/upload-picture`, 'POST', formData, true);

    if (response && response.success) {
        displayMessage(`${pictureType} uploaded successfully for ${driverId}!`);
        loadDriverPicturesForAdmin(); // Refresh previews to show newly uploaded image
        fileInput.value = ''; // Clear file input
    }
}


async function loadRidesForAdmin() {
    const driverId = document.getElementById('select-driver-for-rides').value;
    const ridesTableBody = document.getElementById('admin-rides-table').getElementsByTagName('tbody')[0];
    ridesTableBody.innerHTML = ''; // Clear current rides

    if (!driverId) {
        return;
    }

    const driver = await apiCall(`/drivers/${driverId}`);

    if (driver && driver.rides) {
        driver.rides.forEach(ride => {
            const row = ridesTableBody.insertRow();
            row.insertCell(0).textContent = ride.id; // Assuming ride has an 'id'
            row.insertCell(1).textContent = new Date(ride.date).toLocaleDateString();
            row.insertCell(2).textContent = ride.origin;
            row.insertCell(3).textContent = ride.destination;
            row.insertCell(4).textContent = `$${(ride.fare || 0).toFixed(2)}`;
            const actionCell = row.insertCell(5);
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.onclick = () => removeRideFromDriver(driverId, ride.id); // Use ride.id
            actionCell.appendChild(deleteButton);
        });
    }
}

async function addRideToDriver() {
    const driverId = document.getElementById('select-driver-for-rides').value;
    const origin = document.getElementById('new-ride-origin').value.trim();
    const destination = document.getElementById('new-ride-destination').value.trim();
    const fare = parseFloat(document.getElementById('new-ride-fare').value);

    if (!driverId || !origin || !destination || isNaN(fare) || fare <= 0) {
        displayMessage("Please select a driver and fill in all valid ride details.", true);
        return;
    }

    const newRide = {
        date: new Date().toISOString(), // ISO string for consistent date handling
        origin: origin,
        destination: destination,
        fare: fare
    };

    const response = await apiCall(`/drivers/${driverId}/rides`, 'POST', newRide); // Post to specific driver's rides endpoint

    if (response && response.success) {
        displayMessage(`Ride added successfully for ${driverId}!`);
        document.getElementById('new-ride-origin').value = '';
        document.getElementById('new-ride-destination').value = '';
        document.getElementById('new-ride-fare').value = '';
        loadRidesForAdmin(); // Refresh the table
        updateLeaderboard(); // Update leaderboard after ride change
    }
}

async function removeRideFromDriver(driverId, rideIdToRemove) {
    if (confirm(`Are you sure you want to remove ride ${rideIdToRemove} from driver ${driverId}?`)) {
        const response = await apiCall(`/drivers/${driverId}/rides/${rideIdToRemove}`, 'DELETE'); // Delete specific ride
        if (response) {
            displayMessage(`Ride ${rideIdToRemove} removed successfully from ${driverId}.`);
            loadRidesForAdmin(); // Refresh the table
            updateLeaderboard(); // Update leaderboard after ride change
        }
    }
}

async function loadCommissionsForAdmin() {
    const driverId = document.getElementById('select-driver-for-commissions').value;
    document.getElementById('admin-commission-amount').textContent = '$0.00';
    document.getElementById('admin-commission-due-date').textContent = 'N/A';
    document.getElementById('set-commission-amount').value = '';
    document.getElementById('set-commission-due-date').value = '';

    if (!driverId) return;

    const driver = await apiCall(`/drivers/${driverId}`);

    if (driver && driver.commission) {
        document.getElementById('admin-commission-amount').textContent = `$${driver.commission.amountDue ? driver.commission.amountDue.toFixed(2) : '0.00'}`;
        document.getElementById('admin-commission-due-date').textContent = driver.commission.dueDate || 'N/A';
        document.getElementById('set-commission-amount').value = driver.commission.amountDue || '';
        document.getElementById('set-commission-due-date').value = driver.commission.dueDate || '';
    }
}

async function setDriverCommission() {
    const driverId = document.getElementById('select-driver-for-commissions').value;
    const amountDue = parseFloat(document.getElementById('set-commission-amount').value);
    const dueDate = document.getElementById('set-commission-due-date').value;

    if (!driverId || isNaN(amountDue) || !dueDate) {
        displayMessage("Please select a driver and enter a valid amount and due date.", true);
        return;
    }

    const response = await apiCall(`/drivers/${driverId}/commission`, 'PUT', { amountDue, dueDate }); // Update commission

    if (response && response.success) {
        displayMessage(`Commission set for ${driverId} successfully!`);
        loadCommissionsForAdmin(); // Refresh values
    }
}

async function updateDriverNotes() {
    const notes = document.getElementById('admin-driver-notes').value.trim();
    const response = await apiCall('/settings/driver-notes', 'PUT', { notes }); // Update general settings

    if (response && response.success) {
        displayMessage("Driver notes updated successfully!");
        loadDriverNotes(); // Update notes on dashboard
    }
}

async function downloadData() {
    displayMessage("Initiating data download... This might take a moment.", false);
    const response = await apiCall('/admin/download-data', 'GET'); // Request all data from backend
    if (response) {
        const dataStr = JSON.stringify(response, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'blackcarpet_rideshare_data.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        displayMessage("Data downloaded successfully!");
    }
}

async function clearAllDataBackend() {
    if (confirm("WARNING: This will permanently delete ALL driver data and admin settings from the backend database. Are you absolutely sure? This action cannot be undone.")) {
        const response = await apiCall('/admin/clear-all-data', 'POST'); // Using POST for destructive action
        if (response && response.success) {
            displayMessage("All backend data cleared. The application will restart for initial setup.", false);
            logout(); // Force logout
            checkAuthAndLoad(); // Re-initialize
        }
    }
}


// --- Initial Load ---
document.addEventListener('DOMContentLoaded', () => {
    checkAuthAndLoad(); // This will determine which section to show initially
});

// --- JavaScript Code Ends Here ---
