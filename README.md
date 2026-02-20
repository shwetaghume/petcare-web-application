# 🐾 PetCare - Modern Pet Care Platform

A comprehensive, modern pet care platform built with the MERN stack, featuring pet adoption, pharmacy services, and veterinary care management.

## ✨ Features

### 🔐 Authentication & Security
- **Secure User Registration & Login** with JWT tokens
- **Comprehensive Input Validation** on both frontend and backend
- **Password Strength Requirements** with real-time feedback
- **Email Verification** and password reset capabilities
- **Protected Routes** with proper authorization

### 🐕 Pet Management
- **Pet Adoption System** with detailed pet profiles
- **Category-based Pet Browsing** (Dogs, Cats, Birds, Fish, Small Animals)
- **Advanced Search Functionality** with filters
- **Pet Details & Adoption Forms**

### 💊 Pharmacy Services
- **Pet Medications & Supplies**
- **Prescription Management**
- **Shopping Cart with Persistent Storage**
- **Product Categories & Search**

### 🏥 Veterinary Services
- **Appointment Booking System**
- **Emergency Care Information**
- **Service Listings & Details**

### 🎨 Modern UI/UX
- **Minimalistic & Clean Design** with modern aesthetics
- **Responsive Design** for all device sizes
- **Smooth Animations & Transitions**
- **Dark Mode Support** (auto-detection)
- **Accessibility Features** (WCAG compliant)
- **Loading States & Error Handling**

## 🛠️ Technical Stack

### Frontend
- **React 18** with Hooks and Context API
- **React Router 6** for navigation
- **Axios** for API communication
- **CSS Custom Properties** for theming
- **Modern CSS Grid & Flexbox** layouts
- **CSS Animations** for smooth interactions

### Backend
- **Node.js & Express.js** server
- **MongoDB** with Mongoose ODM
- **JWT Authentication** with bcryptjs
- **Input Validation & Sanitization**
- **Error Handling Middleware**
- **CORS Configuration**

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd PetFinal1
   ```

2. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Environment Configuration**
   
   Create a `.env` file in the backend directory:
   ```env
   MONGODB_URI=mongodb://localhost:27017/petcare
   JWT_SECRET=your-super-secret-jwt-key-here
   PORT=5000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3000
   ```

5. **Start the Development Servers**
   
   Backend (from backend directory):
   ```bash
   npm run dev
   ```
   
   Frontend (from frontend directory):
   ```bash
   npm start
   ```

6. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 📱 Application Structure

### Frontend Structure
```
src/
├── App.js                 # Main app with routing & auth context
├── App.css               # Modern design system & utilities
├── components/           # Reusable components
│   ├── Navbar.js        # Navigation with auth awareness
│   ├── Home.js          # Landing page with features
│   ├── Pets.js          # Pet listing & search
│   ├── Pharmacy.js      # Pharmacy & products
│   ├── Services.js      # Veterinary services
│   └── Cart.js          # Shopping cart
├── pages/               # Page components
│   ├── Login.js         # Enhanced login with validation
│   └── Register.js      # Registration with strength indicator
└── styles/              # Component-specific styles
```

### Backend Structure
```
backend/
├── index.js             # Express server setup
├── models/              # MongoDB schemas
│   ├── User.js          # Enhanced user model
│   ├── Pet.js           # Pet model
│   └── Adoption.js      # Adoption model
├── routes/              # API routes
│   ├── auth.js          # Authentication routes
│   ├── pets.js          # Pet management
│   └── users.js         # User management
└── middleware/          # Custom middleware
    └── auth.js          # JWT authentication
```

## 🎨 Design System

### Color Palette
- **Primary**: #2563eb (Blue)
- **Accent**: #0ea5e9 (Sky Blue)
- **Success**: #10b981 (Green)
- **Warning**: #f59e0b (Amber)
- **Error**: #ef4444 (Red)
- **Neutrals**: Gray scale from 50-900

### Typography
- **Font Family**: System fonts (Apple/Segoe UI/Roboto)
- **Font Weights**: 300, 400, 500, 600, 700
- **Responsive Scaling**: Fluid typography

### Components
- **Cards**: Elevated with subtle shadows
- **Buttons**: Multiple variants (primary, secondary, ghost)
- **Forms**: Clean inputs with focus states
- **Navigation**: Sticky header with smooth scrolling

## 🔒 Security Features

### Frontend Security
- **Input Sanitization** before API calls
- **Client-side Validation** with real-time feedback
- **Secure Token Storage** in localStorage
- **Protected Route Components**
- **CSRF Protection** headers

### Backend Security
- **Password Hashing** with bcrypt (cost: 12)
- **JWT Token Validation** with expiry
- **Input Validation** with comprehensive rules
- **Error Handling** without exposing system details
- **Rate Limiting** (configurable)
- **CORS Configuration** for trusted origins

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/change-password` - Change password

### Pets
- `GET /api/pets` - Get all pets
- `GET /api/pets/:id` - Get specific pet
- `POST /api/pets` - Add new pet (admin)
- `PUT /api/pets/:id` - Update pet (admin)
- `DELETE /api/pets/:id` - Delete pet (admin)

### Users
- `GET /api/users` - Get all users (admin)
- `GET /api/users/:id` - Get specific user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (admin)

## 🧪 Testing

### Frontend Testing
```bash
cd frontend
npm test
```

### Backend Testing
```bash
cd backend
npm test
```

## 🚀 Deployment

### Environment Variables
For production, ensure these environment variables are set:
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Strong JWT secret key
- `NODE_ENV=production`
- `FRONTEND_URL` - Production frontend URL

### Build Commands
```bash
# Frontend build
cd frontend
npm run build

# Backend start
cd backend
npm start
```

## 📈 Performance Optimizations

- **Lazy Loading** for images and components
- **Code Splitting** with React.lazy
- **Memoization** for expensive calculations
- **Database Indexing** on frequently queried fields
- **Compression** middleware for API responses
- **Caching** strategies for static assets

## 🎯 Future Enhancements

- [ ] **Email Notifications** for adoptions and appointments
- [ ] **Payment Integration** for pharmacy orders
- [ ] **Real-time Chat** for customer support
- [ ] **Mobile App** with React Native
- [ ] **Advanced Analytics** dashboard
- [ ] **Social Features** (reviews, ratings)
- [ ] **Multi-language Support**

## 💸 Payment Flow

All pharmacy and product orders are now placed using **Cash on Delivery (COD)**. No online payment is required. Payment is collected at the time of delivery by the courier.

- When placing an order, users provide their shipping address and contact details.
- The order is confirmed and processed for delivery.
- Payment is made in cash when the order is delivered to the user.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Frontend Development**: Modern React with hooks and context
- **Backend Development**: RESTful API with Express.js
- **Database Design**: MongoDB with Mongoose ODM
- **UI/UX Design**: Minimalistic and accessible design

## 📞 Support

For support, email support@petcare.com or create an issue in the repository.

---

**Built with ❤️ for pet lovers everywhere** 🐾 