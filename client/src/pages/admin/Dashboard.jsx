import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { formatCurrency } from '../../utils/currencyFormatter';
import LiveClock from '../../components/Shared/LiveClock';
import {
  Users, Banknote, Activity, Calendar, TrendingUp, UserPlus,
  ArrowRight, CreditCard, Dumbbell
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalMembers: 0,
    totalTrainers: 0,
    totalRevenue: 0,
    totalClasses: 0
  });
  const [analytics, setAnalytics] = useState({ revenueData: [], memberData: [] });
  const [expiredMembers, setExpiredMembers] = useState([]); // New State
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const statsRes = await api.get('/admin/dashboard');
        setStats(statsRes.data);

        const analyticsRes = await api.get('/admin/analytics');
        setAnalytics(analyticsRes.data);

        const expiredRes = await api.get('/admin/expired-members');
        setExpiredMembers(expiredRes.data);
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-pulse flex flex-col items-center">
        <div className="h-12 w-12 bg-slate-200 rounded-full mb-4"></div>
        <div className="h-4 w-32 bg-slate-200 rounded"></div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in pb-10">

      {/* Modern Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-blue-600 rounded-full blur-3xl opacity-20"></div>
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-64 h-64 bg-purple-600 rounded-full blur-3xl opacity-20"></div>

        <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-blue-200 text-xs font-bold uppercase tracking-wider backdrop-blur-sm border border-white/10">
              <Activity size={12} /> System Operational
            </span>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">Admin Overview</h1>
            <p className="text-slate-400 max-w-lg text-sm md:text-base">
              Monitor your gym's performance, revenue streams, and member growth in real-time.
            </p>
          </div>
          <div className="bg-white/5 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 shadow-xl">
            <LiveClock />
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Members"
          value={stats.totalMembers}
          icon={<Users className="w-5 h-5" />}
          trend="Monthly Growth"
          color="blue"
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          icon={<Banknote className="w-5 h-5" />}
          trend="Lifetime total"
          color="green"
        />
        <StatCard
          title="Active Trainers"
          value={stats.totalTrainers}
          icon={<Dumbbell className="w-5 h-5" />}
          trend="Currently active"
          color="purple"
        />
        <StatCard
          title="Classes Scheduled"
          value={stats.totalClasses}
          icon={<Calendar className="w-5 h-5" />}
          trend="Currently scheduled"
          color="orange"
        />
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

        {/* Left Column: Charts (2/3 width on large screens) */}
        <div className="xl:col-span-2 space-y-8">

          {/* Revenue Chart */}
          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  Revenue Analytics
                </h3>
                <p className="text-sm text-gray-500">Income trends over the past 6 months</p>
              </div>
              <div className="p-2 bg-green-50 rounded-xl">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
            </div>

            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9CA3AF', fontSize: 12, fontWeight: 500 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9CA3AF', fontSize: 12, fontWeight: 500 }}
                    tickFormatter={(value) => `${value / 1000}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      borderRadius: '12px',
                      border: 'none',
                      color: '#fff',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                    }}
                    itemStyle={{ color: '#fff' }}
                    labelStyle={{ color: '#9CA3AF', marginBottom: '0.5rem' }}
                    formatter={(value) => [formatCurrency(value), 'Revenue']}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#10B981"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Member Growth Chart */}
          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Member Growth</h3>
                <p className="text-sm text-gray-500">New registrations over time</p>
              </div>
              <div className="p-2 bg-blue-50 rounded-xl">
                <UserPlus className="w-5 h-5 text-blue-600" />
              </div>
            </div>

            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.memberData} barSize={40}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9CA3AF', fontSize: 12, fontWeight: 500 }}
                    dy={10}
                  />
                  <Tooltip
                    cursor={{ fill: '#F3F4F6', radius: 8 }}
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Bar
                    dataKey="value"
                    fill="#3B82F6"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Column: Quick Actions & Notices (1/3 width) */}
        <div className="space-y-6">

          {/* Quick Actions Card */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link to="/admin/members" className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors border border-gray-100 group">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <UserPlus size={18} />
                  </div>
                  <span className="font-medium text-gray-700">Add Member</span>
                </div>
                <ArrowRight size={16} className="text-gray-300 group-hover:text-blue-600 transition-colors" />
              </Link>

              <Link to="/admin/classes" className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors border border-gray-100 group">
                <div className="flex items-center gap-3">
                  <div className="bg-orange-100 p-2 rounded-lg text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                    <Calendar size={18} />
                  </div>
                  <span className="font-medium text-gray-700">Schedule Class</span>
                </div>
                <ArrowRight size={16} className="text-gray-300 group-hover:text-orange-600 transition-colors" />
              </Link>

              <Link to="/admin/billing" className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors border border-gray-100 group">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-2 rounded-lg text-green-600 group-hover:bg-green-600 group-hover:text-white transition-colors">
                    <CreditCard size={18} />
                  </div>
                  <span className="font-medium text-gray-700">Check Payments</span>
                </div>
                <ArrowRight size={16} className="text-gray-300 group-hover:text-green-600 transition-colors" />
              </Link>
            </div>
          </div>

        </div>
      </div>

      {/* EXPIRY ALERTS WIDGET */}
      {expiredMembers.length > 0 && (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-red-100">
          <h3 className="font-bold text-red-600 mb-4 flex items-center gap-2">
            <div className="p-2 bg-red-100 rounded-lg"><Activity size={18} /></div>
            Expiry Alerts
          </h3>
          <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
            {expiredMembers.map(m => (
              <div key={m.user_id} className="p-3 bg-red-50 rounded-xl border border-red-100">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{m.name}</p>
                    <p className="text-xs text-red-500 font-mono">{m.plan_name}</p>
                  </div>
                  <span className="bg-red-200 text-red-800 text-[10px] font-bold px-2 py-1 rounded-full">
                    {m.days_expired} Days Over
                  </span>
                </div>
                <div className="mt-2 text-xs text-gray-600 flex flex-col gap-1">
                  <p>Trainer: <span className="font-semibold">{m.assigned_trainer}</span></p>
                  {m.days_expired > 2 ? (
                    <p className="text-red-700 font-bold">⚠️ Removal Pending (Over 2 days)</p>
                  ) : (
                    <p className="text-orange-600 font-bold">⏳ Grace Period ({2 - m.days_expired} days left)</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System Status / Mini Widget */}
      <div className="bg-slate-900 p-6 rounded-3xl text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
        <h3 className="font-bold text-lg relative z-10">System Status</h3>
        <p className="text-slate-400 text-sm mt-1 relative z-10">All systems operational.</p>

        <div className="mt-6 space-y-4 relative z-10">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Database</span>
            <span className="text-green-400 font-bold flex items-center gap-1">
              <span className="w-2 h-2 bg-green-400 rounded-full"></span> Online
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Server Load</span>
            <span className="text-blue-400 font-bold">Stable</span>
          </div>
        </div>
      </div>

    </div>

  );
}

// Modern Stat Card Component
function StatCard({ title, value, icon, trend, color }) {
  const colorStyles = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600",
    orange: "bg-orange-50 text-orange-600",
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 group">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-2xl ${colorStyles[color]} transition-colors`}>
          {icon}
        </div>
        {trend && (
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-gray-50 px-2 py-1 rounded-full">
            {trend}
          </span>
        )}
      </div>
      <div>
        <h3 className="text-3xl font-black text-gray-900 tracking-tight">{value}</h3>
        <p className="text-sm font-medium text-gray-500 mt-1">{title}</p>
      </div>
    </div>
  );
}