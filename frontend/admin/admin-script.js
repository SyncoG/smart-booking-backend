// Admin Panel JavaScript - Material UI Implementation

// API Configuration
const ADMIN_API_BASE_URL = 'http://127.0.0.1:8000';
const ADMIN_API_ENDPOINTS = {
    LOGIN: `${ADMIN_API_BASE_URL}/accounts/login/`,
    USERS: `${ADMIN_API_BASE_URL}/admin/users/`,
    SERVICES: `${ADMIN_API_BASE_URL}/services/`,
    BOOKINGS: `${ADMIN_API_BASE_URL}/bookings/`,
    ANALYTICS: `${ADMIN_API_BASE_URL}/admin/analytics/`,
    NOTIFICATIONS: `${ADMIN_API_BASE_URL}/notifications/`,
    DASHBOARD_STATS: `${ADMIN_API_BASE_URL}/admin/dashboard-stats/`,
    SYSTEM_HEALTH: `${ADMIN_API_BASE_URL}/admin/system-health/`,
};

// Global State
let adminAuthToken = null;
let currentAdminUser = null;
let currentTab = 'dashboard';
let sidebarCollapsed = false;
let isMobileView = false;

// Charts instances
let revenueChart = null;
let usersChart = null;
let performanceChart = null;
let categoriesChart = null;
let userDistributionChart = null;

// DOM Elements
const elements = {
    // Login
    loginSection: document.getElementById('admin-login-section'),
    loginForm: document.getElementById('admin-login-form'),
    adminUsername: document.getElementById('admin-username'),
    adminPassword: document.getElementById('admin-password'),
    
    // Dashboard
    adminDashboard: document.getElementById('admin-dashboard'),
    
    // Navigation
    sidebar: document.getElementById('sidebar'),
    menuToggle: document.getElementById('menu-toggle'),
    navItems: document.querySelectorAll('.nav-item'),
    
    // Profile
    profileBtn: document.getElementById('profile-btn'),
    profileMenu: document.getElementById('profile-menu'),
    adminName: document.getElementById('admin-name'),
    
    // Content tabs
    tabContents: document.querySelectorAll('.tab-content'),
    
    // Loading and notifications
    loadingOverlay: document.getElementById('loading-overlay'),
    snackbar: document.getElementById('snackbar'),
    snackbarMessage: document.getElementById('snackbar-message'),
    
    // Data tables
    usersTableBody: document.getElementById('users-table-body'),
    bookingsTableBody: document.getElementById('bookings-table-body'),
    servicesGrid: document.getElementById('services-grid'),
    
    // Metrics
    totalUsersMetric: document.getElementById('total-users-metric'),
    totalServicesMetric: document.getElementById('total-services-metric'),
    totalBookingsMetric: document.getElementById('total-bookings-metric'),
    totalRevenueMetric: document.getElementById('total-revenue-metric'),
    
    // Recent Activity
    recentActivity: document.getElementById('recent-activity'),
    
    // Dialogs
    userDialog: document.getElementById('user-dialog'),
    
    // Notification badge
    adminNotificationBadge: document.getElementById('admin-notification-badge'),
};

// Utility Functions
function showLoading() {
    elements.loadingOverlay.classList.remove('hidden');
}

function hideLoading() {
    elements.loadingOverlay.classList.add('hidden');
}

function showSnackbar(message, type = 'info') {
    elements.snackbarMessage.textContent = message;
    elements.snackbar.className = `snackbar ${type}`;
    elements.snackbar.classList.remove('hidden');
    
    setTimeout(() => {
        elements.snackbar.classList.add('hidden');
    }, 4000);
}

function hideSnackbar() {
    elements.snackbar.classList.add('hidden');
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

// API Helper Functions
async function makeAdminAPIRequest(url, options = {}) {
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        }
    };
    
    if (adminAuthToken) {
        defaultOptions.headers['Authorization'] = `Token ${adminAuthToken}`;
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
        console.error('Admin API Request failed:', error);
        throw error;
    }
}

