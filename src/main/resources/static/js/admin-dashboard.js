// Add real-time updates for recent activity
let activityUpdateInterval;

// Add实时更新仪表盘状态的功能
let dashboardStatsInterval;

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
    
    // 设置实时更新所有数据
    setupRealtimeUpdates();
});

// 新增函数：设置实时更新所有数据
function setupRealtimeUpdates() {
    // 清除可能存在的定时器
    if (dashboardStatsInterval) {
        clearInterval(dashboardStatsInterval);
    }
    if (activityUpdateInterval) {
        clearInterval(activityUpdateInterval);
    }
    
    // 设置每分钟更新统计数据的定时器
    dashboardStatsInterval = setInterval(function() {
        loadDashboardStats();
        console.log("实时更新仪表盘统计数据...");
    }, 60000); // 每分钟更新一次
    
    // 设置每30秒更新活动列表的定时器
    activityUpdateInterval = setInterval(function() {
        loadRecentActivity();
        console.log("实时更新活动列表...");
    }, 30000); // 每30秒更新一次
    
    // 页面卸载时清除定时器
    window.addEventListener('beforeunload', function() {
        if (dashboardStatsInterval) {
            clearInterval(dashboardStatsInterval);
        }
        if (activityUpdateInterval) {
            clearInterval(activityUpdateInterval);
        }
    });
}

// 检查是否是管理员
function isAdmin() {
    const auth = authStorage.getAuth();
    return auth && auth.token && auth.role === 'ADMIN';
}

// 修改加载仪表盘统计数据的函数，使其更准确
function loadDashboardStats() {
    // 显示加载状态
    document.getElementById('roomCount').innerHTML = '<small><i class="fas fa-spinner fa-spin"></i></small>';
    document.getElementById('reservationCount').innerHTML = '<small><i class="fas fa-spinner fa-spin"></i></small>';
    document.getElementById('userCount').innerHTML = '<small><i class="fas fa-spinner fa-spin"></i></small>';
    document.getElementById('todayReservationCount').innerHTML = '<small><i class="fas fa-spinner fa-spin"></i></small>';
    
    // 会议室总数
    adminApi.getAllRooms()
        .then(rooms => {
            console.log("加载会议室:", rooms);
            document.getElementById('roomCount').textContent = rooms && rooms.length ? rooms.length : '0';
        })
        .catch(error => {
            console.error('Error loading room count:', error);
            document.getElementById('roomCount').textContent = '0';
        });
    
    // 活跃预订数量 - 确保过滤掉已取消的和已过期的预订
    adminApi.getAllReservations()
        .then(reservations => {
            console.log("加载预订:", reservations);
            const now = new Date();
            
            // 筛选活跃预订：未取消且未过期
            const activeReservations = reservations && Array.isArray(reservations) ? 
                reservations.filter(reservation => {
                    // 如果已取消，则不是活跃预订
                    if (reservation.status === 'CANCELLED') return false;
                    
                    // 检查预订是否已过期
                    const reservationEndTime = new Date(`${reservation.date}T${reservation.endTime}`);
                    return reservationEndTime > now;
                }) : [];
                
            document.getElementById('reservationCount').textContent = activeReservations.length;
        })
        .catch(error => {
            console.error('Error loading reservation count:', error);
            document.getElementById('reservationCount').textContent = '0';
        });
    
    // 注册用户数量 - 使用更健壮的方式处理用户数据
    adminApi.getAllUsers()
        .then(userData => {
            console.log("加载用户数:", userData);
            let usersCount = 0;
            
            if (userData) {
                if (userData.content && Array.isArray(userData.content)) {
                    usersCount = userData.content.length;
                } else if (Array.isArray(userData)) {
                    usersCount = userData.length;
                } else if (userData.totalElements !== undefined) {
                    usersCount = userData.totalElements;
                } else if (userData.users && Array.isArray(userData.users)) {
                    usersCount = userData.users.length;
                }
            }
            
            document.getElementById('userCount').textContent = usersCount;
        })
        .catch(error => {
            console.error('Error loading user count:', error);
            document.getElementById('userCount').textContent = '0';
        });
    
    // 今日预订数量 - 确保只统计未取消的预订
    const today = new Date().toISOString().split('T')[0];
    adminApi.getAllReservations()
        .then(reservations => {
            console.log("加载今日预订:", reservations, "今日日期:", today);
            const todayReservations = reservations && Array.isArray(reservations) ? 
                reservations.filter(reservation => 
                    reservation.date === today && reservation.status !== 'CANCELLED'
                ) : [];
            document.getElementById('todayReservationCount').textContent = todayReservations.length;
        })
        .catch(error => {
            console.error('Error loading today\'s reservation count:', error);
            document.getElementById('todayReservationCount').textContent = '0';
        });
}

// 加载最近活动 - updated to use API if available
function loadRecentActivity() {
    // Try to use the API first
    if (typeof adminApi !== 'undefined' && adminApi.getRecentActivity) {
        adminApi.getRecentActivity()
            .then(activities => {
                console.log("获取到的活动:", activities);
                displayRecentActivity(activities);
            })
            .catch(error => {
                console.error('加载最近活动时出错:', error);
                
                // Fallback to mock data if API fails
                const mockActivities = generateMockActivities();
                displayRecentActivity(mockActivities);
            });
    } else {
        // Fallback to mock data
        const mockActivities = generateMockActivities();
        displayRecentActivity(mockActivities);
    }
}

// Function to generate mock activities if API not available
function generateMockActivities() {
    return [
        { time: new Date(), type: 'ROOM_CREATED', description: 'Created new meeting room: Conference Room A' },
        { time: new Date(Date.now() - 1000 * 60 * 30), type: 'RESERVATION_DELETED', description: 'Deleted reservation #123 for Board Room' },
        { time: new Date(Date.now() - 1000 * 60 * 60), type: 'USER_LOCKED', description: 'Locked user account: johndoe@example.com' },
        { time: new Date(Date.now() - 1000 * 60 * 60 * 2), type: 'ROOM_UPDATED', description: 'Updated meeting room: Training Room' },
        { time: new Date(Date.now() - 1000 * 60 * 60 * 24), type: 'USER_DELETED', description: 'Deleted user account: testuser@example.com' }
    ];
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