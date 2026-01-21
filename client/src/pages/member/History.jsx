import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Calendar, Clock, CheckCircle, TrendingUp } from 'lucide-react';

export default function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await api.get('/attendance/my-history');
      setHistory(res.data);
    } catch (error) {
      console.error("Failed to load history");
    } finally {
      setLoading(false);
    }
  };

  // Helper to format date nicely
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  // Helper to get stats
  const getStats = () => {
    const total = history.length;
    const thisMonth = history.filter(h => {
      const d = new Date(h.attendance_date);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    return { total, thisMonth };
  };

  const stats = getStats();

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Attendance History</h1>
        <p className="text-gray-500">Track your gym consistency and visits.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-600 text-white p-6 rounded-2xl shadow-lg shadow-blue-200">
          <div className="flex items-center gap-2 mb-2 text-blue-100 text-sm font-bold uppercase tracking-wider">
            <CheckCircle size={16} /> Total Visits
          </div>
          <div className="text-4xl font-black">{stats.total}</div>
        </div>
        <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm">
           <div className="flex items-center gap-2 mb-2 text-gray-400 text-sm font-bold uppercase tracking-wider">
            <TrendingUp size={16} /> This Month
          </div>
          <div className="text-4xl font-black text-gray-900">{stats.thisMonth}</div>
        </div>
      </div>

      {/* Timeline List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 font-bold text-gray-900">
          Recent Activity
        </div>
        
        {loading ? (
          <div className="p-10 text-center text-gray-400">Loading history...</div>
        ) : history.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            <Calendar className="w-10 h-10 mx-auto text-gray-300 mb-3"/>
            No attendance records found yet.
          </div>
        ) : (
          <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
            {history.map((record) => (
              <div key={record.attendance_id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                
                <div className="flex items-center gap-4">
                  {/* Date Box */}
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex flex-col items-center justify-center text-gray-600 font-bold border border-gray-200">
                    <span className="text-[10px] uppercase">{new Date(record.attendance_date).toLocaleString('default', { month: 'short' })}</span>
                    <span className="text-lg leading-none">{new Date(record.attendance_date).getDate()}</span>
                  </div>
                  
                  <div>
                    <h4 className="font-bold text-gray-900">{formatDate(record.attendance_date)}</h4>
                    <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100 font-bold">
                      Verified Check-in
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex items-center gap-2 text-gray-900 font-mono font-bold text-lg">
                    <Clock size={16} className="text-gray-400" />
                    {record.check_in.slice(0,5)}
                  </div>
                  <div className="text-xs text-gray-400 font-medium">
                     {record.check_out ? `Out: ${record.check_out.slice(0,5)}` : 'Active Session'}
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}