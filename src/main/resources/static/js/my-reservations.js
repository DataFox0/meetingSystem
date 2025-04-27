document.addEventListener('DOMContentLoaded', function() {
    // 检查用户是否已登录
    if (!authStorage.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }
    
    // 加载用户预订
    loadReservations();
    
    // 设置筛选选项卡点击事件
    const filterTabs = document.querySelectorAll('.filter-tabs .tab-btn');
    filterTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // 移除其他选项卡的active类
            filterTabs.forEach(t => t.classList.remove('active'));
            // 添加当前选项卡的active类
            this.classList.add('active');
            
            // 筛选预订
            const filter = this.dataset.filter;
            filterReservations(filter);
        });
    });
    
    // 设置模态框关闭事件
    const modal = document.getElementById('reservationDetailModal');
    const closeBtn = modal.querySelector('.close');
    
    closeBtn.onclick = function() {
        modal.style.display = 'none';
    };
    
    window.onclick = function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
});

// 加载用户预订
function loadReservations() {
    const reservationsContainer = document.getElementById('reservationsContainer');
    reservationsContainer.innerHTML = '<div class="loading">Loading your reservations...</div>';
    
    reservationApi.getUserReservations()
        .then(reservations => {
            // 保存预订到全局变量，用于筛选
            window.allReservations = reservations;
            
            // 显示所有预订
            displayReservations(reservations);
        })
        .catch(error => {
            console.error('Error loading reservations:', error);
            reservationsContainer.innerHTML = `<div class="error-message">Failed to load reservations: ${error.message}</div>`;
        });
}

// 根据筛选条件显示预订
function filterReservations(filter) {
    if (!window.allReservations) return;
    
    const now = new Date();
    let filteredReservations;
    
    switch (filter) {
        case 'upcoming':
            filteredReservations = window.allReservations.filter(res => {
                const resDate = new Date(res.date);
                const endTimeParts = res.endTime.split(':');
                resDate.setHours(parseInt(endTimeParts[0], 10));
                return !res.cancelled && resDate > now;
            });
            break;
        case 'past':
            filteredReservations = window.allReservations.filter(res => {
                const resDate = new Date(res.date);
                const endTimeParts = res.endTime.split(':');
                resDate.setHours(parseInt(endTimeParts[0], 10));
                return !res.cancelled && resDate <= now;
            });
            break;
        case 'cancelled':
            filteredReservations = window.allReservations.filter(res => res.cancelled);
            break;
        default: // 'all'
            filteredReservations = window.allReservations;
    }
    
    displayReservations(filteredReservations);
}

// 显示预订
function displayReservations(reservations) {
    const reservationsContainer = document.getElementById('reservationsContainer');
    
    if (reservations.length === 0) {
        reservationsContainer.innerHTML = '<div class="no-results">No reservations found</div>';
        return;
    }
    
    reservationsContainer.innerHTML = '';
    
    // 按日期和开始时间排序（最近的在前）
    reservations.sort((a, b) => {
        const dateA = new Date(a.date + 'T' + a.startTime);
        const dateB = new Date(b.date + 'T' + b.startTime);
        return dateB - dateA;
    });
    
    reservations.forEach(reservation => {
        const reservationCard = document.createElement('div');
        reservationCard.className = `reservation-card card ${getReservationStatusClass(reservation)}`;
        reservationCard.dataset.id = reservation.id;
        
        const formattedDate = formatDate(reservation.date);
        const timeRange = `${reservation.startTime} - ${reservation.endTime}`;
        
        reservationCard.innerHTML = `
            <div class="reservation-date">${formattedDate}</div>
            <div class="reservation-content">
                <h3>${reservation.roomName}</h3>
                <div class="reservation-meta">
                    <div><i class="icon-location"></i> ${reservation.roomLocation}</div>
                    <div><i class="icon-time"></i> ${timeRange}</div>
                    <div><i class="icon-people"></i> Attendees: ${reservation.attendeesCount}</div>
                </div>
                <div class="reservation-status ${getStatusClass(reservation)}">${getStatusText(reservation)}</div>
            </div>
            <div class="reservation-actions">
                <button class="btn btn-detail" data-id="${reservation.id}">Details</button>
                ${!reservation.cancelled && canCancel(reservation) ? 
                    `<button class="btn btn-cancel" data-id="${reservation.id}">Cancel</button>` : ''}
            </div>
        `;
        
        reservationsContainer.appendChild(reservationCard);
    });
    
    // 添加按钮事件处理
    document.querySelectorAll('.btn-detail').forEach(btn => {
        btn.addEventListener('click', function() {
            const reservationId = parseInt(this.dataset.id, 10);
            showReservationDetails(reservationId);
        });
    });
    
    document.querySelectorAll('.btn-cancel').forEach(btn => {
        btn.addEventListener('click', function() {
            const reservationId = parseInt(this.dataset.id, 10);
            confirmCancelReservation(reservationId);
        });
    });
}

