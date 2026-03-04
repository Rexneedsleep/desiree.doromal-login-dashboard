// Data Storage
let records = JSON.parse(localStorage.getItem('records')) || [];
let currentEditingId = null;
const RECORDS_PER_PAGE = 5;
let currentPage = 1;

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', function() {
    if (!localStorage.getItem('currentUser')) {
        window.location.href = 'index.html';
    }
    
    loadUserInfo();
    setupMenuLinks();
    loadRecords();
    updateDashboard();
});

// Load User Information
function loadUserInfo() {
    const currentUser = localStorage.getItem('currentUser');
    const users = JSON.parse(localStorage.getItem('users')) || {};
    
    if (users[currentUser]) {
        const user = users[currentUser];
        const initial = user.name.charAt(0).toUpperCase();
        
        document.getElementById('userName').textContent = user.name;
        document.getElementById('userInitial').textContent = initial;
        
        // Profile Info
        document.getElementById('profileUsername').textContent = currentUser;
        document.getElementById('profileName').textContent = user.name;
        document.getElementById('profileEmail').textContent = user.email;
        document.getElementById('profileDate').textContent = new Date().toLocaleDateString();
    }
}

// Setup Menu Navigation
function setupMenuLinks() {
    const menuLinks = document.querySelectorAll('.menu-link');
    
    menuLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all links
            menuLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            // Hide all sections
            document.querySelectorAll('.content-section').forEach(section => {
                section.classList.remove('active');
            });
            
            // Show selected section
            const pageId = this.getAttribute('data-page');
            const pageElement = document.getElementById(pageId);
            if (pageElement) {
                pageElement.classList.add('active');
                
                // Update page title
                const titles = {
                    'overview': 'Dashboard Overview',
                    'data-entry': 'Data Entry / Management',
                    'records': 'Records List',
                    'profile': 'My Profile',
                    'settings': 'Settings'
                };
                
                document.getElementById('pageTitle').textContent = titles[pageId] || 'Dashboard';
            }
        });
    });
}

// Update Dashboard Cards
function updateDashboard() {
    document.getElementById('totalRecords').textContent = records.length;
}

// Load Records from LocalStorage
function loadRecords() {
    const tableBody = document.getElementById('recordsTable');
    tableBody.innerHTML = '';
    
    if (records.length === 0) {
        tableBody.innerHTML = '<tr id="emptyRow"><td colspan="7" style="text-align: center; padding: 30px; color: #999;">No records found. Start by adding a new record.</td></tr>';
        document.getElementById('pagination').innerHTML = '';
        return;
    }
    
    // Remove empty row if it exists
    const emptyRow = document.getElementById('emptyRow');
    if (emptyRow) {
        emptyRow.remove();
    }
    
    // Pagination
    const totalPages = Math.ceil(records.length / RECORDS_PER_PAGE);
    const startIndex = (currentPage - 1) * RECORDS_PER_PAGE;
    const endIndex = startIndex + RECORDS_PER_PAGE;
    const pageRecords = records.slice(startIndex, endIndex);
    
    pageRecords.forEach((record, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${record.id}</td>
            <td>${record.name}</td>
            <td>${record.email}</td>
            <td>${record.phone || '-'}</td>
            <td>${record.department || '-'}</td>
            <td>${record.dateAdded}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-info" onclick="viewDetails(${record.id})">View</button>
                    <button class="btn-secondary" onclick="openEditModal(${record.id})">Edit</button>
                    <button class="btn-danger" onclick="deleteRecordById(${record.id})">Delete</button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });
    
    // Setup Pagination
    setupPagination(totalPages);
}

