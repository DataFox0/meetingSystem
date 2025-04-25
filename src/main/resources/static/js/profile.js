document.addEventListener('DOMContentLoaded', function() {
    // 检查用户是否已登录
    if (!authStorage.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }
    
    const passwordModal = document.getElementById('passwordModal');
    const closeModalBtn = document.querySelector('.close');
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    const changePasswordForm = document.getElementById('changePasswordForm');
    
    // 加载用户资料
    loadUserProfile();
    // 加载预订统计
    loadReservationStats();
    
    // 关闭模态框
    closeModalBtn.addEventListener('click', function() {
        passwordModal.style.display = 'none';
    });
    
    // 点击模态框外部关闭模态框
    window.addEventListener('click', function(event) {
        if (event.target === passwordModal) {
            passwordModal.style.display = 'none';
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
        userApi.getUserProfile()
            .then(profile => {
                // 显示用户资料
                document.getElementById('studentId').textContent = profile.studentId;
                document.getElementById('username').textContent = profile.username;
                document.getElementById('email').textContent = profile.email;
                
                // 设置头像 - 添加调试信息
                console.log("Avatar URL from profile:", profile.avatarUrl);
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
                alert('Failed to load profile: ' + error.message);
            });
    }
    
    // 函数：加载预订统计
    function loadReservationStats() {
        reservationApi.getUserReservations()
            .then(reservations => {
                const now = new Date();
                let upcomingCount = 0;
                let pastCount = 0;
                
                // 计算统计数据
                reservations.forEach(reservation => {
                    const reservationDate = new Date(reservation.date);
                    const endTimeParts = reservation.endTime.split(':');
                    reservationDate.setHours(parseInt(endTimeParts[0], 10));
                    
                    if (!reservation.cancelled) {
                        if (reservationDate > now) {
                            upcomingCount++;
                        } else {
                            pastCount++;
                        }
                    }
                });
                
                // 显示统计数据
                document.getElementById('totalReservations').textContent = upcomingCount + pastCount;
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
}); 