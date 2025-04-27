document.addEventListener('DOMContentLoaded', function() {
    // 检查用户是否已登录
    if (!authStorage.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }
    
    // 从URL获取会议室ID
    const urlParams = new URLSearchParams(window.location.search);
    const roomId = urlParams.get('id');
    
    if (!roomId) {
        window.location.href = 'meeting-rooms.html';
        return;
    }
    
    console.log('Loading room details for room ID:', roomId); // 添加调试日志
    
    // 加载会议室详情
    loadRoomDetails(roomId)
        .then(() => {
            // 确保会议室详情加载完成后再初始化日期选择器
            // 这样确保roomId已经设置到表单中
            initDatePicker();
        })
        .catch(error => {
            console.error('Failed to load room details:', error);
            alert('Failed to load room details: ' + error.message);
        });
    
    // 设置预订表单提交事件
    document.getElementById('reservationForm').addEventListener('submit', handleReservationSubmit);
});

// 加载会议室详情
function loadRoomDetails(roomId) {
    return new Promise((resolve, reject) => {
        roomApi.getRoomById(roomId)
            .then(room => {
                // 更新页面标题
                document.title = `${room.name} - Meeting Reservation System`;
                
                // 显示会议室详情
                document.getElementById('roomName').textContent = room.name;
                document.getElementById('roomLocation').textContent = room.location;
                document.getElementById('roomCapacity').textContent = room.capacity;
                
                // 设置会议室图片
                if (room.imageUrl) {
                    document.getElementById('roomImage').src = room.imageUrl;
                }
                
                // 显示设施
                const facilitiesList = document.getElementById('roomFacilities');
                facilitiesList.innerHTML = '';
                
                room.facilities.forEach(facility => {
                    const li = document.createElement('li');
                    li.textContent = facility;
                    facilitiesList.appendChild(li);
                });
                
                // 显示描述
                if (room.description) {
                    document.getElementById('roomDescription').textContent = room.description;
                } else {
                    document.getElementById('roomDescription').innerHTML = '<em>No description available</em>';
                }
                
                // 设置预订表单中的房间ID
                document.getElementById('roomId').value = room.id;
                
                // 设置参与人数上限
                document.getElementById('attendeesCount').max = room.capacity;
                document.getElementById('attendeesCount').placeholder = `Max: ${room.capacity}`;
                
                // 设置默认参与人数为1
                document.getElementById('attendeesCount').value = 1;
                
                resolve(); // 解析Promise
            })
            .catch(error => {
                console.error('Error loading room details:', error);
                reject(error); // 拒绝Promise
            });
    });
}

// 初始化日期选择器和时间段
function initDatePicker() {
    const dateInput = document.getElementById('date');
    const today = new Date();
    
    // 设置日期最小值为今天
    dateInput.min = formatDateForInput(today);
    dateInput.value = formatDateForInput(today);
    
    // 设置日期最大值为今天+6天（共7天）
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + 6);
    dateInput.max = formatDateForInput(maxDate);
    
    // 初始化日期选项卡
    initDateTabs(today);
    
    // 加载当前选择日期的时间段
    loadTimeSlots(dateInput.value);
    
    // 当日期改变时更新时间段
    dateInput.addEventListener('change', function() {
        const selectedDate = new Date(this.value);
        initDateTabs(selectedDate);
        loadTimeSlots(this.value);
    });
}

// 初始化日期选项卡
function initDateTabs(baseDate) {
    const dateTabsContainer = document.querySelector('.date-tabs');
    dateTabsContainer.innerHTML = '';
    
    // 创建7天的日期选项卡
    for (let i = 0; i < 7; i++) {
        const date = new Date(baseDate);
        date.setDate(date.getDate() + i);
        
        const dateTab = document.createElement('div');
        dateTab.className = 'date-tab';
        if (i === 0) dateTab.classList.add('active');
        
        const dateString = formatDateForInput(date);
        dateTab.dataset.date = dateString;
        
        // 显示日期和星期
        const dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
        const dayOfMonth = date.getDate();
        const month = date.toLocaleString('default', { month: 'short' });
        
        dateTab.innerHTML = `
            ${i === 0 ? 'Today' : dayOfWeek}<br>
            ${month} ${dayOfMonth}
        `;
        
        dateTab.addEventListener('click', function() {
            // 更新活跃的选项卡
            document.querySelectorAll('.date-tab').forEach(tab => tab.classList.remove('active'));
            this.classList.add('active');
            
            // 更新日期输入框
            document.getElementById('date').value = this.dataset.date;
            
            // 加载该日期的时间段
            loadTimeSlots(this.dataset.date);
        });
        
        dateTabsContainer.appendChild(dateTab);
    }
}

