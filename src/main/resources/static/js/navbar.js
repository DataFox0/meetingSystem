// Navigation bar functionality
document.addEventListener('DOMContentLoaded', function() {
  // Mobile menu toggle
  const menuToggle = document.getElementById('menuToggle');
  const mainMenu = document.getElementById('mainMenu');
  
  if (menuToggle && mainMenu) {
    menuToggle.addEventListener('click', function() {
      mainMenu.classList.toggle('active');
    });
  }
  
  // User dropdown menu toggle
  const userMenuToggle = document.getElementById('userMenuToggle');
  const userDropdown = document.getElementById('userDropdown');
  
  if (userMenuToggle && userDropdown) {
    userMenuToggle.addEventListener('click', function(e) {
      e.stopPropagation();
      userDropdown.classList.toggle('active');
    });
    
    // Close dropdown when clicking elsewhere
    document.addEventListener('click', function() {
      userDropdown.classList.remove('active');
    });
    
    // Prevent dropdown from closing when clicking inside it
    userDropdown.addEventListener('click', function(e) {
      e.stopPropagation();
    });
  }
  
  // Logout functionality
  const logoutBtn = document.getElementById('logoutBtn');
  
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function(e) {
      e.preventDefault();
      
      // Clear authentication
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      localStorage.removeItem('role');
      
      // Redirect to login page
      window.location.href = 'login.html';
    });
  }
  
  // Set active nav link based on current page
  const currentPage = window.location.pathname.split('/').pop();
  const navLinks = document.querySelectorAll('.nav-link');
  
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage) {
      link.classList.add('active');
    }
  });
  
  // Load user info from localStorage
  const navbarUsername = document.getElementById('navbarUsername');
  const navbarAvatar = document.getElementById('navbarAvatar');
  
  if (navbarUsername) {
    const username = localStorage.getItem('username');
    if (username) {
      navbarUsername.textContent = username;
    }
  }
  
  if (navbarAvatar) {
    const avatarUrl = localStorage.getItem('avatarUrl');
    if (avatarUrl) {
      navbarAvatar.src = avatarUrl;
    }
  }
}); 