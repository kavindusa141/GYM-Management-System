# 🏋️‍♂️ Enterprise Gym Management System with Automated Billing & Digital Check-In

[![Node.js Version](https://img.shields.io/badge/Node.js-v18+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/React-v19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS Version](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Database](https://img.shields.io/badge/MySQL-Sequelize_ORM-4479A1?style=flat-square&logo=mysql&logoColor=white)](https://mysql.com/)
[![Payment Gateway](https://img.shields.io/badge/Stripe-Integration-635BFF?style=flat-square&logo=stripe&logoColor=white)](https://stripe.com/)
[![License](https://img.shields.io/badge/License-ISC-blue.svg?style=flat-square)](LICENSE)

A comprehensive, production-ready enterprise web application designed to streamline gym operations, eliminate membership revenue leakage, automate recurring billing, schedule classes, track attendance, and provide interactive analytics. 

Built with a robust, high-performance Node.js & Express REST API, standard database indexing, and a modern, responsive React 19 single-page application styled using Tailwind CSS v4 and Framer Motion animations.

---

## 📖 Table of Contents
1. [Core Features](#-core-features)
2. [System Architecture & Flow](#-system-architecture--flow)
3. [Database Entity-Relationship Diagram (ERD)](#-database-entity-relationship-diagram-erd)
4. [Role-Based Access Control (RBAC)](#-role-based-access-control-rbac)
5. [Key Technical Integrations](#-key-technical-integrations)
6. [Tech Stack Details](#-tech-stack-details)
7. [Prerequisites & Environment Variables](#-prerequisites--environment-variables)
8. [Installation & Local Setup](#-installation--local-setup)
9. [Running the Application](#-running-the-application)
10. [Database Management & Optimizations](#-database-management--optimizations)
11. [Project Lifecycle & PM Governance](#-project-lifecycle--pm-governance)
12. [License](#-license)

---

## 🚀 Core Features

### 👤 Role-Based Portals (RBAC)
- **Administrators**: Control system settings, manage memberships, oversee trainers & staff, adjust pricing, and generate dynamic reports.
- **Trainers**: Manage client assignments, track workouts & health metrics, set availability schedules, and build workout plans.
- **Members**: Book gym classes via an interactive calendar, manage Stripe subscriptions, check-in using secure QR codes, and review workout logs.
- **Front-Desk Staff**: Handle manual member registrations, verify digital QR check-ins, and manage daily class schedules.

### 💳 Stripe Automated Billing & PDF Invoicing
- Secure credit card processing using **Stripe Checkout Sessions**.
- Asynchronous webhook integration processing real-time subscription activations, cancellations, and payment failures.
- Auto-generation of professional **PDF Receipts and Invoices** on the member portal (using jsPDF & html2canvas).

### 📷 WebRTC QR-Code Attendance System
- Member check-ins via a built-in camera scanner component.
- Real-time verification checks on subscription status.
- Fallback manual check-in tools for administrative staff.

### 📊 Real-Time Analytics & Report Engine
- Interactive dashboards with charts for revenue, member growth, class capacity, and trainer metrics (using Recharts).
- **Attendance Heatmaps** demonstrating gym capacity peaks by day and time.
- Dynamic report exporting to **CSV & PDF** files.

### 📅 Class Booking & Scheduling
- Full visual calendar integration (using React Big Calendar).
- Capacity thresholds and automated waitlist tracking.
- Trainer availability tracking to avoid scheduling double-bookings.

---

## 🏗️ System Architecture & Flow

The system employs a clear separation of concerns, decoupling the frontend SPA from the backend REST API, and integrating with external microservices:

```mermaid
flowchart TD
    %% Styling
    classDef client fill:#e3f2fd,stroke:#1565c0,stroke-width:2px;
    classDef server fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px;
    classDef database fill:#fffde7,stroke:#fbc02d,stroke-width:2px;
    classDef external fill:#fbe9e7,stroke:#d84315,stroke-width:2px;

    %% Client Layer
    subgraph ClientLayer["Vite React SPA (Frontend)"]
        UI[React Views / Pages] --> AuthCtx[Auth Context JWT]
        UI --> StripeJS[Stripe Elements JS]
        UI --> QRScanner[react-qr-scanner]
        UI --> Recharts[Recharts Analytics]
    end
    class UI,AuthCtx,StripeJS,QRScanner,Recharts client;

    %% API Server Layer
    subgraph ServerLayer["Node.js & Express REST API"]
        App[Express Router] --> RateLimit[Brute-Force Rate Limiter]
        RateLimit --> AuthMiddleware[JWT Auth Middleware]
        AuthMiddleware --> Controller[Route Controllers]
        Controller --> CronJobs[Node-Cron Scheduled Jobs]
    end
    class App,RateLimit,AuthMiddleware,Controller,CronJobs server;

    %% Database Layer
    subgraph DBLayer["Database (Storage)"]
        Sequelize[Sequelize ORM] --> MySQL[(MySQL DB)]
    end
    class Sequelize,MySQL database;

    %% External Services
    subgraph External["External Cloud Integrations"]
        Stripe[Stripe API & Webhooks]
        Cloudinary[Cloudinary Media Storage]
        Nodemailer[SMTP / Nodemailer Email Server]
    end
    class Stripe,Cloudinary,Nodemailer external;

    %% Interconnections
    UI -- HTTPS Requests --> App
    Controller --> Sequelize
    UI -. Payment Intent .-> Stripe
    Stripe -- Webhook Triggers --> App
    Controller --> Cloudinary
    Controller --> Nodemailer
```

---

## 🗄️ Database Entity-Relationship Diagram (ERD)

The database schema utilizes standard foreign key relationships optimized with custom indexing rules to allow scalable querying:

```mermaid
erDiagram
    USERS ||--o| MEMBER_PROFILES : "has profile"
    USERS ||--o{ USER_SUBSCRIPTIONS : "subscribes"
    USERS ||--o{ PAYMENTS : "makes"
    USERS ||--o{ CLASS_BOOKINGS : "books"
    USERS ||--o{ ATTENDANCES : "checks in"
    USERS ||--o{ WORKOUT_PLANS : "assigned / created"
    USERS ||--o{ PROGRESS_LOGS : "monitored / logged"
    USERS ||--o{ MEMBER_ASSIGNMENTS : "linked trainer/member"
    
    MEMBERSHIP_PLANS ||--o{ USER_SUBSCRIPTIONS : "associated plan"
    MEMBERSHIP_PLANS ||--o{ PAYMENTS : "charged plan"
    PROMOTIONS ||--o{ PAYMENTS : "applied promo"
    
    GYM_CLASSES ||--o{ CLASS_BOOKINGS : "holds"
    USERS ||--o{ GYM_CLASSES : "trains"
    
    WORKOUT_PLANS ||--o{ WORKOUT_EXERCISES : "contains"
    WORKOUT_PLANS ||--o{ WORKOUT_LOGS : "tracks"
    USERS ||--o{ WORKOUT_LOGS : "records"

    USERS {
        int id PK
        string name
        string email
        string password_hash
        string role "ADMIN | TRAINER | MEMBER | STAFF"
        string status "ACTIVE | INACTIVE"
        boolean is_deleted
    }

    MEMBER_PROFILES {
        int id PK
        int user_id FK
        float height
        float weight
        string emergency_contact
        string medical_conditions
    }

    USER_SUBSCRIPTIONS {
        int id PK
        int user_id FK
        int plan_id FK
        date start_date
        date end_date
        string status "ACTIVE | EXPIRED | CANCELLED"
        string stripe_sub_id
    }

    MEMBERSHIP_PLANS {
        int id PK
        string name
        float price
        int duration_months
        string description
    }

    PAYMENTS {
        int id PK
        int user_id FK
        int plan_id FK
        int promo_id FK
        float amount
        string currency
        string status "PAID | FAILED | PENDING"
        date transaction_date
        string invoice_number
    }

    GYM_CLASSES {
        int id PK
        string class_name
        int trainer_id FK
        datetime start_time
        datetime end_time
        int max_capacity
    }

    CLASS_BOOKINGS {
        int id PK
        int class_id FK
        int user_id FK
        string status "BOOKED | CANCELLED"
    }

    ATTENDANCES {
        int id PK
        int member_id FK
        datetime check_in_time
        string check_in_method "QR | MANUAL"
    }

    WORKOUT_PLANS {
        int id PK
        string plan_name
        int member_id FK
        int trainer_id FK
        int updated_by FK
    }

    WORKOUT_EXERCISES {
        int id PK
        int plan_id FK
        string exercise_name
        int sets
        int reps
        int rest_seconds
    }

    PROGRESS_LOGS {
        int id PK
        int member_id FK
        int trainer_id FK
        float weight
        float body_fat_percentage
        date log_date
    }
```

---

## 🛡️ Role-Based Access Control (RBAC)

The application enforces security scopes on the router and layout levels. Users are automatically redirected to their specific dashboards upon login.

| Feature Module | Admin | Trainer | Staff | Member |
| :--- | :---: | :---: | :---: | :---: |
| **System Settings Configuration** | ✅ | ❌ | ❌ | ❌ |
| **Membership Plan Management** | ✅ | ❌ | ❌ | ❌ |
| **Financial Revenue & Audit Logs** | ✅ | ❌ | ❌ | ❌ |
| **Trainer / Client Assignments** | ✅ | ❌ | ❌ | ❌ |
| **Staff & Trainer Directory Control**| ✅ | ❌ | ❌ | ❌ |
| **Workout Plan Architect** | ✅ | ✅ | ❌ | ❌ |
| **Member Progress Logging** | ✅ | ✅ | ❌ | ❌ |
| **Class Booking Calendar** | ✅ | ✅ | ✅ | ✅ |
| **Manual Member Registration** | ✅ | ❌ | ✅ | ❌ |


---

## 🔌 Key Technical Integrations

### 1. Stripe Checkout Flow & Webhook Syncing
Members choose their subscription tier on the client app, which communicates with the backend to create a Stripe checkout session. Once payment completes:
- Stripe transmits an asynchronous `checkout.session.completed` or `invoice.payment_succeeded` request to the backend webhook endpoint.
- The webhook verifies the signature using `stripe.webhooks.constructEvent()` for security.
- The system automatically triggers the updates to the corresponding `user_subscriptions` and logs the payment transaction in the database.

### 2. Live WebRTC QR Code Scanner
The member portal features a QR code generator containing the user's encoded validation payload.
- The reception desk runs the frontend scanning interface (`@yudiel/react-qr-scanner`) via a standard webcam or USB QR reader.
- It parses the token, queries the attendance API, checks if the member has a valid active subscription, and saves the attendance check-in timestamp.
- On success, visual alerts display the check-in confirmation within 2 seconds.

### 3. Automated System Tasks (Cron Services)
The server runs background workers using `node-cron` to execute operational cleanup:
- **Subscription Auditing**: Runs daily at midnight to scan `user_subscriptions` and transition expired memberships to the `EXPIRED` status, changing users' status to `INACTIVE`.
- **System Metrics Cleanup**: Compresses outdated log assets and checks database health metrics.

---

## 🛠️ Tech Stack Details

### Client-Side (Frontend)
- **Core Framework**: React 19 (Vite compilation engine)
- **Styling**: Tailwind CSS v4 & PostCSS 8
- **Transitions & Animations**: Framer Motion 12
- **State Management**: React Context API & Custom Custom hooks
- **Router**: React Router DOM 7
- **HTTP Client**: Axios (configured with interceptors for JWT injection)
- **Visualization**: Recharts 3 (interactive line, bar, and pie charts)
- **Calendar Engine**: React Big Calendar 1
- **File Utilities**: jsPDF 4, jsPDF-AutoTable 5, html2canvas 1
- **UI Notifications**: React Hot Toast 2

### Server-Side (Backend API)
- **Runtime**: Node.js v18+
- **Web Server Framework**: Express.js v5
- **ORM**: Sequelize v6
- **Database Driver**: mysql2 v3
- **Authentication**: jsonwebtoken (JWT) v9, bcrypt v6
- **Asset Storage Manager**: Multer v2 & Cloudinary SDK
- **Task Runner**: node-cron v4
- **Email Dispatcher**: Nodemailer v7
- **Brute-Force Protection**: express-rate-limit v8

---

## ⚙️ Prerequisites & Environment Variables

Ensure you have the following installed locally:
- **Node.js** (v18.x or above)
- **MySQL Server** (v8.x or above)

### 1. Backend Environment Variables (`backend/.env`)
Create a `.env` file inside the `backend` folder:
```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_db_username
DB_PASSWORD=your_db_password
DB_NAME=gym_management_db

JWT_SECRET=your_jwt_signing_secret_key
JWT_EXPIRES_IN=24h

STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_secret

EMAIL_USER=your_smtp_sender_email@gmail.com
EMAIL_PASS=your_app_password
```

### 2. Client Environment Variables (`client/.env`)
Create a `.env` file inside the `client` folder:
```env
VITE_API_URL=http://localhost:5000/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

---

## 📦 Installation & Local Setup

### Step 1: Clone the Project
```bash
git clone <repository-url>
cd GYM-Management-System
```

### Step 2: Set up Backend Services
```bash
cd backend
npm install
```
Configure your database connection inside `backend/.env`.

### Step 3: Set up Frontend App
```bash
cd ../client
npm install
```
Configure your VITE variables inside `client/.env`.

### Step 4: Run Database Sync
The database schema will automatically sync models when launching the backend server. If you want to configure optimal indexes, run the indexing script:
```bash
cd ../backend
npm run db:index # or node scripts/setupIndexes.js
```

---

## 🏃‍♂️ Running the Application

### Option A: Development Environment (Nodemon + Vite)

1. **Start the Backend Server (Terminal 1)**:
   ```bash
   cd backend
   npm run dev
   # Server will start on http://localhost:5000
   ```
2. **Start the React Client (Terminal 2)**:
   ```bash
   cd client
   npm run dev
   # App will open on http://localhost:5173
   ```

### Option B: Production Environment

1. **Compile React Frontend Assets**:
   ```bash
   cd client
   npm run build
   # Compiled static assets will output to client/dist
   ```
2. **Start Server**:
   ```bash
   cd ../backend
   npm start
   # Runs server in production mode
   ```

---

## 🎛️ Database Management & Optimizations

The system provides utility tools in the `backend/scripts` folder to support testing, auditing, and maintenance:

### 1. Database Index Setup (`npm run db:index` / `node scripts/setupIndexes.js`)
Builds fast indexing layers for MySQL, dramatically improving fetch query performance during peak gym hours:
- `idx_users_name`, `idx_users_status`, `idx_users_role`, `idx_users_is_deleted` on the `users` table.
- `idx_payments_date`, `idx_payments_status` on the `payments` table.
- `idx_subscriptions_status`, `idx_subscriptions_end_date` on the `user_subscriptions` table.

### 2. Database Factory Reset Sandbox (`npm run db:reset` / `node scripts/factoryReset.js`)
For testing, staging, and demo resets, this script cleans the sandbox space:
- Temporarily disables foreign key constraints (`SET FOREIGN_KEY_CHECKS = 0`).
- Truncates all transactional rows (Payments, Bookings, Attendances, Logs, Member Profiles).
- Deletes all users except the root account having the role `ADMIN`.
- Resets auto-increment indexes to `1` across all tables.

---

## 🤝 Project Lifecycle & PM Governance

This application was delivered using a hybrid **Agile-Waterfall lifecycle** to enforce budget and schedule baselines while remaining highly adaptable during development:

### Milestone Breakdown
- 📅 **Milestone 1**: Project Charter Approved (Week 2)
- 📅 **Milestone 2**: Database Schema Finalized (Week 8)
- 📅 **Milestone 3**: Backend APIs Completed & Certified (Week 14)
- 📅 **Milestone 4**: Payment Integration & Security Audit (Week 21)
- 📅 **Milestone 5**: UAT and Final Handover Completed (Week 26)



---

## 📄 License

Distributed under the ISC License. See `LICENSE` for more information.

---

*Designed and developed to automate enterprise fitness logistics.* 🏋️‍♂️✨
