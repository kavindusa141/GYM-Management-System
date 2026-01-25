import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Calendar, Clock, Users, XCircle, AlertCircle, CheckCircle } from 'lucide-react';

export default function MyClasses() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const res = await api.get('/classes/trainer/my-classes');
      setClasses(res.data);
    } catch (error) {
      console.error("Error fetching classes");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (classId) => {
    if (!window.confirm("Are you sure you want to cancel this class? Members will be notified.")) return;
    
    try {
      await api.patch(`/classes/${classId}/cancel`);
      toast.success("Class Cancelled");
      // Refresh list locally
      setClasses(classes.map(c => 
        c.class_id === classId ? { ...c, status: 'CANCELLED' } : c
      ));
    } catch (error) {
      toast.error("Failed to cancel class");
    }
  };

  // Helper to format time (e.g., 14:30:00 -> 02:30 PM)
  const formatTime = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(hours);
    date.setMinutes(minutes);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      
      <div>
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
          <Calendar className="text-blue-600" size={28} /> My Class Schedule
        </h1>
        <p className="text-gray-500">View and manage your upcoming sessions.</p>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading schedule...</div>
      ) : classes.length === 0 ? (
        <div className="p-10 text-center border-2 border-dashed border-gray-200 rounded-xl">
          <p className="text-gray-500">No classes assigned to you yet.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((cls) => (
            <div 
              key={cls.class_id} 
              className={`relative bg-white p-6 rounded-2xl shadow-sm border transition-all ${
                cls.status === 'CANCELLED' ? 'border-red-100 bg-red-50/30' : 'border-gray-100 hover:shadow-md'
              }`}
            >
              {/* Status Badge */}
              <div className="absolute top-4 right-4">
                {cls.status === 'CANCELLED' ? (
                  <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                    <XCircle size={12}/> Cancelled
                  </span>
                ) : (
                  <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                    <CheckCircle size={12}/> Scheduled
                  </span>
                )}
              </div>

              <h3 className={`text-lg font-bold mb-1 ${cls.status === 'CANCELLED' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                {cls.name}
              </h3>
              
              <div className="space-y-3 mt-4">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Calendar size={16} className="text-blue-500"/>
                  <span className="font-medium">{cls.day_of_week}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Clock size={16} className="text-blue-500"/>
                  <span className="font-medium">
                    {formatTime(cls.start_time)} ({cls.duration} mins)
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Users size={16} className="text-blue-500"/>
                  <span className="font-medium">Capacity: {cls.capacity}</span>
                </div>
              </div>

              {/* Action Button */}
              {cls.status !== 'CANCELLED' && (
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <button 
                    onClick={() => handleCancel(cls.class_id)}
                    className="w-full py-2 bg-white border border-red-200 text-red-600 rounded-xl text-sm font-bold hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <AlertCircle size={16}/> Cancel Class
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}