// Setup Pagination
function setupPagination(totalPages) {
    const paginationDiv = document.getElementById('pagination');
    paginationDiv.innerHTML = '';
    
    if (totalPages <= 1) return;
    
    // Previous button
    if (currentPage > 1) {
        const prevBtn = document.createElement('button');
        prevBtn.textContent = 'Previous';
        prevBtn.onclick = () => {
            currentPage--;
            loadRecords();
        };
        paginationDiv.appendChild(prevBtn);
    }
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.textContent = i;
        if (i === currentPage) {
            btn.classList.add('active');
        }
        btn.onclick = () => {
            currentPage = i;
            loadRecords();
        };
        paginationDiv.appendChild(btn);
    }
    
    // Next button
    if (currentPage < totalPages) {
        const nextBtn = document.createElement('button');
        nextBtn.textContent = 'Next';
        nextBtn.onclick = () => {
            currentPage++;
            loadRecords();
        };
        paginationDiv.appendChild(nextBtn);
    }
}

// Add New Record
function addRecord() {
    const name = document.getElementById('fullName').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const department = document.getElementById('department').value;
    const notes = document.getElementById('notes').value;
    
    if (!name || !email) {
        showMessage('dataEntryMessage', 'Please fill in Name and Email fields', 'error');
        return;
    }
    
    const newRecord = {
        id: records.length > 0 ? Math.max(...records.map(r => r.id)) + 1 : 1,
        name: name,
        email: email,
        phone: phone,
        department: department,
        notes: notes,
        dateAdded: new Date().toISOString().split('T')[0]
    };
    
    records.push(newRecord);
    saveRecords();
    clearForm();
    
    showMessage('dataEntryMessage', 'Record added successfully!', 'success');
    updateDashboard();
    
    setTimeout(() => {
        document.getElementById('dataEntryMessage').style.display = 'none';
    }, 3000);
}

// Clear Form
function clearForm() {
    document.getElementById('fullName').value = '';
    document.getElementById('email').value = '';
    document.getElementById('phone').value = '';
    document.getElementById('department').value = '';
    document.getElementById('notes').value = '';
}

// Filter Table
function filterTable() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const tableBody = document.getElementById('recordsTable');
    const rows = tableBody.getElementsByTagName('tr');
    
    Array.from(rows).forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

// View Record Details
function viewDetails(id) {
    const record = records.find(r => r.id === id);
    
    if (!record) return;
    
    const modal = document.getElementById('detailsModal');
    const modalBody = document.getElementById('modalBody');
    
    currentEditingId = id;
    
    modalBody.innerHTML = `
        <div class="details-grid">
            <div class="detail-item">
                <label>ID</label>
                <value>${record.id}</value>
            </div>
            <div class="detail-item">
                <label>Full Name</label>
                <value>${record.name}</value>
            </div>
            <div class="detail-item">
                <label>Email</label>
                <value>${record.email}</value>
            </div>
            <div class="detail-item">
                <label>Phone</label>
                <value>${record.phone || '-'}</value>
            </div>
            <div class="detail-item">
                <label>Department</label>
                <value>${record.department || '-'}</value>
            </div>
            <div class="detail-item">
                <label>Date Added</label>
                <value>${record.dateAdded}</value>
            </div>
        </div>
        <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 15px;">
            <label style="display: block; color: #999; font-size: 12px; text-transform: uppercase; margin-bottom: 10px;">Notes</label>
            <p style="color: #333;">${record.notes || 'No notes added'}</p>
        </div>
    `;
    
    modal.classList.add('active');
}

// Open Edit Modal
function openEditModal(id) {
    const record = records.find(r => r.id === id);
    
    if (!record) return;
    
    currentEditingId = id;
    
    document.getElementById('editModalTitle').textContent = 'Edit Record';
    document.getElementById('editFullName').value = record.name;
    document.getElementById('editEmail').value = record.email;
    document.getElementById('editPhone').value = record.phone || '';
    document.getElementById('editDepartment').value = record.department || '';
    document.getElementById('editNotes').value = record.notes || '';
    
    document.getElementById('detailsModal').classList.remove('active');
    document.getElementById('editModal').classList.add('active');
}

