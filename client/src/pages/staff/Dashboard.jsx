import { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { 
  Users, QrCode, CreditCard, UserPlus, Clock, ArrowRight, CheckCircle, Banknote, Activity 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import LiveClock from '../../components/Shared/LiveClock';
import { formatCurrency } from '../../utils/currencyFormatter';

export default function StaffDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalMembers: 0,
    todayAttendance: 0,
    todayRevenue: 0,
    recentCheckins: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/dashboard/staff-stats');
        setStats(res.data);
      } catch (error) {
        console.error("Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  if (loading) return <div className="p-10 text-center text-gray-400">Loading Dashboard...</div>;

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-slate-900 text-white p-8 rounded-3xl shadow-2xl relative overflow-hidden">
        {/* Decorative background blob */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 rounded-full blur-3xl opacity-20 -mr-16 -mt-16"></div>
        
        <div className="relative z-10">
          <p className="text-blue-400 font-bold tracking-wider text-sm uppercase mb-1">{getGreeting()}, Staff</p>
          <h1 className="text-3xl md:text-4xl font-black">{user?.name}</h1>
          <p className="text-slate-400 mt-2 max-w-md text-sm">
            Front Desk Overview: <strong className="text-white">{stats.todayAttendance} members</strong> checked in today.
          </p>
        </div>
        <div className="relative z-10 bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10">
          <LiveClock />
        </div>
      </div>

      {/* QUICK STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
              <Activity size={20} />
            </div>
            <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Live</span>
          </div>
          <div>
            <span className="text-3xl font-black text-gray-900">{stats.liveMembersCount || 0}</span>
            <p className="text-xs font-bold text-gray-500 uppercase mt-1">Inside Gym</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <Users size={20} />
            </div>
            <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Active</span>
          </div>
          <div>
            <span className="text-3xl font-black text-gray-900">{stats.totalMembers}</span>
            <p className="text-xs font-bold text-gray-500 uppercase mt-1">Total Members</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
              <QrCode size={20} />
            </div>
            <span className="text-xs font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Today</span>
          </div>
          <div>
            <span className="text-3xl font-black text-gray-900">{stats.todayAttendance}</span>
            <p className="text-xs font-bold text-gray-500 uppercase mt-1">Check-ins</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
             <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
              <Banknote size={20} />
            </div>
             <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Today</span>
          </div>
          <div>
            <span className="text-2xl font-black text-gray-900">{formatCurrency(stats.todayRevenue)}</span>
            <p className="text-xs font-bold text-gray-500 uppercase mt-1">Total Revenue</p>
          </div>
        </div>

      </div>

      {/* QUICK ACTIONS ROW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link to="/staff/attendance" className="bg-blue-600 p-4 rounded-2xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all group flex items-center gap-3 text-white">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <QrCode size={20} />
          </div>
          <div>
            <span className="font-bold block text-sm">Scan Entry</span>
            <span className="text-xs text-blue-100">Check-in member</span>
          </div>
        </Link>

        <Link to="/staff/pos" className="bg-slate-800 p-4 rounded-2xl shadow-lg shadow-slate-200 hover:bg-slate-900 transition-all group flex items-center gap-3 text-white">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <CreditCard size={20} />
          </div>
          <div>
            <span className="font-bold block text-sm">Payment System</span>
            <span className="text-xs text-slate-400">Process Payment</span>
          </div>
        </Link>

        <Link to="/staff/register" className="bg-white border border-gray-200 p-4 rounded-2xl hover:border-blue-400 transition-all group flex items-center gap-3 text-gray-700 hover:text-blue-600">
           <div className="w-10 h-10 bg-gray-50 text-gray-500 rounded-xl flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
            <UserPlus size={20} />
          </div>
          <div>
            <span className="font-bold block text-sm">Register</span>
            <span className="text-xs text-gray-400 group-hover:text-blue-400">New Member</span>
          </div>
        </Link>
      </div>

      {/* RECENT ACTIVITY FEED */}
      <div className="grid lg:grid-cols-2 gap-8">
        
        {/* Recent Check-ins */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm min-h-[350px]">
          <div className="flex items-center justify-between mb-6">
             <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Clock className="text-blue-600" size={24}/> Recent Check-ins
            </h2>
            <Link to="/staff/attendance" className="text-xs font-bold text-gray-400 hover:text-blue-600 flex items-center gap-1">
              View All <ArrowRight size={12}/>
            </Link>
          </div>

          {stats.recentCheckins.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">
              No check-ins recorded today yet.
            </div>
          ) : (
            <div className="space-y-4">
              {stats.recentCheckins.map((log, index) => (
                <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-2xl transition-colors border border-transparent hover:border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm">
                      {log.User?.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{log.User?.name}</p>
                      <p className="text-xs text-gray-500 font-mono">{log.User?.member_code}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-gray-900">
                      {new Date(`${log.attendance_date}T${log.check_in}`).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                    <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">
                      Entry
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Instructions / Notice Board (Optional Placeholder) */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 text-white flex flex-col justify-between relative overflow-hidden">
           <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-10 -mt-10 blur-3xl"></div>
           
           <div>
             <h3 className="text-2xl font-black mb-2">Staff Notice</h3>
             <p className="text-slate-400 text-sm leading-relaxed">
               Please ensure all members scan their QR code upon entry. If a membership is expired, direct them to the Payment counter for renewal.
             </p>
           </div>

           <div className="mt-8 pt-6 border-t border-white/10">
             <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                 <CheckCircle size={16} className="text-white" />
               </div>
               <div>
                 <p className="text-sm font-bold">System Status</p>
                 <p className="text-xs text-green-400">All Systems Operational</p>
               </div>
             </div>
           </div>
        </div>

      </div>
    </div>
  );
}