import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, QrCode, LogOut, Menu, X, Settings, Users, UserPlus, CreditCard, Calendar, BarChart2
} from 'lucide-react';
import { useState } from 'react';
import logo from '../../assets/images/logo.png';

export default function StaffLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const getLinkClass = (path) => {
    const isActive = location.pathname === path;
    return `flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-all ${isActive
      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
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

      {/* --- SIDEBAR --- */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30 w-72 bg-slate-900 border-r border-slate-800 shadow-2xl lg:shadow-none transform transition-transform duration-300 ease-in-out flex flex-col h-full
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
      `}>

        {/* Header */}
        <div className="p-6 flex flex-col items-center gap-2 shrink-0 bg-white/5 rounded-b-xl mx-2 mb-2">
          <img src={logo} alt="Royal Fitness Kingdom" className="h-24 w-auto object-contain" />
          <span className="px-3 py-1 bg-blue-600/20 text-blue-400 rounded-full text-[10px] font-bold uppercase tracking-wider">Staff Portal</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar pb-4 mt-2">

          <Link to="/staff/dashboard" className={getLinkClass('/staff/dashboard')}>
            <LayoutDashboard size={18} />
            Dashboard
          </Link>

          <div className="pt-5 pb-2 px-4 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
            Operations
          </div>

          <Link to="/staff/members" className={getLinkClass('/staff/members')}>
            <Users size={18} />
            Members
          </Link>



          <Link to="/staff/pos" className={getLinkClass('/staff/pos')}>
            <CreditCard size={18} />
            Billing & Payments
          </Link>

          <Link to="/staff/attendance" className={getLinkClass('/staff/attendance')}>
            <QrCode size={18} />
            Attendance
          </Link>

          <Link to="/staff/classes" className={getLinkClass('/staff/classes')}>
            <Calendar size={18} />
            Manage Classes
          </Link>

          <Link to="/staff/reports" className={getLinkClass('/staff/reports')}>
            <BarChart2 size={18} />
            Analytics & Reports
          </Link>



          {/* Note: If you add more pages later like "Member Lookup", add them here */}
          <div className="pt-5 pb-2 px-4 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
            Account
          </div>

          {/* NEW SETTINGS LINK */}
          <Link to="/staff/settings" className={getLinkClass('/staff/settings')}>
            <Settings size={18} />
            Settings
          </Link>

        </nav>

        {/* Footer (Logout) */}
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
            <img src={logo} alt="Royal Fitness Kingdom" className="h-14 w-auto object-contain" />
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