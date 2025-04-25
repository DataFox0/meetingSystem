document.addEventListener('DOMContentLoaded', function() {
    // 检查是否是管理员
    if (!isAdmin()) {
        window.location.href = 'login.html';
        return;
    }
    
    // 加载用户列表
    loadUsers();
    
    // 设置搜索按钮点击事件
    document.getElementById('searchBtn').addEventListener('click', function() {
        const searchQuery = document.getElementById('userSearch').value.trim().toLowerCase();
        filterUsers(searchQuery);
    });
    
    // 设置回车键搜索
    document.getElementById('userSearch').addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            document.getElementById('searchBtn').click();
        }
    });
    
    // 设置模态框关闭事件
    document.querySelectorAll('.close, .close-btn').forEach(element => {
        element.addEventListener('click', function() {
            document.getElementById('userDetailModal').style.display = 'none';
            document.getElementById('deleteConfirmModal').style.display = 'none';
        });
    });
    
    // 点击页面其他地方关闭模态框
    window.addEventListener('click', function(event) {
        if (event.target.className === 'modal') {
            event.target.style.display = 'none';
        }
    });
});

// 检查是否是管理员
function isAdmin() {
    const auth = authStorage.getAuth();
    return auth && auth.token && auth.role === 'ADMIN';
}

// 加载用户列表
function loadUsers() {
    adminApi.getAllUsers()
        .then(users => {
            // 保存用户列表到页面数据中，方便筛选
            window.allUsers = users;
            displayUsers(users);
        })
        .catch(error => {
            console.error('Error loading users:', error);
            alert('Failed to load users: ' + error.message);
        });
}

// 显示用户列表
function displayUsers(users) {
    const tableBody = document.querySelector('#usersTable tbody');
    tableBody.innerHTML = '';
    
    if (users.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = '<td colspan="7" class="text-center">No users found</td>';
        tableBody.appendChild(tr);
        return;
    }
    
    users.forEach(user => {
        const tr = document.createElement('tr');
        
        tr.innerHTML = `
            <td>${user.id}</td>
            <td>${user.username}</td>
            <td>${user.email}</td>
            <td>${user.studentId || 'N/A'}</td>
            <td><span class="status-label ${user.enabled ? 'status-active' : 'status-inactive'}">${user.enabled ? 'Active' : 'Locked'}</span></td>
            <td><span class="status-label ${user.emailVerified ? 'status-approved' : 'status-pending'}">${user.emailVerified ? 'Verified' : 'Unverified'}</span></td>
            <td>
                <div class="btn-group">
                    <button class="btn btn-sm btn-primary view-btn" data-id="${user.id}">View</button>
                    <button class="btn btn-sm ${user.enabled ? 'btn-warning' : 'btn-success'} lock-btn" data-id="${user.id}" data-enabled="${user.enabled}">
                        ${user.enabled ? 'Lock' : 'Unlock'}
                    </button>
                    <button class="btn btn-sm btn-danger delete-btn" data-id="${user.id}">Delete</button>
                </div>
            </td>
        `;
        
        tableBody.appendChild(tr);
    });
    
    // 添加查看按钮事件
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const userId = this.getAttribute('data-id');
            showUserDetail(userId);
        });
    });
    
    // 添加锁定/解锁按钮事件
    document.querySelectorAll('.lock-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const userId = this.getAttribute('data-id');
            const enabled = this.getAttribute('data-enabled') === 'true';
            toggleUserLock(userId, enabled);
        });
    });
    
    // 添加删除按钮事件
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const userId = this.getAttribute('data-id');
            showDeleteConfirmation(userId);
        });
    });
}

// 筛选用户
function filterUsers(query) {
    if (!window.allUsers) return;
    
    if (!query) {
        displayUsers(window.allUsers);
        return;
    }
    
    const filteredUsers = window.allUsers.filter(user => 
        user.username.toLowerCase().includes(query) || 
        user.email.toLowerCase().includes(query) || 
        (user.studentId && user.studentId.toLowerCase().includes(query))
    );
    
    displayUsers(filteredUsers);
}

