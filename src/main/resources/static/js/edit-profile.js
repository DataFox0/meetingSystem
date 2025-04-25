document.addEventListener('DOMContentLoaded', function() {
    // 检查用户是否已登录
    if (!authStorage.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }
    
    // 加载用户资料
    loadUserProfile();
    
    // 设置表单提交事件
    document.getElementById('profileForm').addEventListener('submit', handleProfileUpdate);
    document.getElementById('passwordForm').addEventListener('submit', handlePasswordUpdate);
    document.getElementById('avatarForm').addEventListener('submit', handleAvatarUpdate);
});

// 加载用户资料
function loadUserProfile() {
    userApi.getUserProfile()
        .then(profile => {
            // 填充表单
            document.getElementById('username').value = profile.username;
            document.getElementById('email').value = profile.email;
            document.getElementById('studentId').value = profile.studentId;
        })
        .catch(error => {
            console.error('Error loading profile:', error);
            alert('Failed to load profile: ' + error.message);
        });
}

// 处理个人资料更新
function handleProfileUpdate(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    
    if (!username) {
        alert('Username cannot be empty');
        return;
    }
    
    const profileData = {
        username: username
    };
    
    userApi.updateProfile(profileData)
        .then(response => {
            console.log('Profile update response:', response); // 添加日志，帮助调试
            alert('Profile updated successfully');
            window.location.href = 'profile.html';
        })
        .catch(error => {
            console.error('Error updating profile:', error);
            alert('Failed to update profile: ' + error.message);
        });
}

// 处理密码更新
function handlePasswordUpdate(event) {
    event.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (!currentPassword || !newPassword || !confirmPassword) {
        alert('All password fields are required');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        alert('New passwords do not match');
        return;
    }
    
    const passwordData = {
        currentPassword: currentPassword,
        newPassword: newPassword
    };
    
    userApi.updatePassword(passwordData)
        .then(() => {
            alert('Password updated successfully');
            // 清空密码字段
            document.getElementById('currentPassword').value = '';
            document.getElementById('newPassword').value = '';
            document.getElementById('confirmPassword').value = '';
        })
        .catch(error => {
            console.error('Error updating password:', error);
            alert('Failed to update password: ' + error.message);
        });
}

// 处理头像更新
function handleAvatarUpdate(event) {
    event.preventDefault();
    
    const avatarInput = document.getElementById('avatar');
    if (!avatarInput.files || avatarInput.files.length === 0) {
        alert('Please select an image file');
        return;
    }
    
    const file = avatarInput.files[0];
    if (!file.type.match('image.*')) {
        alert('Please select an image file');
        return;
    }
    
    const formData = new FormData();
    formData.append('avatar', file);
    
    // 获取认证信息
    const { token } = authStorage.getAuth();
    
    // 手动构建fetch请求，因为需要发送文件
    fetch('/api/users/avatar', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.avatarUrl) {
            alert('Avatar updated successfully');
            // 可选：刷新页面以显示新头像
            window.location.reload();
        } else {
            throw new Error('No avatar URL returned');
        }
    })
    .catch(error => {
        console.error('Error updating avatar:', error);
        alert('Failed to update avatar: ' + error.message);
    });
} 