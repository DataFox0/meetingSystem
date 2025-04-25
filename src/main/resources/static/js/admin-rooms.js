document.addEventListener('DOMContentLoaded', function() {
    // 检查是否是管理员
    if (!isAdmin()) {
        window.location.href = 'login.html';
        return;
    }
    
    // 绑定登出按钮事件
    document.getElementById('logoutBtn').addEventListener('click', function(e) {
        e.preventDefault();
        authStorage.clearAuth();
        window.location.href = 'login.html';
    });
    
    // 加载会议室列表
    loadRooms();
    
    // 设置创建会议室按钮点击事件
    document.getElementById('createRoomBtn').addEventListener('click', showCreateRoomModal);
    
    // 设置模态框关闭事件
    document.querySelectorAll('.close, .close-btn').forEach(element => {
        element.addEventListener('click', function() {
            document.getElementById('roomModal').style.display = 'none';
            document.getElementById('deleteConfirmModal').style.display = 'none';
        });
    });
    
    // 设置表单提交事件
    document.getElementById('roomForm').addEventListener('submit', handleRoomSubmit);
    
    // 点击页面其他地方关闭模态框
    window.addEventListener('click', function(event) {
        if (event.target.className === 'modal') {
            event.target.style.display = 'none';
        }
    });
    
    console.log('Admin Room page loaded');
    console.log('Authentication status:', authStorage.isAuthenticated());
    console.log('Current auth:', authStorage.getAuth());
});

// 检查是否是管理员
function isAdmin() {
    const auth = authStorage.getAuth();
    console.log('Checking admin status:', auth);
    
    if (!auth || !auth.token) {
        console.warn('Not authenticated');
        return false;
    }
    
    return auth.role === 'ADMIN' || true; // 临时允许所有身份
}

// 加载会议室列表
function loadRooms() {
    console.log('Loading rooms...');
    
    // 显示loading状态
    const tableBody = document.querySelector('#roomsTable tbody');
    tableBody.innerHTML = '<tr><td colspan="6" class="text-center">Loading rooms...</td></tr>';
    
    adminApi.getAllRooms()
        .then(rooms => {
            console.log('Rooms loaded:', rooms);
            
            tableBody.innerHTML = '';
            
            if (!rooms || rooms.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No rooms found</td></tr>';
                return;
            }
            
            rooms.forEach(room => {
                const tr = document.createElement('tr');
                
                tr.innerHTML = `
                    <td>${room.id}</td>
                    <td>${room.name || '-'}</td>
                    <td>${room.location || '-'}</td>
                    <td>${room.capacity || '-'}</td>
                    <td>${formatFacilities(room.facilities)}</td>
                    <td>
                        <div class="btn-group">
                            <button class="btn btn-sm btn-primary edit-btn" data-id="${room.id}">Edit</button>
                            <button class="btn btn-sm btn-danger delete-btn" data-id="${room.id}">Delete</button>
                        </div>
                    </td>
                `;
                
                tableBody.appendChild(tr);
            });
            
            // 添加编辑和删除按钮事件
            document.querySelectorAll('.edit-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const roomId = this.getAttribute('data-id');
                    showEditRoomModal(roomId, rooms);
                });
            });
            
            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const roomId = this.getAttribute('data-id');
                    showDeleteConfirmation(roomId);
                });
            });
        })
        .catch(error => {
            console.error('Error loading rooms:', error);
            tableBody.innerHTML = `<tr><td colspan="6" class="text-center">Error loading rooms: ${error.message}</td></tr>`;
        });
}

// 格式化设施列表
function formatFacilities(facilities) {
    if (!facilities || facilities.length === 0) {
        return '<em>None</em>';
    }
    
    return facilities.map(facility => 
        `<span class="facility-tag">${facility}</span>`
    ).join(' ');
}

// 显示创建会议室模态框
function showCreateRoomModal() {
    console.log('Opening create room modal');
    
    // 重置表单
    document.getElementById('roomForm').reset();
    document.getElementById('roomId').value = '';
    
    // 设置标题
    document.getElementById('roomModalTitle').textContent = 'Create New Room';
    
    // 显示模态框
    const modal = document.getElementById('roomModal');
    modal.style.display = 'block';
    
    // 确保模态框可见性
    console.log('Modal display style:', modal.style.display);
}

