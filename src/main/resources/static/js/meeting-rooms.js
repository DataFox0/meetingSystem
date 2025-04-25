document.addEventListener('DOMContentLoaded', function() {
    // 检查用户是否已登录
    if (!authStorage.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }
    
    // 加载所有会议室
    loadRooms();
    
    // 加载位置和设施选项
    loadFilterOptions();
    
    // 设置筛选表单提交事件
    document.getElementById('roomFilterForm').addEventListener('submit', handleFilterSubmit);
    document.getElementById('roomFilterForm').addEventListener('reset', handleFilterReset);
});

// 加载所有会议室
function loadRooms() {
    const roomsContainer = document.getElementById('roomsContainer');
    roomsContainer.innerHTML = '<div class="loading">Loading rooms...</div>';
    
    roomApi.getAllRooms()
        .then(rooms => {
            displayRooms(rooms);
        })
        .catch(error => {
            console.error('Error loading rooms:', error);
            roomsContainer.innerHTML = `<div class="error-message">Failed to load rooms: ${error.message}</div>`;
        });
}

// 加载筛选选项
function loadFilterOptions() {
    // 加载位置选项
    roomApi.getAllLocations()
        .then(locations => {
            const locationSelect = document.getElementById('location');
            locations.forEach(location => {
                const option = document.createElement('option');
                option.value = location;
                option.textContent = location;
                locationSelect.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Error loading locations:', error);
        });
    
    // 加载设施选项
    roomApi.getAllFacilities()
        .then(facilities => {
            const facilitiesContainer = document.getElementById('facilitiesContainer');
            facilities.forEach(facility => {
                const checkboxDiv = document.createElement('div');
                checkboxDiv.className = 'checkbox-item';
                
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = `facility-${facility}`;
                checkbox.name = 'facilities';
                checkbox.value = facility;
                
                const label = document.createElement('label');
                label.htmlFor = `facility-${facility}`;
                label.textContent = facility;
                
                checkboxDiv.appendChild(checkbox);
                checkboxDiv.appendChild(label);
                facilitiesContainer.appendChild(checkboxDiv);
            });
        })
        .catch(error => {
            console.error('Error loading facilities:', error);
        });
}

// 处理筛选表单提交
function handleFilterSubmit(event) {
    event.preventDefault();
    
    const location = document.getElementById('location').value;
    const minCapacity = document.getElementById('capacity').value;
    
    // 获取选中的设施
    const facilityCheckboxes = document.querySelectorAll('input[name="facilities"]:checked');
    const facilities = Array.from(facilityCheckboxes).map(checkbox => checkbox.value);
    
    // 构建筛选数据
    const filterData = {};
    if (location) filterData.location = location;
    if (minCapacity) filterData.minCapacity = parseInt(minCapacity, 10);
    if (facilities.length > 0) filterData.facilities = facilities;
    
    // 执行筛选
    const roomsContainer = document.getElementById('roomsContainer');
    roomsContainer.innerHTML = '<div class="loading">Filtering rooms...</div>';
    
    roomApi.filterRooms(filterData)
        .then(rooms => {
            displayRooms(rooms);
        })
        .catch(error => {
            console.error('Error filtering rooms:', error);
            roomsContainer.innerHTML = `<div class="error-message">Failed to filter rooms: ${error.message}</div>`;
        });
}

// 处理筛选重置
function handleFilterReset() {
    // 重置表单后延迟加载所有会议室
    setTimeout(() => {
        loadRooms();
    }, 100);
}

// 显示会议室
function displayRooms(rooms) {
    const roomsContainer = document.getElementById('roomsContainer');
    
    if (rooms.length === 0) {
        roomsContainer.innerHTML = '<div class="no-results">No meeting rooms found</div>';
        return;
    }
    
    roomsContainer.innerHTML = '';
    
    rooms.forEach(room => {
        const roomCard = document.createElement('div');
        roomCard.className = 'room-card card';
        
        const roomImage = document.createElement('div');
        roomImage.className = 'room-image';
        
        const img = document.createElement('img');
        img.src = room.imageUrl || 'images/default-room.jpg';
        img.alt = room.name;
        roomImage.appendChild(img);
        
        const roomContent = document.createElement('div');
        roomContent.className = 'room-content';
        
        roomContent.innerHTML = `
            <h3>${room.name}</h3>
            <div class="room-meta">
                <div><i class="icon-location"></i> ${room.location}</div>
                <div><i class="icon-people"></i> Capacity: ${room.capacity}</div>
            </div>
            <div class="room-facilities">
                ${room.facilities.map(facility => `<span class="facility-tag">${facility}</span>`).join('')}
            </div>
            <a href="room-detail.html?id=${room.id}" class="btn">View Details</a>
        `;
        
        roomCard.appendChild(roomImage);
        roomCard.appendChild(roomContent);
        roomsContainer.appendChild(roomCard);
    });
} 