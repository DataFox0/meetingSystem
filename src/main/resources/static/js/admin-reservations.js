// 辅助函数：格式化日期
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

// 辅助函数：截断文本
function truncateText(text, maxLength) {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

// 辅助函数：获取状态文本
function getStatusText(reservation) {
    if (reservation.cancelled) return 'Cancelled';
    
    switch (reservation.status) {
        case 'PENDING': return 'Pending';
        case 'APPROVED': return 'Approved';
        case 'REJECTED': return 'Rejected';
        default: return reservation.status || 'Unknown';
    }
}

// 辅助函数：获取状态CSS类
function getStatusClass(reservation) {
    if (reservation.cancelled) return 'status-cancelled';
    
    switch (reservation.status) {
        case 'PENDING': return 'status-pending';
        case 'APPROVED': return 'status-approved';
        case 'REJECTED': return 'status-rejected';
        default: return '';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // 检查是否是管理员
    if (!isAdmin()) {
        window.location.href = 'login.html';
        return;
    }
    
    // 加载会议室选项
    loadRoomOptions();
    
    // 加载预订列表
    loadReservations();
    
    // 设置筛选按钮点击事件
    document.getElementById('applyFiltersBtn').addEventListener('click', function() {
        loadReservations();
    });
    
    // 设置全选复选框事件
    document.getElementById('selectAll').addEventListener('change', function() {
        const isChecked = this.checked;
        document.querySelectorAll('input[name="reservation-checkbox"]').forEach(checkbox => {
            checkbox.checked = isChecked;
        });
        updateBulkActions();
    });
    
    // 设置批量删除按钮点击事件
    document.getElementById('deleteSelectedBtn').addEventListener('click', function() {
        const selectedIds = getSelectedReservationIds();
        if (selectedIds.length === 0) return;
        
        showDeleteConfirmation(selectedIds);
    });
    
    // 设置模态框关闭事件
    document.querySelectorAll('.close, .close-btn').forEach(element => {
        element.addEventListener('click', function() {
            document.getElementById('reservationDetailModal').style.display = 'none';
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

// 加载会议室选项
function loadRoomOptions() {
    adminApi.getAllRooms()
        .then(rooms => {
            const roomSelect = document.getElementById('roomFilter');
            
            rooms.forEach(room => {
                const option = document.createElement('option');
                option.value = room.id;
                option.textContent = room.name;
                roomSelect.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Error loading room options:', error);
        });
}

// 加载预订列表
function loadReservations() {
    const roomId = document.getElementById('roomFilter').value;
    const status = document.getElementById('statusFilter').value;
    
    // 显示加载状态
    const tableBody = document.querySelector('#reservationsTable tbody');
    tableBody.innerHTML = '<tr><td colspan="9" class="text-center">Loading reservations...</td></tr>';
    
    adminApi.getAllReservations(roomId, status)
        .then(reservations => {
            console.log("Loaded reservations:", reservations); // 调试用
            tableBody.innerHTML = '';
            
            if (reservations.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="9" class="text-center">No reservations found</td></tr>';
                return;
            }
            
            reservations.forEach(reservation => {
                const tr = document.createElement('tr');
                
                tr.innerHTML = `
                    <td><input type="checkbox" name="reservation-checkbox" value="${reservation.id}"></td>
                    <td>${reservation.id}</td>
                    <td>${reservation.roomName}</td>
                    <td>${reservation.userUsername || reservation.userName || reservation.username || 'N/A'}</td>
                    <td>${formatDate(reservation.date)}</td>
                    <td>${reservation.startTime} - ${reservation.endTime}</td>
                    <td>${truncateText(reservation.purpose, 30)}</td>
                    <td><span class="status-label ${getStatusClass(reservation)}">${getStatusText(reservation)}</span></td>
                    <td>
                        <div class="btn-group">
                            <button class="btn btn-sm btn-primary view-btn" data-id="${reservation.id}">View</button>
                            <button class="btn btn-sm btn-danger delete-btn" data-id="${reservation.id}">Delete</button>
                        </div>
                    </td>
                `;
                
                tableBody.appendChild(tr);
            });
            
            // 添加复选框事件
            document.querySelectorAll('input[name="reservation-checkbox"]').forEach(checkbox => {
                checkbox.addEventListener('change', updateBulkActions);
            });
            
            // 添加查看按钮事件
            document.querySelectorAll('.view-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const reservationId = this.getAttribute('data-id');
                    showReservationDetail(reservationId, reservations);
                });
            });
            
            // 添加删除按钮事件
            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const reservationId = this.getAttribute('data-id');
                    showDeleteConfirmation([reservationId]);
                });
            });
            
            // 重置全选复选框
            document.getElementById('selectAll').checked = false;
            updateBulkActions();
        })
        .catch(error => {
            console.error('Error loading reservations:', error);
            tableBody.innerHTML = `<tr><td colspan="9" class="text-center">Error: ${error.message}</td></tr>`;
        });
}

// 更新批量操作按钮状态
function updateBulkActions() {
    const selectedCount = document.querySelectorAll('input[name="reservation-checkbox"]:checked').length;
    const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
    
    deleteSelectedBtn.disabled = selectedCount === 0;
    deleteSelectedBtn.textContent = `Delete Selected (${selectedCount})`;
}

// 获取选中的预订ID
function getSelectedReservationIds() {
    return Array.from(document.querySelectorAll('input[name="reservation-checkbox"]:checked'))
        .map(checkbox => checkbox.value);
}

// 显示预订详情
function showReservationDetail(reservationId, reservations) {
    // 查找预订
    const reservation = reservations.find(r => r.id == reservationId);
    
    if (!reservation) {
        alert('Reservation not found');
        return;
    }
    
    // 设置详情内容
    document.getElementById('detail-id').textContent = reservation.id;
    document.getElementById('detail-room').textContent = `${reservation.roomName} (${reservation.roomLocation})`;
    document.getElementById('detail-user').textContent = reservation.userUsername || reservation.userName || reservation.username || 'N/A';
    document.getElementById('detail-date').textContent = formatDate(reservation.date);
    document.getElementById('detail-time').textContent = `${reservation.startTime} - ${reservation.endTime}`;
    document.getElementById('detail-attendees').textContent = reservation.attendeesCount || 'Not specified';
    document.getElementById('detail-purpose').textContent = reservation.purpose || 'Not specified';
    document.getElementById('detail-status').innerHTML = `<span class="status-label ${getStatusClass(reservation)}">${getStatusText(reservation)}</span>`;
    
    // 设置删除按钮事件
    document.getElementById('deleteReservationBtn').onclick = function() {
        document.getElementById('reservationDetailModal').style.display = 'none';
        showDeleteConfirmation([reservationId]);
    };
    
    // 显示模态框
    document.getElementById('reservationDetailModal').style.display = 'block';
}

// 显示删除确认
function showDeleteConfirmation(reservationIds) {
    // 保存要删除的ID
    document.getElementById('confirmDeleteBtn').setAttribute('data-ids', JSON.stringify(reservationIds));
    
    // 更新确认文本
    const confirmationText = reservationIds.length > 1 
        ? `Are you sure you want to delete ${reservationIds.length} reservations?` 
        : 'Are you sure you want to delete this reservation?';
    
    document.querySelector('#deleteConfirmModal p:first-of-type').textContent = confirmationText;
    
    // 设置确认按钮事件
    document.getElementById('confirmDeleteBtn').onclick = function() {
        const ids = JSON.parse(this.getAttribute('data-ids'));
        deleteReservations(ids);
    };
    
    // 显示模态框
    document.getElementById('deleteConfirmModal').style.display = 'block';
}

// 删除预订
function deleteReservations(reservationIds) {
    // 显示加载状态
    const confirmBtn = document.getElementById('confirmDeleteBtn');
    const originalText = confirmBtn.textContent;
    confirmBtn.textContent = 'Deleting...';
    confirmBtn.disabled = true;
    
    // 单个删除还是批量删除
    const deletePromise = reservationIds.length === 1
        ? adminApi.deleteReservation(reservationIds[0])
        : adminApi.batchDeleteReservations(reservationIds);
    
    deletePromise
        .then(() => {
            // 关闭模态框
            document.getElementById('deleteConfirmModal').style.display = 'none';
            
            // 显示成功消息
            const message = reservationIds.length > 1
                ? `${reservationIds.length} reservations deleted successfully`
                : 'Reservation deleted successfully';
            alert(message);
            
            // 重新加载预订列表
            loadReservations();
        })
        .catch(error => {
            console.error('Error deleting reservations:', error);
            alert('Failed to delete: ' + error.message);
        })
        .finally(() => {
            // 恢复按钮状态
            confirmBtn.textContent = originalText;
            confirmBtn.disabled = false;
        });
} 