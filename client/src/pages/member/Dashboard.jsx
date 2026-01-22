import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../../services/api'; // Import API helper
import { Calendar, User, Activity, Clock, AlertCircle, CheckCircle, Zap } from 'lucide-react';
import { formatCurrency } from '../../utils/currencyFormatter';

export default function MemberDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch dashboard stats from backend
    api.get('/member/member-stats')
      .then(res => {
        console.log("Dashboard stats loaded:", res.data);
        setStats(res.data);
        setError(null);
      })
      .catch(err => {
        console.error("Failed to load stats", err);
        setError(err.message);
        // Set default values if API fails
        setStats({
          attendanceCount: 0,
          active: false,
          planName: "No Active Plan",
          expiryDate: null,
          daysLeft: 0,
          startDate: null,
          upcomingClasses: 0
        });
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-10 text-center text-gray-400">Loading Dashboard...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      {error && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
          <p className="font-semibold">Note: Some data may not be loading correctly. Please refresh if issues persist.</p>
        </div>
      )}
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
        
        {/* 1. Active Membership Package Card - PROMINENT */}
        <div className={`p-6 rounded-xl border-2 shadow-lg col-span-1 md:col-span-3 transition-all ${
          stats?.active 
            ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300' 
            : 'bg-gradient-to-r from-red-50 to-orange-50 border-red-300'
        }`}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              {stats?.active ? (
                <div className="p-3 bg-green-100 rounded-full">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              ) : (
                <div className="p-3 bg-red-100 rounded-full">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
              )}
              <div>
                <h3 className="text-lg font-bold text-gray-900">Your Membership</h3>
                <p className={`text-sm font-semibold ${stats?.active ? 'text-green-700' : 'text-red-700'}`}>
                  {stats?.active ? "✓ Currently Active" : "✗ Membership Expired"}
                </p>
              </div>
            </div>
            {stats?.active && stats?.daysLeft <= 7 && (
              <span className="flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded-full">
                <Zap className="w-3 h-3" /> Expiring Soon
              </span>
            )}
          </div>

          {stats?.active && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Plan Name */}
              <div className="bg-white/60 backdrop-blur p-4 rounded-lg border border-green-100">
                <p className="text-xs text-gray-600 font-semibold uppercase">Current Plan</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{stats?.planName}</p>
              </div>

              {/* Expiry Date */}
              <div className="bg-white/60 backdrop-blur p-4 rounded-lg border border-green-100">
                <p className="text-xs text-gray-600 font-semibold uppercase">Expires On</p>
                <p className="text-lg font-bold text-gray-900 mt-1">
                  {stats?.expiryDate ? new Date(stats.expiryDate).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                  }) : 'N/A'}
                </p>
              </div>

              {/* Days Remaining */}
              <div className="bg-white/60 backdrop-blur p-4 rounded-lg border border-green-100">
                <p className="text-xs text-gray-600 font-semibold uppercase">Days Remaining</p>
                <p className={`text-2xl font-bold mt-1 ${
                  stats?.daysLeft > 30 ? 'text-green-600' : 
                  stats?.daysLeft > 7 ? 'text-orange-600' : 
                  'text-red-600'
                }`}>
                  {stats?.daysLeft} days
                </p>
              </div>

              {/* Start Date */}
              <div className="bg-white/60 backdrop-blur p-4 rounded-lg border border-green-100">
                <p className="text-xs text-gray-600 font-semibold uppercase">Started On</p>
                <p className="text-lg font-bold text-gray-900 mt-1">
                  {stats?.startDate ? new Date(stats.startDate).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                  }) : 'N/A'}
                </p>
              </div>
            </div>
          )}

          {!stats?.active && (
            <div className="bg-white/60 backdrop-blur p-4 rounded-lg border border-red-100 mt-4 flex items-center justify-between">
              <div>
                <p className="text-gray-900 font-semibold mb-1">Your membership has expired</p>
                <p className="text-sm text-gray-600">Renew your membership to continue enjoying all facilities</p>
              </div>
              <Link 
                to="/member/payment" 
                className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition whitespace-nowrap ml-4"
              >
                Renew Now
              </Link>
            </div>
          )}
        </div>

        {/* 2. Membership Status Card - Compact */}
        <div className="p-6 bg-white shadow rounded-xl border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-700">Status</h3>
            <User className={`w-8 h-8 ${stats?.active ? 'text-green-500' : 'text-red-500'}`} />
          </div>
          
          <p className={`text-2xl font-bold ${stats?.active ? 'text-gray-900' : 'text-red-500'}`}>
            {stats?.active ? "Active" : "Expired"}
          </p>
          
          <p className="text-sm text-gray-500 mt-1">
            {stats?.active ? "Your membership is valid" : "Please renew your membership"}
          </p>
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