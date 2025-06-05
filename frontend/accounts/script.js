// API Configuration
const API_BASE_URL = 'http://127.0.0.1:8000';
const API_ENDPOINTS = {
    LOGIN: `${API_BASE_URL}/accounts/login/`,
    REGISTER: `${API_BASE_URL}/accounts/register/`,
    PROFILE: `${API_BASE_URL}/accounts/profile/`,
    BOOKINGS: `${API_BASE_URL}/bookings/`,
    BOOKING_STATS: `${API_BASE_URL}/bookings/dashboard-stats/`,
    NOTIFICATIONS: `${API_BASE_URL}/notifications/`,
    NOTIFICATION_COUNT: `${API_BASE_URL}/notifications/unread-count/`,
    MARK_ALL_READ: `${API_BASE_URL}/notifications/mark-all-read/`,
    SERVICES: `${API_BASE_URL}/services/`,
    SERVICE_CATEGORIES: `${API_BASE_URL}/services/categories/`,
    SERVICE_STATS: `${API_BASE_URL}/services/stats/`,
    MY_SERVICES: `${API_BASE_URL}/services/my-services/`,
    PAYMENTS: `${API_BASE_URL}/payments/`,
    PAYMENT_STATS: `${API_BASE_URL}/payments/stats/`,
    CREATE_PAYMENT: `${API_BASE_URL}/payments/create/`,
    REVIEWS: `${API_BASE_URL}/reviews/`,
    REVIEW_STATS: `${API_BASE_URL}/reviews/stats/`,
    CREATE_REVIEW: `${API_BASE_URL}/reviews/create/`,
    PUBLIC_REVIEWS: `${API_BASE_URL}/reviews/public/`
};

// Global state
let currentUser = null;
let authToken = null;
let currentSection = 'login';
let currentTheme = '';
let bookingsData = [];
let notificationsData = [];
let servicesData = [];
let categoriesData = [];
let paymentsData = [];
let reviewsData = [];
let currentServiceView = 'browse'; // 'browse' or 'manage'
let serviceFilters = {
    category: '',
    search: '',
    sort: 'name'
};
let paymentFilters = {
    status: '',
    date: ''
};
let reviewFilters = {
    rating: '',
    search: ''
};

// DOM Elements
const elements = {
    // Sections
    loginSection: document.getElementById('login-section'),
    registerSection: document.getElementById('register-section'),
    dashboardSection: document.getElementById('dashboard-section'),
    servicesSection: document.getElementById('services-section'),
    bookingsSection: document.getElementById('bookings-section'),
    notificationsSection: document.getElementById('notifications-section'),
    profileSection: document.getElementById('profile-section'),
    categoryServicesSection: document.getElementById('category-services-section'),
    
    // Navigation
    loginBtn: document.getElementById('login-btn'),
    registerBtn: document.getElementById('register-btn'),
    dashboardBtn: document.getElementById('dashboard-btn'),
    servicesBtn: document.getElementById('services-btn'),
    bookingsBtn: document.getElementById('bookings-btn'),
    notificationsBtn: document.getElementById('notifications-btn'),
    profileBtn: document.getElementById('profile-btn'),
    logoutBtn: document.getElementById('logout-btn'),
    myServicesBtn: document.getElementById('my-services-btn'),
    browseCategoriesBtn: document.getElementById('browse-categories-btn'),
    
    // Forms
    loginForm: document.getElementById('login-form'),
    registerForm: document.getElementById('register-form'),
    
    // Auth toggles
    showRegister: document.getElementById('show-register'),
    showLogin: document.getElementById('show-login'),
    
    // User type handling
    userType: document.getElementById('user-type'),
    providerFields: document.getElementById('provider-fields'),
    
    // Alert container
    alertContainer: document.getElementById('alert-container'),
    
    // Loading spinner
    loadingSpinner: document.getElementById('loading-spinner'),
    
    // Notification badge
    notificationBadge: document.getElementById('notification-badge'),
    
    // Modals
    modal: document.getElementById('booking-modal'),
    modalClose: document.getElementById('close-modal'),
    serviceModal: document.getElementById('service-modal'),
    serviceModalClose: document.getElementById('close-service-modal')
};

// Utility Functions
function showAlert(message, type = 'info') {
    const alert = document.createElement('div');
    alert.className = `alert ${type}`;
    alert.textContent = message;
    
    elements.alertContainer.appendChild(alert);
    
    setTimeout(() => {
        alert.remove();
    }, 5000);
}

function showLoading() {
    elements.loadingSpinner.classList.remove('hidden');
}