// Authentication Functions
async function adminLogin(username, password) {
    showLoading();
    try {
        const data = await makeAdminAPIRequest(ADMIN_API_ENDPOINTS.LOGIN, {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
        
        // Verify user is admin
        if (data.user.user_type !== 'admin') {
            throw new Error('Access denied. Admin privileges required.');
        }
        
        adminAuthToken = data.token;
        currentAdminUser = data.user;
        
        localStorage.setItem('adminAuthToken', adminAuthToken);
        localStorage.setItem('currentAdminUser', JSON.stringify(currentAdminUser));
        
        showSnackbar('Admin login successful!', 'success');
        showAdminDashboard();
        await loadDashboardData();
        
    } catch (error) {
        showSnackbar('Admin login failed: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

function adminLogout() {
    adminAuthToken = null;
    currentAdminUser = null;
    
    localStorage.removeItem('adminAuthToken');
    localStorage.removeItem('currentAdminUser');
    
    showAdminLogin();
    showSnackbar('Logged out successfully!', 'info');
}

function showAdminLogin() {
    elements.loginSection.classList.remove('hidden');
    elements.adminDashboard.classList.add('hidden');
}

function showAdminDashboard() {
    elements.loginSection.classList.add('hidden');
    elements.adminDashboard.classList.remove('hidden');
    
    // Update admin name
    elements.adminName.textContent = currentAdminUser.first_name || currentAdminUser.username;
}

// Navigation Functions
function initializeNavigation() {
    elements.navItems.forEach(item => {
        item.addEventListener('click', () => {
            const tabName = item.dataset.tab;
            switchTab(tabName);
        });
    });
    
    elements.menuToggle.addEventListener('click', toggleSidebar);
    elements.profileBtn.addEventListener('click', toggleProfileMenu);
    
    // Close profile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!elements.profileBtn.contains(e.target)) {
            elements.profileMenu.classList.add('hidden');
        }
    });
}

function switchTab(tabName) {
    // Update navigation
    elements.navItems.forEach(item => {
        item.classList.remove('active');
        if (item.dataset.tab === tabName) {
            item.classList.add('active');
        }
    });
    
    // Update content
    elements.tabContents.forEach(content => {
        content.classList.remove('active');
    });
    
    const targetTab = document.getElementById(`${tabName}-tab`);
    if (targetTab) {
        targetTab.classList.add('active');
        currentTab = tabName;
        
        // Load tab-specific data
        loadTabData(tabName);
    }
}

function toggleSidebar() {
    sidebarCollapsed = !sidebarCollapsed;
    elements.adminDashboard.classList.toggle('sidebar-collapsed', sidebarCollapsed);
    
    if (isMobileView) {
        elements.sidebar.classList.toggle('open');
    }
}

function toggleProfileMenu() {
    elements.profileMenu.classList.toggle('hidden');
}

// Dashboard Functions
async function loadDashboardData() {
    try {
        showLoading();
        
        // Load dashboard stats and recent activity in parallel
        const [stats, activity] = await Promise.all([
            loadDashboardStats(),
            loadRecentActivity()
        ]);
        
        // Initialize charts
        initializeCharts();
        
    } catch (error) {
        showSnackbar('Failed to load dashboard data: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

async function loadDashboardStats() {
    try {
        // For demo purposes, using mock data
        // In production, this would call ADMIN_API_ENDPOINTS.DASHBOARD_STATS
        const stats = {
            total_users: 1245,
            total_services: 389,
            total_bookings: 2156,
            total_revenue: 47892,
            user_growth: 12,
            service_growth: 8,
            booking_growth: 23,
            revenue_growth: 15
        };
        
        updateDashboardMetrics(stats);
        return stats;
    } catch (error) {
        console.error('Failed to load dashboard stats:', error);
        throw error;
    }
}

function updateDashboardMetrics(stats) {
    elements.totalUsersMetric.textContent = stats.total_users.toLocaleString();
    elements.totalServicesMetric.textContent = stats.total_services.toLocaleString();
    elements.totalBookingsMetric.textContent = stats.total_bookings.toLocaleString();
    elements.totalRevenueMetric.textContent = formatCurrency(stats.total_revenue);
}

async function loadRecentActivity() {
    try {
        // Mock recent activity data
        const activities = [
            {
                icon: 'person_add',
                title: 'New User Registration',
                description: 'Sarah Johnson joined as a customer',
                time: '2 minutes ago',
                type: 'user'
            },
            {
                icon: 'event',
                title: 'Booking Confirmed',
                description: 'Booking #2156 confirmed by provider',
                time: '5 minutes ago',
                type: 'booking'
            },
            {
                icon: 'room_service',
                title: 'New Service Added',
                description: 'Professional Photography service added',
                time: '12 minutes ago',
                type: 'service'
            },
            {
                icon: 'payments',
                title: 'Payment Processed',
                description: '$150 payment completed for booking #2155',
                time: '18 minutes ago',
                type: 'payment'
            },
            {
                icon: 'star',
                title: 'Review Submitted',
                description: '5-star review for Premium Spa Service',
                time: '25 minutes ago',
                type: 'review'
            }
        ];
        
        renderRecentActivity(activities);
        return activities;
    } catch (error) {
        console.error('Failed to load recent activity:', error);
        throw error;
    }
}

function renderRecentActivity(activities) {
    const container = elements.recentActivity;
    
    container.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon">
                <span class="material-icons-outlined">${activity.icon}</span>
            </div>
            <div class="activity-content">
                <div class="activity-title">${activity.title}</div>
                <div class="activity-description">${activity.description}</div>
            </div>
            <div class="activity-time">${activity.time}</div>
        </div>
    `).join('');
}

// Chart Functions
function initializeCharts() {
    initializeRevenueChart();
    initializeUsersChart();
}

function initializeRevenueChart() {
    const ctx = document.getElementById('revenue-chart');
    if (!ctx) return;
    
    const chartContext = ctx.getContext('2d');
    
    if (revenueChart) {
        revenueChart.destroy();
    }
    
    revenueChart = new Chart(chartContext, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                label: 'Revenue',
                data: [12000, 15000, 13500, 18000, 21000, 24000],
                borderColor: '#1976d2',
                backgroundColor: 'rgba(25, 118, 210, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    }
                }
            }
        }
    });
}

function initializeUsersChart() {
    const ctx = document.getElementById('users-chart');
    if (!ctx) return;
    
    const chartContext = ctx.getContext('2d');
    
    if (usersChart) {
        usersChart.destroy();
    }
    
    usersChart = new Chart(chartContext, {
        type: 'bar',
        data: {
            labels: ['Customers', 'Providers', 'Admins'],
            datasets: [{
                data: [1120, 120, 5],
                backgroundColor: [
                    '#1976d2',
                    '#42a5f5',
                    '#64b5f6'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Tab Data Loading Functions
async function loadTabData(tabName) {
    switch (tabName) {
        case 'dashboard':
            await loadDashboardData();
            break;
        case 'users':
            await loadUsersData();
            break;
        case 'services':
            await loadServicesData();
            break;
        case 'bookings':
            await loadBookingsData();
            break;
        case 'analytics':
            await loadAnalyticsData();
            break;
        case 'settings':
            loadSettingsData();
            break;
    }
}

async function loadUsersData() {
    try {
        showLoading();
        
        // Mock users data
        const users = [
            {
                id: 1,
                username: 'customer1',
                email: 'customer1@example.com',
                first_name: 'John',
                last_name: 'Doe',
                user_type: 'customer',
                is_active: true,
                date_joined: '2024-01-15T10:30:00Z'
            },
            {
                id: 2,
                username: 'provider1',
                email: 'provider1@example.com',
                first_name: 'Jane',
                last_name: 'Smith',
                user_type: 'provider',
                is_active: true,
                date_joined: '2024-01-20T14:20:00Z'
            },
            {
                id: 3,
                username: 'admin',
                email: 'admin@example.com',
                first_name: 'Admin',
                last_name: 'User',
                user_type: 'admin',
                is_active: true,
                date_joined: '2024-01-01T09:00:00Z'
            }
        ];
        
        renderUsersTable(users);
        
    } catch (error) {
        showSnackbar('Failed to load users data: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

function renderUsersTable(users) {
    const container = elements.usersTableBody;
    
    container.innerHTML = users.map(user => `
        <tr>
            <td>
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--primary); color: white; display: flex; align-items: center; justify-content: center; font-weight: 500;">
                        ${user.first_name.charAt(0)}${user.last_name.charAt(0)}
                    </div>
                    <div>
                        <div style="font-weight: 500;">${user.first_name} ${user.last_name}</div>
                        <div style="font-size: 0.75rem; color: var(--text-secondary);">@${user.username}</div>
                    </div>
                </div>
            </td>
            <td>
                <span class="status-badge ${user.user_type}">${user.user_type}</span>
            </td>
            <td>${user.email}</td>
            <td>
                <span class="status-badge ${user.is_active ? 'active' : 'inactive'}">
                    ${user.is_active ? 'Active' : 'Inactive'}
                </span>
            </td>
            <td>${formatDate(user.date_joined)}</td>
            <td>
                <div style="display: flex; gap: 8px;">
                    <button class="icon-btn" onclick="editUser(${user.id})" title="Edit">
                        <span class="material-icons-outlined">edit</span>
                    </button>
                    <button class="icon-btn" onclick="deleteUser(${user.id})" title="Delete">
                        <span class="material-icons-outlined">delete</span>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

async function loadServicesData() {
    try {
        showLoading();
        
        // This would call the actual services API
        const response = await makeAdminAPIRequest(ADMIN_API_ENDPOINTS.SERVICES);
        renderServicesGrid(response);
        
    } catch (error) {
        showSnackbar('Failed to load services data: ' + error.message, 'error');
        // Show mock data on error
        renderMockServices();
    } finally {
        hideLoading();
    }
}

function renderMockServices() {
    const mockServices = [
        {
            id: 1,
            name: 'Professional Photography',
            category: 'Creative Services',
            provider: 'Jane Smith Photography',
            price: 150,
            duration: 120,
            is_active: true,
            created_at: '2024-01-15T10:30:00Z'
        },
        {
            id: 2,
            name: 'Premium Spa Treatment',
            category: 'Beauty & Wellness',
            provider: 'Zen Spa Center',
            price: 200,
            duration: 90,
            is_active: true,
            created_at: '2024-01-20T14:20:00Z'
        }
    ];
    
    renderServicesGrid(mockServices);
}

function renderServicesGrid(services) {
    const container = elements.servicesGrid;
    
    container.innerHTML = services.map(service => `
        <div class="service-card">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 16px;">
                <div>
                    <h4 style="margin: 0 0 4px 0; color: var(--text-primary);">${service.name}</h4>
                    <p style="margin: 0; font-size: 0.875rem; color: var(--text-secondary);">${service.category || 'No category'}</p>
                </div>
                <span class="status-badge ${service.is_active ? 'active' : 'inactive'}">
                    ${service.is_active ? 'Active' : 'Inactive'}
                </span>
            </div>
            
            <div style="margin-bottom: 16px;">
                <div style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 4px;">Provider</div>
                <div style="font-weight: 500;">${service.provider_name || service.provider || 'Unknown'}</div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                <div>
                    <div style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 4px;">Price</div>
                    <div style="font-weight: 500; color: var(--primary);">${formatCurrency(service.price)}</div>
                </div>
                <div>
                    <div style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 4px;">Duration</div>
                    <div style="font-weight: 500;">${service.duration} min</div>
                </div>
            </div>
            
            <div style="display: flex; gap: 8px; margin-top: auto;">
                <button class="outlined-btn" onclick="editService(${service.id})">
                    <span class="material-icons-outlined">edit</span>
                    Edit
                </button>
                <button class="text-btn" onclick="toggleServiceStatus(${service.id})">
                    <span class="material-icons-outlined">${service.is_active ? 'pause' : 'play_arrow'}</span>
                    ${service.is_active ? 'Deactivate' : 'Activate'}
                </button>
            </div>
        </div>
    `).join('');
}

async function loadBookingsData() {
    try {
        showLoading();
        
        // Mock bookings data
        const bookings = [
            {
                id: 1,
                customer_name: 'John Doe',
                service_name: 'Professional Photography',
                provider_name: 'Jane Smith',
                booking_date: '2024-06-10T14:00:00Z',
                status: 'confirmed',
                total_price: 150
            },
            {
                id: 2,
                customer_name: 'Alice Johnson',
                service_name: 'Premium Spa Treatment',
                provider_name: 'Zen Spa Center',
                booking_date: '2024-06-12T10:30:00Z',
                status: 'pending',
                total_price: 200
            }
        ];
        
        renderBookingsTable(bookings);
        
    } catch (error) {
        showSnackbar('Failed to load bookings data: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

function renderBookingsTable(bookings) {
    const container = elements.bookingsTableBody;
    
    container.innerHTML = bookings.map(booking => `
        <tr>
            <td><strong>#${booking.id}</strong></td>
            <td>${booking.customer_name}</td>
            <td>${booking.service_name}</td>
            <td>${booking.provider_name}</td>
            <td>${formatDate(booking.booking_date)}</td>
            <td>
                <span class="status-badge ${booking.status}">${booking.status}</span>
            </td>
            <td><strong>${formatCurrency(booking.total_price)}</strong></td>
            <td>
                <div style="display: flex; gap: 8px;">
                    <button class="icon-btn" onclick="viewBooking(${booking.id})" title="View">
                        <span class="material-icons-outlined">visibility</span>
                    </button>
                    <button class="icon-btn" onclick="editBooking(${booking.id})" title="Edit">
                        <span class="material-icons-outlined">edit</span>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

async function loadAnalyticsData() {
    try {
        showLoading();
        
        // Initialize analytics charts
        initializeAnalyticsCharts();
        
    } catch (error) {
        showSnackbar('Failed to load analytics data: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

function initializeAnalyticsCharts() {
    // Performance Chart
    const performanceCtx = document.getElementById('performance-chart');
    if (performanceCtx && !performanceChart) {
        performanceChart = new Chart(performanceCtx.getContext('2d'), {
            type: 'line',
            data: {
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                datasets: [
                    {
                        label: 'Bookings',
                        data: [45, 52, 48, 61],
                        borderColor: '#1976d2',
                        backgroundColor: 'rgba(25, 118, 210, 0.1)',
                        tension: 0.4
                    },
                    {
                        label: 'Revenue',
                        data: [4500, 5200, 4800, 6100],
                        borderColor: '#42a5f5',
                        backgroundColor: 'rgba(66, 165, 245, 0.1)',
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
    
    // Categories Chart
    const categoriesCtx = document.getElementById('categories-chart');
    if (categoriesCtx && !categoriesChart) {
        categoriesChart = new Chart(categoriesCtx.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Beauty & Spa', 'Fitness', 'Consulting', 'Photography', 'Other'],
                datasets: [{
                    data: [30, 25, 20, 15, 10],
                    backgroundColor: [
                        '#1976d2',
                        '#42a5f5',
                        '#64b5f6',
                        '#90caf9',
                        '#bbdefb'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }
    
    // User Distribution Chart
    const userDistCtx = document.getElementById('user-distribution-chart');
    if (userDistCtx && !userDistributionChart) {
        userDistributionChart = new Chart(userDistCtx.getContext('2d'), {
            type: 'pie',
            data: {
                labels: ['Customers', 'Providers', 'Admins'],
                datasets: [{
                    data: [89.6, 9.6, 0.8],
                    backgroundColor: [
                        '#1976d2',
                        '#42a5f5',
                        '#64b5f6'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }
}

function loadSettingsData() {
    // Settings tab content would be loaded here
    showSnackbar('Settings functionality would be implemented here', 'info');
}

// Action Functions
function fillAdminDemo() {
    elements.adminUsername.value = 'admin';
    elements.adminPassword.value = 'admin123';
}

function showCreateUserDialog() {
    elements.userDialog.classList.remove('hidden');
}

function closeUserDialog() {
    elements.userDialog.classList.add('hidden');
}

function editUser(userId) {
    showSnackbar(`Edit user ${userId} functionality would be implemented here`, 'info');
}

function deleteUser(userId) {
    if (confirm('Are you sure you want to delete this user?')) {
        showSnackbar(`Delete user ${userId} functionality would be implemented here`, 'info');
    }
}

function editService(serviceId) {
    showSnackbar(`Edit service ${serviceId} functionality would be implemented here`, 'info');
}

function toggleServiceStatus(serviceId) {
    showSnackbar(`Toggle service ${serviceId} status functionality would be implemented here`, 'info');
}

function viewBooking(bookingId) {
    showSnackbar(`View booking ${bookingId} functionality would be implemented here`, 'info');
}

function editBooking(bookingId) {
    showSnackbar(`Edit booking ${bookingId} functionality would be implemented here`, 'info');
}

function showAdminProfile() {
    showSnackbar('Admin profile functionality would be implemented here', 'info');
    elements.profileMenu.classList.add('hidden');
}

function showSettings() {
    switchTab('settings');
    elements.profileMenu.classList.add('hidden');
}

// Responsive Design Handler
function handleResponsiveDesign() {
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    
    function handleMediaQueryChange(e) {
        isMobileView = e.matches;
        
        if (isMobileView) {
            elements.adminDashboard.classList.add('sidebar-collapsed');
            sidebarCollapsed = true;
        } else {
            elements.sidebar.classList.remove('open');
        }
    }
    
    mediaQuery.addListener(handleMediaQueryChange);
    handleMediaQueryChange(mediaQuery);
}

// Event Listeners
function initializeEventListeners() {
    // Login form
    elements.loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = elements.adminUsername.value;
        const password = elements.adminPassword.value;
        await adminLogin(username, password);
    });
    
    // Navigation
    initializeNavigation();
    
    // Responsive design
    handleResponsiveDesign();
    
    // Window resize handler
    window.addEventListener('resize', () => {
        // Redraw charts on resize
        if (revenueChart) revenueChart.resize();
        if (usersChart) usersChart.resize();
        if (performanceChart) performanceChart.resize();
        if (categoriesChart) categoriesChart.resize();
        if (userDistributionChart) userDistributionChart.resize();
    });
}

// Initialization
document.addEventListener('DOMContentLoaded', function() {
    // Check for stored admin authentication
    const storedToken = localStorage.getItem('adminAuthToken');
    const storedUser = localStorage.getItem('currentAdminUser');
    
    if (storedToken && storedUser) {
        adminAuthToken = storedToken;
        currentAdminUser = JSON.parse(storedUser);
        showAdminDashboard();
        loadDashboardData();
    } else {
        showAdminLogin();
    }
    
    // Initialize event listeners
    initializeEventListeners();
});

// Global functions for window scope
window.fillAdminDemo = fillAdminDemo;
window.showCreateUserDialog = showCreateUserDialog;
window.closeUserDialog = closeUserDialog;
window.editUser = editUser;
window.deleteUser = deleteUser;
window.editService = editService;
window.toggleServiceStatus = toggleServiceStatus;
window.viewBooking = viewBooking;
window.editBooking = editBooking;
window.showAdminProfile = showAdminProfile;
window.showSettings = showSettings;
window.adminLogout = adminLogout;
window.hideSnackbar = hideSnackbar; 