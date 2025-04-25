document.addEventListener('DOMContentLoaded', function() {
    const resetPasswordForm = document.getElementById('resetPasswordForm');
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    // Set the token value in the hidden field
    document.getElementById('token').value = token;
    
    resetPasswordForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (password !== confirmPassword) {
            alert('Passwords do not match!');
            return;
        }
        
        try {
            // Determine the role from the token
            // In a real app, you might need a separate endpoint to validate the token
            // and determine if it belongs to a user or admin
            const role = 'user'; // For simplicity, we're assuming user role
            
            await authApi.resetPassword({
                token,
                password
            }, role);
            
            // Show success message
            alert('Password reset successful! You can now login with your new password.');
            
            // Redirect to login page
            window.location.href = 'login.html';
        } catch (error) {
            alert('Failed to reset password: ' + error.message);
        }
    });
}); 