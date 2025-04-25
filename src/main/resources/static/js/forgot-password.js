document.addEventListener('DOMContentLoaded', function() {
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    const urlParams = new URLSearchParams(window.location.search);
    const role = urlParams.get('role') || 'user';
    
    forgotPasswordForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        
        try {
            await authApi.resetPasswordRequest(email, role);
            
            // Show success message
            alert('Reset password email sent! Please check your inbox.');
            
            // Redirect to login page
            window.location.href = 'login.html';
        } catch (error) {
            alert('Failed to request password reset: ' + error.message);
        }
    });
}); 