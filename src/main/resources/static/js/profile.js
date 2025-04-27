document.addEventListener('DOMContentLoaded', function() {
    console.log("Profile page loaded, checking authentication...");
    
    // 检查用户是否已登录
    if (!authStorage.isAuthenticated()) {
        console.log("Not authenticated, redirecting to login page");
        window.location.href = 'login.html';
        return;
    }
    
    console.log("User is authenticated, loading profile data");
    
    const passwordModal = document.getElementById('passwordModal');
    const closeModalBtn = document.querySelector('.close');
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    const changePasswordForm = document.getElementById('changePasswordForm');
    
    // 加载用户资料
    loadUserProfile();
    // 加载预订统计
    loadReservationStats();
    
    // 检查是否有新的预订需要刷新统计数据
    checkForReservationUpdates();
    
    // 设置删除账户按钮点击事件
    const deleteAccountBtn = document.getElementById('deleteAccountBtn');
    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', function() {
            document.getElementById('deleteAccountModal').style.display = 'block';
        });
    }

    // 设置删除确认和取消按钮
    document.getElementById('confirmDeleteBtn')?.addEventListener('click', deleteUserAccount);
    document.getElementById('cancelDeleteBtn')?.addEventListener('click', function() {
        document.getElementById('deleteAccountModal').style.display = 'none';
    });
    
    // 设置关闭按钮
    document.querySelector('.close')?.addEventListener('click', function() {
        document.getElementById('deleteAccountModal').style.display = 'none';
    });
    
    // 点击模态框外部关闭模态框
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('deleteAccountModal');
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    // 打开修改密码模态框
    changePasswordBtn.addEventListener('click', function() {
        passwordModal.style.display = 'block';
    });
    
    // 修改密码表单提交事件
    changePasswordForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (newPassword !== confirmPassword) {
            alert('New passwords do not match');
            return;
        }
        
        const passwordData = {
            currentPassword,
            newPassword
        };
        
        changePassword(passwordData);
    });
    
    // 函数：加载用户资料
    function loadUserProfile() {
        console.log("Loading user profile data...");
        
        userApi.getUserProfile()
            .then(profile => {
                console.log("User profile loaded:", profile);
                
                // 显示用户资料
                document.getElementById('studentId').textContent = profile.studentId || 'N/A';
                document.getElementById('username').textContent = profile.username || 'N/A';
                document.getElementById('email').textContent = profile.email || 'N/A';
                
                // 设置头像
                if (profile.avatarUrl) {
                    const userAvatar = document.getElementById('userAvatar');
                    userAvatar.src = profile.avatarUrl;
                    userAvatar.onerror = function() {
                        console.error("Error loading avatar from:", profile.avatarUrl);
                        this.src = 'images/default-avatar.jpg'; // 加载失败时使用默认头像
                    };
                }
            })
            .catch(error => {
                console.error('Error loading profile:', error);
            });
    }
    
    // 函数：加载预订统计
    function loadReservationStats() {
        console.log("Loading reservation statistics...");
        
        // 获取预订数据并计算统计信息
        fetch('/api/reservations', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('token'),
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load reservations');
            }
            return response.json();
        })
        .then(reservations => {
            if (!Array.isArray(reservations)) {
                throw new Error('Invalid reservation data format');
            }
            
            // 统计信息初始化
            let totalCount = 0;
            let upcomingCount = 0;
            let pastCount = 0;
            
            // 计算统计数据
            const now = new Date();
            
            reservations.forEach(reservation => {
                // 跳过已取消的预订
                if (reservation.cancelled) {
                    return;
                }
                
                totalCount++;
                
                try {
                    // 解析日期和时间
                    const reservationDate = new Date(reservation.date);
                    if (reservation.endTime) {
                        const [hours, minutes] = reservation.endTime.split(':').map(Number);
                        reservationDate.setHours(hours, minutes || 0);
                    }
                    
                    // 判断是否是未来的预订
                    if (reservationDate > now) {
                        upcomingCount++;
                    } else {
                        pastCount++;
                    }
                } catch (e) {
                    console.error('Error processing reservation date:', e);
                }
            });
            
            // 更新统计数据显示
            document.getElementById('totalReservations').textContent = totalCount;
            document.getElementById('upcomingReservations').textContent = upcomingCount;
            document.getElementById('pastReservations').textContent = pastCount;
        })
        .catch(error => {
            console.error('Error loading reservation stats:', error);
        });
    }
    
    // 函数：修改密码
    function changePassword(passwordData) {
        userApi.changePassword(passwordData)
            .then(response => {
                alert('Password changed successfully!');
                passwordModal.style.display = 'none';
                changePasswordForm.reset();
            })
            .catch(error => {
                alert('Failed to change password: ' + error.message);
            });
    }
    
    // 函数：检查是否有新的预订更新
    function checkForReservationUpdates() {
        const statsUpdated = localStorage.getItem('reservationStatsUpdated');
        if (statsUpdated === 'true') {
            // 重新加载预订统计
            loadReservationStats();
            // 重置标志
            localStorage.removeItem('reservationStatsUpdated');
        }
    }
    
    // 函数：删除用户账户
    function deleteUserAccount() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) loadingOverlay.style.display = 'flex';
        
        fetch('/api/users/profile', {
            method: 'DELETE',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to delete account');
            }
            return response.text();
        })
        .then(() => {
            alert('Your account has been successfully deleted');
            // 清除本地存储的认证信息
            localStorage.removeItem('token');
            localStorage.removeItem('username');
            localStorage.removeItem('role');
            // 跳转到首页
            window.location.href = 'index.html';
        })
        .catch(error => {
            console.error('Error deleting account:', error);
            alert('Failed to delete account: ' + error.message);
            if (loadingOverlay) loadingOverlay.style.display = 'none';
            document.getElementById('deleteAccountModal').style.display = 'none';
        });
    }
}); 