import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../../services/api'; // Import API helper
import { Calendar, User, Activity, Clock } from 'lucide-react';

export default function MemberDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch dashboard stats from backend
    api.get('/admin/member-stats')
      .then(res => setStats(res.data))
      .catch(err => console.error("Failed to load stats", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-10 text-center text-gray-400">Loading Dashboard...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Hello, {user?.name}</h1>
          <p className="text-gray-600">Welcome to your fitness dashboard.</p>
        </div>
        <Link to="/member/profile-setup" className="px-4 py-2 text-sm text-blue-600 bg-blue-100 rounded hover:bg-blue-200">
          Edit Profile
        </Link>
      </header>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        
        {/* 1. Membership Status Card */}
        <div className="p-6 bg-white shadow rounded-xl border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-700">Membership Status</h3>
            <User className={`w-8 h-8 ${stats?.active ? 'text-green-500' : 'text-red-500'}`} />
          </div>
          
          <p className={`text-2xl font-bold ${stats?.active ? 'text-gray-900' : 'text-red-500'}`}>
            {stats?.active ? "Active" : "Expired"}
          </p>
          
          <p className="text-sm text-green-600 font-bold mt-1">
            {stats?.planName}
          </p>

          {stats?.active && stats?.expiryDate && (
             <p className="text-xs text-gray-400 mt-2">
               Expires: {new Date(stats.expiryDate).toLocaleDateString()}
             </p>
          )}

          {!stats?.active && (
            <Link to="/member/payment" className="text-xs text-blue-600 font-bold underline mt-2 block">
              Renew Now
            </Link>
          )}
        </div>

        {/* 2. Book A Class Card */}
        <Link to="/member/schedule" className="p-6 transition bg-white shadow rounded-xl hover:shadow-md group border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-700">Upcoming Classes</h3>
            <Calendar className="w-8 h-8 text-blue-500 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats?.upcomingClasses || 0}</p>
          <p className="text-sm text-gray-500">Booked sessions</p>
        </Link>

        {/* 3. Attendance / Streak Card */}
        <div className="p-6 bg-white shadow rounded-xl border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-700">Total Visits</h3>
            <Activity className="w-8 h-8 text-orange-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats?.attendanceCount || 0}</p>
          <p className="text-sm text-gray-500">Check-ins to date</p>
        </div>

      </div>
    </div>
  );
}