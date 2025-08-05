// Worker code starts here

// This is a direct copy of your index.html file, with a script tag at the bottom
const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Driver Dashboard</title>
    <link href="https://fonts.googleapis.com/css2?family=Chewy&display=swap" rel="stylesheet">
    <style>
        /* --- CSS Code Starts Here --- */
        body {
            background-color: #000000; /* Full black background */
            color: #FFFFFF; /* White text for general content */
            font-family: 'Chewy', cursive, sans-serif; /* Chewy font */
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        .container {
            max-width: 1200px;
            margin: 20px auto;
            padding: 20px;
            background-color: #1a1a1a; /* Slightly lighter black for content areas */
            border-radius: 8px;
            box-shadow: 0 0 15px rgba(255, 215, 0, 0.3); /* Gold shadow */
        }

        header {
            text-align: center;
            margin-bottom: 30px;
        }

        .logo-placeholder img {
            max-width: 150px; /* Adjust as needed */
            height: auto;
            margin-bottom: 15px;
        }

        .driver-notes-section {
            background-color: #333333;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
        }

        .driver-notes-section h2 {
            color: #FFD700; /* Gold for headings */
            margin-top: 0;
        }

        .driver-notes-section p {
            font-size: 1.1em;
            line-height: 1.5;
        }

        /* Login and Admin sections */
        #login-section, #admin-login-section {
            text-align: center;
            padding: 50px 20px;
        }

        #login-section input, #admin-login-section input {
            padding: 10px;
            margin: 10px;
            border: 2px solid #FFD700;
            background-color: #000000;
            color: #FFFFFF;
            border-radius: 5px;
            font-family: 'Chewy', cursive, sans-serif;
        }

        #login-section button, #admin-login-section button {
            background-color: #FFD700;
            color: #000000;
            border: none;
            padding: 10px 20px;
            margin: 5px;
            border-radius: 5px;
            cursor: pointer;
            font-family: 'Chewy', cursive, sans-serif;
            font-size: 1.1em;
            transition: background-color 0.3s ease;
        }

        #login-section button:hover, #admin-login-section button:hover {
            background-color: #e0b000;
        }


        nav {
            display: flex;
            justify-content: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #FFD700; /* Gold accent */
            padding-bottom: 10px;
        }

        .nav-button {
            background-color: #333333;
            color: #FFFFFF;
            border: 2px solid #555555;
            padding: 10px 20px;
            margin: 0 10px;
            border-radius: 5px;
            cursor: pointer;
            font-family: 'Chewy', cursive, sans-serif;
            font-size: 1.1em;
            transition: all 0.3s ease;
        }

        .nav-button:hover {
            background-color: #555555;
            border-color: #FFD700;
        }

        .nav-button.active {
            background-color: #FFD700; /* Gold when active */
            color: #000000;
            border-color: #FFD700;
            font-weight: bold;
        }

        .content-section {
            display: none; /* Hidden by default, shown by JavaScript */
        }

        .content-section.active {
            display: block;
        }

        h1, h2, h3 {
            color: #FFD700; /* Gold for main headings */
            text-align: center;
            margin-bottom: 20px;
        }

        .data-summary {
            display: flex;
            justify-content: space-around;
            margin-bottom: 30px;
        }

        .summary-box {
            background-color: #333333;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            flex: 1;
            margin: 0 10px;
            border: 1px solid #555555;
        }

        .summary-box h3 {
            color: #FFFFFF;
            margin-top: 0;
        }

        .summary-box p {
            font-size: 2em;
            font-weight: bold;
            color: #FFD700; /* Gold for values */
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }

        table th, table td {
            border: 1px solid #555555;
            padding: 12px;
            text-align: left;
            color: #FFFFFF;
        }

        table th {
            background-color: #333333;
            color: #FFD700; /* Gold for table headers */
            font-weight: bold;
        }

        table tr:nth-child(even) {
            background-color: #222222;
        }

        table tr:hover {
            background-color: #444444;
        }

        .profile-details p {
            margin-bottom: 10px;
            font-size: 1.1em;
        }

        .profile-details strong {
            color: #FFD700;
        }

        .support-message {
            font-style: italic;
            color: #AAAAAA;
            text-align: center;
            margin-top: 20px;
        }

        /* Leaderboard Styling */
        .leaderboard-chart {
            display: flex;
            flex-direction: column;
            align-items: center;
            margin-top: 30px;
        }

        .place {
            background-color: #333333;
            border: 2px solid #555555;
            border-radius: 10px;
            padding: 15px 25px;
            margin-bottom: 15px;
            width: 80%;
            max-width: 400px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 1.3em;
            font-weight: bold;
        }

        .first-place {
            background-color: #FFD700; /* Gold for 1st place */
            color: #000000;
            border-color: #FFD700;
            font-size: 1.6em;
            padding: 20px 30px;
            box-shadow: 0 0 20px rgba(255, 215, 0, 0.7);
        }

        .second-place {
            background-color: #C0C0C0; /* Silver for 2nd place */
            color: #000000;
            border-color: #C0C0C0;
            font-size: 1.4em;
        }

        .third-place {
            background-color: #CD7F32; /* Bronze for 3rd place */
            color: #000000;
            border-color: #CD7F32;
            font-size: 1.2em;
        }

        .place .rank {
            font-size: 1.2em;
            margin-right: 15px;
            min-width: 40px;
            text-align: center;
        }

        .first-place .rank {
            color: #000000;
        }
        .second-place .rank {
            color: #000000;
        }
        .third-place .rank {
            color: #000000;
        }


        .place .driver-name {
            flex-grow: 1;
            text-align: left;
        }

        .place .rides {
            color: #FFFFFF; /* White for ride count in lower places */
            font-style: italic;
        }
        .first-place .rides {
            color: #000000; /* Black for ride count in first place */
        }

        /* Admin Specific Styling */
        .admin-controls {
            display: flex;
            flex-direction: column;
            gap: 25px;
            margin-top: 30px;
        }

        .admin-section {
            background-color: #2a2a2a;
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #444444;
        }

        .admin-section h2, .admin-section h3 {
            color: #FFD700;
            text-align: left;
            margin-top: 0;
            margin-bottom: 15px;
        }

        .admin-section input[type="text"],
        .admin-section input[type="number"],
        .admin-section input[type="date"],
        .admin-section select,
        .admin-section textarea {
            width: calc(100% - 24px); /* Account for padding */
            padding: 10px;
            margin-bottom: 10px;
            border: 1px solid #FFD700;
            background-color: #000000;
            color: #FFFFFF;
            border-radius: 5px;
            font-family: 'Chewy', cursive, sans-serif;
        }

        .admin-section input[type="file"] {
            width: calc(100% - 2px); /* Account for border */
            padding: 10px 0;
            margin-bottom: 10px;
            color: #FFFFFF;
            font-family: 'Chewy', cursive, sans-serif;
            border: none; /* File input styling is tricky, better to let browser handle */
        }


        .admin-section button {
            background-color: #FFD700;
            color: #000000;
            border: none;
            padding: 10px 15px;
            margin-top: 5px;
            margin-right: 10px;
            border-radius: 5px;
            cursor: pointer;
            font-family: 'Chewy', cursive, sans-serif;
            font-size: 1em;
            transition: background-color 0.3s ease;
        }

        .admin-section button:hover {
            background-color: #e0b000;
        }

        /* Admin table specific */
        #admin-rides-table td button {
            background-color: #ff4d4d; /* Red for delete */
            color: white;
            padding: 5px 10px;
            font-size: 0.9em;
        }

        #admin-rides-table td button:hover {
            background-color: #cc0000;
        }

        /* New Commissions Section Styling */
        .commission-details {
            text-align: center;
            margin-top: 20px;
            padding: 20px;
            background-color: #333333;
            border-radius: 8px;
            border: 1px solid #555555;
        }

        .commission-details p {
            font-size: 1.2em;
            margin-bottom: 15px;
        }

        .commission-details strong {
            color: #FFD700;
        }

        .whatsapp-button {
            display: inline-block;
            background-color: #25D366; /* WhatsApp Green */
            color: white;
            padding: 12px 25px;
            border-radius: 25px;
            text-decoration: none;
            font-family: 'Chewy', cursive, sans-serif;
            font-size: 1.2em;
            transition: background-color 0.3s ease;
            margin-top: 20px;
        }

        .whatsapp-button:hover {
            background-color: #1DA851;
        }

        /* Profile Images */
        .profile-image-container {
            text-align: center;
            margin-bottom: 20px;
        }

        .profile-image-container img {
            width: 192px; /* Fixed size */
            height: 192px; /* Fixed size */
            object-fit: cover; /* Ensures image covers the area without distortion */
            border-radius: 50%; /* Circular for driver picture */
            border: 3px solid #FFD700;
            margin: 10px;
            cursor: pointer; /* Indicates it's clickable */
            transition: transform 0.2s ease-in-out;
        }

        .profile-image-container img.vehicle-image {
            border-radius: 8px; /* Square for vehicle picture */
        }
        .profile-image-container img.insurance-image {
            border-radius: 8px; /* Square for insurance picture */
        }

        .profile-image-container img:hover {
            transform: scale(1.05); /* Slight scale on hover */
        }

        .profile-image-label {
            display: block;
            color: #FFD700;
            font-size: 0.9em;
            margin-top: 5px;
        }

        .admin-image-preview {
            max-width: 150px;
            max-height: 150px;
            border: 1px solid #555;
            margin-top: 10px;
            display: block; /* Ensures it takes its own line */
        }
        /* --- CSS Code Ends Here --- */
    </style>
