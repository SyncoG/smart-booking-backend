# Smart Booking - Accounts Frontend

A modern, responsive frontend for the Smart Booking accounts system built with vanilla HTML, CSS, and JavaScript.

## Features

- **User Authentication**
  - Login with username/password
  - Register new accounts (Customer or Service Provider)
  - Token-based authentication with persistent sessions
  - Logout functionality

- **User Profiles**
  - View personal information
  - Customer-specific profile details
  - Service Provider business information
  - Verification status display

- **Modern UI/UX**
  - Responsive design for all devices
  - Beautiful gradient backgrounds
  - Smooth animations and transitions
  - Loading states and error handling
  - Alert notifications

## Setup Instructions

### 1. Backend Setup
Make sure your Django backend is running:

```bash
# From the project root
.venv\Scripts\python.exe manage.py runserver
```

The backend should be accessible at `http://localhost:8000`

### 2. Frontend Setup
You can serve the frontend in several ways:

#### Option A: Simple HTTP Server (Python)
```bash
# Navigate to the frontend directory
cd frontend/accounts

# Serve with Python (Python 3)
python -m http.server 8080

# Or with Python 2
python -m SimpleHTTPServer 8080
```

Access the frontend at: `http://localhost:8080`

#### Option B: Live Server (VS Code Extension)
1. Install the "Live Server" extension in VS Code
2. Right-click on `index.html`
3. Select "Open with Live Server"

#### Option C: Any Static File Server
Use any static file server like `serve`, `http-server`, or similar.

## Usage

### Initial Access
1. Open the frontend in your browser
2. You'll see the login page by default
3. Use the test accounts created by the dummy data command

### Test Accounts
Use these credentials for testing:

**Superuser:**
- Username: `admin`
- Password: `admin123`

**Customer:**
- Username: `customer1`
- Password: `customer123`

**Service Provider:**
- Username: `provider1`
- Password: `provider123`

### Registration
1. Click "Register here" on the login page
2. Fill in the required information
3. Select account type (Customer or Service Provider)
4. For Service Providers, additional business fields will appear
5. Submit the form to create your account

### Profile Management
Once logged in:
- View your profile information
- See account verification status
- Access type-specific profile details
- Logout when done

## File Structure

```
frontend/accounts/
├── index.html          # Main HTML file
├── styles.css          # All CSS styles
├── script.js           # JavaScript functionality
└── README.md          # This file
```

## API Integration

The frontend communicates with the Django REST API:

- **POST** `/accounts/login/` - User login
- **POST** `/accounts/register/` - User registration  
- **GET** `/accounts/profile/` - Get user profile

The API base URL is configured in `script.js` and defaults to `http://localhost:8000/accounts`.

## Browser Compatibility

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Responsive Design

The frontend is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile phones

## Security Features

- Token-based authentication
- Secure password handling
- CORS-enabled API communication
- Input validation
- XSS protection

## Customization

### Changing API URL
Edit the `API_BASE_URL` constant in `script.js`:

```javascript
const API_BASE_URL = 'http://your-api-domain.com/accounts';
```

### Styling
All styles are contained in `styles.css`. The design uses:
- CSS Grid and Flexbox for layouts
- CSS Custom Properties for theming
- Responsive breakpoints
- Smooth animations

### Adding Features
The JavaScript is modular and easy to extend. Key areas:
- `elements` object contains all DOM references
- `authState` manages authentication state
- API functions handle backend communication
- UI functions manage interface updates

## Troubleshooting

### CORS Errors
If you see CORS errors:
1. Ensure the Django backend has `django-cors-headers` installed
2. Check that your frontend URL is in `CORS_ALLOWED_ORIGINS`
3. For development, ensure `CORS_ALLOW_ALL_ORIGINS = True`

### API Connection Issues
1. Verify the backend is running on the correct port
2. Check the `API_BASE_URL` in `script.js`
3. Ensure your backend URLs are correctly configured

### Authentication Issues
1. Clear browser localStorage if you have stale tokens
2. Check that the backend is properly creating tokens
3. Verify the user credentials

## Production Deployment

For production:
1. Update `API_BASE_URL` to your production API URL
2. Remove `CORS_ALLOW_ALL_ORIGINS = True` from Django settings
3. Add your production domain to `CORS_ALLOWED_ORIGINS`
4. Serve the frontend from a proper web server (nginx, Apache, etc.)
5. Enable HTTPS for secure token transmission

## Contributing

1. Follow the existing code style
2. Test on multiple browsers and devices
3. Ensure responsive design is maintained
4. Update this README for any new features 