// 显示用户详情
function showUserDetail(userId) {
    if (!window.allUsers) return;
    
    // 查找用户
    const user = window.allUsers.find(u => u.id == userId);
    
    if (!user) {
        alert('User not found');
        return;
    }
    
    // 设置详情内容
    document.getElementById('detail-id').textContent = user.id;
    document.getElementById('detail-username').textContent = user.username;
    document.getElementById('detail-email').textContent = user.email;
    document.getElementById('detail-studentId').textContent = user.studentId || 'N/A';
    
    const statusElement = document.getElementById('detail-status');
    statusElement.textContent = user.enabled ? 'Active' : 'Locked';
    statusElement.className = `detail-value ${user.enabled ? 'status-active' : 'status-inactive'}`;
    
    const emailVerifiedElement = document.getElementById('detail-emailVerified');
    emailVerifiedElement.textContent = user.emailVerified ? 'Verified' : 'Unverified';
    emailVerifiedElement.className = `detail-value ${user.emailVerified ? 'status-approved' : 'status-pending'}`;
    
    // 设置锁定/解锁按钮
    const lockUnlockBtn = document.getElementById('lockUnlockUserBtn');
    lockUnlockBtn.textContent = user.enabled ? 'Lock User' : 'Unlock User';
    lockUnlockBtn.className = `btn ${user.enabled ? 'btn-warning' : 'btn-success'}`;
    lockUnlockBtn.onclick = function() {
        document.getElementById('userDetailModal').style.display = 'none';
        toggleUserLock(userId, user.enabled);
    };
    
    // 设置删除按钮点击事件
    document.getElementById('deleteUserBtn').onclick = function() {
        document.getElementById('userDetailModal').style.display = 'none';
        showDeleteConfirmation(userId);
    };
    
    // 显示模态框
    document.getElementById('userDetailModal').style.display = 'block';
}

// 切换用户锁定状态
function toggleUserLock(userId, currentlyEnabled) {
    const apiCall = currentlyEnabled ? adminApi.lockUser(userId) : adminApi.unlockUser(userId);
    
    apiCall
        .then(() => {
            alert(`User ${currentlyEnabled ? 'locked' : 'unlocked'} successfully`);
            loadUsers(); // 重新加载用户列表
        })
        .catch(error => {
            console.error(`Error ${currentlyEnabled ? 'locking' : 'unlocking'} user:`, error);
            alert(`Failed to ${currentlyEnabled ? 'lock' : 'unlock'} user: ` + error.message);
        });
}

// 显示删除确认对话框
function showDeleteConfirmation(userId) {
    const modal = document.getElementById('deleteConfirmModal');
    const confirmBtn = document.getElementById('confirmDeleteBtn');
    const cancelBtn = document.getElementById('cancelDeleteBtn');
    const closeBtn = document.querySelector('#deleteConfirmModal .close');
    
    // 存储要删除的用户ID
    confirmBtn.setAttribute('data-id', userId);
    
    // 显示模态框
    modal.style.display = 'block';
    
    // 删除确认
    confirmBtn.onclick = function() {
        const id = this.getAttribute('data-id');
        
        // 显示加载状态
        confirmBtn.textContent = 'Deleting...';
        confirmBtn.disabled = true;
        
        adminApi.deleteUser(id)
            .then(() => {
                // 成功删除
                modal.style.display = 'none';
                alert('User deleted successfully');
                loadUsers(); // 重新加载用户列表
            })
            .catch(error => {
                console.error('Error deleting user:', error);
                alert('Failed to delete user: ' + error.message);
            })
            .finally(() => {
                // 恢复按钮状态
                confirmBtn.textContent = 'Delete';
                confirmBtn.disabled = false;
            });
    };
    
    // 取消删除
    function closeModal() {
        modal.style.display = 'none';
    }
    
    cancelBtn.onclick = closeModal;
    closeBtn.onclick = closeModal;
    
    // 点击模态框外部关闭
    window.onclick = function(event) {
        if (event.target === modal) {
            closeModal();
        }
    };
}

// 添加通知功能
function showNotification(message, type = 'info') {
    // 如果页面上没有通知容器，创建一个
    let notificationContainer = document.getElementById('notificationContainer');
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notificationContainer';
        notificationContainer.style.position = 'fixed';
        notificationContainer.style.top = '20px';
        notificationContainer.style.right = '20px';
        notificationContainer.style.zIndex = '1000';
        document.body.appendChild(notificationContainer);
    }
    
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            ${message}
        </div>
        <button class="notification-close">&times;</button>
    `;
    
    // 设置样式
    notification.style.padding = '10px 15px';
    notification.style.marginBottom = '10px';
    notification.style.borderRadius = '4px';
    notification.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    notification.style.display = 'flex';
    notification.style.justifyContent = 'space-between';
    notification.style.alignItems = 'center';
    
    // 根据类型设置背景色
    if (type === 'success') {
        notification.style.backgroundColor = '#d4edda';
        notification.style.color = '#155724';
        notification.style.borderColor = '#c3e6cb';
    } else if (type === 'error') {
        notification.style.backgroundColor = '#f8d7da';
        notification.style.color = '#721c24';
        notification.style.borderColor = '#f5c6cb';
    } else {
        notification.style.backgroundColor = '#d1ecf1';
        notification.style.color = '#0c5460';
        notification.style.borderColor = '#bee5eb';
    }
    
    // 添加到容器
    notificationContainer.appendChild(notification);
    
    // 关闭按钮
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.style.background = 'none';
    closeBtn.style.border = 'none';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.fontSize = '20px';
    closeBtn.onclick = function() {
        notification.remove();
    };
    
    // 5秒后自动消失
    setTimeout(() => {
        notification.remove();
    }, 5000);
} 