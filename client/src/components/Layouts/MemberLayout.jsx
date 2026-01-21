import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Calendar, CheckCircle, LogOut, User, Menu, X, QrCode, Dumbbell, CreditCard 
} from 'lucide-react';
import { useState } from 'react';

export default function MemberLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Helper for link styles (Dark Theme Adapted)
  const getLinkClass = (path) => {
    const isActive = location.pathname === path;
    return `flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-all ${
      isActive 
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' // Active: Blue with Glow
        : 'text-slate-400 hover:bg-slate-800 hover:text-white' // Inactive: Slate text, Dark Hover
    }`;
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900 overflow-hidden">
      
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* --- SIDEBAR (Dark Theme) --- */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30 w-72 bg-slate-900 border-r border-slate-800 shadow-2xl lg:shadow-none transform transition-transform duration-300 ease-in-out flex flex-col h-full
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
      `}>
        
        {/* 1. FIXED HEADER (Logo) */}
        <div className="p-6 flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <span className="font-black text-lg">R</span>
          </div>
          <div>
            <h1 className="text-lg font-black text-white tracking-tight">Royal Fitness</h1>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Member Portal</span>
          </div>
        </div>

        {/* 2. SCROLLABLE NAVIGATION */}
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar pb-4">
          
          <Link to="/member/dashboard" className={getLinkClass('/member/dashboard')}>
            <LayoutDashboard size={18} />
            My Dashboard
          </Link>

          {/* Section Header */}
          <div className="pt-5 pb-2 px-4 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
            Access & Schedule
          </div>

          <Link to="/member/scan" className={getLinkClass('/member/scan')}>
            <QrCode size={18} />
            Scan Attendance
          </Link>

          <Link to="/member/schedule" className={getLinkClass('/member/schedule')}>
            <Calendar size={18} />
            Class Schedule
          </Link>

          {/* --- NEW PAYMENT TAB ADDED HERE --- */}
          <Link to="/member/payment" className={getLinkClass('/member/payment')}>
            <CreditCard size={18} />
            Membership & Billing
          </Link>
          {/* ---------------------------------- */}
          
          <Link to="/member/history" className={getLinkClass('/member/history')}>
            <CheckCircle size={18} />
            History
          </Link>

          <Link to="/member/workouts" className={getLinkClass('/member/workouts')}>
            <Dumbbell size={18} /> My Workout Plans
          </Link>

          {/* Section Header */}
          <div className="pt-5 pb-2 px-4 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
            Account
          </div>

           <Link to="/member/profile" className={getLinkClass('/member/profile')}>
            <User size={18} />
            My Profile
          </Link>

        </nav>

        {/* 3. FIXED FOOTER (Logout) */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 shrink-0">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2.5 w-full text-sm font-bold text-red-400 hover:bg-slate-800 rounded-xl transition-colors"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white border-b border-gray-100 p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
              <span className="font-bold">R</span>
            </div>
            <span className="font-bold text-gray-900">Royal Fitness</span>
          </div>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-gray-500 rounded-lg hover:bg-gray-100">
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 bg-slate-50/50">
          <div className="max-w-6xl mx-auto pb-10">
             <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}