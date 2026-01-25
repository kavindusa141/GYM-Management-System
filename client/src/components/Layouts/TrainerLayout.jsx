import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Dumbbell, 
  LogOut, 
  Activity, 
  ClipboardList, 
  Calendar, 
  Clock,
  Settings 
} from 'lucide-react';
import { useState } from 'react';

export default function TrainerLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const getLinkClass = (path) => {
    const isActive = location.pathname === path;
    return `flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-all ${
      isActive 
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
    }`;
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900 overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className="w-72 bg-slate-900 flex flex-col h-full border-r border-slate-800 shadow-xl z-20">
        
        <div className="p-6 flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <span className="font-black text-lg">R</span>
          </div>
          <div>
            <h1 className="text-lg font-black text-white tracking-tight">Royal Fitness</h1>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Trainer Portal</span>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar py-4">
          
          <Link to="/trainer/dashboard" className={getLinkClass('/trainer/dashboard')}>
            <LayoutDashboard size={18} />
            Dashboard
          </Link>

          {/* --- WORKOUT SECTION --- */}
          <div className="pt-5 pb-2 px-4 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
            Workout Management
          </div>
          <Link to="/trainer/plans" className={getLinkClass('/trainer/plans')}>
            <ClipboardList size={18} />
            Manage Plans
          </Link>
          <Link to="/trainer/create-plan" className={getLinkClass('/trainer/create-plan')}>
            <Dumbbell size={18} />
            Assign New Plan
          </Link>

          {/* --- CLASSES SECTION --- */}
          <div className="pt-5 pb-2 px-4 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
            Classes
          </div>
          <Link to="/trainer/classes" className={getLinkClass('/trainer/classes')}>
            <Calendar size={18} />
            My Schedule
          </Link>

          {/* --- MONITORING SECTION --- */}
          <div className="pt-5 pb-2 px-4 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
            Monitoring
          </div>
          <Link to="/trainer/progress" className={getLinkClass('/trainer/progress')}>
             <Activity size={18} />
             Client Progress
          </Link>

          {/* --- PROFILE SECTION --- */}
          <div className="pt-5 pb-2 px-4 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
            Profile & Settings
          </div>
          <Link to="/trainer/availability" className={getLinkClass('/trainer/availability')}>
            <Clock size={18} />
            My Availability
          </Link>

          <Link to="/trainer/settings" className={getLinkClass('/trainer/settings')}>
            <Settings size={18} />
              Settings
          </Link>

        </nav>

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

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-slate-50/50">
        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-6xl mx-auto pb-10">
             <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}