// Open Add Modal
function openAddModal() {
    currentEditingId = null;
    document.getElementById('editModalTitle').textContent = 'Add New Record';
    document.getElementById('editFullName').value = '';
    document.getElementById('editEmail').value = '';
    document.getElementById('editPhone').value = '';
    document.getElementById('editDepartment').value = '';
    document.getElementById('editNotes').value = '';
    
    document.getElementById('editModal').classList.add('active');
}

// Save Edited Record
function saveEditRecord() {
    const name = document.getElementById('editFullName').value;
    const email = document.getElementById('editEmail').value;
    const phone = document.getElementById('editPhone').value;
    const department = document.getElementById('editDepartment').value;
    const notes = document.getElementById('editNotes').value;
    
    if (!name || !email) {
        alert('Please fill in Name and Email fields');
        return;
    }
    
    if (currentEditingId === null) {
        // Adding new record
        const newRecord = {
            id: records.length > 0 ? Math.max(...records.map(r => r.id)) + 1 : 1,
            name: name,
            email: email,
            phone: phone,
            department: department,
            notes: notes,
            dateAdded: new Date().toISOString().split('T')[0]
        };
        records.push(newRecord);
    } else {
        // Editing existing record
        const record = records.find(r => r.id === currentEditingId);
        if (record) {
            record.name = name;
            record.email = email;
            record.phone = phone;
            record.department = department;
            record.notes = notes;
        }
    }
    
    saveRecords();
    loadRecords();
    updateDashboard();
    closeEditModal();
}

// Delete Record by ID
function deleteRecordById(id) {
    if (confirm('Are you sure you want to delete this record?')) {
        records = records.filter(r => r.id !== id);
        saveRecords();
        loadRecords();
        updateDashboard();
    }
}

// Delete Record from Modal
function deleteRecord() {
    if (currentEditingId !== null) {
        if (confirm('Are you sure you want to delete this record?')) {
            deleteRecordById(currentEditingId);
            closeModal();
        }
    }
}

// Edit Record from Modal
function editRecord() {
    if (currentEditingId !== null) {
        openEditModal(currentEditingId);
    }
}

// Close Modal
function closeModal() {
    document.getElementById('detailsModal').classList.remove('active');
    currentEditingId = null;
}

// Close Edit Modal
function closeEditModal() {
    document.getElementById('editModal').classList.remove('active');
    currentEditingId = null;
}

// Save Records to LocalStorage
function saveRecords() {
    localStorage.setItem('records', JSON.stringify(records));
}

// Change Password
function changePassword() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (!currentPassword || !newPassword || !confirmPassword) {
        alert('Please fill in all password fields');
        return;
    }
    
    const currentUser = localStorage.getItem('currentUser');
    const users = JSON.parse(localStorage.getItem('users')) || {};
    
    if (users[currentUser] && users[currentUser].password === currentPassword) {
        if (newPassword === confirmPassword) {
            users[currentUser].password = newPassword;
            localStorage.setItem('users', JSON.stringify(users));
            alert('Password changed successfully!');
            document.getElementById('currentPassword').value = '';
            document.getElementById('newPassword').value = '';
            document.getElementById('confirmPassword').value = '';
        } else {
            alert('New passwords do not match');
        }
    } else {
        alert('Current password is incorrect');
    }
}

// Save Settings
function saveSettings() {
    const settings = {
        emailNotifications: document.getElementById('emailNotifications').checked,
        smsNotifications: document.getElementById('smsNotifications').checked,
        darkMode: document.getElementById('darkMode').checked
    };
    
    localStorage.setItem('appSettings', JSON.stringify(settings));
    alert('Settings saved successfully!');
}