function hideLoading() {
    elements.loadingSpinner.classList.add('hidden');
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Theme Management
function applyTheme(userType) {
    // Remove existing themes
    document.body.classList.remove('customer-theme', 'provider-theme');
    
    // Apply appropriate theme
    if (userType === 'customer') {
        document.body.classList.add('customer-theme');
        currentTheme = 'customer-theme';
        showCustomerElements();
    } else if (userType === 'provider') {
        document.body.classList.add('provider-theme');
        currentTheme = 'provider-theme';
        showProviderElements();
    }
}

function showCustomerElements() {
    // Show customer-specific elements
    const customerActions = document.getElementById('customer-quick-actions');
    const providerActions = document.getElementById('provider-quick-actions');
    const customerFab = document.getElementById('customer-fab');
    
    if (customerActions) customerActions.classList.remove('hidden');
    if (providerActions) providerActions.classList.add('hidden');
    if (customerFab) customerFab.classList.remove('hidden');
    
    // Show browse categories button
    if (elements.browseCategoriesBtn) {
        elements.browseCategoriesBtn.classList.remove('hidden');
    }
    
    // Hide my services button
    if (elements.myServicesBtn) {
        elements.myServicesBtn.classList.add('hidden');
    }
}

function showProviderElements() {
    // Show provider-specific elements
    const customerActions = document.getElementById('customer-quick-actions');
    const providerActions = document.getElementById('provider-quick-actions');
    const customerFab = document.getElementById('customer-fab');
    
    if (customerActions) customerActions.classList.add('hidden');
    if (providerActions) providerActions.classList.remove('hidden');
    if (customerFab) customerFab.classList.add('hidden');
    
    // Show my services button
    if (elements.myServicesBtn) {
        elements.myServicesBtn.classList.remove('hidden');
    }
    
    // Hide browse categories button
    if (elements.browseCategoriesBtn) {
        elements.browseCategoriesBtn.classList.add('hidden');
    }
}

// Category-based Service Functions
function showCategoryServices(categoryName) {
    // Map category names to display names
    const categoryDisplayNames = {
        'education': 'Education & Training',
        'travel': 'Travel & Transportation',
        'food': 'Food & Dining',
        'beauty': 'Beauty & Wellness',
        'home': 'Home Services',
        'business': 'Business & Consulting'
    };
    
    // Update section title
    const categoryTitle = document.getElementById('category-title');
    if (categoryTitle) {
        categoryTitle.innerHTML = `<i class="fas fa-${getCategoryIcon(categoryName)}"></i> ${categoryDisplayNames[categoryName] || categoryName}`;
    }
    
    // Show category services section
    showSection('category-services');
    
    // Load services for this category
    loadCategoryServices(categoryName);
}

function getCategoryIcon(categoryName) {
    const icons = {
        'education': 'graduation-cap',
        'travel': 'plane',
        'food': 'utensils',
        'beauty': 'spa',
        'home': 'home',
        'business': 'briefcase'
    };
    return icons[categoryName] || 'tag';
}

async function loadCategoryServices(categoryName) {
    try {
        showLoading();
        
        // Map category names to actual category IDs or names
        const categoryMap = {
            'education': 'Education & Training',
            'travel': 'Travel & Transportation',
            'food': 'Food & Catering',
            'beauty': 'Beauty & Spa',
            'home': 'Home Services',
            'business': 'Consulting'
        };
        
        const categoryFilter = categoryMap[categoryName];
        let url = API_ENDPOINTS.SERVICES;
        
        if (categoryFilter) {
            url += `?category_name=${encodeURIComponent(categoryFilter)}`;
        }
        
        const services = await makeAPIRequest(url);
        renderCategoryServices(services);
        
    } catch (error) {
        showAlert('Failed to load category services: ' + error.message, 'error');
        const container = document.getElementById('category-services-grid');
        if (container) {
            container.innerHTML = '<p class="no-data">Failed to load services</p>';
        }
    } finally {
        hideLoading();
    }
}

function renderCategoryServices(services) {
    const container = document.getElementById('category-services-grid');
    if (!container) return;
    
    if (!services || services.length === 0) {
        container.innerHTML = '<p class="no-data">No services found in this category</p>';
        return;
    }
    
    container.innerHTML = services.map(service => createServiceCard(service)).join('');
}

// API Helper Functions
async function makeAPIRequest(url, options = {}) {
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        }
    };
    
    if (authToken) {
        defaultOptions.headers['Authorization'] = `Token ${authToken}`;
    }
    
    const finalOptions = { ...defaultOptions, ...options };
    
    try {
        const response = await fetch(url, finalOptions);
        
        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(errorData);
        }
        
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        }
        
        return await response.text();
    } catch (error) {
        console.error('API Request failed:', error);
        throw error;
    }
}

