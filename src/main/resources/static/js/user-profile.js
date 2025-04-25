document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const auth = authStorage.getAuth();
    if (!auth.token || auth.role !== 'USER') {
        window.location.href = 'login.html';
        return;
    }
    
    // DOM elements
    const profileForm = document.getElementById('profileForm');
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    const passwordDialog = document.getElementById('passwordDialog');
    const closePasswordDialog = passwordDialog.querySelector('.close');
    const changePasswordForm = document.getElementById('changePasswordForm');
    const avatarUpload = document.getElementById('avatarUpload');
    const updateMessage = document.getElementById('updateMessage');
    const passwordMessage = document.getElementById('passwordMessage');
    const logoutBtn = document.getElementById('logoutBtn');
    
    // Load user profile data
    loadUserProfile();
    
    // Event listeners
    profileForm.addEventListener('submit', updateProfile);
    changePasswordBtn.addEventListener('click', () => passwordDialog.style.display = 'block');
    closePasswordDialog.addEventListener('click', () => passwordDialog.style.display = 'none');
    changePasswordForm.addEventListener('submit', updatePassword);
    avatarUpload.addEventListener('change', uploadAvatar);
    logoutBtn.addEventListener('click', function(e) {
        e.preventDefault();
        authStorage.clearAuth();
        window.location.href = 'index.html';
    });
    
    // Close modal when clicking outside of it
    window.addEventListener('click', function(event) {
        if (event.target === passwordDialog) {
            passwordDialog.style.display = 'none';
        }
    });
    
    // Functions
    async function loadUserProfile() {
        try {
            const response = await fetch('/api/users/profile', {
                headers: {
                    'Authorization': `Bearer ${auth.token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to load profile');
            }
            
            const user = await response.json();
            
            // Populate form fields
            document.getElementById('username').textContent = user.username;
            document.getElementById('studentId').value = user.studentId;
            document.getElementById('displayName').value = user.username;
            document.getElementById('email').value = user.email;
            
            // Set avatar if available
            if (user.avatarUrl) {
                document.getElementById('userAvatar').src = user.avatarUrl;
            }
        } catch (error) {
            console.error('Error loading profile:', error);
            updateMessage.textContent = 'Failed to load profile data. Please try again.';
            updateMessage.className = 'message error';
        }
    }
    
    async function updateProfile(e) {
        e.preventDefault();
        updateMessage.textContent = '';
        
        try {
            const username = document.getElementById('displayName').value;
            
            const response = await fetch('/api/users/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${auth.token}`
                },
                body: JSON.stringify({ username })
            });
            
            if (!response.ok) {
                throw new Error('Failed to update profile');
            }
            
            updateMessage.textContent = 'Profile updated successfully';
            updateMessage.className = 'message success';
            
            // Update username in UI and storage
            document.getElementById('username').textContent = username;
            const updatedAuth = authStorage.getAuth();
            updatedAuth.username = username;
            authStorage.saveAuth(updatedAuth.token, username, updatedAuth.role);
            
        } catch (error) {
            console.error('Error updating profile:', error);
            updateMessage.textContent = 'Failed to update profile. Please try again.';
            updateMessage.className = 'message error';
        }
    }
    
    async function updatePassword(e) {
        e.preventDefault();
        passwordMessage.textContent = '';
        
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (newPassword !== confirmPassword) {
            passwordMessage.textContent = 'New passwords do not match';
            passwordMessage.className = 'message error';
            return;
        }
        
        try {
            const response = await fetch('/api/users/password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${auth.token}`
                },
                body: JSON.stringify({
                    currentPassword,
                    newPassword
                })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to update password');
            }
            
            passwordMessage.textContent = 'Password updated successfully';
            passwordMessage.className = 'message success';
            
            // Reset form
            changePasswordForm.reset();
            
            // Close dialog after a delay
            setTimeout(() => {
                passwordDialog.style.display = 'none';
            }, 2000);
            
        } catch (error) {
            console.error('Error updating password:', error);
            passwordMessage.textContent = error.message || 'Failed to update password. Please try again.';
            passwordMessage.className = 'message error';
        }
    }
    
    async function uploadAvatar(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        // Check file type and size
        const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!validTypes.includes(file.type)) {
            alert('Please select a valid image file (JPEG, PNG, or GIF)');
            return;
        }
        
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            alert('File size should not exceed 5MB');
            return;
        }
        
        const formData = new FormData();
        formData.append('avatar', file);
        
        try {
            const response = await fetch('/api/users/avatar', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${auth.token}`
                },
                body: formData
            });
            
            if (!response.ok) {
                throw new Error('Failed to upload avatar');
            }
            
            const data = await response.json();
            
            // Update avatar in UI
            document.getElementById('userAvatar').src = data.avatarUrl;
            
            updateMessage.textContent = 'Avatar updated successfully';
            updateMessage.className = 'message success';
            
        } catch (error) {
            console.error('Error uploading avatar:', error);
            updateMessage.textContent = 'Failed to upload avatar. Please try again.';
            updateMessage.className = 'message error';
        }
    }
}); 