</head>
<body>
    <div class="container">
        <header>
            <div class="logo-placeholder">
                <img src="your-business-logo.png" alt="Business Logo">
            </div>
            <div class="driver-notes-section">
                <h2>Driver Notes:</h2>
                <p id="driver-notes"></p>
            </div>
        </header>

        <div id="login-section" class="content-section active">
            <h1>Driver Login</h1>
            <input type="text" id="driver-id-input" placeholder="Enter Driver ID">
            <button onclick="loginDriver()">Login</button>
            <button onclick="showAdminLogin()">Admin Login</button>
        </div>

        <div id="admin-login-section" class="content-section">
            <h1>Admin Login</h1>
            <input type="password" id="admin-password-input" placeholder="Enter Admin Password">
            <button onclick="loginAdmin()">Login</button>
            <button onclick="showLogin()">Back to Driver Login</button>
        </div>

        <nav id="driver-nav" style="display: none;">
            <button class="nav-button active" onclick="showSection('rides-earnings', true)">My Rides & Earnings</button>
            <button class="nav-button" onclick="showSection('profile', true)">My Profile</button>
            <button class="nav-button" onclick="showSection('commissions', true)">Commissions</button>
            <button class="nav-button" onclick="showSection('leaderboard', true)">Leaderboard</button> <button class="nav-button" onclick="logout()">Logout</button>
        </nav>

        <nav id="admin-nav" style="display: none;">
            <button class="nav-button active" onclick="showSection('admin-dashboard', true)">Admin Dashboard</button>
            <button class="nav-button" onclick="logout()">Logout</button>
        </nav>

        <main>
            <section id="rides-earnings" class="content-section">
                <h1>My Rides & Earnings</h1>
                <div class="data-summary">
                    <div class="summary-box">
                        <h3>Total Rides</h3>
                        <p id="total-rides">0</p>
                    </div>
                    <div class="summary-box">
                        <h3>Total Earnings</h3>
                        <p id="total-earnings">$0.00</p>
                    </div>
                </div>

                <h2>Recent Rides</h2>
                <table id="rides-table">
                    <thead>
                        <tr>
                            <th>Ride ID</th>
                            <th>Date</th>
                            <th>Origin</th>
                            <th>Destination</th>
                            <th>Fare</th>
                        </tr>
                    </thead>
                    <tbody>
                        </tbody>
                </table>
            </section>

            <section id="profile" class="content-section">
                <h1>My Profile</h1>
                <div class="profile-details">
                    <div class="profile-image-container">
                        <a id="driver-picture-link" href="#" target="_blank" style="display:none;">
                            <img id="profile-driver-picture" src="" alt="Driver Picture">
                        </a>
                        <span id="profile-driver-picture-placeholder" style="display:block;">No Driver Picture</span>
                        <a id="vehicle-picture-link" href="#" target="_blank" style="display:none;">
                            <img id="profile-vehicle-picture" class="vehicle-image" src="" alt="Vehicle Picture">
                        </a>
                        <span id="profile-vehicle-picture-placeholder" style="display:block;">No Vehicle Picture</span>
                        <a id="insurance-picture-link" href="#" target="_blank" style="display:none;">
                            <img id="profile-insurance-picture" class="insurance-image" src="" alt="Insurance Picture">
                        </a>
                        <span id="profile-insurance-picture-placeholder" style="display:block;">No Insurance Picture</span>
                    </div>

                    <p><strong>Full Name:</strong> <span id="profile-full-name"></span></p>
                    <p><strong>Driver ID:</strong> <span id="profile-id"></span></p>
                    <p><strong>WhatsApp Phone:</strong> <span id="profile-whatsapp-phone"></span></p>
                    <p><strong>Vehicle:</strong> <span id="profile-vehicle-type-color"></span></p>
                    <p><strong>License Plate:</strong> <span id="profile-license-plate"></span></p>
                    <p><strong>Driver's License No.:</strong> <span id="profile-drivers-license-number"></span></p>
                    <p><strong>Insurance Number:</strong> <span id="profile-insurance-number"></span></p>
                    <p class="support-message">To update your profile, please contact support.</p>
                </div>
            </section>

            <section id="commissions" class="content-section">
                <h1>My Commissions</h1>
                <div class="commission-details">
                    <p>Current Commission Due: <strong id="commission-amount">$0.00</strong></p>
                    <p>Due Date: <strong id="commission-due-date">N/A</strong></p>
                    <a id="whatsapp-payment-link" class="whatsapp-button" target="_blank">
                        Request to Pay Commission
                    </a>
                    <p class="support-message" style="margin-top:20px;">
                        Commissions are calculated based on your total earnings and are updated by admin.
                    </p>
                </div>
            </section>


            <section id="leaderboard" class="content-section">
                <h1>Top Drivers Leaderboard</h1>
                <div class="leaderboard-chart">
                    <div class="place first-place">
                        <span class="rank">1st</span>
                        <span class="driver-name">N/A</span>
                        <span class="rides">0 rides</span>
                    </div>
                    <div class="place second-place">
                        <span class="rank">2nd</span>
                        <span class="driver-name">N/A</span>
                        <span class="rides">0 rides</span>
                    </div>
                    <div class="place third-place">
                        <span class="rank">3rd</span>
                        <span class="driver-name">N/A</span>
                        <span class="rides">0 rides</span>
                    </div>
                </div>
            </section>

            <section id="admin-dashboard" class="content-section">
                <h1>Admin Dashboard</h1>
                <div class="admin-controls">
                    <div class="admin-section">
                        <h2>Manage Drivers</h2>
                        <input type="text" id="add-driver-id" placeholder="New Driver ID (e.g., D001)">
                        <input type="text" id="add-driver-name" placeholder="Driver First Name">
                        <button onclick="addDriver()">Add Driver</button>
                        <select id="select-driver-to-manage" onchange="loadDriverForEdit()">
                            <option value="">-- Select Driver to Manage --</option>
                        </select>
                        <button onclick="removeDriver()">Remove Selected Driver</button>

                        <h3>Edit Selected Driver Profile</h3>
                        <input type="text" id="edit-driver-full-name" placeholder="Full Name">
                        <input type="text" id="edit-driver-whatsapp-phone" placeholder="WhatsApp Phone">
                        <input type="text" id="edit-driver-vehicle-type-color" placeholder="Vehicle Type & Color">
                        <input type="text" id="edit-driver-license-plate" placeholder="License Plate Number">
                        <input type="text" id="edit-driver-drivers-license-number" placeholder="Driver's License Number">
                        <input type="text" id="edit-driver-insurance-number" placeholder="Insurance Number">
                        <button onclick="updateDriverProfile()">Update Driver Profile</button>
                    </div>

                    <div class="admin-section">
                        <h2>Upload Driver Pictures</h2>
                        <select id="select-driver-for-pictures" onchange="loadDriverPicturesForAdmin()">
                            <option value="">-- Select Driver --</option>
                        </select>
                        <hr style="border-color:#555;">
                        <h3>Driver Picture</h3>
                        <input type="file" id="upload-driver-picture" accept="image/*">
                        <img id="preview-driver-picture" class="admin-image-preview" src="" style="display:none;">
                        <button onclick="uploadPicture('driverPicture')">Upload Driver Picture</button>
                        <hr style="border-color:#555;">
                        <h3>Vehicle Picture</h3>
                        <input type="file" id="upload-vehicle-picture" accept="image/*">
                        <img id="preview-vehicle-picture" class="admin-image-preview" src="" style="display:none;">
                        <button onclick="uploadPicture('vehiclePicture')">Upload Vehicle Picture</button>
                        <hr style="border-color:#555;">
                        <h3>Insurance Picture</h3>
                        <input type="file" id="upload-insurance-picture" accept="image/*">
                        <img id="preview-insurance-picture" class="admin-image-preview" src="" style="display:none;">
                        <button onclick="uploadPicture('insurancePicture')">Upload Insurance Picture</button>
                    </div>


                    <div class="admin-section">
                        <h2>Manage Driver Rides & Earnings</h2>
                        <select id="select-driver-for-rides" onchange="loadRidesForAdmin()">
                            <option value="">-- Select Driver --</option>
                        </select>
                        <p class="support-message" style="margin-top:10px;">
                            (Adding/removing rides here directly impacts the Leaderboard.)
                        </p>
                        <h3>Add New Ride</h3>
                        <input type="text" id="new-ride-origin" placeholder="Origin">
                        <input type="text" id="new-ride-destination" placeholder="Destination">
                        <input type="number" id="new-ride-fare" placeholder="Fare" step="0.01">
                        <button onclick="addRideToDriver()">Add Ride</button>

                        <h3>Current Rides for Selected Driver</h3>
                        <table id="admin-rides-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Date</th>
                                    <th>Origin</th>
                                    <th>Destination</th>
                                    <th>Fare</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                </tbody>
                        </table>
                    </div>

                    <div class="admin-section">
                        <h2>Manage Commissions</h2>
                        <select id="select-driver-for-commissions" onchange="loadCommissionsForAdmin()">
                            <option value="">-- Select Driver --</option>
                        </select>
                        <p>Current Commission Due: <strong id="admin-commission-amount">$0.00</strong></p>
                        <p>Current Due Date: <strong id="admin-commission-due-date">N/A</strong></p>

                        <h3>Set Commission & Due Date</h3>
                        <input type="number" id="set-commission-amount" placeholder="Commission Amount Due" step="0.01">
                        <input type="date" id="set-commission-due-date">
                        <button onclick="setDriverCommission()">Set Commission</button>
                    </div>

                    <div class="admin-section">
                        <h2>General Settings</h2>
                        <h3>Edit Driver Notes</h3>
                        <textarea id="admin-driver-notes" rows="5" placeholder="Enter notes for drivers..."></textarea>
                        <button onclick="updateDriverNotes()">Update Notes</button>

                        <h3>Data Management</h3>
                        <button onclick="downloadData()">Download All Data</button>
                    </div>
                </div>
            </section>
        </main>
    </div>
