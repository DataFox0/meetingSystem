document.addEventListener('DOMContentLoaded', function() {
    // Tab switching functionality
    const userTabBtn = document.getElementById('userTabBtn');
    const adminTabBtn = document.getElementById('adminTabBtn');
    const userLoginForm = document.getElementById('userLoginForm');
    const adminLoginForm = document.getElementById('adminLoginForm');
    
    userTabBtn.addEventListener('click', function() {
        userTabBtn.classList.add('active');
        adminTabBtn.classList.remove('active');
        userLoginForm.classList.remove('hide');
        adminLoginForm.classList.add('hide');
    });
    
    adminTabBtn.addEventListener('click', function() {
        adminTabBtn.classList.add('active');
        userTabBtn.classList.remove('active');
        adminLoginForm.classList.remove('hide');
        userLoginForm.classList.add('hide');
    });
    
    // User login form submission
    const loginUserForm = document.getElementById('loginUserForm');
    loginUserForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('userEmail').value;
        const password = document.getElementById('userPassword').value;
        
        try {
            const response = await authApi.loginUser({ email, password });
            
            // Save authentication data
            authStorage.saveAuth(response.token, response.username, response.role);
            
            // Show success message
            alert('Login successful!');
            
            // Redirect to user dashboard
            window.location.href = 'user-dashboard.html';
        } catch (error) {
            alert('Login failed: ' + error.message);
        }
    });
    
    // Admin login form submission
    const loginAdminForm = document.getElementById('loginAdminForm');
    loginAdminForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('adminEmail').value;
        const password = document.getElementById('adminPassword').value;
        
        try {
            const response = await authApi.loginAdmin({ email, password });
            
            // Save authentication data
            authStorage.saveAuth(response.token, response.username, response.role);
            
            // Show success message
            alert('Login successful!');
            
            // Redirect to admin dashboard
            window.location.href = 'admin-dashboard.html';
        } catch (error) {
            alert('Login failed: ' + error.message);
        }
    });
    
    // Test database connection
    const testDbBtn = document.getElementById('testDbBtn');
    const dbStatus = document.getElementById('dbStatus');
    
    if (testDbBtn) {
        testDbBtn.addEventListener('click', async function() {
            dbStatus.innerHTML = 'Testing database connection...';
            
            try {
                const response = await fetch('/api/test/db-status');
                const data = await response.json();
                
                if (data.status === 'connected') {
                    dbStatus.innerHTML = `
                        <div class="success-message">
                            Database connected successfully!<br>
                            Users: ${data.userCount}, Admins: ${data.adminCount}
                        </div>
                    `;
                } else {
                    dbStatus.innerHTML = `
                        <div class="error-message">
                            Database connection failed: ${data.message}
                        </div>
                    `;
                }
            } catch (error) {
                dbStatus.innerHTML = `
                    <div class="error-message">
                        Database connection failed: ${error.message}
                    </div>
                `;
            }
        });
    }
    
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