// 加载指定日期的时间段
function loadTimeSlots(dateString) {
    const roomId = document.getElementById('roomId').value;
    const timeSlotsGrid = document.getElementById('timeSlotsGrid');
    
    // 先清空内容并显示加载中
    timeSlotsGrid.innerHTML = '<div class="loading">Loading available time slots...</div>';
    
    checkAvailableTimeSlots(roomId, dateString)
        .then(availabilityData => {
            timeSlotsGrid.innerHTML = '';
            
            // 如果没有返回数据，提供默认的可用性
            if (!availabilityData || Object.keys(availabilityData).length === 0) {
                console.warn('No availability data returned, using default availability');
                availabilityData = {};
                // 所有时间段都设为可用（默认情况）
            }
            
            // 创建时间段，从08:00到22:00每小时一个
            for (let hour = 8; hour <= 21; hour++) {
                const startTime = `${hour.toString().padStart(2, '0')}:00`;
                // 如果没有明确标记为不可用，则默认为可用
                const isAvailable = availabilityData[startTime] !== 'unavailable';
                
                const timeSlot = document.createElement('div');
                timeSlot.className = `time-slot ${isAvailable ? 'available' : 'unavailable'}`;
                timeSlot.dataset.time = startTime;
                
                timeSlot.innerHTML = `
                    ${startTime} - ${(hour + 1).toString().padStart(2, '0')}:00
                    <span class="status-indicator"></span>
                `;
                
                if (isAvailable) {
                    timeSlot.addEventListener('click', handleTimeSlotSelection);
                }
                
                timeSlotsGrid.appendChild(timeSlot);
            }
        })
        .catch(error => {
            console.error('Error in loadTimeSlots:', error);
            // 显示友好的错误信息
            timeSlotsGrid.innerHTML = `
                <div class="error-message">
                    Failed to load time slots: ${error.message}
                    <button class="btn btn-small retry-btn">Retry</button>
                </div>
            `;
            
            // 添加重试按钮的事件监听
            const retryBtn = timeSlotsGrid.querySelector('.retry-btn');
            if (retryBtn) {
                retryBtn.addEventListener('click', () => loadTimeSlots(dateString));
            }
        });
    
    // 重置时间选择
    resetTimeSelection();
}

