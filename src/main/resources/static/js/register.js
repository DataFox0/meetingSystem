document.addEventListener('DOMContentLoaded', function() {
    // Tab switching functionality
    const userTabBtn = document.getElementById('userTabBtn');
    const adminTabBtn = document.getElementById('adminTabBtn');
    const userRegisterForm = document.getElementById('userRegisterForm');
    const adminRegisterForm = document.getElementById('adminRegisterForm');
    
    // 密码验证功能
    const userPassword = document.getElementById('userPassword');
    const adminPassword = document.getElementById('adminPassword');
    
    // 用户密码验证
    if (userPassword) {
        userPassword.addEventListener('input', function() {
            validatePassword(this.value, 'user');
        });
    }
    
    // 管理员密码验证
    if (adminPassword) {
        adminPassword.addEventListener('input', function() {
            validatePassword(this.value, 'admin');
        });
    }
    
    // 密码验证函数
    function validatePassword(password, type) {
        const prefix = type === 'admin' ? 'admin-' : '';
        
        // 检查长度
        const lengthValid = password.length >= 8;
        updateCheckmark(`${prefix}length-check`, lengthValid);
        
        // 检查大写字母
        const uppercaseValid = /[A-Z]/.test(password);
        updateCheckmark(`${prefix}uppercase-check`, uppercaseValid);
        
        // 检查小写字母
        const lowercaseValid = /[a-z]/.test(password);
        updateCheckmark(`${prefix}lowercase-check`, lowercaseValid);
        
        // 检查数字
        const numberValid = /[0-9]/.test(password);
        updateCheckmark(`${prefix}number-check`, numberValid);
        
        // 检查特殊字符
        const specialValid = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        updateCheckmark(`${prefix}special-check`, specialValid);
        
        return lengthValid && uppercaseValid && lowercaseValid && numberValid && specialValid;
    }
    
    // 更新检查标记
    function updateCheckmark(id, isValid) {
        const element = document.getElementById(id);
        if (element) {
            const icon = element.querySelector('i');
            if (icon) {
                if (isValid) {
                    icon.className = 'fas fa-check-circle';
                    icon.style.color = '#2ecc71';
                } else {
                    icon.className = 'fas fa-times-circle';
                    icon.style.color = '#6c757d';
                }
            }
        }
    }
    
    userTabBtn.addEventListener('click', function() {
        userTabBtn.classList.add('active');
        adminTabBtn.classList.remove('active');
        userRegisterForm.classList.remove('hide');
        adminRegisterForm.classList.add('hide');
    });
    
    adminTabBtn.addEventListener('click', function() {
        adminTabBtn.classList.add('active');
        userTabBtn.classList.remove('active');
        adminRegisterForm.classList.remove('hide');
        userRegisterForm.classList.add('hide');
    });
    
    // 预览用户头像
    const userAvatarFile = document.getElementById('userAvatarFile');
    const userAvatarPreview = document.getElementById('userAvatarPreview');
    const userAvatarImg = document.getElementById('userAvatarImg');
    
    userAvatarFile.addEventListener('change', function() {
        previewImage(this, userAvatarPreview, userAvatarImg);
    });
    
    // 预览管理员头像
    const adminAvatarFile = document.getElementById('adminAvatarFile');
    const adminAvatarPreview = document.getElementById('adminAvatarPreview');
    const adminAvatarImg = document.getElementById('adminAvatarImg');
    
    adminAvatarFile.addEventListener('change', function() {
        previewImage(this, adminAvatarPreview, adminAvatarImg);
    });
    
    // 图像预览函数
    function previewImage(input, previewContainer, imgElement) {
        if (input.files && input.files[0]) {
            const file = input.files[0];
            
            // 验证文件类型
            const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
            if (!validTypes.includes(file.type)) {
                alert('Please select a valid image file (JPEG, PNG, or GIF)');
                input.value = '';
                return;
            }
            
            // 验证文件大小（限制为5MB）
            if (file.size > 5 * 1024 * 1024) {
                alert('File size should not exceed 5MB');
                input.value = '';
                return;
            }
            
            const reader = new FileReader();
            
            reader.onload = function(e) {
                imgElement.src = e.target.result;
                previewContainer.style.display = 'block';
            };
            
            reader.readAsDataURL(file);
        } else {
            previewContainer.style.display = 'none';
        }
    }
    
    // User registration form submission
    const registerUserForm = document.getElementById('registerUserForm');
    registerUserForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const studentId = document.getElementById('userStudentId').value;
        const username = document.getElementById('userUsername').value;
        const email = document.getElementById('userEmail').value;
        const password = document.getElementById('userPassword').value;
        const avatarFile = document.getElementById('userAvatarFile').files[0];
        
        // 验证密码是否符合所有要求
        if (!validatePassword(password, 'user')) {
            alert('请确保您的密码符合所有要求');
            return;
        }
        
        try {
            // 首先创建用户基本信息
            const userData = { 
                studentId,
                username, 
                email, 
                password
            };
            
            const response = await authApi.registerUser(userData);
            
            // 如果有上传头像文件，则处理上传
            if (avatarFile) {
                try {
                    // 构建FormData对象
                    const formData = new FormData();
                    formData.append('avatar', avatarFile);
                    formData.append('email', email); // 添加邮箱用于标识用户
                    
                    // 手动构建fetch请求上传头像
                    await fetch('/api/auth/upload-avatar', {
                        method: 'POST',
                        body: formData
                    });
                } catch (error) {
                    console.error('Avatar upload failed:', error);
                    // 继续注册流程即使头像上传失败
                }
            }
            
            // 显示成功消息
            alert('Registration successful! Please check your email to verify your account.');
            
            // 重定向到登录页面
            window.location.href = 'login.html';
        } catch (error) {
            alert('Registration failed: ' + error.message);
        }
    });
    
    // Admin registration form submission
    const registerAdminForm = document.getElementById('registerAdminForm');
    registerAdminForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const adminData = {
            username: document.getElementById('adminUsername').value,
            email: document.getElementById('adminEmail').value,
            password: document.getElementById('adminPassword').value,
            invitationCode: document.getElementById('adminInvitationCode').value
        };
        
        // 验证密码是否符合所有要求
        if (!validatePassword(adminData.password, 'admin')) {
            alert('请确保您的密码符合所有要求');
            return;
        }
        
        const avatarFile = document.getElementById('adminAvatarFile').files[0];
        
        try {
            const response = await authApi.registerAdmin(adminData);
            
            // 如果有上传头像文件，则处理上传
            if (avatarFile) {
                try {
                    // 构建FormData对象
                    const formData = new FormData();
                    formData.append('avatar', avatarFile);
                    formData.append('email', adminData.email); // 添加邮箱用于标识管理员
                    formData.append('role', 'ADMIN'); // 添加角色标识
                    
                    // 手动构建fetch请求上传头像
                    await fetch('/api/auth/upload-avatar', {
                        method: 'POST',
                        body: formData
                    });
                } catch (error) {
                    console.error('Avatar upload failed:', error);
                    // 继续注册流程即使头像上传失败
                }
            }
            
            // 显示成功消息
            alert('Admin registered successfully! Please check your email to verify your account.');
            
            // 重定向到登录页面
            window.location.href = 'login.html';
        } catch (error) {
            alert('Registration failed: ' + error.message);
        }
    });
    
    // Check if already authenticated
    const auth = authStorage.getAuth();
    if (auth.token) {
        // Redirect to the appropriate dashboard
        if (auth.role === 'USER') {
            window.location.href = 'user-dashboard.html';
        } else if (auth.role === 'ADMIN') {
            window.location.href = 'admin-dashboard.html';
        }
    }
});