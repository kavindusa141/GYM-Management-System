# GYM Management System

A comprehensive web application designed to streamline gym operations, manage memberships, schedule classes, track attendance, and provide detailed analytics for gym owners and trainers. This system features a robust backend built with Node.js and Express, ensuring secure and efficient data management, coupled with a modern, responsive frontend using React and Tailwind CSS.

## 🆕 Recent Updates (Current Stage)

### v1.1 - Enhanced Reporting & Member Management
-   **Attendance Reports**: Now includes member names for better identification in attendance logs.
-   **Heatmap Fixes**: Resolved API errors to ensure accurate attendance visualization on the dashboard.
-   **New Registration Page**: Replaced the previous modal with a full-page, premium registration experience for adding new members.
-   **Collaborative Workout Plans**: Trainers can now view, edit, and audit common workout plans, with tracking of the creator and last editor.

## 🚀 Features

### 👤 User Roles & Authentication
- **Role-Based Access Control (RBAC)**: Distinct dashboards and functionalities for **Admins**, **Trainers**, **Members**, and **Staff**.
- **Secure Authentication**: JWT-based authentication with bcrypt for password hashing.

### 🏋️‍♂️ Member Management
- **Registration & Profiles**: Detailed member profiles including health metrics and membership status.
- **Membership Plans**: Create and manage different membership tiers.
- **Progress Tracking**: Track member's physical progress over time.

### 📅 Scheduling & Booking
- **Class Management**: Admins and Trainers can schedule classes and assign trainers.
- **Booking System**: Members can browse and book available slots for classes.
- **Availability**: Trainers can manage their availability.

### 📝 Workout Plans
- **Personalized Plans**: Trainers can create custom workout routines for specific members.
- **Collaborative Common Plans**: Shared repository of workout plans that all trainers can contribute to and audit.
- **Visual Guides**: Integration for tracking exercises and sets.

### 📊 Reports & Analytics
- **Dashboard**: Interactive charts for revenue, member growth, and gym usage.
- **Attendance Handling**:
    - **QR Code Scanning**: Fast check-in/out for members.
    - **Manual Entry**: Fallback for staff/admins.
    - **Detailed Reports**: Heatmaps and list views showing member attendance history.
- **Financial Reports**: Track income from memberships and other services.

### 💳 Payments
- **Stripe Integration**: Secure payment processing for membership fees.
- **Invoice Generation**: Automated PDF invoice generation for payments.

## 🛠️ Tech Stack

### Client (Frontend)
- **Framework**: React 19 (Vite)
- **Styling**: Tailwind CSS 4, Lucide React (Icons)
- **State Management**: React Context / Hooks
- **Routing**: React Router DOM 7
- **HTTP Client**: Axios
- **Visualization**: Recharts
- **Utilities**: Date-fns, React Big Calendar, HTML2Canvas, JSPDF

### Backend (API)
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL (using Sequelize ORM)
- **Authentication**: JSON Web Tokens (JWT), Bcrypt
- **Email Service**: Nodemailer
- **File Uploads**: Multer
- **Scheduling**: Node-cron
- **Payment Gateway**: Stripe

## ⚙️ Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher recommended)
- **MySQL** Server
- **npm** or **yarn** package manager

## 📦 Installation

1.  **Clone the Repository**
    ```bash
    git clone <repository-url>
    cd GYM-Management-System
    ```

2.  **Backend Setup**
    ```bash
    cd backend
    npm install
    ```
    *   Create a `.env` file in the `backend` directory with the following variables (example):
        ```env
        PORT=5000
        DB_HOST=localhost
        DB_USER=root
        DB_PASSWORD=yourpassword
        DB_NAME=gym_db
        JWT_SECRET=your_jwt_secret
        STRIPE_SECRET_KEY=your_stripe_key
        EMAIL_USER=your_email@example.com
        EMAIL_PASS=your_email_password
        ```

3.  **Client Setup**
    ```bash
    cd ../client
    npm install
    ```
    *   Create a `.env` file in the `client` directory if needed (e.g., for API base URL):
        ```env
        VITE_API_URL=http://localhost:5000/api
        ```

## 🏃‍♂️ Running the Application

### Start the Backend
```bash
cd backend
npm run dev
# Server will start on http://localhost:5000 (or your configured port)
```

### Start the Client
```bash
cd client
npm run dev
# Application will run on http://localhost:5173 (default Vite port)
```

## 🤝 Contributing

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

Distributed under the ISC License.
