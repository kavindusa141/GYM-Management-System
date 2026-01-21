import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ClipboardCheck, LogOut, Home } from 'lucide-react';

export default function StaffLayout() {
  const { logout, user } = useAuth();

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Staff Sidebar */}
      <aside className="w-64 text-white bg-green-900 flex flex-col">
        <div className="p-6 text-xl font-bold text-center border-b border-green-800">
          STAFF PORTAL
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2">
          <Link to="/staff/dashboard" className="flex items-center px-4 py-3 rounded hover:bg-green-800">
            <Home className="w-5 h-5 mr-3" /> Dashboard
          </Link>
          <Link to="/staff/attendance" className="flex items-center px-4 py-3 rounded hover:bg-green-800">
            <ClipboardCheck className="w-5 h-5 mr-3" /> Mark Attendance
          </Link>
        </nav>

        <div className="p-4 border-t border-green-800">
          <div className="mb-2 text-sm text-green-300">Staff: {user?.name}</div>
          <button onClick={logout} className="flex items-center w-full text-red-300 hover:text-white">
            <LogOut className="w-5 h-5 mr-2" /> Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}