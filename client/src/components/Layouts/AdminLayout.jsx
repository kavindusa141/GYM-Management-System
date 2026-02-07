import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, CreditCard, LogOut,
  Menu, X, Calendar, ClipboardCheck,
  TrendingUp, Wrench, Settings
} from 'lucide-react';
import { useState } from 'react';

export default function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Helper for link styles (Adapted for Dark Sidebar)
  const getLinkClass = (path) => {
    const isActive = location.pathname === path;
    return `flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-all ${isActive
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
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Admin Panel</span>
          </div>
        </div>

        {/* 2. SCROLLABLE NAVIGATION */}
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar pb-4">

          <Link to="/admin/dashboard" className={getLinkClass('/admin/dashboard')}>
            <LayoutDashboard size={18} />
            Dashboard
          </Link>

          {/* Section Header */}
          <div className="pt-5 pb-2 px-4 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
            Management
          </div>

          <Link to="/admin/members" className={getLinkClass('/admin/members')}>
            <Users size={18} />
            Members
          </Link>

          <Link to="/admin/staff" className={getLinkClass('/admin/staff')}>
            <Users size={18} />
            Team & Trainers
          </Link>

          <Link to="/admin/assign-trainer" className={getLinkClass('/admin/assign-trainer')}>
            <Users size={18} />
            Assign Trainers
          </Link>

          <Link to="/admin/classes" className={getLinkClass('/admin/classes')}>
            <Calendar size={18} />
            Class Schedule
          </Link>

          <Link to="/admin/attendance" className={getLinkClass('/admin/attendance')}>
            <ClipboardCheck size={18} />
            Attendance
          </Link>

          <Link to="/admin/create-plan" className={getLinkClass('/admin/create-plan')}>
            <CreditCard size={18} /> Membership Plans
          </Link>

          <Link to="/admin/equipment" className={getLinkClass('/admin/equipment')}>
            <Wrench size={18} />
            Equipment
          </Link>

          {/* Section Header */}
          <div className="pt-5 pb-2 px-4 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
            Finance & Data
          </div>

          <Link to="/admin/billing" className={getLinkClass('/admin/billing')}>
            <CreditCard size={18} />
            Billing & Payments
          </Link>

          <Link to="/admin/reports" className={getLinkClass('/admin/reports')}>
            <TrendingUp size={18} />
            Reports & Analytics
          </Link>

          <div className="pt-5 pb-2 px-4 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
            System
          </div>

          <Link to="/admin/settings" className={getLinkClass('/admin/settings')}>
            <Settings size={18} />
            Settings & Config
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
          <div className="max-w-7xl mx-auto pb-10">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}