// Authentication Functions
async function login(username, password) {
    showLoading();
    try {
        const data = await makeAPIRequest(API_ENDPOINTS.LOGIN, {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
        
        authToken = data.token;
        currentUser = data.user;
        
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        showAlert('Login successful!', 'success');
        updateUIForLoggedInUser();
        await loadDashboard();
        
    } catch (error) {
        showAlert('Login failed: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

async function register(formData) {
    showLoading();
    try {
        const data = await makeAPIRequest(API_ENDPOINTS.REGISTER, {
            method: 'POST',
            body: JSON.stringify(formData)
        });
        
        showAlert('Registration successful! Please login.', 'success');
        showSection('login');
        
    } catch (error) {
        showAlert('Registration failed: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

async function logout() {
    authToken = null;
    currentUser = null;
    
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    
    updateUIForLoggedOutUser();
    showSection('login');
    showAlert('Logged out successfully!', 'info');
}

// UI State Management
function updateUIForLoggedInUser() {
    // Hide auth buttons, show app buttons
    elements.loginBtn.classList.add('hidden');
    elements.registerBtn.classList.add('hidden');
    
    elements.dashboardBtn.classList.remove('hidden');
    elements.servicesBtn.classList.remove('hidden');
    elements.bookingsBtn.classList.remove('hidden');
    elements.notificationsBtn.classList.remove('hidden');
    elements.profileBtn.classList.remove('hidden');
    elements.logoutBtn.classList.remove('hidden');
    
    // Apply user-type specific theme
    applyTheme(currentUser.user_type);
    
    // Show welcome message
    showSection('dashboard');
    showWelcomeMessage();
}

function showWelcomeMessage() {
    const welcomeElement = document.getElementById('dashboard-welcome');
    if (welcomeElement && currentUser) {
        if (currentUser.user_type === 'provider') {
            welcomeElement.textContent = `Welcome back, ${currentUser.first_name || currentUser.username}! Manage your services and bookings.`;
        } else if (currentUser.user_type === 'customer') {
            welcomeElement.textContent = `Welcome back, ${currentUser.first_name || currentUser.username}! Discover and book amazing services.`;
        } else {
            welcomeElement.textContent = `Welcome back, ${currentUser.first_name || currentUser.username}!`;
        }
    }
}

function updateUIForLoggedOutUser() {
    // Show auth buttons, hide app buttons
    elements.loginBtn.classList.remove('hidden');
    elements.registerBtn.classList.remove('hidden');
    
    elements.dashboardBtn.classList.add('hidden');
    elements.servicesBtn.classList.add('hidden');
    elements.bookingsBtn.classList.add('hidden');
    elements.notificationsBtn.classList.add('hidden');
    elements.profileBtn.classList.add('hidden');
    elements.logoutBtn.classList.add('hidden');
    
    if (elements.myServicesBtn) elements.myServicesBtn.classList.add('hidden');
    if (elements.browseCategoriesBtn) elements.browseCategoriesBtn.classList.add('hidden');
    
    // Reset theme
    document.body.classList.remove('provider-theme', 'customer-theme');
    currentTheme = '';
    
    showSection('login');
}

function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.auth-section, .main-section').forEach(section => {
        section.classList.add('hidden');
    });
    
    // Remove active class from all nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Show requested section and mark nav button as active
    currentSection = sectionName;
    
    switch(sectionName) {
        case 'login':
            elements.loginSection.classList.remove('hidden');
            elements.loginBtn.classList.add('active');
            break;
        case 'register':
            elements.registerSection.classList.remove('hidden');
            elements.registerBtn.classList.add('active');
            break;
        case 'dashboard':
            elements.dashboardSection.classList.remove('hidden');
            elements.dashboardBtn.classList.add('active');
            loadDashboard();
            break;
        case 'services':
            elements.servicesSection.classList.remove('hidden');
            elements.servicesBtn.classList.add('active');
            loadServices();
            break;
        case 'bookings':
            elements.bookingsSection.classList.remove('hidden');
            elements.bookingsBtn.classList.add('active');
            loadBookings();
            break;
        case 'notifications':
            elements.notificationsSection.classList.remove('hidden');
            elements.notificationsBtn.classList.add('active');
            loadNotifications();
            break;
        case 'profile':
            elements.profileSection.classList.remove('hidden');
            elements.profileBtn.classList.add('active');
            loadProfile();
            break;
        case 'category-services':
            if (elements.categoryServicesSection) {
                elements.categoryServicesSection.classList.remove('hidden');
            }
            break;
    }
}

// Dashboard Functions
async function loadDashboard() {
    try {
        showLoading();
        
        // Load dashboard stats
        const stats = await makeAPIRequest(API_ENDPOINTS.BOOKING_STATS);
        updateDashboardStats(stats);
        
        // Load recent bookings and notifications
        await Promise.all([
            loadRecentBookings(),
            loadRecentNotifications(),
            updateNotificationBadge()
        ]);
        
        // Update welcome message
        showWelcomeMessage();
            
    } catch (error) {
        showAlert('Failed to load dashboard: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

function updateDashboardStats(stats) {
    document.getElementById('total-bookings').textContent = stats.total_bookings || 0;
    document.getElementById('pending-bookings').textContent = stats.pending_bookings || 0;
    document.getElementById('completed-bookings').textContent = stats.completed_bookings || 0;
    
    // Show revenue card only for providers
    const revenueCard = document.getElementById('revenue-card');
    if (currentUser.user_type === 'provider' && stats.total_revenue !== undefined) {
        revenueCard.classList.remove('hidden');
        document.getElementById('total-revenue').textContent = formatCurrency(stats.total_revenue);
    } else {
        revenueCard.classList.add('hidden');
    }
}

async function loadRecentBookings() {
    try {
        const response = await makeAPIRequest(API_ENDPOINTS.BOOKINGS);
        const recentBookings = response.slice(0, 5); // Get first 5 bookings
        
        const container = document.getElementById('recent-bookings');
        
        if (recentBookings.length === 0) {
            container.innerHTML = '<p class="no-data">No recent bookings</p>';
            return;
        }
        
        container.innerHTML = recentBookings.map(booking => `
            <div class="booking-item" onclick="showBookingDetails(${booking.id})">
                <div class="booking-header">
                    <span class="booking-id">Booking #${booking.id}</span>
                    <span class="booking-status ${booking.status}">${booking.status_display || booking.status}</span>
                </div>
                <div class="booking-details">
                    <div class="booking-detail">
                        <label>Service:</label>
                        <span>${booking.service_name || booking.service}</span>
                    </div>
                    <div class="booking-detail">
                        <label>Date:</label>
                        <span>${formatDate(booking.booking_date)}</span>
                    </div>
                    <div class="booking-detail">
                        <label>Price:</label>
                        <span>${formatCurrency(booking.total_price)}</span>
                    </div>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        document.getElementById('recent-bookings').innerHTML = '<p class="no-data">Failed to load bookings</p>';
    }
}

async function loadRecentNotifications() {
    try {
        const response = await makeAPIRequest(API_ENDPOINTS.NOTIFICATIONS);
        const recentNotifications = response.slice(0, 5); // Get first 5 notifications
        
        const container = document.getElementById('recent-notifications');
        
        if (recentNotifications.length === 0) {
            container.innerHTML = '<p class="no-data">No recent notifications</p>';
            return;
        }
        
        container.innerHTML = recentNotifications.map(notification => `
            <div class="notification-item ${!notification.is_read ? 'unread' : ''}">
                <div class="notification-header">
                    <span class="notification-title">${notification.title}</span>
                    <span class="notification-time">${notification.time_ago || formatDate(notification.created_at)}</span>
                </div>
                <div class="notification-message">${notification.message}</div>
            </div>
        `).join('');
        
    } catch (error) {
        document.getElementById('recent-notifications').innerHTML = '<p class="no-data">Failed to load notifications</p>';
    }
}

// Bookings Functions
async function loadBookings() {
    try {
        showLoading();
        
        const response = await makeAPIRequest(API_ENDPOINTS.BOOKINGS);
        bookingsData = response;
        renderBookings(bookingsData);
        
    } catch (error) {
        showAlert('Failed to load bookings: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

function renderBookings(bookings) {
    const container = document.getElementById('bookings-list');
    
    if (bookings.length === 0) {
        container.innerHTML = '<p class="no-data">No bookings found</p>';
        return;
    }
    
    container.innerHTML = bookings.map(booking => `
        <div class="booking-item">
            <div class="booking-header">
                <span class="booking-id">Booking #${booking.id}</span>
                <span class="booking-status ${booking.status}">${booking.status_display || booking.status}</span>
            </div>
            <div class="booking-details">
                <div class="booking-detail">
                    <label>Service:</label>
                    <span>${booking.service_name || booking.service}</span>
                </div>
                <div class="booking-detail">
                    <label>${currentUser.user_type === 'customer' ? 'Provider' : 'Customer'}:</label>
                    <span>${currentUser.user_type === 'customer' ? booking.provider_name : booking.customer_name}</span>
                </div>
                <div class="booking-detail">
                    <label>Date:</label>
                    <span>${formatDate(booking.booking_date)}</span>
                </div>
                <div class="booking-detail">
                    <label>Duration:</label>
                    <span>${booking.service_duration || booking.duration} minutes</span>
                </div>
                <div class="booking-detail">
                    <label>Price:</label>
                    <span>${formatCurrency(booking.total_price)}</span>
                </div>
                ${booking.notes ? `
                <div class="booking-detail">
                    <label>Notes:</label>
                    <span>${booking.notes}</span>
                </div>
                ` : ''}
            </div>
            <div class="booking-actions">
                <button class="btn btn-sm btn-secondary" onclick="showBookingDetails(${booking.id})">
                    <i class="fas fa-eye"></i> View Details
                </button>
                ${getBookingActionButtons(booking)}
            </div>
        </div>
    `).join('');
}

function getBookingActionButtons(booking) {
    let buttons = [];
    
    // Provider actions
    if (currentUser.user_type === 'provider') {
        if (booking.status === 'pending') {
            buttons.push(`<button class="btn btn-sm btn-primary" onclick="updateBookingStatus(${booking.id}, 'confirmed')">
                <i class="fas fa-check"></i> Confirm
            </button>`);
            buttons.push(`<button class="btn btn-sm btn-danger" onclick="updateBookingStatus(${booking.id}, 'cancelled')">
                <i class="fas fa-times"></i> Cancel
            </button>`);
        } else if (booking.status === 'confirmed') {
            buttons.push(`<button class="btn btn-sm btn-primary" onclick="updateBookingStatus(${booking.id}, 'completed')">
                <i class="fas fa-check-circle"></i> Complete
            </button>`);
        }
    }
    
    // Customer actions
    if (currentUser.user_type === 'customer') {
        if (booking.status === 'pending' || booking.status === 'confirmed') {
            buttons.push(`<button class="btn btn-sm btn-danger" onclick="updateBookingStatus(${booking.id}, 'cancelled')">
                <i class="fas fa-times"></i> Cancel
            </button>`);
        }
    }
    
    return buttons.join('');
}

async function updateBookingStatus(bookingId, newStatus) {
    try {
        showLoading();
        
        const response = await makeAPIRequest(`${API_ENDPOINTS.BOOKINGS}${bookingId}/`, {
            method: 'PATCH',
            body: JSON.stringify({ 
                status: newStatus
            })
        });
        
        showAlert('Booking status updated successfully', 'success');
        await loadBookings(); // Reload bookings
        await updateNotificationBadge(); // Update notification count
        
    } catch (error) {
        showAlert('Failed to update booking status: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

function showBookingDetails(bookingId) {
    const booking = bookingsData.find(b => b.id === bookingId);
    if (!booking) return;
    
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const modalFooter = document.getElementById('modal-footer');
    
    modalTitle.textContent = `Booking #${booking.id} Details`;
    
    modalBody.innerHTML = `
        <div class="booking-details">
            <div class="booking-detail">
                <label>Status:</label>
                <span class="booking-status ${booking.status}">${booking.status_display || booking.status}</span>
            </div>
            <div class="booking-detail">
                <label>Service:</label>
                <span>${booking.service_name || booking.service}</span>
            </div>
            <div class="booking-detail">
                <label>Customer:</label>
                <span>${booking.customer_name} (${booking.customer_email || booking.customer})</span>
            </div>
            <div class="booking-detail">
                <label>Provider:</label>
                <span>${booking.provider_name} (${booking.provider_email || booking.provider})</span>
            </div>
            <div class="booking-detail">
                <label>Booking Date:</label>
                <span>${formatDate(booking.booking_date)}</span>
            </div>
            <div class="booking-detail">
                <label>Duration:</label>
                <span>${booking.service_duration || booking.duration} minutes</span>
            </div>
            <div class="booking-detail">
                <label>Total Price:</label>
                <span>${formatCurrency(booking.total_price)}</span>
            </div>
            <div class="booking-detail">
                <label>Created:</label>
                <span>${formatDate(booking.created_at)}</span>
            </div>
            <div class="booking-detail">
                <label>Last Updated:</label>
                <span>${formatDate(booking.updated_at)}</span>
            </div>
            ${booking.notes ? `
            <div class="booking-detail">
                <label>Notes:</label>
                <span>${booking.notes}</span>
            </div>
            ` : ''}
        </div>
    `;
    
    modalFooter.innerHTML = `
        <button class="btn btn-secondary" onclick="closeModal()">Close</button>
        ${getBookingActionButtons(booking)}
    `;
    
    elements.modal.classList.remove('hidden');
}

// Notifications Functions
async function loadNotifications() {
    try {
        showLoading();
        
        const response = await makeAPIRequest(API_ENDPOINTS.NOTIFICATIONS);
        notificationsData = response;
        renderNotifications(notificationsData);
        
    } catch (error) {
        showAlert('Failed to load notifications: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

function renderNotifications(notifications) {
    const container = document.getElementById('notifications-list');
    
    if (notifications.length === 0) {
        container.innerHTML = '<p class="no-data">No notifications</p>';
        return;
    }
    
    container.innerHTML = notifications.map(notification => `
        <div class="notification-item ${!notification.is_read ? 'unread' : ''}">
            <div class="notification-header">
                <span class="notification-title">${notification.title}</span>
                <span class="notification-time">${notification.time_ago || formatDate(notification.created_at)}</span>
            </div>
            <div class="notification-message">${notification.message}</div>
            <div class="notification-actions">
                ${!notification.is_read ? `
                    <button class="btn btn-sm btn-primary" onclick="markAsRead(${notification.id})">
                        <i class="fas fa-check"></i> Mark as Read
                    </button>
                ` : ''}
                <button class="btn btn-sm btn-danger" onclick="deleteNotification(${notification.id})">
                    <i class="fas fa-trash"></i> Delete
                </button>
                ${notification.action_url ? `
                    <button class="btn btn-sm btn-secondary" onclick="window.open('${notification.action_url}', '_blank')">
                        <i class="fas fa-external-link-alt"></i> View
                    </button>
                ` : ''}
            </div>
        </div>
    `).join('');
}

async function markAsRead(notificationId) {
    try {
        await makeAPIRequest(`${API_ENDPOINTS.NOTIFICATIONS}${notificationId}/read/`, {
            method: 'POST'
        });
        
        await loadNotifications();
        await updateNotificationBadge();
        
    } catch (error) {
        showAlert('Failed to mark notification as read: ' + error.message, 'error');
    }
}

async function markAllAsRead() {
    try {
        showLoading();
        
        const response = await makeAPIRequest(API_ENDPOINTS.MARK_ALL_READ, {
            method: 'POST'
        });
        
        showAlert('All notifications marked as read', 'success');
        await loadNotifications();
        await updateNotificationBadge();
        
    } catch (error) {
        showAlert('Failed to mark all notifications as read: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

async function deleteNotification(notificationId) {
    if (!confirm('Are you sure you want to delete this notification?')) {
        return;
    }
    
    try {
        await makeAPIRequest(`${API_ENDPOINTS.NOTIFICATIONS}${notificationId}/delete/`, {
            method: 'DELETE'
        });
        
        await loadNotifications();
        await updateNotificationBadge();
        showAlert('Notification deleted successfully', 'success');
        
    } catch (error) {
        showAlert('Failed to delete notification: ' + error.message, 'error');
    }
}

async function updateNotificationBadge() {
    try {
        const response = await makeAPIRequest(API_ENDPOINTS.NOTIFICATION_COUNT);
        const count = response.unread_count || response.count || 0;
        
        if (count > 0) {
            elements.notificationBadge.textContent = count;
            elements.notificationBadge.classList.remove('hidden');
        } else {
            elements.notificationBadge.classList.add('hidden');
        }
        
    } catch (error) {
        console.error('Failed to update notification badge:', error);
    }
}

// Profile Functions
async function loadProfile() {
    try {
        showLoading();
        
        const response = await makeAPIRequest(API_ENDPOINTS.PROFILE);
        renderProfile(response);
        
    } catch (error) {
        showAlert('Failed to load profile: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

function renderProfile(response) {
    // Extract user and profile data from response
    const user = response.user || response;
    const profile = response.profile || {};
    
    // Update profile header
    document.getElementById('profile-name').textContent = 
        `${user.first_name} ${user.last_name}` || user.username;
    document.getElementById('profile-type').textContent = 
        user.user_type ? user.user_type.charAt(0).toUpperCase() + user.user_type.slice(1) : 'User';
    
    // Update basic info
    document.getElementById('profile-username').textContent = user.username || '-';
    document.getElementById('profile-email').textContent = user.email || '-';
    document.getElementById('profile-phone').textContent = user.phone || '-';
    document.getElementById('profile-joined').textContent = user.date_joined ? formatDate(user.date_joined) : '-';
    
    // Show/hide profile sections based on user type
    const customerProfile = document.getElementById('customer-profile');
    const providerProfile = document.getElementById('provider-profile');
    
    if (user.user_type === 'customer') {
        customerProfile.classList.remove('hidden');
        providerProfile.classList.add('hidden');
        
        // Update customer profile - using safe defaults
        document.getElementById('preferred-categories').textContent = 'All Categories';
        document.getElementById('customer-total-bookings').textContent = profile.total_bookings || '0';
        document.getElementById('favorite-services').textContent = 'None yet';
        
        const statusBadge = document.getElementById('profile-status');
        statusBadge.textContent = user.is_verified ? 'Verified Customer' : 'Active Customer';
        statusBadge.className = `status-badge ${user.is_verified ? 'verified' : 'unverified'}`;
        
    } else if (user.user_type === 'provider') {
        customerProfile.classList.add('hidden');
        providerProfile.classList.remove('hidden');
        
        // Update provider profile - using safe defaults
        document.getElementById('business-name-display').textContent = profile.business_name || user.username;
        document.getElementById('business-description').textContent = profile.description || 'Professional service provider';
        document.getElementById('business-location').textContent = profile.location || 'Location not specified';
        document.getElementById('provider-total-services').textContent = profile.total_services || '0';
        document.getElementById('provider-total-bookings').textContent = profile.total_bookings || '0';
        document.getElementById('provider-rating').textContent = profile.average_rating ? `${profile.average_rating}/5` : 'No ratings yet';
        
        const statusBadge = document.getElementById('profile-status');
        statusBadge.textContent = user.is_verified ? 'Verified Provider' : 'Pending Verification';
        statusBadge.className = `status-badge ${user.is_verified ? 'verified' : 'unverified'}`;
    }
}

// Services Functions
async function loadServices() {
    try {
        showLoading();
        
        // Load services
        await loadServicesData();
        
    } catch (error) {
        showAlert('Failed to load services: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

async function loadServicesData() {
    try {
        let url = API_ENDPOINTS.SERVICES;
        
        // Apply filters
        const params = new URLSearchParams();
        if (serviceFilters.category) {
            params.append('category', serviceFilters.category);
        }
        if (serviceFilters.search) {
            params.append('search', serviceFilters.search);
        }
        if (serviceFilters.sort) {
            params.append('order_by', serviceFilters.sort);
        }
        
        if (params.toString()) {
            url += '?' + params.toString();
        }
        
        const response = await makeAPIRequest(url);
        servicesData = response;
        renderServices();
    } catch (error) {
        console.error('Failed to load services:', error);
        document.getElementById('services-list').innerHTML = '<p class="no-data">Failed to load services</p>';
    }
}

function renderServices() {
    const container = document.getElementById('services-list');
    
    if (servicesData.length === 0) {
        container.innerHTML = '<p class="no-data">No services found</p>';
        return;
    }
    
    container.innerHTML = servicesData.map(service => createServiceCard(service)).join('');
}

function createServiceCard(service) {
    const isProvider = currentUser?.user_type === 'provider';
    const isOwner = isProvider && service.provider === currentUser.id;
    
    return `
        <div class="service-card ${currentTheme === 'customer-theme' ? 'interactive-card' : 'flat-card'}">
            <div class="service-header">
                <div>
                    <h3 class="service-title">${service.name}</h3>
                    <p class="service-provider">by ${service.provider_name}</p>
                </div>
                <div class="service-price">${formatCurrency(service.price)}</div>
            </div>
            <p class="service-description">${service.description}</p>
            <div class="service-meta">
                <span><i class="fas fa-clock"></i> ${service.duration} mins</span>
                <span><i class="fas fa-star"></i> ${service.average_rating || 'No ratings'}</span>
            </div>
            <div class="service-actions">
                ${isOwner ? `
                    <button class="btn btn-secondary btn-sm" onclick="editService(${service.id})">
                        <i class="fas fa-edit"></i>
                        Edit
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deleteService(${service.id})">
                        <i class="fas fa-trash"></i>
                        Delete
                    </button>
                ` : `
                    <button class="btn btn-secondary btn-sm" onclick="showServiceDetails(${service.id})">
                        <i class="fas fa-info-circle"></i>
                        Details
                    </button>
                    ${currentUser?.user_type === 'customer' ? `
                        <button class="btn btn-primary btn-sm" onclick="bookService(${service.id})">
                            <i class="fas fa-calendar-plus"></i>
                            Book
                        </button>
                    ` : ''}
                `}
            </div>
        </div>
    `;
}

// Service Modal Functions
async function showServiceDetails(serviceId) {
    try {
        showLoading();
        
        const service = await makeAPIRequest(`${API_ENDPOINTS.SERVICES}${serviceId}/`);
        
        document.getElementById('service-modal-title').textContent = service.name;
        document.getElementById('service-modal-body').innerHTML = `
            <div class="service-details">
                <div class="service-detail">
                    <label>Provider</label>
                    <span>${service.provider_name}</span>
                </div>
                <div class="service-detail">
                    <label>Category</label>
                    <span class="service-category">${service.category_name}</span>
                </div>
                <div class="service-detail">
                    <label>Price</label>
                    <span>${formatCurrency(service.price)}</span>
                </div>
                <div class="service-detail">
                    <label>Duration</label>
                    <span>${service.duration} minutes</span>
                </div>
                <div class="service-detail">
                    <label>Rating</label>
                    <span class="service-rating">${service.average_rating || 'No ratings'}</span>
                </div>
                <div class="service-detail">
                    <label>Description</label>
                    <span>${service.description}</span>
                </div>
                ${service.requirements ? `
                    <div class="service-detail">
                        <label>Requirements</label>
                        <span>${service.requirements}</span>
                    </div>
                ` : ''}
            </div>
        `;
        
        document.getElementById('service-modal-footer').innerHTML = `
            ${currentUser?.user_type === 'customer' ? `
                <button class="btn btn-primary" onclick="bookService(${service.id}); closeServiceModal();">
                    <i class="fas fa-calendar-plus"></i>
                    Book This Service
                </button>
            ` : ''}
            <button class="btn btn-secondary" onclick="closeServiceModal()">Close</button>
        `;
        
        elements.serviceModal.classList.remove('hidden');
        
    } catch (error) {
        showAlert('Failed to load service details: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

function closeServiceModal() {
    elements.serviceModal.classList.add('hidden');
}

// Modal Functions
function closeModal() {
    elements.modal.classList.add('hidden');
}

// Demo and Quick Actions
function fillDemoLogin(username, password) {
    document.getElementById('login-username').value = username;
    document.getElementById('login-password').value = password;
}

async function bookService(serviceId) {
    // For now, show a placeholder - this would normally open a booking form
    showAlert('Booking functionality coming soon! Service ID: ' + serviceId, 'info');
}

function showQuickBooking() {
    showSection('services');
}

function showMyServices() {
    showSection('services');
    // Filter to show only current user's services
    if (currentUser?.user_type === 'provider') {
        // This would normally filter services by current provider
        loadServices();
    }
}

function showAddServiceForm() {
    showAlert('Add service form coming soon!', 'info');
}

function editService(serviceId) {
    showAlert('Edit service functionality coming soon! Service ID: ' + serviceId, 'info');
}

function deleteService(serviceId) {
    if (confirm('Are you sure you want to delete this service?')) {
        showAlert('Delete service functionality coming soon! Service ID: ' + serviceId, 'info');
    }
}

function editProfile() {
    showAlert('Profile editing functionality coming soon!', 'info');
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Check for stored authentication
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('currentUser');
    
    if (storedToken && storedUser) {
        authToken = storedToken;
        currentUser = JSON.parse(storedUser);
        updateUIForLoggedInUser();
        loadDashboard();
    }
    
    // Navigation event listeners
    elements.loginBtn.addEventListener('click', () => showSection('login'));
    elements.registerBtn.addEventListener('click', () => showSection('register'));
    elements.dashboardBtn.addEventListener('click', () => showSection('dashboard'));
    elements.servicesBtn.addEventListener('click', () => showSection('services'));
    elements.bookingsBtn.addEventListener('click', () => showSection('bookings'));
    elements.notificationsBtn.addEventListener('click', () => showSection('notifications'));
    elements.profileBtn.addEventListener('click', () => showSection('profile'));
    elements.logoutBtn.addEventListener('click', logout);
    
    // Auth form toggles
    elements.showRegister.addEventListener('click', (e) => {
        e.preventDefault();
        showSection('register');
    });
    
    elements.showLogin.addEventListener('click', (e) => {
        e.preventDefault();
        showSection('login');
    });
    
    // User type change handler
    elements.userType.addEventListener('change', function() {
        if (this.value === 'provider') {
            elements.providerFields.classList.remove('hidden');
        } else {
            elements.providerFields.classList.add('hidden');
        }
    });
    
    // Login form submission
    elements.loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const username = formData.get('username');
        const password = formData.get('password');
        
        await login(username, password);
    });
    
    // Register form submission
    elements.registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const data = Object.fromEntries(formData.entries());
        
        // Validate passwords match on frontend for better UX
        if (data.password !== data.password_confirm) {
            showAlert('Passwords do not match!', 'error');
            return;
        }
        
        // Send all data including password_confirm to backend for validation
        await register(data);
    });
    
    // Modal close events
    elements.modalClose.addEventListener('click', closeModal);
    elements.modal.addEventListener('click', function(e) {
        if (e.target === this) {
            closeModal();
        }
    });
    
    // Notification mark all read
    document.getElementById('mark-all-read-btn').addEventListener('click', markAllAsRead);
    
    // Filter bookings
    document.getElementById('apply-filters').addEventListener('click', function() {
        const statusFilter = document.getElementById('status-filter').value;
        const dateFilter = document.getElementById('date-filter').value;
        
        let filteredBookings = [...bookingsData];
        
        if (statusFilter) {
            filteredBookings = filteredBookings.filter(booking => booking.status === statusFilter);
        }
        
        if (dateFilter) {
            const filterDate = new Date(dateFilter).toDateString();
            filteredBookings = filteredBookings.filter(booking => 
                new Date(booking.booking_date).toDateString() === filterDate
            );
        }
        
        renderBookings(filteredBookings);
    });
    
    // Escape key to close modal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            if (!elements.modal.classList.contains('hidden')) {
                closeModal();
            }
            if (!elements.serviceModal.classList.contains('hidden')) {
                closeServiceModal();
            }
        }
    });
    
    // Services event listeners
    if (elements.serviceModalClose) {
        elements.serviceModalClose.addEventListener('click', closeServiceModal);
    }
    
    if (elements.serviceModal) {
        elements.serviceModal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeServiceModal();
            }
        });
    }

    // Service filter controls
    const applyServiceFiltersBtn = document.getElementById('apply-service-filters');
    if (applyServiceFiltersBtn) {
        applyServiceFiltersBtn.addEventListener('click', applyServiceFilters);
    }

    const clearServiceFiltersBtn = document.getElementById('clear-service-filters');
    if (clearServiceFiltersBtn) {
        clearServiceFiltersBtn.addEventListener('click', clearServiceFilters);
    }

    // Service management buttons
    const newServiceBtn = document.getElementById('new-service-btn');
    if (newServiceBtn) {
        newServiceBtn.addEventListener('click', function() {
            showAlert('New service creation form would be implemented here', 'info');
        });
    }

    const myServicesBtn = document.getElementById('my-services-btn');
    if (myServicesBtn) {
        myServicesBtn.addEventListener('click', showMyServices);
    }

    // Category filter change
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', function() {
            serviceFilters.category = this.value;
            loadServicesData();
            renderCategories();
        });
    }

    // Search filter with debounce
    const searchFilter = document.getElementById('search-filter');
    if (searchFilter) {
        let searchTimeout;
        searchFilter.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                serviceFilters.search = this.value;
                loadServicesData();
            }, 500);
        });
    }

    // Sort filter
    const sortFilter = document.getElementById('price-sort');
    if (sortFilter) {
        sortFilter.addEventListener('change', function() {
            serviceFilters.sort = this.value;
            loadServicesData();
        });
    }
    
    // Update notification badge periodically
    setInterval(updateNotificationBadge, 30000); // Every 30 seconds
}); 