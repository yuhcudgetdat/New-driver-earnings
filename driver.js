/* --- JavaScript Code Starts Here --- */
// --- Global State ---
let appData = {
    drivers: [],
    driverNotes: ""
};

const WHATSAPP_NUMBER = '18683568145';
let loggedInDriverId = null;
let isAdmin = false;

// --- Utility Functions ---
async function fetchData(endpoint, method = 'GET', body = null) {
    const options = {
        method: method,
        headers: { 'Content-Type': 'application/json' },
    };
    if (body) {
        options.body = JSON.stringify(body);
    }
    const response = await fetch(`/api/${endpoint}`, options);
    if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
    }
    return response.json();
}

function showSection(sectionId, updateNav = false) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');

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

    if (sectionId === 'commissions' && loggedInDriverId) {
        loadDriverCommissions();
    }
    if (sectionId === 'profile' && loggedInDriverId) {
        loadDriverProfile();
    }
    if (sectionId === 'rides-earnings' && loggedInDriverId) {
        loadDriverDashboard();
    }
    if (sectionId === 'admin-dashboard' && isAdmin) {
        loadAdminDashboard();
    }
}

// --- Login & Session Management ---
async function loginDriver() {
    const driverIdInput = document.getElementById('driver-id-input').value.trim().toUpperCase();
    try {
        const data = await fetchData('login/driver', 'POST', { driverId: driverIdInput });
        loggedInDriverId = driverIdInput;
        isAdmin = false;
        document.getElementById('login-section').style.display = 'none';
        document.getElementById('admin-login-section').style.display = 'none';
        document.getElementById('driver-nav').style.display = 'flex';
        document.getElementById('admin-nav').style.display = 'none';
        appData.driverNotes = data.notes;
        document.getElementById('driver-notes').textContent = appData.driverNotes;
        showSection('rides-earnings', true);
    } catch (e) {
        alert('Driver ID not found. Please try again.');
    }
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

async function loginAdmin() {
    const adminPasswordInput = document.getElementById('admin-password-input').value;
    try {
        const data = await fetchData('login/admin', 'POST', { password: adminPasswordInput });
        if (data.success) {
            loggedInDriverId = null;
            isAdmin = true;
            document.getElementById('login-section').style.display = 'none';
            document.getElementById('admin-login-section').style.display = 'none';
            document.getElementById('driver-nav').style.display = 'none';
            document.getElementById('admin-nav').style.display = 'flex';
            appData.driverNotes = data.notes;
            document.getElementById('driver-notes').textContent = appData.driverNotes;
            showSection('admin-dashboard', true);
        } else {
            alert('Incorrect Admin Password.');
        }
    } catch (e) {
        alert('Login failed. Please try again.');
    }
}

function logout() {
    loggedInDriverId = null;
    isAdmin = false;
    document.getElementById('driver-id-input').value = '';
    document.getElementById('admin-password-input').value = '';
    document.getElementById('driver-nav').style.display = 'none';
    document.getElementById('admin-nav').style.display = 'none';
    showSection('login-section', false);
}

// --- Driver Dashboard Functions ---
async function loadDriverDashboard() {
    if (!loggedInDriverId) return;
    try {
        const driver = await fetchData(`driver/data?id=${loggedInDriverId}`);
        const totalRides = driver.rides.length;
        const totalEarnings = driver.rides.reduce((sum, ride) => sum + (ride.fare || 0), 0);

        document.getElementById('total-rides').textContent = totalRides;
        document.getElementById('total-earnings').textContent = `$${totalEarnings.toFixed(2)}`;

        const ridesTableBody = document.querySelector('#rides-table tbody');
        ridesTableBody.innerHTML = '';
        driver.rides.forEach(ride => {
            const row = ridesTableBody.insertRow();
            row.insertCell().textContent = ride.id;
            row.insertCell().textContent = ride.date || 'N/A';
            row.insertCell().textContent = ride.origin;
            row.insertCell().textContent = ride.destination;
            row.insertCell().textContent = `$${(ride.fare || 0).toFixed(2)}`;
        });
        updateLeaderboard();
        loadDriverCommissions();
    } catch (e) {
        console.error("Failed to load driver dashboard:", e);
    }
}

async function loadDriverProfile() {
    if (!loggedInDriverId) return;
    try {
        const driver = await fetchData(`driver/profile?id=${loggedInDriverId}`);
        document.getElementById('profile-full-name').textContent = driver.fullName || 'N/A';
        document.getElementById('profile-id').textContent = driver.id || 'N/A';
        document.getElementById('profile-whatsapp-phone').textContent = driver.whatsappPhone || 'N/A';
        document.getElementById('profile-vehicle-type-color').textContent = driver.vehicleTypeColor || 'N/A';
        document.getElementById('profile-license-plate').textContent = driver.licensePlate || 'N/A';
        document.getElementById('profile-drivers-license-number').textContent = driver.driversLicenseNumber || 'N/A';
        document.getElementById('profile-insurance-number').textContent = driver.insuranceNumber || 'N/A';

        const pictureElements = [
            { id: 'driverPicture', url: driver.driverPictureUrl, linkId: 'driver-picture-link', placeholderId: 'profile-driver-picture-placeholder', imgId: 'profile-driver-picture' },
            { id: 'vehiclePicture', url: driver.vehiclePictureUrl, linkId: 'vehicle-picture-link', placeholderId: 'profile-vehicle-picture-placeholder', imgId: 'profile-vehicle-picture' },
            { id: 'insurancePicture', url: driver.insurancePictureUrl, linkId: 'insurance-picture-link', placeholderId: 'profile-insurance-picture-placeholder', imgId: 'profile-insurance-picture' }
        ];

        pictureElements.forEach(pic => {
            const linkElement = document.getElementById(pic.linkId);
            const imgElement = document.getElementById(pic.imgId);
            const placeholderElement = document.getElementById(pic.placeholderId);
            
            if (pic.url) {
                linkElement.href = pic.url;
                linkElement.style.display = 'block';
                imgElement.src = pic.url;
                placeholderElement.style.display = 'none';
            } else {
                linkElement.style.display = 'none';
                placeholderElement.style.display = 'block';
            }
        });
    } catch (e) {
        console.error("Failed to load driver profile:", e);
    }
}

async function loadDriverCommissions() {
    if (!loggedInDriverId) return;
    try {
        const driver = await fetchData(`driver/commissions?id=${loggedInDriverId}`);
        const commissionAmount = driver.commissionDue || 0;
        const commissionDueDate = driver.commissionDueDate || 'N/A';

        document.getElementById('commission-amount').textContent = `$${commissionAmount.toFixed(2)}`;
        document.getElementById('commission-due-date').textContent = commissionDueDate;
        
        const whatsappLink = document.getElementById('whatsapp-payment-link');
        if (commissionAmount > 0) {
            const message = encodeURIComponent(`Hello, I would like to pay my outstanding commission of $${commissionAmount.toFixed(2)}.`);
            whatsappLink.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
            whatsappLink.style.display = 'inline-block';
        } else {
            whatsappLink.style.display = 'none';
        }
    } catch (e) {
        console.error("Failed to load driver commissions:", e);
    }
}

// --- Leaderboard Functions ---
async function updateLeaderboard() {
    try {
        const leaderboardData = await fetchData('leaderboard');
        const chartElements = [
            document.querySelector('.first-place'),
            document.querySelector('.second-place'),
            document.querySelector('.third-place')
        ];

        for (let i = 0; i < 3; i++) {
            const place = chartElements[i];
            if (leaderboardData[i]) {
                place.querySelector('.driver-name').textContent = leaderboardData[i].fullName || leaderboardData[i].firstName;
                place.querySelector('.rides').textContent = `${leaderboardData[i].rides.length} rides`;
            } else {
                place.querySelector('.driver-name').textContent = 'N/A';
                place.querySelector('.rides').textContent = '0 rides';
            }
        }
    } catch (e) {
        console.error("Failed to update leaderboard:", e);
    }
}

// --- Admin Dashboard Functions ---
async function loadAdminDashboard() {
    if (!isAdmin) return;
    try {
        const drivers = await fetchData('admin/drivers');
        appData.drivers = drivers;

        const driverSelects = document.querySelectorAll('select[id^="select-driver"]');
        driverSelects.forEach(select => {
            const selectedValue = select.value;
            select.innerHTML = '<option value="">-- Select Driver --</option>';
            drivers.forEach(driver => {
                const option = document.createElement('option');
                option.value = driver.id;
                option.textContent = `${driver.id} - ${driver.fullName || driver.firstName}`;
                select.appendChild(option);
            });
            if (selectedValue) {
                select.value = selectedValue;
            }
        });

        document.getElementById('admin-driver-notes').value = await fetchData('notes');
        updateLeaderboard();
    } catch (e) {
        console.error("Failed to load admin dashboard:", e);
    }
}

async function addDriver() {
    if (!isAdmin) return;
    const driverId = document.getElementById('add-driver-id').value.trim().toUpperCase();
    const driverName = document.getElementById('add-driver-name').value.trim();

    if (driverId && driverName) {
        try {
            await fetchData('admin/add-driver', 'POST', { driverId, driverName });
            alert('Driver added successfully!');
            document.getElementById('add-driver-id').value = '';
            document.getElementById('add-driver-name').value = '';
            loadAdminDashboard();
        } catch (e) {
            alert('Failed to add driver. ID might already exist.');
        }
    } else {
        alert('Please enter a Driver ID and First Name.');
    }
}

async function removeDriver() {
    if (!isAdmin) return;
    const selectedDriverId = document.getElementById('select-driver-to-manage').value;
    if (selectedDriverId) {
        if (confirm(`Are you sure you want to remove driver ${selectedDriverId}?`)) {
            try {
                await fetchData('admin/remove-driver', 'POST', { driverId: selectedDriverId });
                alert('Driver removed successfully.');
                loadAdminDashboard();
            } catch (e) {
                alert('Failed to remove driver.');
            }
        }
    } else {
        alert('Please select a driver to remove.');
    }
}

async function loadDriverForEdit() {
    if (!isAdmin) return;
    const selectedDriverId = document.getElementById('select-driver-to-manage').value;
    if (selectedDriverId) {
        try {
            const driver = await fetchData(`admin/driver-details?id=${selectedDriverId}`);
            document.getElementById('edit-driver-full-name').value = driver.fullName || '';
            document.getElementById('edit-driver-whatsapp-phone').value = driver.whatsappPhone || '';
            document.getElementById('edit-driver-vehicle-type-color').value = driver.vehicleTypeColor || '';
            document.getElementById('edit-driver-license-plate').value = driver.licensePlate || '';
            document.getElementById('edit-driver-drivers-license-number').value = driver.driversLicenseNumber || '';
            document.getElementById('edit-driver-insurance-number').value = driver.insuranceNumber || '';
        } catch (e) {
            console.error("Failed to load driver for edit:", e);
        }
    }
}

async function updateDriverProfile() {
    if (!isAdmin) return;
    const selectedDriverId = document.getElementById('select-driver-to-manage').value;
    if (!selectedDriverId) {
        alert('Please select a driver to edit.');
        return;
    }
    const updatedProfile = {
        fullName: document.getElementById('edit-driver-full-name').value,
        whatsappPhone: document.getElementById('edit-driver-whatsapp-phone').value,
        vehicleTypeColor: document.getElementById('edit-driver-vehicle-type-color').value,
        licensePlate: document.getElementById('edit-driver-license-plate').value,
        driversLicenseNumber: document.getElementById('edit-driver-drivers-license-number').value,
        insuranceNumber: document.getElementById('edit-driver-insurance-number').value
    };

    try {
        await fetchData('admin/update-profile', 'POST', { driverId: selectedDriverId, profile: updatedProfile });
        alert('Driver profile updated successfully!');
        loadAdminDashboard();
    } catch (e) {
        alert('Failed to update driver profile.');
    }
}

async function loadDriverPicturesForAdmin() {
    if (!isAdmin) return;
    const selectedDriverId = document.getElementById('select-driver-for-pictures').value;
    const pictureUrls = selectedDriverId ? await fetchData(`admin/pictures?id=${selectedDriverId}`) : {};
    
    document.getElementById('preview-driver-picture').src = pictureUrls.driverPictureUrl || '';
    document.getElementById('preview-driver-picture').style.display = pictureUrls.driverPictureUrl ? 'block' : 'none';
    
    document.getElementById('preview-vehicle-picture').src = pictureUrls.vehiclePictureUrl || '';
    document.getElementById('preview-vehicle-picture').style.display = pictureUrls.vehiclePictureUrl ? 'block' : 'none';
    
    document.getElementById('preview-insurance-picture').src = pictureUrls.insurancePictureUrl || '';
    document.getElementById('preview-insurance-picture').style.display = pictureUrls.insurancePictureUrl ? 'block' : 'none';
}

async function uploadPicture(type) {
    if (!isAdmin) return;
    const selectedDriverId = document.getElementById('select-driver-for-pictures').value;
    if (!selectedDriverId) {
        alert('Please select a driver first.');
        return;
    }

    const fileInput = document.getElementById(`upload-${type.toLowerCase().replace('picture','')}-picture`);
    if (!fileInput.files[0]) {
        alert('Please select a file to upload.');
        return;
    }

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    formData.append('driverId', selectedDriverId);
    formData.append('type', type);

    try {
        // Note: fetch with FormData does not require a Content-Type header
        const response = await fetch('/api/admin/upload-picture', {
            method: 'POST',
            body: formData,
        });

        if (response.ok) {
            const { url } = await response.json();
            alert('Picture uploaded successfully!');
            document.getElementById(`preview-${type.toLowerCase().replace('picture','')}-picture`).src = url;
            document.getElementById(`preview-${type.toLowerCase().replace('picture','')}-picture`).style.display = 'block';
        } else {
            alert('Failed to upload picture.');
        }
    } catch (e) {
        console.error("Upload error:", e);
        alert('An error occurred during upload.');
    }
}


async function loadRidesForAdmin() {
    if (!isAdmin) return;
    const selectedDriverId = document.getElementById('select-driver-for-rides').value;
    const ridesTableBody = document.querySelector('#admin-rides-table tbody');
    ridesTableBody.innerHTML = '';
    if (selectedDriverId) {
        try {
            const driver = await fetchData(`admin/driver-details?id=${selectedDriverId}`);
            driver.rides.forEach(ride => {
                const row = ridesTableBody.insertRow();
                row.insertCell().textContent = ride.id;
                row.insertCell().textContent = ride.date || 'N/A';
                row.insertCell().textContent = ride.origin;
                row.insertCell().textContent = ride.destination;
                row.insertCell().textContent = `$${(ride.fare || 0).toFixed(2)}`;
                const actionCell = row.insertCell();
                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Delete';
                deleteButton.onclick = () => removeRideFromDriver(selectedDriverId, ride.id);
                actionCell.appendChild(deleteButton);
            });
        } catch (e) {
            console.error("Failed to load rides for admin:", e);
        }
    }
}

async function addRideToDriver() {
    if (!isAdmin) return;
    const selectedDriverId = document.getElementById('select-driver-for-rides').value;
    const origin = document.getElementById('new-ride-origin').value;
    const destination = document.getElementById('new-ride-destination').value;
    const fare = parseFloat(document.getElementById('new-ride-fare').value);

    if (selectedDriverId && origin && destination && !isNaN(fare)) {
        try {
            await fetchData('admin/add-ride', 'POST', { driverId: selectedDriverId, origin, destination, fare });
            alert('Ride added successfully!');
            document.getElementById('new-ride-origin').value = '';
            document.getElementById('new-ride-destination').value = '';
            document.getElementById('new-ride-fare').value = '';
            loadRidesForAdmin();
            updateLeaderboard();
        } catch (e) {
            alert('Failed to add ride.');
        }
    } else {
        alert('Please fill out all ride details.');
    }
}

async function removeRideFromDriver(driverId, rideId) {
    if (!isAdmin) return;
    if (confirm(`Are you sure you want to delete ride ${rideId} from driver ${driverId}?`)) {
        try {
            await fetchData('admin/remove-ride', 'POST', { driverId, rideId });
            alert('Ride removed successfully!');
            loadRidesForAdmin();
            updateLeaderboard();
        } catch (e) {
            alert('Failed to remove ride.');
        }
    }
}

async function loadCommissionsForAdmin() {
    if (!isAdmin) return;
    const selectedDriverId = document.getElementById('select-driver-for-commissions').value;
    if (selectedDriverId) {
        try {
            const driver = await fetchData(`admin/driver-details?id=${selectedDriverId}`);
            document.getElementById('admin-commission-amount').textContent = `$${(driver.commissionDue || 0).toFixed(2)}`;
            document.getElementById('admin-commission-due-date').textContent = driver.commissionDueDate || 'N/A';
            document.getElementById('set-commission-amount').value = driver.commissionDue || 0;
            document.getElementById('set-commission-due-date').value = driver.commissionDueDate || '';
        } catch (e) {
            console.error("Failed to load commissions for admin:", e);
        }
    } else {
        document.getElementById('admin-commission-amount').textContent = '$0.00';
        document.getElementById('admin-commission-due-date').textContent = 'N/A';
        document.getElementById('set-commission-amount').value = '';
        document.getElementById('set-commission-due-date').value = '';
    }
}

async function setDriverCommission() {
    if (!isAdmin) return;
    const selectedDriverId = document.getElementById('select-driver-for-commissions').value;
    const commissionAmount = parseFloat(document.getElementById('set-commission-amount').value);
    const commissionDueDate = document.getElementById('set-commission-due-date').value;

    if (selectedDriverId && !isNaN(commissionAmount)) {
        try {
            await fetchData('admin/set-commission', 'POST', { driverId: selectedDriverId, commissionAmount, commissionDueDate });
            alert('Commission updated successfully!');
            loadCommissionsForAdmin();
            if (loggedInDriverId === selectedDriverId) {
                loadDriverCommissions();
            }
        } catch (e) {
            alert('Failed to set commission.');
        }
    } else {
        alert('Please select a driver and enter a valid amount.');
    }
}

async function updateDriverNotes() {
    if (!isAdmin) return;
    const notes = document.getElementById('admin-driver-notes').value.trim();
    try {
        await fetchData('admin/update-notes', 'POST', { notes });
        document.getElementById('driver-notes').textContent = notes;
        alert('Driver notes updated!');
    } catch (e) {
        alert('Failed to update driver notes.');
    }
}

async function downloadData() {
    if (!isAdmin) return;
    try {
        const data = await fetchData('admin/download');
        const dataStr = JSON.stringify(data, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `driver_app_data_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        alert('Data downloaded successfully!');
    } catch (e) {
        alert('Failed to download data.');
    }
}

// --- Initial Load ---
document.addEventListener('DOMContentLoaded', () => {
    showSection('login-section');
    updateLeaderboard();
});
/* --- JavaScript Code Ends Here --- */