</body>
</html>
`;


// This is your driver.js file, embedded as a script
const js = `
    let appState = {
        isAdmin: false,
        loggedInDriverId: null,
        drivers: [],
        currentDriverDetails: null,
    };

    function showAdminLogin() {
        showSection('admin-login-section', false);
    }

    function showLogin() {
        showSection('login-section', false);
    }

    async function loginDriver() {
        const driverIdInput = document.getElementById('driver-id-input');
        const driverId = driverIdInput.value;
        if (!driverId) {
            alert('Please enter a Driver ID.');
            return;
        }

        try {
            const response = await fetch(\`/api/login/driver\`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ driverId })
            });

            if (response.ok) {
                const data = await response.json();
                appState.loggedInDriverId = driverId;
                appState.isAdmin = false;
                appState.currentDriverDetails = data;
                updateDriverNotes(data.notes);
                showSection('rides-earnings', false);
                updateDriverNav();
                await fetchDriverData();
            } else {
                alert('Login failed. Driver not found.');
            }
        } catch (error) {
            console.error('Error during driver login:', error);
            alert('An error occurred during login. Please try again.');
        }
    }

    async function loginAdmin() {
        const passwordInput = document.getElementById('admin-password-input');
        const password = passwordInput.value;

        try {
            const response = await fetch(\`/api/login/admin\`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    appState.isAdmin = true;
                    updateDriverNotes(data.notes);
                    showSection('admin-dashboard', false);
                    updateAdminNav();
                    await fetchAdminDrivers();
                } else {
                    alert('Admin login failed. Invalid password.');
                }
            } else {
                alert('Admin login failed. Invalid password.');
            }
        } catch (error) {
            console.error('Error during admin login:', error);
            alert('An error occurred during login. Please try again.');
        }
    }

    function updateDriverNav() {
        document.getElementById('driver-nav').style.display = 'flex';
        document.getElementById('admin-nav').style.display = 'none';
        const loginSection = document.getElementById('login-section');
        const adminLoginSection = document.getElementById('admin-login-section');
        if (loginSection) loginSection.style.display = 'none';
        if (adminLoginSection) adminLoginSection.style.display = 'none';
    }

    function updateAdminNav() {
        document.getElementById('driver-nav').style.display = 'none';
        document.getElementById('admin-nav').style.display = 'flex';
        const loginSection = document.getElementById('login-section');
        const adminLoginSection = document.getElementById('admin-login-section');
        if (loginSection) loginSection.style.display = 'none';
        if (adminLoginSection) adminLoginSection.style.display = 'none';
    }

    function logout() {
        appState.isAdmin = false;
        appState.loggedInDriverId = null;
        appState.currentDriverDetails = null;
        showSection('login-section', false);
        document.getElementById('driver-nav').style.display = 'none';
        document.getElementById('admin-nav').style.display = 'none';
        updateDriverNotes('');
    }

    function showSection(sectionId, updateActiveNav = false) {
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(sectionId).classList.add('active');

        if (updateActiveNav) {
            document.querySelectorAll('.nav-button').forEach(button => {
                button.classList.remove('active');
            });
            const activeNavButton = document.querySelector(\`[onclick="showSection('\${sectionId}', true)"]\`);
            if (activeNavButton) {
                activeNavButton.classList.add('active');
            }
        }

        if (sectionId === 'profile') {
            fetchDriverProfile();
        } else if (sectionId === 'rides-earnings') {
            fetchDriverData();
        } else if (sectionId === 'leaderboard') {
            fetchLeaderboard();
        } else if (sectionId === 'commissions') {
            fetchDriverCommissions();
        } else if (sectionId === 'admin-dashboard') {
            fetchAdminDrivers();
        }
    }

    async function fetchDriverData() {
        if (!appState.loggedInDriverId) return;

        try {
            const response = await fetch(\`/api/driver/data?id=\${appState.loggedInDriverId}\`);
            if (response.ok) {
                const data = await response.json();
                appState.currentDriverDetails = data;
                updateRidesAndEarnings();
            }
        } catch (error) {
            console.error('Error fetching driver data:', error);
        }
    }

    function updateRidesAndEarnings() {
        if (!appState.currentDriverDetails) return;

        const { rides, commissionDue } = appState.currentDriverDetails;
        const totalRides = rides.length;
        const totalEarnings = rides.reduce((sum, ride) => sum + parseFloat(ride.fare), 0);

        document.getElementById('total-rides').textContent = totalRides;
        document.getElementById('total-earnings').textContent = \`$ \${totalEarnings.toFixed(2)}\`;

        const ridesTableBody = document.querySelector('#rides-table tbody');
        ridesTableBody.innerHTML = '';
        rides.forEach(ride => {
            const row = ridesTableBody.insertRow();
            row.innerHTML = \`<td>\${ride.id}</td><td>\${ride.date}</td><td>\${ride.origin}</td><td>\${ride.destination}</td><td>$ \${parseFloat(ride.fare).toFixed(2)}</td>\`;
        });
    }

    async function fetchDriverProfile() {
        if (!appState.loggedInDriverId) return;

        try {
            const response = await fetch(\`/api/driver/profile?id=\${appState.loggedInDriverId}\`);
            if (response.ok) {
                const profile = await response.json();
                document.getElementById('profile-full-name').textContent = profile.fullName;
                document.getElementById('profile-id').textContent = profile.id;
                document.getElementById('profile-whatsapp-phone').textContent = profile.whatsappPhone;
                document.getElementById('profile-vehicle-type-color').textContent = profile.vehicleTypeColor;
                document.getElementById('profile-license-plate').textContent = profile.licensePlate;
                document.getElementById('profile-drivers-license-number').textContent = profile.driversLicenseNumber;
                document.getElementById('profile-insurance-number').textContent = profile.insuranceNumber;

                // Update pictures
                const picturesResponse = await fetch(\`/api/admin/pictures?id=\${appState.loggedInDriverId}\`);
                if (picturesResponse.ok) {
                    const pictures = await picturesResponse.json();
                    setPicture('profile-driver-picture', pictures.driverPictureUrl, 'driver-picture-link');
                    setPicture('profile-vehicle-picture', pictures.vehiclePictureUrl, 'vehicle-picture-link');
                    setPicture('profile-insurance-picture', pictures.insurancePictureUrl, 'insurance-picture-link');
                }
            }
        } catch (error) {
            console.error('Error fetching driver profile:', error);
        }
    }

    function setPicture(imgId, url, linkId) {
        const imgElement = document.getElementById(imgId);
        const linkElement = document.getElementById(linkId);
        const placeholderElement = document.getElementById(\`\${imgId}-placeholder\`);

        if (url && url.trim() !== '') {
            imgElement.src = url;
            linkElement.href = url;
            linkElement.style.display = 'inline-block';
            imgElement.style.display = 'inline-block';
            placeholderElement.style.display = 'none';
        } else {
            imgElement.style.display = 'none';
            linkElement.style.display = 'none';
            placeholderElement.style.display = 'block';
        }
    }


    async function fetchDriverCommissions() {
        if (!appState.loggedInDriverId) return;

        try {
            const response = await fetch(\`/api/driver/commissions?id=\${appState.loggedInDriverId}\`);
            if (response.ok) {
                const data = await response.json();
                document.getElementById('commission-amount').textContent = \`$ \${parseFloat(data.commissionDue).toFixed(2)}\`;
                document.getElementById('commission-due-date').textContent = data.commissionDueDate || 'N/A';
                
                // Construct WhatsApp link
                const whatsappText = encodeURIComponent(\`I am requesting to pay my commission of $ \${parseFloat(data.commissionDue).toFixed(2)}. Please advise.\`);
                document.getElementById('whatsapp-payment-link').href = \`https://wa.me/your-whatsapp-number?text=\${whatsappText}\`;
            }
        } catch (error) {
            console.error('Error fetching driver commissions:', error);
        }
    }

    async function fetchLeaderboard() {
        try {
            const response = await fetch(\`/api/leaderboard\`);
            if (response.ok) {
                const drivers = await response.json();
                const leaderboardElements = document.querySelectorAll('.leaderboard-chart .place');

                leaderboardElements.forEach((el, index) => {
                    if (drivers[index]) {
                        const driver = drivers[index];
                        el.querySelector('.driver-name').textContent = driver.firstName;
                        el.querySelector('.rides').textContent = \`\${driver.rides.length} rides\`;
                    } else {
                        el.querySelector('.driver-name').textContent = 'N/A';
                        el.querySelector('.rides').textContent = '0 rides';
                    }
                });
            }
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
        }
    }

    async function updateDriverNotes(notes) {
        const notesElement = document.getElementById('driver-notes');
        if (notesElement) {
            notesElement.textContent = notes || 'No new notes from admin.';
        }
    }

    // --- Admin Functions ---

    async function fetchAdminDrivers() {
        if (!appState.isAdmin) return;
        try {
            const response = await fetch(\`/api/admin/drivers\`);
            if (response.ok) {
                appState.drivers = await response.json();
                populateDriverSelects();
                fetchDriverNotesForAdmin();
            }
        } catch (error) {
            console.error('Error fetching admin drivers:', error);
        }
    }

    function populateDriverSelects() {
        const selects = document.querySelectorAll('#select-driver-to-manage, #select-driver-for-rides, #select-driver-for-commissions, #select-driver-for-pictures');
        selects.forEach(select => {
            const initialOption = select.querySelector('option[value=""]');
            select.innerHTML = '';
            select.appendChild(initialOption.cloneNode(true));
            appState.drivers.forEach(driver => {
                const option = document.createElement('option');
                option.value = driver.id;
                option.textContent = \`\${driver.id} - \${driver.firstName}\`;
                select.appendChild(option);
            });
        });
    }

    async function addDriver() {
        const driverId = document.getElementById('add-driver-id').value;
        const driverName = document.getElementById('add-driver-name').value;
        if (!driverId || !driverName) {
            alert('Both Driver ID and Name are required.');
            return;
        }

        try {
            const response = await fetch('/api/admin/add-driver', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ driverId, driverName })
            });
            if (response.ok) {
                alert('Driver added successfully!');
                document.getElementById('add-driver-id').value = '';
                document.getElementById('add-driver-name').value = '';
                await fetchAdminDrivers();
            } else {
                const error = await response.json();
                alert(\`Error: \${error.error}\`);
            }
        } catch (error) {
            console.error('Error adding driver:', error);
            alert('An error occurred while adding the driver.');
        }
    }

    async function removeDriver() {
        const driverId = document.getElementById('select-driver-to-manage').value;
        if (!driverId) {
            alert('Please select a driver to remove.');
            return;
        }

        if (confirm(\`Are you sure you want to remove driver \${driverId}?\`)) {
            try {
                const response = await fetch('/api/admin/remove-driver', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ driverId })
                });
                if (response.ok) {
                    alert('Driver removed successfully!');
                    await fetchAdminDrivers();
                } else {
                    alert('Error removing driver.');
                }
            } catch (error) {
                console.error('Error removing driver:', error);
                alert('An error occurred while removing the driver.');
            }
        }
    }

    async function loadDriverForEdit() {
        const driverId = document.getElementById('select-driver-to-manage').value;
        if (!driverId) {
            document.getElementById('edit-driver-full-name').value = '';
            document.getElementById('edit-driver-whatsapp-phone').value = '';
            document.getElementById('edit-driver-vehicle-type-color').value = '';
            document.getElementById('edit-driver-license-plate').value = '';
            document.getElementById('edit-driver-drivers-license-number').value = '';
            document.getElementById('edit-driver-insurance-number').value = '';
            return;
        }

        const driver = appState.drivers.find(d => d.id === driverId);
        if (driver) {
            document.getElementById('edit-driver-full-name').value = driver.fullName || '';
            document.getElementById('edit-driver-whatsapp-phone').value = driver.whatsappPhone || '';
            document.getElementById('edit-driver-vehicle-type-color').value = driver.vehicleTypeColor || '';
            document.getElementById('edit-driver-license-plate').value = driver.licensePlate || '';
            document.getElementById('edit-driver-drivers-license-number').value = driver.driversLicenseNumber || '';
            document.getElementById('edit-driver-insurance-number').value = driver.insuranceNumber || '';
        }
    }

    async function updateDriverProfile() {
        const driverId = document.getElementById('select-driver-to-manage').value;
        if (!driverId) {
            alert('Please select a driver to update.');
            return;
        }

        const profile = {
            fullName: document.getElementById('edit-driver-full-name').value,
            whatsappPhone: document.getElementById('edit-driver-whatsapp-phone').value,
            vehicleTypeColor: document.getElementById('edit-driver-vehicle-type-color').value,
            licensePlate: document.getElementById('edit-driver-license-plate').value,
            driversLicenseNumber: document.getElementById('edit-driver-drivers-license-number').value,
            insuranceNumber: document.getElementById('edit-driver-insurance-number').value,
        };

        try {
            const response = await fetch('/api/admin/update-profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ driverId, profile })
            });
            if (response.ok) {
                alert('Driver profile updated successfully!');
                await fetchAdminDrivers();
            } else {
                alert('Error updating driver profile.');
            }
        } catch (error) {
            console.error('Error updating driver profile:', error);
            alert('An error occurred while updating the profile.');
        }
    }
    
    async function loadDriverPicturesForAdmin() {
        const driverId = document.getElementById('select-driver-for-pictures').value;
        if (!driverId) {
            hidePicturePreview('preview-driver-picture');
            hidePicturePreview('preview-vehicle-picture');
            hidePicturePreview('preview-insurance-picture');
            return;
        }

        try {
            const response = await fetch(\`/api/admin/pictures?id=\${driverId}\`);
            if (response.ok) {
                const pictures = await response.json();
                showPicturePreview('preview-driver-picture', pictures.driverPictureUrl);
                showPicturePreview('preview-vehicle-picture', pictures.vehiclePictureUrl);
                showPicturePreview('preview-insurance-picture', pictures.insurancePictureUrl);
            }
        } catch (error) {
            console.error('Error fetching pictures for admin:', error);
        }
    }

    function showPicturePreview(imgId, url) {
        const imgElement = document.getElementById(imgId);
        if (url && url.trim() !== '') {
            imgElement.src = url;
            imgElement.style.display = 'block';
        } else {
            imgElement.style.display = 'none';
        }
    }

    function hidePicturePreview(imgId) {
        const imgElement = document.getElementById(imgId);
        imgElement.style.display = 'none';
        imgElement.src = '';
    }

    async function uploadPicture(type) {
        const driverId = document.getElementById('select-driver-for-pictures').value;
        if (!driverId) {
            alert('Please select a driver first.');
            return;
        }
        
        let fileInput;
        if (type === 'driverPicture') fileInput = document.getElementById('upload-driver-picture');
        else if (type === 'vehiclePicture') fileInput = document.getElementById('upload-vehicle-picture');
        else if (type === 'insurancePicture') fileInput = document.getElementById('upload-insurance-picture');
        
        if (!fileInput.files[0]) {
            alert('Please select a file to upload.');
            return;
        }
        
        const formData = new FormData();
        formData.append('file', fileInput.files[0]);
        formData.append('driverId', driverId);
        formData.append('type', type);

        try {
            const response = await fetch('/api/admin/upload-picture', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const data = await response.json();
                alert(\`\${type} uploaded successfully!\`);
                showPicturePreview(\`preview-\${type}\`, data.url);
            } else {
                alert('Error uploading picture.');
            }
        } catch (error) {
            console.error('Error uploading picture:', error);
            alert('An error occurred during upload.');
        }
    }


    async function loadRidesForAdmin() {
        const driverId = document.getElementById('select-driver-for-rides').value;
        const ridesTableBody = document.querySelector('#admin-rides-table tbody');
        ridesTableBody.innerHTML = '';

        if (!driverId) return;

        const driver = appState.drivers.find(d => d.id === driverId);
        if (driver && driver.rides) {
            driver.rides.forEach(ride => {
                const row = ridesTableBody.insertRow();
                row.innerHTML = \`<td>\${ride.id}</td><td>\${ride.date}</td><td>\${ride.origin}</td><td>\${ride.destination}</td><td>$ \${parseFloat(ride.fare).toFixed(2)}</td><td><button onclick="removeRide('\${driverId}', '\${ride.id}')">Remove</button></td>\`;
            });
        }
    }

    async function addRideToDriver() {
        const driverId = document.getElementById('select-driver-for-rides').value;
        const origin = document.getElementById('new-ride-origin').value;
        const destination = document.getElementById('new-ride-destination').value;
        const fare = parseFloat(document.getElementById('new-ride-fare').value);

        if (!driverId || !origin || !destination || isNaN(fare)) {
            alert('All fields are required and fare must be a number.');
            return;
        }

        try {
            const response = await fetch('/api/admin/add-ride', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ driverId, origin, destination, fare })
            });
            if (response.ok) {
                alert('Ride added successfully!');
                document.getElementById('new-ride-origin').value = '';
                document.getElementById('new-ride-destination').value = '';
                document.getElementById('new-ride-fare').value = '';
                await fetchAdminDrivers();
                loadRidesForAdmin();
            } else {
                alert('Error adding ride.');
            }
        } catch (error) {
            console.error('Error adding ride:', error);
        }
    }

    async function removeRide(driverId, rideId) {
        if (confirm(\`Are you sure you want to remove ride \${rideId} from driver \${driverId}?\`)) {
            try {
                const response = await fetch('/api/admin/remove-ride', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ driverId, rideId })
                });
                if (response.ok) {
                    alert('Ride removed successfully!');
                    await fetchAdminDrivers();
                    loadRidesForAdmin();
                } else {
                    alert('Error removing ride.');
                }
            } catch (error) {
                console.error('Error removing ride:', error);
            }
        }
    }

    async function loadCommissionsForAdmin() {
        const driverId = document.getElementById('select-driver-for-commissions').value;
        const commissionAmountElement = document.getElementById('admin-commission-amount');
        const commissionDueDateElement = document.getElementById('admin-commission-due-date');
        commissionAmountElement.textContent = '$0.00';
        commissionDueDateElement.textContent = 'N/A';

        if (!driverId) return;

        const driver = appState.drivers.find(d => d.id === driverId);
        if (driver) {
            commissionAmountElement.textContent = \`$ \${parseFloat(driver.commissionDue || 0).toFixed(2)}\`;
            commissionDueDateElement.textContent = driver.commissionDueDate || 'N/A';
            document.getElementById('set-commission-amount').value = driver.commissionDue || '';
            document.getElementById('set-commission-due-date').value = driver.commissionDueDate || '';
        }
    }

    async function setDriverCommission() {
        const driverId = document.getElementById('select-driver-for-commissions').value;
        const commissionAmount = document.getElementById('set-commission-amount').value;
        const commissionDueDate = document.getElementById('set-commission-due-date').value;

        if (!driverId || !commissionAmount || !commissionDueDate) {
            alert('All fields are required.');
            return;
        }
        
        if (isNaN(parseFloat(commissionAmount))) {
            alert('Commission amount must be a number.');
            return;
        }

        try {
            const response = await fetch('/api/admin/set-commission', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ driverId, commissionAmount, commissionDueDate })
            });
            if (response.ok) {
                alert('Commission set successfully!');
                await fetchAdminDrivers();
                loadCommissionsForAdmin();
            } else {
                alert('Error setting commission.');
            }
        } catch (error) {
            console.error('Error setting commission:', error);
        }
    }

    async function fetchDriverNotesForAdmin() {
        try {
            const response = await fetch(\`/api/login/admin\`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: 'YOUR_ADMIN_PASSWORD_HERE' }) // This is for local testing, not for production
            });
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    document.getElementById('admin-driver-notes').value = data.notes;
                }
            }
        } catch (error) {
            console.error('Error fetching driver notes:', error);
        }
    }

    async function updateDriverNotes() {
        const notes = document.getElementById('admin-driver-notes').value;
        try {
            const response = await fetch('/api/admin/update-notes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notes })
            });
            if (response.ok) {
                alert('Driver notes updated successfully!');
                updateDriverNotes(notes);
            } else {
                alert('Error updating notes.');
            }
        } catch (error) {
            console.error('Error updating notes:', error);
        }
    }

    async function downloadData() {
        try {
            const response = await fetch('/api/admin/download');
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = \`driver_app_data_\${new Date().toISOString().split('T')[0]}.json\`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                alert('Data download initiated!');
            } else {
                alert('Error downloading data.');
            }
        } catch (error) {
            console.error('Error downloading data:', error);
        }
    }
`;

// This is the worker's fetch handler. It responds to all requests.
// It combines the HTML and JS into a single response.
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  
  // Handle API endpoints
  if (url.pathname.startsWith('/api/')) {
    const { env } = self;
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
                'Content-Disposition': `attachment; filename="driver_app_data_\${new Date().toISOString().split('T')[0]}.json"`,
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

  // Handle serving the single-page HTML
  return new Response(html.replace('</body>', \`<script>\${js}</script></body>\`), {
    headers: {
      'Content-Type': 'text/html',
    },
  });
}
