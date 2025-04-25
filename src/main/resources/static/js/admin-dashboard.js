document.addEventListener('DOMContentLoaded', function() {
    // 检查是否是管理员
    if (!isAdmin()) {
        window.location.href = 'login.html';
        return;
    }
    
    // 添加登出按钮事件
    document.getElementById('logoutBtn').addEventListener('click', function(e) {
        e.preventDefault();
        authStorage.clearAuth();
        window.location.href = 'login.html';
    });
    
    // 显示管理员用户名
    document.getElementById('adminName').textContent = authStorage.getAuth().username;
    
    // 加载统计数据
    loadDashboardStats();
    
    // 加载最近活动
    loadRecentActivity();
});

// 检查是否是管理员
function isAdmin() {
    const auth = authStorage.getAuth();
    return auth && auth.token && auth.role === 'ADMIN';
}

// 加载仪表盘统计数据
function loadDashboardStats() {
    // 在实际应用中应该从后端获取
    // 这里为了演示使用模拟数据
    
    // 会议室总数
    adminApi.getAllRooms()
        .then(rooms => {
            document.getElementById('roomCount').textContent = rooms.length;
        })
        .catch(error => {
            console.error('Error loading room count:', error);
            document.getElementById('roomCount').textContent = 'Error';
        });
    
    // 活跃预订数量
    adminApi.getAllReservations(null, 'APPROVED')
        .then(reservations => {
            const activeReservations = reservations.filter(reservation => !reservation.cancelled);
            document.getElementById('reservationCount').textContent = activeReservations.length;
        })
        .catch(error => {
            console.error('Error loading reservation count:', error);
            document.getElementById('reservationCount').textContent = 'Error';
        });
    
    // 注册用户数量
    adminApi.getAllUsers()
        .then(users => {
            document.getElementById('userCount').textContent = users.length;
        })
        .catch(error => {
            console.error('Error loading user count:', error);
            document.getElementById('userCount').textContent = 'Error';
        });
    
    // 今日预订数量
    const today = new Date().toISOString().split('T')[0];
    adminApi.getAllReservations()
        .then(reservations => {
            const todayReservations = reservations.filter(reservation => 
                reservation.date === today && !reservation.cancelled
            );
            document.getElementById('todayReservationCount').textContent = todayReservations.length;
        })
        .catch(error => {
            console.error('Error loading today\'s reservation count:', error);
            document.getElementById('todayReservationCount').textContent = 'Error';
        });
}

// 加载最近活动
function loadRecentActivity() {
    // 实际应用中应该从后端API获取
    // 这里为了演示使用模拟数据
    const activityList = [
        { time: new Date(), type: 'ROOM_CREATED', description: 'Created new meeting room: Conference Room A' },
        { time: new Date(Date.now() - 1000 * 60 * 30), type: 'RESERVATION_DELETED', description: 'Deleted reservation #123 for Board Room' },
        { time: new Date(Date.now() - 1000 * 60 * 60), type: 'USER_LOCKED', description: 'Locked user account: johndoe@example.com' },
        { time: new Date(Date.now() - 1000 * 60 * 60 * 2), type: 'ROOM_UPDATED', description: 'Updated meeting room: Training Room' },
        { time: new Date(Date.now() - 1000 * 60 * 60 * 24), type: 'USER_DELETED', description: 'Deleted user account: testuser@example.com' }
    ];
    
    displayRecentActivity(activityList);
    
    /*
    // 如果后端有API，应该用下面的代码
    adminApi.getRecentActivity()
        .then(activities => {
            displayRecentActivity(activities);
        })
        .catch(error => {
            console.error('Error loading recent activities:', error);
            document.getElementById('recentActivityList').innerHTML = '<div class="error-message">Failed to load activities</div>';
        });
    */
}

// 显示最近活动
function displayRecentActivity(activities) {
    const activityListElement = document.getElementById('recentActivityList');
    activityListElement.innerHTML = '';
    
    if (activities.length === 0) {
        activityListElement.innerHTML = '<div class="no-activities">No recent activities</div>';
        return;
    }
    
    activities.forEach(activity => {
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        
        const activityTime = document.createElement('div');
        activityTime.className = 'activity-time';
        activityTime.textContent = formatActivityTime(activity.time);
        
        const activityDescription = document.createElement('div');
        activityDescription.className = 'activity-description';
        activityDescription.textContent = activity.description;
        
        activityItem.appendChild(activityTime);
        activityItem.appendChild(activityDescription);
        activityListElement.appendChild(activityItem);
    });
}

// 格式化活动时间
function formatActivityTime(time) {
    const now = new Date();
    const activityTime = new Date(time);
    
    const diffMs = now - activityTime;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMinutes < 1) {
        return 'Just now';
    } else if (diffMinutes < 60) {
        return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
    } else if (diffHours < 24) {
        return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    } else if (diffDays < 7) {
        return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    } else {
        return activityTime.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    }
} 