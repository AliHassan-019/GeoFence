# Geofence Management System

A modern, full-stack web application for geofence management built with the MERN stack (MongoDB, Express.js, React, Node.js) and Google OAuth authentication.

## 🚀 Features

- **Google OAuth Authentication**: Secure login with Google accounts
- **Role-Based Access Control**: Admin and client user roles with different permissions
- **Modern UI**: Responsive design built with React and Tailwind CSS
- **RESTful API**: Well-structured backend API with Express.js
- **Database Integration**: MongoDB with Mongoose ODM
- **Session Management**: Secure session handling with JWT tokens
- **Docker Support**: Containerized deployment with Docker Compose
- **Production Ready**: Nginx configuration and security best practices

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend │    │  Express Backend │    │    MongoDB      │
│   (Port 3000)   │◄──►│   (Port 5001)   │◄──►│   (Port 27017)  │
│                 │    │                 │    │                 │
│ • React Router  │    │ • JWT Auth      │    │ • User Data     │
│ • Tailwind CSS  │    │ • Google OAuth  │    │ • Sessions      │
│ • Zustand Store │    │ • CORS Enabled  │    │ • Indexes       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📋 Prerequisites

- **Node.js** (v18 or higher)
- **MongoDB** (v6.0 or higher)
- **npm** or **yarn**
- **Google Cloud Console** account (for OAuth setup)
- **Docker** and **Docker Compose** (for containerized deployment)

## 🛠️ Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd geofence2
```

### 2. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - Development: `http://localhost:5001/api/auth/google/callback`
   - Production: `https://yourdomain.com/api/auth/google/callback`

### 3. Environment Configuration

#### Backend Setup
```bash
cd backend
cp .env.example .env
```

Edit `.env` with your configuration:
```env
PORT=5001
MONGODB_URI=mongodb://localhost:27017/geofence
JWT_SECRET=your_very_secure_jwt_secret_key_here_minimum_32_characters
JWT_REFRESH_SECRET=your_very_secure_refresh_secret_key_here_minimum_32_characters
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5001/api/auth/google/callback
FRONTEND_URL=http://localhost:3000
SESSION_SECRET=your_very_secure_session_secret_here_minimum_32_characters
```

#### Frontend Setup
```bash
cd ../frontend
npm install
```

### 4. Database Setup

Start MongoDB locally or use a cloud service like MongoDB Atlas.

For local MongoDB:
```bash
# Install MongoDB (macOS with Homebrew)
brew install mongodb-community
brew services start mongodb-community

# Or use Docker
docker run -d -p 27017:27017 --name mongodb mongo:6.0
```

### 5. Install Dependencies and Start

#### Backend
```bash
cd backend
npm install
npm start
```

