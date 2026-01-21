import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Dumbbell, LogOut, User, Activity } from 'lucide-react';
import { useState } from 'react';

export default function TrainerLayout() {
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
    return `flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-all ${
      isActive ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
    }`;
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900 overflow-hidden">
      <aside className="w-72 bg-slate-900 flex flex-col h-full border-r border-slate-800">
        <div className="p-6 flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black">R</div>
          <div><h1 className="text-white font-bold">Royal Fitness</h1><span className="text-xs text-slate-500 font-bold uppercase">Trainer Portal</span></div>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <Link to="/trainer/dashboard" className={getLinkClass('/trainer/dashboard')}>
            <LayoutDashboard size={18} /> Dashboard
          </Link>
          <Link to="/trainer/create-plan" className={getLinkClass('/trainer/create-plan')}>
            <Dumbbell size={18} /> Assign Plan
          </Link>

          <Link to="/trainer/progress" className={getLinkClass('/trainer/progress')}>
             <Activity size={18} />
              Client Progress
          </Link>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2.5 w-full text-sm font-bold text-red-400 hover:bg-slate-800 rounded-xl">
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
        <div className="max-w-6xl mx-auto"><Outlet /></div>
      </main>
    </div>
  );
}