import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import LiveClock from '../../components/Shared/LiveClock';
import { Calendar, User, Users, Activity, AlertCircle, CheckCircle, Zap, Timer, ArrowRight, CreditCard, ChevronRight } from 'lucide-react';

// Helper to format minutes into "1h 20m" or "45m"
const formatDuration = (mins) => {
  if (!mins) return "0m";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

export default function MemberDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/member/member-stats')
      .then(res => {
        setStats(res.data);
        setError(null);
      })
      .catch(err => {
        console.error("Failed to load stats", err);
        setError(err.message);
        setStats({
          attendanceCount: 0,
          active: false,
          planName: "No Active Plan",
          expiryDate: null,
          daysLeft: 0,
          startDate: null,
          upcomingClasses: 0,
          avgMinutes: 0
        });
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-pulse flex flex-col items-center">
        <div className="h-12 w-12 bg-gray-200 rounded-full mb-4"></div>
        <div className="h-4 w-32 bg-gray-200 rounded"></div>
      </div>
    </div>
  );

  // Safety Check: Get first name or default to "Member"
  const firstName = user?.name ? user.name.split(' ')[0] : 'Member';

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* --- Error Toast --- */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-700 shadow-sm">
          <AlertCircle size={20} />
          <p className="font-medium text-sm">Unable to load some data. Please refresh or try again later.</p>
        </div>
      )}

      {/* --- Header Section --- */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            Hello, {firstName} <span className="text-2xl">👋</span>
          </h1>
          <p className="text-gray-500 font-medium mt-1">Here is your daily activity overview.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 text-sm font-semibold text-gray-600">
            <LiveClock />
          </div>
          <Link 
            to="/member/profile-setup" 
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-gray-900 rounded-xl hover:bg-gray-800 transition-all hover:shadow-lg hover:-translate-y-0.5"
          >
            <User size={16} /> Edit Profile
          </Link>
        </div>
      </header>

      {/* --- Main Grid --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        
        {/* 1. HERO CARD: Membership Status (Spans Full Width on lg) */}
        <div className={`relative overflow-hidden p-8 rounded-3xl shadow-sm border col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-5 transition-all group ${
          stats?.active 
            ? 'bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 border-gray-800 text-white' 
            : 'bg-white border-red-100 text-gray-900'
        }`}>
          {/* Decorative Background Elements for Active State */}
          {stats?.active && (
            <>
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-500 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity duration-700"></div>
              <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-emerald-500 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity duration-700"></div>
            </>
          )}

          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
              <div className="flex items-start gap-4">
                <div className={`p-4 rounded-2xl ${stats?.active ? 'bg-white/10 backdrop-blur-md' : 'bg-red-50'}`}>
                  {stats?.active ? (
                    <CreditCard className="w-8 h-8 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-8 h-8 text-red-500" />
                  )}
                </div>
                <div>
                  <h3 className={`text-sm font-bold uppercase tracking-wider mb-1 ${stats?.active ? 'text-gray-400' : 'text-gray-500'}`}>
                    Current Membership
                  </h3>
                  <div className="flex items-center gap-3">
                    <h2 className="text-3xl font-black tracking-tight">
                      {stats?.planName || "No Plan"}
                    </h2>
                    {stats?.active && (
                      <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle size={12} /> Active
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Expiring Soon Badge */}
              {stats?.active && stats?.daysLeft <= 7 && (
                <div className="px-4 py-2 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-xl flex items-center gap-2 animate-pulse">
                  <Zap size={16} fill="currentColor" />
                  <span className="font-bold text-sm">Expiring Soon</span>
                </div>
              )}
            </div>

            {/* Details Grid */}
            {stats?.active ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatItem label="Started On" value={stats?.startDate ? new Date(stats.startDate).toLocaleDateString() : 'N/A'} darkTheme />
                <StatItem label="Expires On" value={stats?.expiryDate ? new Date(stats.expiryDate).toLocaleDateString() : 'N/A'} darkTheme />
                <StatItem 
                  label="Days Left" 
                  value={`${stats?.daysLeft} Days`} 
                  highlight={stats?.daysLeft <= 7}
                  darkTheme
                />
                <div className="hidden md:flex flex-col justify-end">
                  {/* --- MODIFICATION HERE: Changed button to Link --- */}
                  <Link 
                    to="/member/payment" 
                    className="text-sm font-bold text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
                  >
                    View Billing <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ) : (
              // Inactive State CTA
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-red-50 p-6 rounded-2xl border border-red-100">
                <div>
                  <h4 className="font-bold text-red-700 text-lg">Action Required</h4>
                  <p className="text-red-600/80 text-sm mt-1">Your membership is inactive. Renew now to access the gym.</p>
                </div>
                <Link 
                  to="/member/payment" 
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-600/20 transition-all flex items-center gap-2"
                >
                  Renew Membership <ArrowRight size={18} />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* 2. Status Metric Card */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 group">
          <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-2xl ${stats?.active ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
              <Activity size={24} />
            </div>
            {stats?.active && <CheckCircle size={18} className="text-emerald-500" />}
          </div>
          <p className="text-gray-500 text-sm font-bold uppercase tracking-wide">Status</p>
          <h3 className={`text-2xl font-black mt-1 ${stats?.active ? 'text-gray-900' : 'text-red-600'}`}>
            {stats?.active ? "Active" : "Expired"}
          </h3>
          <p className="text-xs text-gray-400 mt-2 font-medium">Account standing</p>
        </div>

        {/* 3. Upcoming Classes (Link Card) */}
        <Link to="/member/schedule" className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-blue-600 w-16 h-16 rounded-bl-full -mr-8 -mt-8 opacity-10 group-hover:opacity-20 transition-opacity"></div>
          
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Calendar size={24} />
            </div>
            <ArrowRight size={18} className="text-gray-300 group-hover:text-blue-600 transition-colors" />
          </div>
          <p className="text-gray-500 text-sm font-bold uppercase tracking-wide">Upcoming</p>
          <h3 className="text-2xl font-black text-gray-900 mt-1">{stats?.upcomingClasses || 0}</h3>
          <p className="text-xs text-blue-600 mt-2 font-bold flex items-center gap-1">
             Book Class <ChevronRight size={12}/>
          </p>
        </Link>

        {/* 4. Avg Duration Card */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-2xl bg-purple-50 text-purple-600">
              <Timer size={24} />
            </div>
          </div>
          <p className="text-gray-500 text-sm font-bold uppercase tracking-wide">Avg Session</p>
          <h3 className="text-2xl font-black text-gray-900 mt-1">{formatDuration(stats?.avgMinutes)}</h3>
          <p className="text-xs text-gray-400 mt-2 font-medium">Time per visit</p>
        </div>

        {/* 5. Total Visits Card */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-2xl bg-orange-50 text-orange-600">
              <User size={24} />
            </div>
          </div>
          <p className="text-gray-500 text-sm font-bold uppercase tracking-wide">Total Visits</p>
          <h3 className="text-2xl font-black text-gray-900 mt-1">{stats?.attendanceCount || 0}</h3>
          <p className="text-xs text-gray-400 mt-2 font-medium">Lifetime check-ins</p>
        </div>

        {/* 6. Live Members Card */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-2xl bg-sky-50 text-sky-600">
              <Users size={24} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 bg-sky-100 px-2 py-1 rounded-full">Live Now</span>
          </div>
          <p className="text-gray-500 text-sm font-bold uppercase tracking-wide">In Gym Count</p>
          <h3 className="text-2xl font-black text-gray-900 mt-1">{stats?.liveMembersCount || 0}</h3>
          <p className="text-xs text-gray-400 mt-2 font-medium">Currently training</p>
        </div>

      </div>
    </div>
  );
}

// --- Internal Component for cleaner code ---
function StatItem({ label, value, highlight = false, darkTheme = false }) {
  return (
    <div className={`p-4 rounded-2xl border transition-all ${
      darkTheme 
        ? 'bg-white/5 border-white/5' 
        : 'bg-gray-50 border-gray-100'
    } ${highlight ? 'ring-2 ring-orange-500/50 bg-orange-500/10' : ''}`}>
      <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${
        darkTheme ? 'text-gray-400' : 'text-gray-500'
      }`}>
        {label}
      </p>
      <p className={`font-bold truncate ${
        highlight ? 'text-orange-400' : 
        darkTheme ? 'text-white' : 'text-gray-900'
      }`}>
        {value}
      </p>
    </div>
  );
}