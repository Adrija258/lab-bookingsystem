# 🔬 LabBook — Online Lab Equipment Booking & Availability Management System

A full-stack MERN application for managing lab equipment bookings with role-based access control.

---

## 📁 Project Structure

```
lab-booking/
├── backend/
│   ├── config/
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── equipmentController.js
│   │   └── bookingController.js
│   ├── middleware/
│   │   └── authMiddleware.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Equipment.js
│   │   └── Booking.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── equipmentRoutes.js
│   │   └── bookingRoutes.js
│   ├── seed.js
│   ├── server.js
│   ├── .env
│   └── package.json
│
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.js
    │   │   ├── EquipmentCard.js
    │   │   └── LoadingSpinner.js
    │   ├── context/
    │   │   └── AuthContext.js
    │   ├── pages/
    │   │   ├── LoginPage.js
    │   │   ├── RegisterPage.js
    │   │   ├── DashboardPage.js
    │   │   ├── EquipmentPage.js
    │   │   ├── BookingPage.js
    │   │   ├── BookingHistoryPage.js
    │   │   ├── AdminPanelPage.js
    │   │   └── AdminEquipmentPage.js
    │   ├── services/
    │   │   └── api.js
    │   ├── App.js
    │   ├── App.css
    │   └── index.js
    ├── .env
    └── package.json
```

---

## ⚙️ Prerequisites

Make sure you have installed:
- **Node.js** v16+ → https://nodejs.org
- **MongoDB** (local) → https://www.mongodb.com/try/download/community  
  OR use **MongoDB Atlas** (cloud) → https://www.mongodb.com/atlas
- **npm** (comes with Node.js)

---

## 🚀 Step-by-Step Setup

### Step 1: Clone / Extract the project

```bash
# If using git:
git clone <your-repo-url> lab-booking
cd lab-booking

# Or just navigate to the extracted folder
```

---

### Step 2: Setup Backend

```bash
# Navigate to backend folder
cd backend

# Install dependencies
npm install

# The .env file is already created with defaults:
# PORT=5000
# MONGO_URI=mongodb://localhost:27017/lab_booking
# JWT_SECRET=lab_booking_super_secret_jwt_key_2024
```

**If using MongoDB Atlas**, update `MONGO_URI` in `backend/.env`:
```
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/lab_booking
```

---

### Step 3: Seed the Database (Sample Data)

```bash
# From the backend folder
node seed.js
```

This creates:
- 4 users (1 admin + 3 students)
- 10 lab equipment items
- 5 sample bookings

---

### Step 4: Start the Backend

```bash
# Development mode (auto-restart)
npm run dev

# OR production mode
npm start
```

Backend runs at: **http://localhost:5000**

---

### Step 5: Setup Frontend

```bash
# Open a new terminal, navigate to frontend
cd ../frontend

# Install dependencies
npm install
```

---

### Step 6: Start the Frontend

```bash
npm start
```

Frontend runs at: **http://localhost:3000**  
It auto-opens in your browser.

---

## 🔑 Login Credentials (after seeding)

| Role    | Email              | Password    |
|---------|--------------------|-------------|
| Admin   | admin@lab.com      | admin123    |
| Student | student@lab.com    | student123  |
| Student | bob@lab.com        | student123  |
| Student | carol@lab.com      | student123  |

---

## 🌐 API Endpoints

### Auth
| Method | Endpoint              | Access  | Description         |
|--------|-----------------------|---------|---------------------|
| POST   | /api/auth/register    | Public  | Register new user   |
| POST   | /api/auth/login       | Public  | Login user          |
| GET    | /api/auth/me          | Private | Get current user    |

### Equipment
| Method | Endpoint              | Access       | Description         |
|--------|-----------------------|--------------|---------------------|
| GET    | /api/equipment        | Private      | Get all equipment   |
| GET    | /api/equipment/:id    | Private      | Get single item     |
| POST   | /api/equipment        | Admin only   | Add equipment       |
| PUT    | /api/equipment/:id    | Admin only   | Update equipment    |
| DELETE | /api/equipment/:id    | Admin only   | Delete equipment    |

### Bookings
| Method | Endpoint              | Access       | Description                  |
|--------|-----------------------|--------------|------------------------------|
| GET    | /api/bookings         | Private      | Get bookings (role-filtered) |
| POST   | /api/bookings         | Student      | Create booking               |
| PUT    | /api/bookings/:id     | Private      | Approve/reject/cancel        |
| GET    | /api/bookings/stats   | Admin        | Get dashboard statistics     |

---

## 🎯 Features

### Authentication
- JWT-based authentication with 7-day expiry
- Role-based access (Admin / Student)
- Secure bcrypt password hashing (12 rounds)
- Auto-redirect on token expiry

### Student Features
- Browse lab equipment with search + category filters
- View equipment availability
- Book equipment by selecting date and time slot
- Real-time slot availability display
- View booking history with status
- Cancel pending bookings

### Admin Features
- Dashboard with statistics
- Full equipment CRUD (Add/Edit/Delete)
- Toggle equipment availability
- View all booking requests
- Approve / Reject bookings with optional notes
- Filter bookings by status

### Technical Highlights
- **Double-booking prevention** at controller + model level
- Frontend + backend validation
- Toast notifications for all actions
- Loading states with spinners
- Empty state handling
- Responsive design (mobile → desktop)
- MVC architecture pattern

---

## 🛠️ Troubleshooting

**MongoDB connection error:**
```bash
# Make sure MongoDB is running locally
sudo systemctl start mongod       # Linux
brew services start mongodb-community  # macOS
# Or use MongoDB Atlas cloud URI
```

**Port already in use:**
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

**npm install fails:**
```bash
npm cache clean --force
npm install
```

---

## 🏗️ Tech Stack

| Layer      | Technology                     |
|------------|-------------------------------|
| Frontend   | React 18, React Router v6     |
| Styling    | Bootstrap 5, Bootstrap Icons  |
| HTTP       | Axios                         |
| Toasts     | React Toastify                |
| Backend    | Node.js, Express.js           |
| Database   | MongoDB, Mongoose             |
| Auth       | JWT, bcryptjs                 |
| Validation | express-validator             |

---

## 📝 Notes for Viva

1. **MVC Pattern**: Models in `/models`, Controllers in `/controllers`, Routes in `/routes`
2. **JWT Flow**: Login → receive token → attach to every request header → middleware verifies
3. **Double Booking**: Checked at controller level using `Booking.isSlotAvailable()` static method
4. **Role-based Auth**: Two middleware functions: `protect` (any logged in user) and `adminOnly` (admins only)
5. **React Context**: `AuthContext` provides global user state and auth functions to all components
6. **Axios Interceptors**: Auto-attach token to requests, auto-redirect on 401 errors
