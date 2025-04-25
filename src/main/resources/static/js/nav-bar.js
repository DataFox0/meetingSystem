// 统一导航栏处理
document.addEventListener('DOMContentLoaded', function() {
    // 获取当前页面URL
    const currentUrl = window.location.href;
    const currentPage = currentUrl.substring(currentUrl.lastIndexOf('/') + 1);
    
    // 设置当前页面导航项为激活状态
    const navLinks = document.querySelectorAll('nav ul li a');
    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
    
    // 为所有页面的logout按钮添加统一的退出逻辑
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // 清除本地存储的令牌和用户信息
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            
            // 跳转到登录页面
            window.location.href = 'login.html';
        });
    }
}); 