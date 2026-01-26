import { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { 
  Users, Calendar, Activity, Clock, ChevronRight, Dumbbell, ClipboardList, CheckCircle 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import LiveClock from '../../components/Shared/LiveClock';

export default function TrainerDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    activeClients: 0,
    todayClassCount: 0,
    todaysSchedule: [],
    recentLogs: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/dashboard/trainer-stats');
        setStats(res.data);
      } catch (error) {
        console.error("Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  // Helper for Greeting
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
          <p className="text-blue-400 font-bold tracking-wider text-sm uppercase mb-1">{getGreeting()}, Trainer</p>
          <h1 className="text-3xl md:text-4xl font-black">{user?.name}</h1>
          <p className="text-slate-400 mt-2 max-w-md text-sm">
            Ready to inspire? You have <strong className="text-white">{stats.todaysSchedule.length} classes</strong> and <strong className="text-white">{stats.activeClients} active plans</strong> today.
          </p>
        </div>
        <div className="relative z-10 bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10">
          <LiveClock />
        </div>
      </div>

      {/* QUICK STATS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between h-32">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <Users size={20} />
          </div>
          <div>
            <span className="text-3xl font-black text-gray-900">{stats.activeClients}</span>
            <p className="text-xs font-bold text-gray-500 uppercase mt-1">Active Plans</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between h-32">
          <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
            <Calendar size={20} />
          </div>
          <div>
            <span className="text-3xl font-black text-gray-900">{stats.todayClassCount}</span>
            <p className="text-xs font-bold text-gray-500 uppercase mt-1">Classes Today</p>
          </div>
        </div>

        <Link to="/trainer/create-plan" className="bg-blue-600 p-5 rounded-2xl shadow-lg shadow-blue-200 flex flex-col justify-between h-32 hover:bg-blue-700 transition-colors group">
          <div className="w-10 h-10 bg-white/20 text-white rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <Dumbbell size={20} />
          </div>
          <div>
            <span className="text-lg font-bold text-white block">Assign New Plan</span>
            <p className="text-xs text-blue-100 mt-1">Create routine →</p>
          </div>
        </Link>

        <Link to="/trainer/classes" className="bg-slate-800 p-5 rounded-2xl shadow-lg shadow-slate-200 flex flex-col justify-between h-32 hover:bg-slate-900 transition-colors group">
          <div className="w-10 h-10 bg-white/10 text-white rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <ClipboardList size={20} />
          </div>
          <div>
            <span className="text-lg font-bold text-white block">My Schedule</span>
            <p className="text-xs text-slate-400 mt-1">View classes →</p>
          </div>
        </Link>
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* LEFT COL: Today's Schedule */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="text-blue-600" size={24}/> Today's Schedule
            </h2>
            <Link to="/trainer/classes" className="text-sm font-bold text-blue-600 hover:underline">View All</Link>
          </div>

          <div className="space-y-4">
            {stats.todaysSchedule.length === 0 ? (
              <div className="bg-white p-10 rounded-3xl border border-dashed border-gray-200 text-center">
                <p className="text-gray-400 font-medium">No classes scheduled for today.</p>
                <p className="text-sm text-gray-400 mt-1">Enjoy your free time!</p>
              </div>
            ) : (
              stats.todaysSchedule.map(cls => (
                <div key={cls.class_id} className={`bg-white p-5 rounded-2xl border flex items-center justify-between shadow-sm transition-all ${cls.status === 'CANCELLED' ? 'border-red-100 opacity-70' : 'border-gray-100 hover:shadow-md'}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-bold text-sm ${cls.status === 'CANCELLED' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-600'}`}>
                      <span>{cls.start_time.slice(0,5)}</span>
                    </div>
                    <div>
                      <h3 className={`font-bold text-lg ${cls.status === 'CANCELLED' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{cls.name}</h3>
                      <p className="text-sm text-gray-500">{cls.duration} min • {cls.capacity} Capacity</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {cls.status === 'CANCELLED' ? (
                      <span className="px-3 py-1 bg-red-100 text-red-600 text-xs font-bold rounded-full">Cancelled</span>
                    ) : (
                      <span className="px-3 py-1 bg-green-100 text-green-600 text-xs font-bold rounded-full">Active</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT COL: Recent Activity Feed */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
             <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Activity className="text-purple-600" size={24}/> Client Activity
            </h2>
             <Link to="/trainer/progress" className="text-sm font-bold text-purple-600 hover:underline">View Progress</Link>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm h-auto min-h-[300px]">
            {stats.recentLogs.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm">
                No recent workout logs from your clients.
              </div>
            ) : (
              <div className="space-y-6 relative">
                 {/* Timeline Line */}
                 <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-gray-100"></div>

                 {stats.recentLogs.map((log) => (
                   <div key={log.log_id} className="relative flex gap-4">
                     <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center shrink-0 border-4 border-white z-10 shadow-sm">
                       <CheckCircle size={16} />
                     </div>
                     <div>
                       <p className="text-sm text-gray-900">
                         <span className="font-bold">{log.Member?.name}</span> completed <span className="font-bold text-purple-600">{log.Plan?.name}</span>
                       </p>
                       <p className="text-xs text-gray-400 mt-1">
                         {new Date(log.created_at).toLocaleDateString()} • {log.duration_mins} mins
                       </p>
                       {log.mood && (
                         <span className="inline-block mt-2 px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold uppercase rounded-md">
                           Felt: {log.mood}
                         </span>
                       )}
                     </div>
                   </div>
                 ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}