# Admin Web Panel

React.js web Brand Shoot Admin for managing the Jewellery Mobile App backend. Built with Vite, React Router, and Axios.

## Features

- 🔐 **Authentication** - Secure admin login with JWT tokens
- 📊 **Dashboard** - Overview of users, generations, and token usage
- 👥 **User Management** - View, search, and manage users
- 📈 **Token Analytics** - Detailed token usage statistics with filters
- 🎨 **Content Management** - Manage categories and models
- ⚙️ **Cost Configuration** - Update pricing and exchange rates
- 🎨 **Theme** - Matches mobile app color scheme

## Tech Stack

- **React 19** - UI framework
- **Vite** - Build tool
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Lucide React** - Icon library

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Update `.env` file with your backend URL:

```env
VITE_API_BASE_URL=http://your-backend-url:5000
```

### 3. Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### 4. Build for Production

```bash
npm run build
```

### 5. Preview Production Build

```bash
npm run preview
```

## Project Structure

```
web-frontend/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── Button.jsx
│   │   ├── Input.jsx
│   │   ├── Card.jsx
│   │   ├── Modal.jsx
│   │   └── Loader.jsx
│   ├── context/          # React context providers
│   │   └── AuthContext.jsx
│   ├── pages/            # Page components
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Users.jsx
│   │   ├── UserDetail.jsx
│   │   ├── TokenStats.jsx
│   │   ├── Categories.jsx
│   │   └── Models.jsx
│   ├── services/         # API services
│   │   └── api.js
│   ├── utils/            # Helper functions
│   │   └── helpers.js
│   ├── config.js         # API configuration
│   ├── theme.css         # Global theme variables
│   ├── App.jsx           # Main app component
│   └── main.jsx          # Entry point
├── .env                  # Environment variables
└── package.json
```

## Available Routes

- `/login` - Admin login page
- `/dashboard` - Main dashboard
- `/users` - User management
- `/users/:userId` - User detail page
- `/token-stats` - Token analytics
- `/categories` - Category management
- `/models` - Model management

## Admin Login

Use your admin credentials from the backend:
- Email: Your admin email
- Password: Your admin password

**Note:** Only users with `role: "admin"` can access the panel.

## API Endpoints Used

All endpoints are defined in `src/config.js`:

- `POST /auth/login` - Admin login
- `POST /auth/verify-token` - Verify JWT token
- `GET /admin/dashboard` - Dashboard statistics
- `GET /admin/users` - List users
- `GET /admin/users/:id` - User details
- `GET /admin/token-stats` - Token analytics
- `GET /admin/settings` - Get cost settings
- `PUT /admin/settings` - Update cost settings
- `GET /admin/content/:type` - Get content (categories/models)

## Color Theme

The theme matches the mobile app:

- **Primary**: `#7C3AED` (Purple)
- **Accent**: `#8B5CF6` (Light Purple)
- **Success**: `#22C55E` (Green)
- **Error**: `#EF4444` (Red)
- **Background**: `#FFFFFF` (White)
- **Surface**: `#F8FAFC` (Light Gray)

## Development Notes

- Uses React Router for client-side routing
- Protected routes require authentication
- JWT token stored in localStorage
- Automatic redirect on 401 responses
- Responsive design for desktop and tablet

## Troubleshooting

### CORS Issues
If you encounter CORS errors, ensure your backend allows requests from the frontend origin.

### Authentication Errors
- Verify backend URL in `.env`
- Check that admin user exists in database
- Ensure JWT_SECRET matches backend

### Build Errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```
