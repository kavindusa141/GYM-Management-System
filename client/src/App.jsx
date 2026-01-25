import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LandingPage from './pages/LandingPage';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword'; 
import ResetPassword from './pages/auth/ResetPassword';

// Layouts
import AdminLayout from './components/Layouts/AdminLayout';
import MemberLayout from './components/Layouts/MemberLayout';
import StaffLayout from './components/Layouts/StaffLayout';
import TrainerLayout from './components/Layouts/TrainerLayout';

// Member Pages
import MemberDashboard from './pages/member/Dashboard';
import MemberProfile from './pages/member/Profile';
import MemberProfileSetup from './pages/member/ProfileSetup';
import WorkoutPlans from './pages/member/WorkoutPlans';
import Payment from './pages/member/Payment';
import Receipt from './pages/member/Receipt';
import Schedule from './pages/member/Schedule';
import ScanAttendance from './pages/member/ScanAttendance';
import History from './pages/member/History';
import MemberSettings from './pages/member/Settings';


// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import MemberManagement from './pages/admin/MemberManagement';
import ManageStaff from './pages/admin/ManageStaff';
import Attendance from './pages/admin/Attendance';
import CreateMembershipPlan from './pages/admin/CreatePlan'; 
import Billing from './pages/admin/Billing';
import ManageClasses from './pages/admin/ManageClasses';
import Reports from './pages/admin/Reports';
import Equipment from './pages/admin/Equipment';
import AdminSettings from './pages/admin/Settings';

// Trainer Pages
import TrainerDashboard from './pages/trainer/Dashboard';
import CreateWorkoutPlan from './pages/trainer/CreatePlan';
import ClientProgress from './pages/trainer/ClientProgress';
import ManagePlans from './pages/trainer/ManagePlans';
import MyClasses from './pages/trainer/MyClasses';
import MyAvailability from './pages/trainer/MyAvailability';
import TrainerSettings from './pages/trainer/Settings';

// Staff Pages
import StaffDashboard from './pages/staff/Dashboard';
import MarkAttendance from './pages/staff/MarkAttendance';

// Protected Route Wrapper
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/unauthorized" />;
  return children;
};

export default function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />


      {/* Password Recovery Routes */}
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      
      {/* Receipt Route - Shared for both ADMIN and MEMBER */}
      <Route path="/receipt/:payment_id" element={
        <ProtectedRoute allowedRoles={['ADMIN', 'MEMBER']}>
          <Receipt />
        </ProtectedRoute>
      } />

      {/* --- MEMBER PORTAL --- */}
      <Route path="/member" element={
        <ProtectedRoute allowedRoles={['MEMBER']}>
          <MemberLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="dashboard" />} />
        <Route path="dashboard" element={<MemberDashboard />} />
        <Route path="profile-setup" element={<MemberProfileSetup />} />
        <Route path="profile" element={<MemberProfile />}/>
        <Route path="schedule" element={<Schedule />} />
        <Route path="workouts" element={<WorkoutPlans />} />
        <Route path="payment" element={<Payment />} />
        <Route path="scan" element={<ScanAttendance />} /> 
        <Route path="history" element={<History />} />
        <Route path="settings" element={<MemberSettings />} />
  

      </Route>

      {/* --- ADMIN PORTAL --- */}
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={['ADMIN']}>
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="dashboard" />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="members" element={<MemberManagement />} />
        <Route path="staff" element={<ManageStaff />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="create-plan" element={<CreateMembershipPlan />} />
        <Route path="billing" element={<Billing />} />
        <Route path="classes" element={<ManageClasses />} />
        <Route path="reports" element={<Reports />} />
        <Route path="equipment" element={<Equipment />} />
        <Route path="settings" element={<AdminSettings />} />
        
      </Route>

      {/* --- TRAINER PORTAL --- */}
      <Route path="/trainer" element={
            <ProtectedRoute allowedRoles={['TRAINER']}>
                 <TrainerLayout />
                   </ProtectedRoute>
         }>
  <Route index element={<Navigate to="dashboard" />} />
  <Route path="dashboard" element={<TrainerDashboard />} />
  <Route path="create-plan" element={<CreateWorkoutPlan />} />
  <Route path="plans" element={<ManagePlans />} />
  <Route path="edit-plan/:id" element={<CreateWorkoutPlan />} />
  <Route path="progress" element={<ClientProgress />} />
  <Route path="classes" element={<MyClasses />} />
  <Route path="availability" element={<MyAvailability />} />
  <Route path="settings" element={<TrainerSettings />} />
</Route>


      {/* --- STAFF PORTAL --- */}
      <Route path="/staff" element={
        <ProtectedRoute allowedRoles={['STAFF', 'TRAINER']}>
          <StaffLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="dashboard" />} />
        <Route path="dashboard" element={<StaffDashboard />} />
        <Route path="attendance" element={<MarkAttendance />} />
      </Route>

      {/* Catch-all Redirect */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}