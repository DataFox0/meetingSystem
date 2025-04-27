// Component loader
document.addEventListener('DOMContentLoaded', function() {
  // Load navigation bar based on user role
  const role = localStorage.getItem('role');
  const navbarPlaceholder = document.getElementById('navbar-placeholder');
  
  if (navbarPlaceholder) {
    const navbarPath = role === 'ADMIN' ? 'components/admin-navbar.html' : 'components/user-navbar.html';
    
    fetch(navbarPath)
      .then(response => response.text())
      .then(html => {
        navbarPlaceholder.innerHTML = html;
        
        // Execute navbar.js after loading the component
        const script = document.createElement('script');
        script.src = 'js/navbar.js';
        document.body.appendChild(script);
      })
      .catch(error => {
        console.error('Error loading navbar component:', error);
      });
  }
  
  // Load footer component
  const footerPlaceholder = document.getElementById('footer-placeholder');
  
  if (footerPlaceholder) {
    fetch('components/footer.html')
      .then(response => response.text())
      .then(html => {
        footerPlaceholder.innerHTML = html;
      })
      .catch(error => {
        console.error('Error loading footer component:', error);
      });
  }
}); 