# IFCA-2025 Application

A comprehensive platform with admin frontend, user frontend, and backend services for managing communities, sessions, and user interactions.

## 🏗️ Project Structure

```
IFCA-2025/
├── admin-frontend/     # Admin dashboard (Next.js)
├── frontend/          # User-facing application (Next.js)
├── backend/           # API server (Node.js + Express)
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **PostgreSQL** database
- **Redis** (optional, for caching)

### 1. Backend Setup

The backend is the core API server that both frontends depend on.

```bash
cd backend

# Install dependencies
npm install
# or
yarn install

# Set up environment variables
cp .env.example .env
# Edit .env with your database and other configurations

# Set up database
npx prisma migrate dev
npx prisma generate

# Start the server
npm run dev
# or
yarn dev
```

**Backend will run on:** `http://localhost:5000`

#### Backend Environment Variables

Create a `.env` file in the backend directory:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/ifca_db"

# JWT Secret
JWT_SECRET="your-secret-key"

# Server
PORT=5000
NODE_ENV=development

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# File Upload
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760
```

### 2. Admin Frontend Setup

The admin frontend provides administrative controls and community management.

```bash
cd admin-frontend

# Install dependencies
npm install
# or
yarn install

# Set up environment variables
cp .env.example .env
# Edit .env with your backend API URL

# Start the development server
npm run dev
# or
yarn dev
```

**Admin Frontend will run on:** `http://localhost:3000`

#### Admin Frontend Environment Variables

Create a `.env.local` file in the admin-frontend directory:

```env
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:5000

# Google OAuth (if using)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id

# Other configurations
NEXT_PUBLIC_APP_NAME=IFCA Admin
```

### 3. Frontend Setup

The main user-facing frontend application.

```bash
cd frontend

# Install dependencies
npm install
# or
yarn install

# Set up environment variables
cp .env.example .env
# Edit .env with your backend API URL

# Start the development server
npm run dev
# or
yarn dev
```

**Frontend will run on:** `http://localhost:3001`

#### Frontend Environment Variables

Create a `.env.local` file in the frontend directory:

```env
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:5000

# Google OAuth (if using)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id

# Other configurations
NEXT_PUBLIC_APP_NAME=IFCA
```

## 🗄️ Database Setup

### PostgreSQL Installation

1. **Install PostgreSQL** on your system
2. **Create a database:**
   ```sql
   CREATE DATABASE ifca_db;
   CREATE USER ifca_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE ifca_db TO ifca_user;
   ```

### Database Migrations

```bash
cd backend

# Run migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# Seed database (if seed files exist)
npx prisma db seed
```

## 🔧 Development Commands

### Backend

```bash
cd backend

# Development
npm run dev          # Start with nodemon
npm start           # Start production server

# Database
npm run db:migrate  # Run migrations
npm run db:seed     # Seed database
npm run db:reset    # Reset database

# Testing
npm test            # Run tests
npm run test:watch  # Run tests in watch mode
```

### Admin Frontend

```bash
cd admin-frontend

# Development
npm run dev         # Start development server
npm run build       # Build for production
npm start           # Start production server

# Testing
npm test            # Run tests
npm run test:watch  # Run tests in watch mode

# Linting
npm run lint        # Run ESLint
npm run lint:fix    # Fix linting issues
```

### Frontend

```bash
cd frontend

# Development
npm run dev         # Start development server
npm run build       # Build for production
npm start           # Start production server

# Testing
npm test            # Run tests
npm run test:watch  # Run tests in watch mode

# Linting
npm run lint        # Run ESLint
npm run lint:fix    # Fix linting issues
```

## 🌐 API Documentation

### Base URL
- **Development:** `http://localhost:5000`
- **Production:** `https://your-domain.com`

### Key Endpoints

#### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/refresh` - Refresh token

#### Communities
- `GET /api/community` - List communities
- `POST /api/community` - Create community
- `PUT /api/community/:id` - Update community
- `DELETE /api/community/:id` - Delete community

#### Members
- `GET /api/community/:id/members` - List community members
- `PUT /api/community/:id/members/:subscriptionId/role` - Change member role
- `POST /api/admin/community/:id/subscriptions` - Add/remove members

#### Sessions
- `GET /api/session` - List sessions
- `POST /api/session` - Create session
- `PUT /api/session/:id` - Update session

## 🚀 Production Deployment

### Backend Deployment

```bash
cd backend

# Build the application
npm run build

# Start production server
npm start

# Or use PM2
pm2 start ecosystem.config.js
```

### Frontend Deployment

```bash
cd frontend
cd admin-frontend

# Build for production
npm run build

# Start production server
npm start

# Or deploy to Vercel/Netlify
vercel --prod
```

## 🐳 Docker Deployment

### Using Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Individual Docker Commands

```bash
# Backend
docker build -t ifca-backend ./backend
docker run -p 5000:5000 ifca-backend

# Admin Frontend
docker build -t ifca-admin ./admin-frontend
docker run -p 3000:3000 ifca-admin

# Frontend
docker build -t ifca-frontend ./frontend
docker run -p 3001:3001 ifca-frontend
```

## 🔍 Troubleshooting

### Common Issues

1. **Port Conflicts**
   - Backend: Change `PORT` in `.env`
   - Frontend: Change port in `package.json` scripts

2. **Database Connection**
   - Verify PostgreSQL is running
   - Check `DATABASE_URL` in backend `.env`
   - Ensure database exists and user has permissions

3. **CORS Issues**
   - Verify `NEXT_PUBLIC_API_URL` in frontend `.env`
   - Check backend CORS configuration

4. **Build Errors**
   - Clear `node_modules` and reinstall
   - Check Node.js version compatibility
   - Verify all environment variables are set

### Logs and Debugging

```bash
# Backend logs
cd backend && npm run dev

# Frontend logs
cd frontend && npm run dev
cd admin-frontend && npm run dev

# Database logs
npx prisma studio
```

## 📱 Features

### Admin Frontend
- Community management
- User role management
- Session scheduling
- Analytics dashboard
- Content moderation

### Frontend
- User authentication
- Community participation
- Session joining
- Content creation
- Social interactions

### Backend
- RESTful API
- Authentication & authorization
- File uploads
- Email notifications
- Real-time features

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the API endpoints

---

**Happy Coding! 🚀**