#### Frontend
```bash
cd frontend
npm install
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5001
- API Health Check: http://localhost:5001/api/health

## 🐳 Docker Deployment

### Development with Docker Compose

1. **Copy environment file:**
```bash
cp .env.production .env
```

2. **Edit `.env` with your configuration**

3. **Start all services:**
```bash
docker-compose up -d
```

4. **View logs:**
```bash
docker-compose logs -f
```

5. **Stop services:**
```bash
docker-compose down
```

### Production Deployment

1. **Update environment variables in `.env`**
2. **Build and deploy:**
```bash
docker-compose -f docker-compose.yml up -d --build
```

## 📁 Project Structure

```
geofence2/
├── backend/                 # Node.js/Express backend
│   ├── config/             # Configuration files
│   │   └── passport.js     # Passport.js Google OAuth config
│   ├── middleware/         # Custom middleware
│   │   └── auth.js         # Authentication middleware
│   ├── models/             # Mongoose models
│   │   └── User.js         # User model
│   ├── routes/             # API routes
│   │   ├── auth.js         # Authentication routes
│   │   └── users.js        # User management routes
│   ├── scripts/            # Database scripts
│   │   └── init-mongo.js   # MongoDB initialization
│   ├── .env.example        # Environment variables template
│   ├── Dockerfile          # Docker configuration
│   ├── healthcheck.js      # Health check script
│   ├── package.json        # Dependencies and scripts
│   └── server.js           # Main server file
├── frontend/               # React frontend
│   ├── public/             # Static files
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── auth/       # Authentication components
│   │   │   ├── common/     # Shared components
│   │   │   └── layout/     # Layout components
│   │   ├── pages/          # Page components
│   │   │   ├── admin/      # Admin pages
│   │   │   ├── DashboardPage.js
│   │   │   ├── LoginPage.js
│   │   │   ├── NotFoundPage.js
│   │   │   └── ProfilePage.js
│   │   ├── services/       # API services
│   │   │   └── api.js      # Axios configuration
│   │   ├── store/          # State management
│   │   │   └── authStore.js # Zustand auth store
│   │   ├── App.js          # Main App component
│   │   └── index.js        # Entry point
│   ├── Dockerfile          # Docker configuration
│   ├── nginx.conf          # Nginx configuration
│   ├── package.json        # Dependencies and scripts
│   └── tailwind.config.js  # Tailwind CSS configuration
├── .dockerignore           # Docker ignore file
├── .env.production         # Production environment template
├── docker-compose.yml      # Docker Compose configuration
├── ENVIRONMENT_SETUP.md    # Environment variables guide
└── README.md               # This file
```

## 🔐 Authentication Flow

1. **User clicks "Login with Google"**
2. **Redirected to Google OAuth**
3. **Google redirects back with authorization code**
4. **Backend exchanges code for user profile**
5. **User created/updated in database**
6. **JWT tokens generated and returned**
7. **Frontend stores tokens and redirects to dashboard**

## 👥 User Roles

### Client Users
- View personal dashboard
- Manage profile
- Access client-specific features

### Admin Users
- All client permissions
- User management
- System administration
- Access to admin dashboard

## 🔧 API Endpoints

### Authentication
- `GET /api/auth/google` - Initiate Google OAuth
- `GET /api/auth/google/callback` - OAuth callback
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/logout` - Logout user

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users` - Get all users (admin only)
- `PUT /api/users/:id/role` - Update user role (admin only)
- `PUT /api/users/:id/status` - Update user status (admin only)

### System
- `GET /api/health` - Health check

## 🛡️ Security Features

- **JWT Authentication** with refresh tokens
- **Role-based access control**
- **CORS protection**
- **Environment variable validation**
- **Secure session management**
- **Input validation and sanitization**
- **Security headers** (in Nginx configuration)

## 🚀 Deployment Options

### 1. Traditional VPS/Server
- Install Node.js, MongoDB, and Nginx
- Clone repository and configure environment
- Use PM2 for process management
- Set up reverse proxy with Nginx

### 2. Docker Deployment
- Use provided Docker Compose configuration
- Suitable for any Docker-compatible platform
- Includes MongoDB, backend, and frontend services

### 3. Cloud Platforms
- **Heroku**: Deploy backend and frontend separately
- **AWS**: Use ECS/EKS with Docker images
- **Google Cloud**: Use Cloud Run or GKE
- **DigitalOcean**: Use App Platform or Droplets

## 📊 Monitoring and Logging

### Health Checks
- Backend: `GET /api/health`
- Frontend: `GET /health` (Nginx)
- Database: MongoDB ping

### Logs
- Application logs via console
- Nginx access and error logs
- Docker container logs

## 🔧 Development

### Available Scripts

#### Backend
```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
npm test           # Run tests
```

#### Frontend
```bash
npm start          # Start development server
npm run build      # Build for production
npm test           # Run tests
npm run eject      # Eject from Create React App
```

### Code Style
- **ESLint** for JavaScript linting
- **Prettier** for code formatting
- **Tailwind CSS** for styling

## 🐛 Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Kill process on port 5001
   lsof -ti:5001 | xargs kill -9
   ```

2. **MongoDB connection failed**
   - Check if MongoDB is running
   - Verify connection string in `.env`
   - Check network connectivity

3. **Google OAuth errors**
   - Verify client ID and secret
   - Check callback URL configuration
   - Ensure Google+ API is enabled

4. **CORS errors**
   - Check `FRONTEND_URL` in backend `.env`
   - Verify CORS configuration in server.js

### Debug Mode
Set `NODE_ENV=development` for detailed error messages.

## 📝 Environment Variables

See [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md) for comprehensive environment variable documentation.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the environment setup guide

## 🔄 Version History

- **v1.0.0** - Initial release with Google OAuth and basic user management
- Full MERN stack implementation
- Docker support
- Production-ready configuration