// Export Data
function exportData() {
    const data = {
        records: records,
        exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    
    link.href = url;
    link.download = `records_export_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
}

// Clear All Data
function clearAllData() {
    if (confirm('Are you sure you want to delete all records? This action cannot be undone.')) {
        records = [];
        saveRecords();
        loadRecords();
        updateDashboard();
        alert('All records have been deleted.');
    }
}

// Logout
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    }
}

// Show Message
function showMessage(elementId, message, type) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.className = `message ${type}`;
        element.style.display = 'block';
    }
}

// Sample data initialization
function initializeSampleData() {
    if (records.length === 0) {
        const sampleRecords = [
            {
                id: 1,
                name: 'desiree doromal',
                email: 'desiree.doromal@example.com',
                phone: '(555) 987-6543',
                department: 'Sales',
                notes: 'BSIT 3rd Year Student ',
                dateAdded: '2026-04-03'

            },
            {
                id: 2,
                name: 'Rex Espina Jr.',
                email: 'Rex.espina@example.com',
                phone: '(555) 123-4567',
                department: 'Marketing',
                notes: 'ALL ARROUND',
                dateAdded: '2026-04-03'
            },
            {
                id: 3,
                name: 'danilo palomes',
                email: 'danilo.palomes@example.com',
                phone: '(555) 234-5678',
                department: 'Development',
                notes: 'Senior developer with 5+ years experience',
                dateAdded: '2026-04-03'
            },
            {
                id: 4,
                name: 'Sev jiru Usero',
                email: 'sev.usero@example.com',
                phone: '(555) 345-6789',
                department: 'HR',
                notes: 'HR Manager overseeing recruitment',
                dateAdded: '2026-04-03'
            }
        ];
        records = sampleRecords;
        saveRecords();
    }
}

// Load settings on page load
function loadSettings() {
    const settings = JSON.parse(localStorage.getItem('appSettings')) || {
        emailNotifications: true,
        smsNotifications: false,
        darkMode: false
    };
    
    document.getElementById('emailNotifications').checked = settings.emailNotifications;
    document.getElementById('smsNotifications').checked = settings.smsNotifications;
    document.getElementById('darkMode').checked = settings.darkMode;
}

// Initialize sample data on first load
initializeSampleData();
loadSettings();

// Dashboard Details Functions
function viewPendingTasks() {
    const modal = document.getElementById('dashboardModal');
    const modalTitle = document.getElementById('dashboardModalTitle');
    const modalBody = document.getElementById('dashboardModalBody');
    
    modalTitle.textContent = 'Pending Tasks';
    
    const pendingTasks = [
        { id: 1, title: 'Review Sales Report', dueDate: '2026-03-10', priority: 'High', assignee: 'Desiree Doromal' },
        { id: 2, title: 'Update Customer Database', dueDate: '2026-03-12', priority: 'Medium', assignee: 'Rex Espina Jr.' },
        { id: 3, title: 'Prepare Marketing Materials', dueDate: '2026-03-15', priority: 'Medium', assignee: 'Danilo Palomes' },
        { id: 4, title: 'Schedule Team Meeting', dueDate: '2026-03-11', priority: 'High', assignee: 'Sev Jiru Usero' },
        { id: 5, title: 'Process Invoices', dueDate: '2026-03-13', priority: 'Low', assignee: 'Desiree Doromal' }
    ];
    
    let html = '<table style="width: 100%; border-collapse: collapse;">';
    html += '<thead><tr style="background: #f0f0f0;"><th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Task</th><th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Due Date</th><th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Priority</th><th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Assignee</th></tr></thead>';
    html += '<tbody>';
    
    pendingTasks.forEach(task => {
        const priorityColor = task.priority === 'High' ? '#e74c3c' : task.priority === 'Medium' ? '#f39c12' : '#27ae60';
        html += `<tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 10px;">${task.title}</td>
            <td style="padding: 10px;">${task.dueDate}</td>
            <td style="padding: 10px;"><span style="background: ${priorityColor}; color: white; padding: 4px 8px; border-radius: 3px; font-size: 12px;">${task.priority}</span></td>
            <td style="padding: 10px;">${task.assignee}</td>
        </tr>`;
    });
    
    html += '</tbody></table>';
    modalBody.innerHTML = html;
    modal.classList.add('active');
}

function viewCompletedTasks() {
    const modal = document.getElementById('dashboardModal');
    const modalTitle = document.getElementById('dashboardModalTitle');
    const modalBody = document.getElementById('dashboardModalBody');
    
    modalTitle.textContent = 'Completed Tasks';
    
    const completedTasks = [
        { id: 1, title: 'Q1 Financial Report', completedDate: '2026-03-01', completedBy: 'Desiree Doromal' },
        { id: 2, title: 'Website Redesign', completedDate: '2026-02-28', completedBy: 'Danilo Palomes' },
        { id: 3, title: 'Client Presentation', completedDate: '2026-02-25', completedBy: 'Rex Espina Jr.' },
        { id: 4, title: 'System Upgrade', completedDate: '2026-02-24', completedBy: 'Danilo Palomes' },
        { id: 5, title: 'HR Documentation', completedDate: '2026-02-22', completedBy: 'Sev Jiru Usero' },
        { id: 6, title: 'Budget Planning', completedDate: '2026-02-20', completedBy: 'Desiree Doromal' },
        { id: 7, title: 'Training Program', completedDate: '2026-02-18', completedBy: 'Sev Jiru Usero' },
        { id: 8, title: 'Market Analysis', completedDate: '2026-02-15', completedBy: 'Rex Espina Jr.' },
        { id: 9, title: 'Database Migration', completedDate: '2026-02-14', completedBy: 'Danilo Palomes' },
        { id: 10, title: 'Email Campaign', completedDate: '2026-02-12', completedBy: 'Rex Espina Jr.' },
        { id: 11, title: 'Security Audit', completedDate: '2026-02-10', completedBy: 'Danilo Palomes' },
        { id: 12, title: 'Annual Review', completedDate: '2026-02-08', completedBy: 'Sev Jiru Usero' }
    ];
    
    let html = '<table style="width: 100%; border-collapse: collapse;">';
    html += '<thead><tr style="background: #f0f0f0;"><th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Task</th><th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Completed Date</th><th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Completed By</th></tr></thead>';
    html += '<tbody>';
    
    completedTasks.forEach(task => {
        html += `<tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 10px;">${task.title}</td>
            <td style="padding: 10px;">${task.completedDate}</td>
            <td style="padding: 10px;">${task.completedBy}</td>
        </tr>`;
    });
    
    html += '</tbody></table>';
    modalBody.innerHTML = html;
    modal.classList.add('active');
}

function viewActiveUsers() {
    const modal = document.getElementById('dashboardModal');
    const modalTitle = document.getElementById('dashboardModalTitle');
    const modalBody = document.getElementById('dashboardModalBody');
    
    modalTitle.textContent = 'Active Users';
    
    const activeUsers = [
        { name: 'Desiree Doromal', email: 'desiree.doromal@example.com', status: 'Online', lastActive: 'Now' },
        { name: 'Rex Espina Jr.', email: 'rex.espina@example.com', status: 'Online', lastActive: 'Now' },
        { name: 'Danilo Palomes', email: 'danilo.palomes@example.com', status: 'Online', lastActive: 'Now' }
    ];
    
    let html = '<table style="width: 100%; border-collapse: collapse;">';
    html += '<thead><tr style="background: #f0f0f0;"><th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Name</th><th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Email</th><th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Status</th><th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Last Active</th></tr></thead>';
    html += '<tbody>';
    
    activeUsers.forEach(user => {
        html += `<tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 10px;"><strong>${user.name}</strong></td>
            <td style="padding: 10px;">${user.email}</td>
            <td style="padding: 10px;"><span style="background: #27ae60; color: white; padding: 4px 8px; border-radius: 3px; font-size: 12px;">● ${user.status}</span></td>
            <td style="padding: 10px;">${user.lastActive}</td>
        </tr>`;
    });
    
    html += '</tbody></table>';
    modalBody.innerHTML = html;
    modal.classList.add('active');
}

function viewRecordsDetail() {
    // Navigate to records section
    const recordsMenu = document.querySelector('[data-page="records"]');
    if (recordsMenu) {
        recordsMenu.click();
    }
}

function closeDashboardModal() {
    document.getElementById('dashboardModal').classList.remove('active');
}