// 显示预订详情
function showReservationDetails(reservationId) {
    const reservation = window.allReservations.find(res => res.id === reservationId);
    if (!reservation) return;
    
    const modal = document.getElementById('reservationDetailModal');
    
    // 填充模态框内容
    document.getElementById('modal-roomName').textContent = reservation.roomName;
    document.getElementById('modal-roomLocation').textContent = reservation.roomLocation;
    document.getElementById('modal-date').textContent = formatDate(reservation.date);
    document.getElementById('modal-time').textContent = `${reservation.startTime} - ${reservation.endTime}`;
    document.getElementById('modal-attendees').textContent = reservation.attendeesCount;
    document.getElementById('modal-status').textContent = getStatusText(reservation);
    document.getElementById('modal-purpose').textContent = reservation.purpose;
    
    // 设置状态类名
    document.getElementById('modal-status').className = `value ${getStatusClass(reservation)}`;
    
    // 设置操作按钮
    const actionsDiv = document.getElementById('modal-actions');
    actionsDiv.innerHTML = '';
    
    if (!reservation.cancelled && canCancel(reservation)) {
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn btn-cancel';
        cancelBtn.textContent = 'Cancel Reservation';
        cancelBtn.onclick = function() {
            modal.style.display = 'none';
            confirmCancelReservation(reservationId);
        };
        actionsDiv.appendChild(cancelBtn);
    }
    
    // 显示模态框
    modal.style.display = 'block';
}

// 确认取消预订
function confirmCancelReservation(reservationId) {
    if (confirm('Are you sure you want to cancel this reservation?')) {
        cancelReservation(reservationId);
    }
}

// 取消预订
function cancelReservation(reservationId) {
    reservationApi.cancelReservation(reservationId)
        .then(() => {
            // 设置标志以通知 profile 页面数据已更新
            localStorage.setItem('reservationStatsUpdated', 'true');
            
            alert('Reservation cancelled successfully');
            // 重新加载预订
            loadReservations();
        })
        .catch(error => {
            console.error('Error cancelling reservation:', error);
            alert('Failed to cancel reservation: ' + error.message);
        });
}

// 辅助函数：格式化日期
function formatDate(dateString) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

// 辅助函数：获取预订状态类
function getReservationStatusClass(reservation) {
    if (reservation.cancelled) return 'cancelled';
    
    const now = new Date();
    const resDate = new Date(reservation.date);
    const endTimeParts = reservation.endTime.split(':');
    resDate.setHours(parseInt(endTimeParts[0], 10));
    
    if (resDate <= now) return 'past';
    return 'upcoming';
}

// 辅助函数：获取状态CSS类
function getStatusClass(reservation) {
    if (reservation.cancelled) return 'status-cancelled';
    
    const now = new Date();
    const resDate = new Date(reservation.date);
    const endTimeParts = reservation.endTime.split(':');
    resDate.setHours(parseInt(endTimeParts[0], 10));
    
    if (resDate <= now) return 'status-past';
    
    switch (reservation.status) {
        case 'APPROVED': return 'status-approved';
        case 'REJECTED': return 'status-rejected';
        default: return 'status-pending';
    }
}

// 辅助函数：获取状态文本
function getStatusText(reservation) {
    if (reservation.cancelled) return 'Cancelled';
    
    const now = new Date();
    const resDate = new Date(reservation.date);
    const endTimeParts = reservation.endTime.split(':');
    resDate.setHours(parseInt(endTimeParts[0], 10));
    
    if (resDate <= now) return 'Completed';
    
    switch (reservation.status) {
        case 'APPROVED': return 'Approved';
        case 'REJECTED': return 'Rejected';
        default: return 'Pending';
    }
}

// 辅助函数：检查是否可以取消
function canCancel(reservation) {
    if (reservation.cancelled) return false;
    
    const now = new Date();
    const resDate = new Date(reservation.date);
    const startTimeParts = reservation.startTime.split(':');
    resDate.setHours(parseInt(startTimeParts[0], 10));
    
    // 只能取消未来的预订
    return resDate > now;
} 