document.addEventListener('DOMContentLoaded', function() {
    // Check if user is admin
    checkAdminAccess();
    
    // Set up event listeners
    setupEventListeners();
    
    // Load users
    loadUsers();
});

// Check admin access
function checkAdminAccess() {
    const auth = authStorage.getAuth();
    if (!auth || !auth.token || auth.role !== 'ADMIN') {
        window.location.href = 'login.html';
    }
}

// Set up event listeners
function setupEventListeners() {
    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', function(e) {
        e.preventDefault();
        authStorage.clearAuth();
        window.location.href = 'login.html';
    });
    
    // Search button
    document.getElementById('searchBtn').addEventListener('click', function() {
        const searchQuery = document.getElementById('userSearch').value.trim();
        loadUsers(searchQuery);
    });
    
    // Enter key in search field
    document.getElementById('userSearch').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            document.getElementById('searchBtn').click();
        }
    });
    
    // Modal close buttons
    document.querySelectorAll('.close, .close-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            closeAllModals();
        });
    });
    
    // Close modals when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            closeAllModals();
        }
    });
}

// Close all modals
function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
}

// Load users list
function loadUsers(searchTerm = '') {
    const tableBody = document.querySelector('#usersTable tbody');
    tableBody.innerHTML = `
        <tr>
            <td colspan="6" class="text-center">
                <div class="loading-indicator">
                    <i class="fas fa-spinner fa-spin"></i> Loading users...
                </div>
            </td>
        </tr>
    `;
    
    adminApi.getAllUsers(0, 100, searchTerm)
        .then(response => {
            // Get the users array, depending on the response format
            let users = [];
            if (Array.isArray(response)) {
                users = response;
            } else if (response.content) {
                users = response.content;
            } else if (response.users) {
                users = response.users;
            }
            
            // Store users globally for filtering
            window.allUsers = users;
            
            // Display the users
            displayUsers(users, searchTerm);
        })
        .catch(error => {
            console.error('Error loading users:', error);
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center">
                        <div class="empty-state">
                            <i class="fas fa-exclamation-circle"></i>
                            <p>Error loading users: ${error.message}</p>
                        </div>
                    </td>
                </tr>
            `;
            showNotification('Failed to load users: ' + error.message, 'error');
        });
}

// Display users in the table
function displayUsers(users, searchTerm = '') {
    const tableBody = document.querySelector('#usersTable tbody');
    
    if (!users || users.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">
                    <div class="empty-state">
                        <i class="fas fa-users-slash"></i>
                        <p>No users found${searchTerm ? ' matching your search' : ''}.</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tableBody.innerHTML = '';
    
    users.forEach(user => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${user.id}</td>
            <td>${user.username}</td>
            <td>${user.email}</td>
            <td>${user.studentId || 'N/A'}</td>
            <td>
                <span class="status-badge ${user.enabled ? 'status-active' : 'status-locked'}">
                    ${user.enabled ? 'Active' : 'Locked'}
                </span>
            </td>
            <td>
                <div class="btn-group">
                    <button class="btn btn-sm btn-primary view-btn" data-id="${user.id}">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="btn btn-sm ${user.enabled ? 'btn-warning' : 'btn-success'} lock-btn" data-id="${user.id}" data-enabled="${user.enabled}">
                        <i class="fas fa-${user.enabled ? 'lock' : 'unlock'}"></i> ${user.enabled ? 'Lock' : 'Unlock'}
                    </button>
                    <button class="btn btn-sm btn-danger delete-btn" data-id="${user.id}">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Add event listeners to action buttons
    attachActionButtonListeners();
}

// Attach event listeners to table action buttons
function attachActionButtonListeners() {
    // View buttons
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const userId = this.getAttribute('data-id');
            showUserDetails(userId);
        });
    });
    
    // Lock/Unlock buttons
    document.querySelectorAll('.lock-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const userId = this.getAttribute('data-id');
            const isEnabled = this.getAttribute('data-enabled') === 'true';
            toggleUserLock(userId, isEnabled);
        });
    });
    
    // Delete buttons
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const userId = this.getAttribute('data-id');
            showDeleteConfirmation(userId);
        });
    });
}

// Show user details in modal
function showUserDetails(userId) {
    const user = window.allUsers.find(u => u.id == userId);
    
    if (!user) {
        showNotification('User not found', 'error');
        return;
    }
    
    // Populate user details
    document.getElementById('detail-id').textContent = user.id;
    document.getElementById('detail-username').textContent = user.username;
    document.getElementById('detail-email').textContent = user.email;
    document.getElementById('detail-studentId').textContent = user.studentId || 'N/A';
    
    // Status with badge
    const statusElement = document.getElementById('detail-status');
    statusElement.innerHTML = `
        <span class="status-badge ${user.enabled ? 'status-active' : 'status-locked'}">
            ${user.enabled ? 'Active' : 'Locked'}
        </span>
    `;
    
    // Email verification status
    const emailVerifiedElement = document.getElementById('detail-emailVerified');
    emailVerifiedElement.innerHTML = user.emailVerified ? 'Verified' : 'Not Verified';
    
    // Update lock/unlock button
    const lockUnlockBtn = document.getElementById('lockUnlockBtn');
    const lockUnlockText = document.getElementById('lockUnlockText');
    
    if (user.enabled) {
        lockUnlockBtn.className = 'btn btn-warning';
        lockUnlockText.textContent = 'Lock Account';
        lockUnlockBtn.querySelector('i').className = 'fas fa-lock';
    } else {
        lockUnlockBtn.className = 'btn btn-success';
        lockUnlockText.textContent = 'Unlock Account';
        lockUnlockBtn.querySelector('i').className = 'fas fa-unlock';
    }
    
    // Set up action button listeners
    lockUnlockBtn.onclick = function() {
        toggleUserLock(user.id, user.enabled);
    };
    
    document.getElementById('deleteUserBtn').onclick = function() {
        closeAllModals();
        showDeleteConfirmation(user.id);
    };
    
    // Show the modal
    document.getElementById('userDetailModal').style.display = 'block';
}

// Show delete confirmation modal
function showDeleteConfirmation(userId) {
    const user = window.allUsers.find(u => u.id == userId);
    
    if (!user) {
        showNotification('User not found', 'error');
        return;
    }
    
    // Set up confirm delete button
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    confirmDeleteBtn.onclick = function() {
        deleteUser(userId);
    };
    
    // Show the modal
    document.getElementById('deleteConfirmModal').style.display = 'block';
}

// Toggle user lock status
function toggleUserLock(userId, isCurrentlyEnabled) {
    const actionText = isCurrentlyEnabled ? 'lock' : 'unlock';
    const apiCall = isCurrentlyEnabled ? 
        adminApi.lockUser(userId) : 
        adminApi.unlockUser(userId);
    
    apiCall
        .then(() => {
            showNotification(`User ${actionText}ed successfully`, 'success');
            loadUsers(document.getElementById('userSearch').value.trim());
            closeAllModals();
        })
        .catch(error => {
            console.error(`Error ${actionText}ing user:`, error);
            showNotification(`Failed to ${actionText} user: ${error.message}`, 'error');
        });
}

// Delete user
function deleteUser(userId) {
    // Update UI to show loading
    const confirmBtn = document.getElementById('confirmDeleteBtn');
    const originalText = confirmBtn.innerHTML;
    confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';
    confirmBtn.disabled = true;
    
    adminApi.deleteUser(userId)
        .then(() => {
            closeAllModals();
            showNotification('User deleted successfully', 'success');
            loadUsers(document.getElementById('userSearch').value.trim());
        })
        .catch(error => {
            console.error('Error deleting user:', error);
            showNotification(`Failed to delete user: ${error.message}`, 'error');
        })
        .finally(() => {
            // Reset button
            confirmBtn.innerHTML = originalText;
            confirmBtn.disabled = false;
        });
}

// Show notification
function showNotification(message, type = 'info') {
    // Create container if it doesn't exist
    let container = document.getElementById('notificationContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notificationContainer';
        document.body.appendChild(container);
    }
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div>${message}</div>
        <button class="notification-close">&times;</button>
    `;
    
    // Add to container
    container.appendChild(notification);
    
    // Set up close button
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', function() {
        notification.remove();
    });
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        notification.style.transition = 'all 0.3s ease';
        
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 5000);
} 