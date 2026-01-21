import { useEffect, useState } from 'react';
import api from '../../services/api';
import { 
  Users, DollarSign, Activity, Calendar, TrendingUp, UserPlus 
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Basic Stats
        const statsRes = await api.get('/admin/dashboard');
        setStats(statsRes.data);

        // Fetch Graph Data
        const analyticsRes = await api.get('/admin/analytics');
        setAnalytics(analyticsRes.data);
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-10 text-center text-gray-500">Loading Dashboard...</div>;

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500">Welcome back! Here is your gym's performance overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Members" 
          value={stats.totalMembers} 
          icon={<Users className="w-6 h-6 text-blue-600" />} 
          color="bg-blue-50"
        />
        <StatCard 
          title="Total Revenue" 
          value={`$${stats.totalRevenue}`} 
          icon={<DollarSign className="w-6 h-6 text-green-600" />} 
          color="bg-green-50"
        />
        <StatCard 
          title="Active Trainers" 
          value={stats.totalTrainers} 
          icon={<Activity className="w-6 h-6 text-purple-600" />} 
          color="bg-purple-50"
        />
        <StatCard 
          title="Total Classes" 
          value={stats.totalClasses} 
          icon={<Calendar className="w-6 h-6 text-orange-600" />} 
          color="bg-orange-50"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Revenue Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" /> Revenue Growth
            </h3>
          </div>
          {/* FIXED: Added w-full and minHeight style */}
          <div className="h-64 w-full" style={{ minHeight: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Area type="monotone" dataKey="value" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Member Growth Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-blue-500" /> New Members
            </h3>
          </div>
          {/* FIXED: Added w-full and minHeight style */}
          <div className="h-64 w-full" style={{ minHeight: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.memberData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} />
                <Tooltip cursor={{fill: '#F3F4F6'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}

// Reusable Stat Card Component (Internal)
function StatCard({ title, value, icon, color }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 transition-transform hover:-translate-y-1">
      <div className={`p-4 rounded-xl ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
      </div>
    </div>
  );
}