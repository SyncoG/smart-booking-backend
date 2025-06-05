# Smart Booking System

A comprehensive booking management system with Django backend and modern web frontend, featuring user authentication, service management, booking operations, and real-time notifications.

## 🚀 Quick Start

### Prerequisites
- **Python 3.8+** installed and accessible via command line
- **Git** (if cloning from repository)
- **Windows** (batch file is Windows-specific, but can be adapted for other OS)

### One-Command Setup & Run
1. Open Command Prompt or PowerShell
2. Navigate to the project directory
3. Run the management script:
   ```bash
   smart_booking_manager.bat
   ```
4. Select option **1** for first-time setup
5. Once setup is complete, select option **4** to start the system

The system will automatically:
- Create virtual environment
- Install all dependencies
- Set up database
- Create test users
- Start both backend and frontend servers
- Open your browser to the application

## 📋 Management Script Options

The `smart_booking_manager.bat` provides these options:

| Option | Description | Use Case |
|--------|-------------|----------|
| 1 | Complete System Setup | First-time installation |
| 2 | Create Dummy Users Only | Add test users to existing setup |
| 3 | Start Development Servers | Basic server startup |
| 4 | Start Complete System | Full startup with browser launch |
| 5 | Quick Start | Minimal setup and start |
| 6 | Stop All Servers | Safely stop running servers |
| 7 | System Status Check | Verify system health |
| 8 | Clean and Reset | Complete system reset |
| 9 | Exit | Clean shutdown |

## 👥 Test User Accounts

After setup, use these credentials to test the system:

| User Type | Username | Password | Description |
|-----------|----------|----------|-------------|
| Admin | `admin` | `admin123` | System administrator |
| Customer | `customer1` | `customer123` | Verified customer account |
| Customer | `customer2` | `customer123` | Unverified customer account |
| Provider | `provider1` | `provider123` | Service provider account |

## 🌐 Application URLs

- **Frontend**: http://127.0.0.1:8080
- **Backend API**: http://127.0.0.1:8000
- **Django Admin**: http://127.0.0.1:8000/admin

## ✨ Features

### User Management
- **Multi-type Authentication**: Customer, Provider, and Admin roles
- **User Profiles**: Customizable profiles with role-specific information
- **Registration & Login**: Complete authentication system

### Service Management
- **Service Categories**: Organized service classification
- **Service Browsing**: Search and filter services
- **Provider Dashboard**: Service creation and management
- **Service Details**: Comprehensive service information

### Booking System
- **Booking Creation**: Easy booking process for customers
- **Status Management**: Track booking status (pending, confirmed, completed, cancelled)
- **Booking History**: Complete booking records
- **Dashboard Analytics**: Booking statistics and insights

### Notifications
- **Real-time Notifications**: Instant updates on booking changes
- **Notification Management**: Mark as read, delete notifications
- **Notification Types**: Various notification categories
- **Unread Counter**: Visual notification indicators

### User Interface
- **Responsive Design**: Mobile-friendly interface
- **Role-based Themes**: Different themes for different user types
- **Modern UI**: Clean, professional design
- **Interactive Elements**: Smooth animations and transitions

## 🏗️ Project Structure

```
smart-booking-backend/
├── smart_booking/              # Django project settings
├── accounts/                   # User authentication & profiles
├── services/                   # Service management
├── bookings/                   # Booking system
├── notifications/              # Notification system
├── frontend/accounts/          # Web frontend
│   ├── index.html             # Main application page
│   ├── styles.css             # Styling and themes
│   └── script.js              # Frontend logic
├── smart_booking_manager.bat   # All-in-one management script
├── manage.py                   # Django management script
└── requirements.txt            # Python dependencies
```

## 🔧 Manual Setup (Alternative)

If you prefer manual setup instead of using the batch file:

### 1. Create Virtual Environment
```bash
python -m venv .venv
.venv\Scripts\activate
```

### 2. Install Dependencies
```bash
pip install django djangorestframework django-cors-headers pillow
```

### 3. Database Setup
```bash
python manage.py makemigrations
python manage.py migrate
```

