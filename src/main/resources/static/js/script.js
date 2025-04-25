document.addEventListener('DOMContentLoaded', function() {
    // Update navigation based on authentication status
    function updateNavigation() {
        const navBar = document.getElementById('navBar');
        const auth = authStorage.getAuth();
        
        if (auth.token) {
            // User is authenticated
            navBar.innerHTML = `
                <ul>
                    <li><a href="index.html">Home</a></li>
                    <li><a href="${auth.role.toLowerCase()}-dashboard.html">Dashboard</a></li>
                    <li><a href="#" id="logoutBtn">Logout</a></li>
                </ul>
            `;
            
            // Add logout functionality
            document.getElementById('logoutBtn').addEventListener('click', function(e) {
                e.preventDefault();
                authStorage.clearAuth();
                window.location.href = 'index.html';
            });
        } else {
            // User is not authenticated
            navBar.innerHTML = `
                <ul>
                    <li><a href="index.html">Home</a></li>
                    <li><a href="login.html">Login</a></li>
                    <li><a href="register.html">Register</a></li>
                </ul>
            `;
        }
    }
    
    // Initialize the navigation
    if (document.getElementById('navBar')) {
        updateNavigation();
    }
}); 