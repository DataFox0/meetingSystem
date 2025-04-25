document.addEventListener('DOMContentLoaded', function() {
    // Check authentication and redirect if not authenticated
    const auth = authStorage.getAuth();
    if (!auth.token || auth.role !== 'USER') {
        window.location.href = 'login.html';
        return;
    }
    
    // Display username
    document.getElementById('username').textContent = auth.username;
    
    // Logout functionality
    document.getElementById('logoutBtn').addEventListener('click', function(e) {
        e.preventDefault();
        authStorage.clearAuth();
        window.location.href = 'index.html';
    });
}); 