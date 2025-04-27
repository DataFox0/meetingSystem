// 统一导航栏处理
document.addEventListener('DOMContentLoaded', function() {
    // 获取当前页面URL，以便高亮当前活动的导航项
    const currentPage = window.location.pathname.split('/').pop();
    
    // 设置导航栏链接
    const navLinks = [
        // 删除了Home链接
        { href: 'user-dashboard.html', text: 'Dashboard' },
        { href: 'meeting-rooms.html', text: 'Meeting Rooms' },
        { href: 'my-reservations.html', text: 'My Reservations' },
        { href: 'profile.html', text: 'Profile' },
        { href: '#', text: 'Logout', id: 'logoutBtn' }
    ];
    
    // 获取导航菜单
    const navMenu = document.querySelector('.nav-menu');
    
    // 如果导航菜单存在，更新它
    if (navMenu) {
        let navHTML = '';
        
        navLinks.forEach(link => {
            const isActive = currentPage === link.href;
            navHTML += `
                <li class="nav-item">
                    <a href="${link.href}" class="nav-link${isActive ? ' active' : ''}"${link.id ? ` id="${link.id}"` : ''}>${link.text}</a>
                </li>
            `;
        });
        
        navMenu.innerHTML = navHTML;
        
        // 为登出按钮添加事件监听器
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function(e) {
                e.preventDefault();
                authStorage.clearAuth();
                window.location.href = 'login.html';
            });
        }
    }
}); 