document.addEventListener('DOMContentLoaded', function() {
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Log Out');
            
            // 清除认证信息
            localStorage.removeItem('token');
            localStorage.removeItem('username');
            localStorage.removeItem('role');
            
            // 重定向到登录页面
            window.location.href = 'login.html';
        });
    }
}); 