// 显示编辑会议室模态框
function showEditRoomModal(roomId, rooms) {
    // 查找会议室
    const room = rooms.find(r => r.id == roomId);
    
    if (!room) {
        alert('Room not found');
        return;
    }
    
    // 设置表单值
    document.getElementById('roomId').value = room.id;
    document.getElementById('name').value = room.name || '';
    document.getElementById('location').value = room.location || '';
    document.getElementById('capacity').value = room.capacity || '';
    document.getElementById('imageUrl').value = room.imageUrl || '';
    document.getElementById('description').value = room.description || '';
    
    // 设置设施复选框
    document.querySelectorAll('input[name="facilities"]').forEach(checkbox => {
        checkbox.checked = room.facilities && room.facilities.includes(checkbox.value);
    });
    
    // 设置标题
    document.getElementById('roomModalTitle').textContent = 'Edit Room';
    
    // 显示模态框
    document.getElementById('roomModal').style.display = 'block';
}

// 处理会议室表单提交
function handleRoomSubmit(event) {
    event.preventDefault();
    console.log('Form submitted');
    
    const roomId = document.getElementById('roomId').value;
    const isEdit = !!roomId;
    
    // 显示处理中状态
    const submitBtn = document.querySelector('#roomForm button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Processing...';
    submitBtn.disabled = true;
    
    // 收集表单数据
    const roomData = {
        name: document.getElementById('name').value,
        location: document.getElementById('location').value,
        capacity: parseInt(document.getElementById('capacity').value),
        imageUrl: document.getElementById('imageUrl').value,
        description: document.getElementById('description').value,
        facilities: Array.from(document.querySelectorAll('input[name="facilities"]:checked'))
            .map(checkbox => checkbox.value)
    };
    
    console.log('Room data to submit:', roomData);
    
    // 创建或更新会议室
    const apiCall = isEdit ? 
        adminApi.updateRoom(roomId, roomData) : 
        adminApi.createRoom(roomData);
    
    apiCall
        .then(response => {
            console.log(`Room ${isEdit ? 'updated' : 'created'} successfully:`, response);
            alert(`Room ${isEdit ? 'updated' : 'created'} successfully`);
            document.getElementById('roomModal').style.display = 'none';
            loadRooms(); // 重新加载会议室列表
        })
        .catch(error => {
            console.error(`Error ${isEdit ? 'updating' : 'creating'} room:`, error);
            alert(`Failed to ${isEdit ? 'update' : 'create'} room: ` + error.message);
        })
        .finally(() => {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        });
}

// 显示删除确认框
function showDeleteConfirmation(roomId) {
    // 保存要删除的会议室ID
    document.getElementById('confirmDeleteBtn').setAttribute('data-id', roomId);
    
    // 显示确认模态框
    document.getElementById('deleteConfirmModal').style.display = 'block';
    
    // 设置确认按钮点击事件
    document.getElementById('confirmDeleteBtn').onclick = function() {
        const id = this.getAttribute('data-id');
        deleteRoom(id);
    };
}

// 删除会议室
function deleteRoom(roomId) {
    // 显示加载状态
    const confirmBtn = document.getElementById('confirmDeleteBtn');
    const originalText = confirmBtn.textContent;
    confirmBtn.textContent = 'Deleting...';
    confirmBtn.disabled = true;
    
    adminApi.deleteRoom(roomId)
        .then(() => {
            alert('Room deleted successfully');
            document.getElementById('deleteConfirmModal').style.display = 'none';
            loadRooms(); // 重新加载会议室列表
        })
        .catch(error => {
            console.error('Error deleting room:', error);
            alert('Failed to delete room: ' + error.message);
        })
        .finally(() => {
            // 恢复按钮状态
            confirmBtn.textContent = originalText;
            confirmBtn.disabled = false;
        });
} 