### 4. Create Test Users
```bash
python manage.py create_dummy_users --skip-if-exists
```

### 5. Start Servers
```bash
# Terminal 1: Django Backend
python manage.py runserver 8000

# Terminal 2: Frontend Server
cd frontend/accounts
python -m http.server 8080
```

## 🛠️ Development

### API Endpoints

#### Authentication
- `POST /accounts/login/` - User login
- `POST /accounts/register/` - User registration
- `GET /accounts/profile/` - Get user profile

#### Services
- `GET/POST /services/` - List/Create services
- `GET /services/{id}/` - Service details
- `GET /services/categories/` - Service categories

#### Bookings
- `GET/POST /bookings/` - List/Create bookings
- `PATCH /bookings/{id}/` - Update booking status
- `GET /bookings/dashboard-stats/` - Booking statistics

#### Notifications
- `GET /notifications/` - List notifications
- `POST /notifications/{id}/read/` - Mark as read
- `GET /notifications/unread-count/` - Unread count

### Database Models
- **User**: Extended Django user with user types
- **CustomerProfile**: Customer-specific information
- **ServiceProviderProfile**: Provider business information
- **Service**: Service offerings
- **Booking**: Booking records
- **Notification**: System notifications

## 🐛 Troubleshooting

### Common Issues

#### "Python is not installed or not in PATH"
- Install Python 3.8+ from [python.org](https://python.org)
- Ensure Python is added to system PATH during installation

#### "Virtual environment not found"
- Run option 1 (Complete System Setup) from the management script
- Or manually create: `python -m venv .venv`

#### "Port already in use"
- Use option 6 to stop all servers first
- Or manually kill Python processes: `taskkill /f /im python.exe`

#### Registration fails with password_confirm error
- This has been fixed in the latest version
- Ensure you're using the updated frontend files

#### Frontend not loading
- Check that both servers are running (use option 7 for status check)
- Verify frontend files exist in `frontend/accounts/`
- Try accessing http://127.0.0.1:8080 directly

#### Database errors
- Use option 8 to clean and reset the system
- Then run option 1 for complete setup

### Getting Help

1. **System Status**: Use option 7 in the management script
2. **Clean Reset**: Use option 8 if you encounter persistent issues
3. **Logs**: Check the server console windows for detailed error messages

## 🔄 Development Workflow

### For New Developers
1. Clone the repository
2. Run `smart_booking_manager.bat`
3. Choose option 1 (Complete System Setup)
4. Start developing!

### For Daily Development
1. Run `smart_booking_manager.bat`
2. Choose option 3 (Start Development Servers)
3. Make your changes
4. Test in browser at http://127.0.0.1:8080

### Making Changes
- **Backend**: Edit Django files, server auto-reloads
- **Frontend**: Edit HTML/CSS/JS files, refresh browser
- **Database Changes**: Run migrations after model changes

## 🎯 User Guide

### As a Customer
1. Register/Login as customer
2. Browse service categories
3. Search and filter services
4. Book services
5. Track booking status
6. Receive notifications

### As a Provider
1. Register/Login as provider
2. Manage your service offerings
3. View and manage bookings
4. Update booking status
5. Track business analytics

### As an Admin
1. Login with admin credentials
2. Access Django admin panel
3. Manage users and system data
4. Monitor system activity

## 📊 System Requirements

### Minimum Requirements
- Python 3.8+
- 100MB free disk space
- 512MB RAM
- Modern web browser

### Recommended
- Python 3.9+
- 200MB free disk space
- 1GB RAM
- Chrome/Firefox/Edge latest version

## 📝 Notes

- The system uses SQLite database by default (suitable for development)
- All data is stored locally in the project directory
- The frontend uses vanilla HTML/CSS/JavaScript (no additional frameworks required)
- CORS is enabled for local development
- Token-based authentication is used between frontend and backend

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly using the management script
5. Submit a pull request

---

**Happy Booking! 🎉**

For additional support or questions, please refer to the system status check (option 7) or create a new issue in the repository. 