// 检查可用时间段
async function checkAvailableTimeSlots(roomId, dateString) {
    try {
        const { token } = authStorage.getAuth();
        
        // 确保正确构建 API 调用路径，使用完整的 URL
        // API_BASE_URL 可能未定义，需要确保它是 '/api' 或者完整路径
        const baseUrl = typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : '/api';
        
        console.log(`Fetching time slots for room ${roomId} on date ${dateString}`); // 添加调试日志
        
        const response = await fetch(`${baseUrl}/rooms/${roomId}/availability?date=${dateString}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        // 增强错误处理
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Server response error:', response.status, errorText);
            throw new Error(`Server responded with ${response.status}: ${errorText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error checking time slot availability:', error);
        
        // 在出错时返回一个空对象，而不是抛出错误
        // 这样页面至少能够显示时间槽，即使状态可能不准确
        return {};
    }
}

// 处理时间段选择
function handleTimeSlotSelection(event) {
    const clickedSlot = event.currentTarget;
    const timeSlotsGrid = document.getElementById('timeSlotsGrid');
    const allSlots = timeSlotsGrid.querySelectorAll('.time-slot');
    
    // 获取所有可用时间段
    const availableSlots = Array.from(allSlots).filter(slot => 
        slot.classList.contains('available')
    );
    
    // 检查是否已有选择
    const selectedSlots = timeSlotsGrid.querySelectorAll('.time-slot.selected');
    const hasSelection = selectedSlots.length > 0;
    
    // 如果点击的是已选择的时间段，则取消所有选择
    if (clickedSlot.classList.contains('selected')) {
        allSlots.forEach(slot => slot.classList.remove('selected'));
        resetTimeSelection();
        return;
    }
    
    // 如果没有选择，直接选择点击的时间段
    if (!hasSelection) {
        clickedSlot.classList.add('selected');
        const startTime = clickedSlot.dataset.time;
        const endTime = getEndTimeFromSlot(startTime);
        updateTimeSelection(startTime, endTime);
        return;
    }
    
    // 如果已有选择，则这是第二次点击，计算时间范围
    const firstSlot = selectedSlots[0];
    const firstIndex = Array.from(allSlots).indexOf(firstSlot);
    const currentIndex = Array.from(allSlots).indexOf(clickedSlot);
    
    // 确定开始和结束索引
    let startIndex = Math.min(firstIndex, currentIndex);
    let endIndex = Math.max(firstIndex, currentIndex);
    
    // 检查是否超过3小时（3个时间段）
    if (endIndex - startIndex >= 3) {
        alert('You can only book up to 3 hours at a time');
        return;
    }
    
    // 检查中间的时间段是否都可用
    let allAvailable = true;
    for (let i = startIndex; i <= endIndex; i++) {
        if (!allSlots[i].classList.contains('available')) {
            allAvailable = false;
            break;
        }
    }
    
    if (!allAvailable) {
        alert('All time slots in the range must be available');
        return;
    }
    
    // 清除之前的选择，选择新的范围
    allSlots.forEach(slot => slot.classList.remove('selected'));
    for (let i = startIndex; i <= endIndex; i++) {
        allSlots[i].classList.add('selected');
    }
    
    // 更新时间信息
    const startTime = allSlots[startIndex].dataset.time;
    const endTime = getEndTimeFromSlot(allSlots[endIndex].dataset.time);
    updateTimeSelection(startTime, endTime);
}

// 更新选择的时间信息
function updateTimeSelection(startTime, endTime) {
    const startTimeInput = document.getElementById('startTime');
    const endTimeInput = document.getElementById('endTime');
    const selectedTimeDisplay = document.getElementById('selectedTimeDisplay');
    const durationDisplay = document.getElementById('durationDisplay');
    
    startTimeInput.value = startTime;
    endTimeInput.value = endTime;
    
    // 计算持续时间（小时）
    const start = parseTimeString(startTime);
    const end = parseTimeString(endTime);
    const durationHours = (end - start) / 3600000;
    
    selectedTimeDisplay.textContent = `${startTime} - ${endTime}`;
    durationDisplay.textContent = `${durationHours} hour${durationHours > 1 ? 's' : ''}`;
}

// 重置时间选择
function resetTimeSelection() {
    const startTimeInput = document.getElementById('startTime');
    const endTimeInput = document.getElementById('endTime');
    const selectedTimeDisplay = document.getElementById('selectedTimeDisplay');
    const durationDisplay = document.getElementById('durationDisplay');
    
    startTimeInput.value = '';
    endTimeInput.value = '';
    selectedTimeDisplay.textContent = 'Not selected';
    durationDisplay.textContent = '0 hours';
}

// 从时间段的开始时间获取结束时间
function getEndTimeFromSlot(startTime) {
    const hour = parseInt(startTime.split(':')[0], 10);
    return `${(hour + 1).toString().padStart(2, '0')}:00`;
}

// 解析时间字符串为毫秒数（用于比较）
function parseTimeString(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    
    // 创建基准日期
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    
    return date.getTime();
}

// 格式化日期为输入框格式 (YYYY-MM-DD)
function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// 处理预订提交
function handleReservationSubmit(event) {
    event.preventDefault();
    
    // 获取表单数据
    const roomId = document.getElementById('roomId').value;
    const date = document.getElementById('date').value;
    const startTime = document.getElementById('startTime').value;
    const endTime = document.getElementById('endTime').value;
    const attendeesCount = document.getElementById('attendeesCount').value;
    const purpose = document.getElementById('purpose').value.trim();
    
    // 验证表单
    if (!date || !startTime || !endTime || !attendeesCount || !purpose) {
        alert('All fields are required');
        return;
    }
    
    // 验证时间选择
    if (!startTime || !endTime) {
        alert('Please select a time period');
        return;
    }
    
    // 构建预订数据
    const reservationData = {
        roomId: parseInt(roomId, 10),
        date: date,
        startTime: startTime,
        endTime: endTime,
        attendeesCount: parseInt(attendeesCount, 10),
        purpose: purpose
    };
    
    // 提交预订
    reservationApi.createReservation(reservationData)
        .then(reservation => {
            // 预订成功后更新本地存储中的统计数据
            localStorage.setItem('reservationStatsUpdated', 'true');
            
            alert('Reservation created successfully');
            window.location.href = 'my-reservations.html';
        })
        .catch(error => {
            console.error('Error creating reservation:', error);
            alert('Failed to create reservation: ' + error.message);
        });
} 