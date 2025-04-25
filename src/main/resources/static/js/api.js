// API utility functions for making HTTP requests

const API_BASE_URL = '/api';

// Generic function to make API calls
async function apiCall(endpoint, method = 'GET', data = null, token = null) {
    const headers = {
        'Content-Type': 'application/json'
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    const config = {
        method,
        headers
    };
    
    if (data && (method === 'POST' || method === 'PUT' || method === 'DELETE')) {
        config.body = JSON.stringify(data);
    }
    
    try {
        console.log(`Making ${method} request to ${API_BASE_URL}${endpoint}`);
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        
        // 尝试解析响应为JSON
        let result;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            result = await response.json();
        } else {
            // 如果响应不是JSON，则创建一个包含状态的对象
            const text = await response.text();
            result = { 
                status: response.status,
                message: text || response.statusText 
            };
        }
        
        console.log(`Response from ${endpoint}:`, result);
        
        if (!response.ok) {
            // 从响应中提取错误消息
            const errorMessage = result.error || result.message || `Request failed with status ${response.status}`;
            throw new Error(errorMessage);
        }
        
        return result;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Authentication related API calls
const authApi = {
    registerUser: (userData) => apiCall('/auth/register/user', 'POST', userData),
    registerAdmin: (adminData) => apiCall('/auth/register/admin', 'POST', adminData),
    loginUser: (credentials) => apiCall('/auth/login/user', 'POST', credentials),
    loginAdmin: (credentials) => apiCall('/auth/login/admin', 'POST', credentials),
    resetPasswordRequest: (email, role) => apiCall(`/auth/reset-password-request/${role.toLowerCase()}`, 'POST', { email }),
    resetPassword: (data, role) => apiCall(`/auth/reset-password/${role.toLowerCase()}`, 'POST', data)
};

// User profile related API calls
const userApi = {
    getUserProfile: () => {
        const { token } = authStorage.getAuth();
        return apiCall('/users/profile', 'GET', null, token);
    },
    updateProfile: (profileData) => {
        const { token } = authStorage.getAuth();
        return apiCall('/users/profile', 'PUT', profileData, token);
    },
    updatePassword: (passwordData) => {
        const { token } = authStorage.getAuth();
        return apiCall('/users/password', 'PUT', passwordData, token);
    }
};

// Room related API calls
const roomApi = {
    getAllRooms: () => {
        const { token } = authStorage.getAuth();
        return apiCall('/rooms', 'GET', null, token);
    },
    getRoomById: (roomId) => {
        const { token } = authStorage.getAuth();
        return apiCall(`/rooms/${roomId}`, 'GET', null, token);
    },
    filterRooms: (filterData) => {
        const { token } = authStorage.getAuth();
        return apiCall('/rooms/filter', 'POST', filterData, token);
    },
    getAllLocations: () => {
        const { token } = authStorage.getAuth();
        return apiCall('/rooms/locations', 'GET', null, token);
    },
    getAllFacilities: () => {
        const { token } = authStorage.getAuth();
        return apiCall('/rooms/facilities', 'GET', null, token);
    }
};

// Reservation related API calls
const reservationApi = {
    getUserReservations: () => {
        const { token } = authStorage.getAuth();
        return apiCall('/reservations', 'GET', null, token);
    },
    createReservation: (reservationData) => {
        const { token } = authStorage.getAuth();
        return apiCall('/reservations', 'POST', reservationData, token);
    },
    cancelReservation: (reservationId) => {
        const { token } = authStorage.getAuth();
        return apiCall(`/reservations/${reservationId}`, 'DELETE', null, token);
    }
};

// Local storage functions to manage authentication state
const authStorage = {
    saveAuth: (token, username, role) => {
        localStorage.setItem('token', token);
        localStorage.setItem('username', username);
        localStorage.setItem('role', role);
    },
    getAuth: () => {
        return {
            token: localStorage.getItem('token'),
            username: localStorage.getItem('username'),
            role: localStorage.getItem('role')
        };
    },
    clearAuth: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        localStorage.removeItem('role');
    },
    isAuthenticated: () => !!localStorage.getItem('token')
};

// 管理员相关API调用
const adminApi = {
    // 会议室管理
    getAllRooms: () => {
        const { token } = authStorage.getAuth();
        return apiCall('/admin/rooms', 'GET', null, token);
    },
    createRoom: (roomData) => {
        const { token } = authStorage.getAuth();
        return apiCall('/admin/rooms', 'POST', roomData, token);
    },
    updateRoom: (roomId, roomData) => {
        const { token } = authStorage.getAuth();
        return apiCall(`/admin/rooms/${roomId}`, 'PUT', roomData, token);
    },
    deleteRoom: (roomId) => {
        const { token } = authStorage.getAuth();
        return apiCall(`/admin/rooms/${roomId}`, 'DELETE', null, token);
    },
    
    // 预订管理
    getAllReservations: (roomId, status) => {
        const { token } = authStorage.getAuth();
        let url = '/admin/reservations';
        
        // 添加查询参数
        const params = [];
        if (roomId) params.push(`roomId=${roomId}`);
        if (status) params.push(`status=${status}`);
        
        if (params.length > 0) {
            url += '?' + params.join('&');
        }
        
        return apiCall(url, 'GET', null, token);
    },
    deleteReservation: (reservationId) => {
        const { token } = authStorage.getAuth();
        return apiCall(`/admin/reservations/${reservationId}`, 'DELETE', null, token);
    },
    batchDeleteReservations: (ids) => {
        const { token } = authStorage.getAuth();
        return apiCall('/admin/reservations/batch', 'DELETE', ids, token);
    },
    
    // 用户管理
    getAllUsers: () => {
        const { token } = authStorage.getAuth();
        return apiCall('/admin/users', 'GET', null, token);
    },
    lockUser: (userId) => {
        const { token } = authStorage.getAuth();
        return apiCall(`/admin/users/${userId}/lock`, 'PUT', null, token);
    },
    unlockUser: (userId) => {
        const { token } = authStorage.getAuth();
        return apiCall(`/admin/users/${userId}/unlock`, 'PUT', null, token);
    },
    deleteUser: (userId) => {
        const { token } = authStorage.getAuth();
        return apiCall(`/admin/users/${userId}`, 'DELETE', null, token);
    },
    
    // 仪表盘
    getDashboardStats: () => {
        const { token } = authStorage.getAuth();
        return apiCall('/admin/dashboard/stats', 'GET', null, token);
    },
    getRecentActivity: () => {
        const { token } = authStorage.getAuth();
        return apiCall('/admin/dashboard/activity', 'GET', null, token);
    }
};