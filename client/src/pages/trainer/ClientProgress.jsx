import { useState, useEffect } from 'react';
import api from '../../services/api';
import { User, Activity, Calendar, Clock, Search } from 'lucide-react';

export default function ClientProgress() {
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState('');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  // 1. Load Members Dropdown
  useEffect(() => {
    api.get('/workouts/members').then(res => setMembers(res.data));
  }, []);

  // 2. Fetch Logs when Member Selected
  useEffect(() => {
    if (!selectedMember) return;
    setLoading(true);
    api.get(`/workouts/progress/${selectedMember}`)
      .then(res => setLogs(res.data))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, [selectedMember]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Client Progress Tracking</h1>
        <p className="text-gray-500">Monitor workout consistency and feedback.</p>
      </div>

      {/* Selector */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <label className="block text-sm font-bold text-gray-700 mb-2">Select Client to View</label>
        <div className="relative">
          <User className="absolute left-3 top-3.5 text-gray-400" size={20}/>
          <select 
            className="w-full pl-10 p-3 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
            value={selectedMember}
            onChange={(e) => setSelectedMember(e.target.value)}
          >
            <option value="">-- Choose a Member --</option>
            {members.map(m => (
              <option key={m.user_id} value={m.user_id}>{m.name} ({m.member_code})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Results */}
      {selectedMember && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 font-bold text-gray-900 flex justify-between items-center">
            <span>Workout History</span>
            <span className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full">{logs.length} Sessions</span>
          </div>

          {loading ? (
            <div className="p-10 text-center text-gray-400">Loading history...</div>
          ) : logs.length === 0 ? (
            <div className="p-10 text-center text-gray-500">
              <Activity className="w-12 h-12 mx-auto text-gray-200 mb-3"/>
              No workout logs found for this client.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {logs.map((log) => (
                <div key={log.log_id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    
                    <div className="flex items-start gap-4">
                      {/* Date Badge */}
                      <div className="w-14 h-14 bg-gray-100 rounded-xl flex flex-col items-center justify-center text-gray-600 font-bold border border-gray-200 shrink-0">
                        <span className="text-[10px] uppercase">{new Date(log.date).toLocaleString('default', { month: 'short' })}</span>
                        <span className="text-xl leading-none">{new Date(log.date).getDate()}</span>
                      </div>
                      
                      <div>
                        <h4 className="font-bold text-gray-900">{log.Plan?.name}</h4>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                          <span className="flex items-center gap-1"><Clock size={14}/> {log.duration_mins} mins</span>
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                            log.mood === 'Great' ? 'bg-green-100 text-green-700' : 
                            log.mood === 'Hard' ? 'bg-orange-100 text-orange-700' : 
                            'bg-blue-100 text-blue-700'
                          }`}>
                            Mood: {log.mood}
                          </span>
                        </div>
                      </div>
                    </div>

                    {log.notes && (
                      <div className="md:w-1/3 bg-yellow-50 text-yellow-800 p-3 rounded-xl text-sm italic border border-yellow-100">
                        "{log.notes}"
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}