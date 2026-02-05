import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Calendar, Clock, Users, XCircle, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

export default function MyClasses() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('SCHEDULED'); // SCHEDULED, COMPLETED, CANCELLED, ALL

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const res = await api.get('/classes/trainer/my-classes');
      setClasses(res.data);
    } catch (error) {
      console.error("Error fetching classes", error);
      toast.error("Failed to load classes");
    } finally {
      setLoading(false);
    }
  };

  // Filter classes based on status
  const filteredClasses = classes.filter(cls => {
    if (filterStatus === 'ALL') return true;
    return cls.status === filterStatus;
  });

  // Check if class has ended (for marking completed)
  const hasClassEnded = (dateStr, endTimeStr) => {
    if (!dateStr || !endTimeStr) return false;
    const classEnd = new Date(`${dateStr}T${endTimeStr}`);
    return classEnd < new Date();
  };

  // Check if class is upcoming
  const isUpcoming = (dateStr, startTimeStr) => {
    if (!dateStr || !startTimeStr) return false;
    const classStart = new Date(`${dateStr}T${startTimeStr}`);
    return classStart > new Date();
  };

  // Update class status
  const handleStatusUpdate = async (classId, newStatus, cls) => {
    let message = '';
    let title = '';

    if (newStatus === 'COMPLETED') {
      title = 'Mark Class as Completed';
      message = 'Mark this class as completed? This action cannot be undone.';
    } else if (newStatus === 'CANCELLED') {
      title = 'Cancel Class';
      message = 'Cancel this class? Members will be notified. This class must be cancelled at least 12 hours before start time.';
    } else if (newStatus === 'SCHEDULED') {
      title = 'Restore Class';
      message = 'Restore this class to scheduled? This class must be restored at least 12 hours before start time.';
    }

    if (!window.confirm(message)) return;
    
    try {
      const response = await api.put(`/classes/${classId}/status`, { status: newStatus });
      
      if (response.data?.timeInfo) {
        const { hoursUntilStart } = response.data.timeInfo;
        if (newStatus === 'CANCELLED' && hoursUntilStart < 12) {
          toast.error(`Cannot cancel: Class starts in ${Math.round(hoursUntilStart)} hours. Must cancel 12 hours before.`);
          return;
        }
        if (newStatus === 'SCHEDULED' && hoursUntilStart < 12) {
          toast.error(`Cannot restore: Class starts in ${Math.round(hoursUntilStart)} hours. Must restore 12 hours before.`);
          return;
        }
      }

      toast.success(`Class marked as ${newStatus.toLowerCase()}`);
      
      // Update locally
      setClasses(classes.map(c => {
        if (c.class_id === classId) {
          return { ...c, status: newStatus };
        }
        return c;
      }));
    } catch (error) {
      const errMsg = error.response?.data?.message || `Failed to ${newStatus.toLowerCase()} class`;
      toast.error(errMsg);
    }
  };

  // Helper to format time
  const formatTime = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours));
    date.setMinutes(parseInt(minutes));
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  // Helper to format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      
      <div>
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
          <Calendar className="text-blue-600" size={28} /> My Class Schedule
        </h1>
        <p className="text-gray-500">Manage your assigned classes and update their status</p>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 bg-white p-2 rounded-xl border border-gray-200 w-fit">
        {['SCHEDULED', 'COMPLETED', 'CANCELLED', 'ALL'].map(status => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              filterStatus === status 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            {status === 'SCHEDULED' ? 'Upcoming' : status}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading schedule...</div>
      ) : filteredClasses.length === 0 ? (
        <div className="p-10 text-center border-2 border-dashed border-gray-200 rounded-xl">
          <Calendar size={32} className="mx-auto text-gray-300 mb-2"/>
          <p className="text-gray-500 font-medium">
            {filterStatus === 'ALL' ? 'No classes assigned yet' : `No ${filterStatus.toLowerCase()} classes`}
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClasses.map((cls) => {
            const ended = hasClassEnded(cls.class_date, cls.end_time);
            const upcoming = isUpcoming(cls.class_date, cls.start_time);

            return (
              <div 
                key={cls.class_id} 
                className={`relative bg-white p-6 rounded-2xl shadow-sm border transition-all ${
                  cls.status === 'CANCELLED' ? 'border-red-100 bg-red-50/30 opacity-75' : 
                  cls.status === 'COMPLETED' ? 'border-green-100 bg-green-50/30' :
                  'border-gray-100 hover:shadow-md'
                }`}
              >
                {/* Status Badge */}
                <div className="absolute top-4 right-4">
                  {cls.status === 'CANCELLED' ? (
                    <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                      <XCircle size={12}/> Cancelled
                    </span>
                  ) : cls.status === 'COMPLETED' ? (
                    <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                      <CheckCircle size={12}/> Completed
                    </span>
                  ) : (
                    <span className="bg-blue-100 text-blue-600 text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                      <CheckCircle size={12}/> Scheduled
                    </span>
                  )}
                </div>

                <h3 className={`text-lg font-bold mb-1 ${cls.status === 'CANCELLED' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                  {cls.title || cls.name}
                </h3>

                {cls.description && (
                  <p className="text-xs text-gray-500 mb-4">{cls.description}</p>
                )}
                
                <div className="space-y-3 mt-4">
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Calendar size={16} className="text-blue-500 flex-shrink-0"/>
                    <span className="font-medium">{formatDate(cls.class_date)}</span>
                  </div>

                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Clock size={16} className="text-blue-500 flex-shrink-0"/>
                    <span className="font-medium">
                      {formatTime(cls.start_time)} - {formatTime(cls.end_time)} ({cls.duration || 60} mins)
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Users size={16} className="text-blue-500 flex-shrink-0"/>
                    <span className="font-medium">
                      {cls.booking_count || 0} / {cls.capacity} Members Booked
                    </span>
                  </div>
                </div>

                {/* Capacity Progress Bar */}
                {cls.capacity > 0 && (
                  <div className="mt-4">
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          cls.is_full ? 'bg-red-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${Math.min(((cls.booking_count || 0) / cls.capacity) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Display who cancelled and when (for cancelled classes) */}
                {cls.status === 'CANCELLED' && cls.cancelled_by_name && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-xs text-red-700">
                      <span className="font-semibold">Cancelled by:</span> {cls.cancelled_by_name}
                      {cls.cancelled_at && (
                        <>
                          <br/>
                          <span className="text-red-600">{new Date(cls.cancelled_at).toLocaleString()}</span>
                        </>
                      )}
                    </p>
                  </div>
                )}

                {/* Timing Info and Messages */}
                {cls.status === 'SCHEDULED' && cls.hours_until_start !== undefined && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-700">
                      <span className="font-semibold">Class starts in:</span> {cls.hours_until_start} hours
                    </p>
                    {cls.hours_until_start < 12 && (
                      <p className="text-xs text-red-600 mt-1">
                        <AlertCircle size={12} className="inline mr-1"/> Cannot cancel or restore within 12 hours of class start time
                      </p>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="mt-6 pt-4 border-t border-gray-100 space-y-2">
                  {cls.status === 'SCHEDULED' && (
                    <>
                      {/* Show "Mark Completed" button if class has ended */}
                      {cls.can_mark_complete ? (
                        <button 
                          onClick={() => handleStatusUpdate(cls.class_id, 'COMPLETED', cls)}
                          className="w-full py-2 bg-green-50 border border-green-200 text-green-600 rounded-lg text-sm font-bold hover:bg-green-100 transition-colors flex items-center justify-center gap-2"
                          title="Mark class as completed after it ends"
                        >
                          <CheckCircle size={16}/> Mark Completed
                        </button>
                      ) : (
                        <button 
                          disabled
                          className="w-full py-2 bg-gray-50 border border-gray-200 text-gray-400 rounded-lg text-sm font-bold cursor-not-allowed flex items-center justify-center gap-2"
                          title="Class must end before marking as completed"
                        >
                          <CheckCircle size={16}/> Mark Completed
                        </button>
                      )}

                      {/* Show cancel button with 12-hour validation */}
                      {cls.can_cancel_12h ? (
                        <button 
                          onClick={() => handleStatusUpdate(cls.class_id, 'CANCELLED', cls)}
                          className="w-full py-2 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm font-bold hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                        >
                          <XCircle size={16}/> Cancel Class
                        </button>
                      ) : (
                        <button 
                          disabled
                          className="w-full py-2 bg-gray-50 border border-gray-200 text-gray-400 rounded-lg text-sm font-bold cursor-not-allowed flex items-center justify-center gap-2"
                          title={`Cannot cancel: Class starts in ${cls.hours_until_start} hours. Must cancel 12 hours before.`}
                        >
                          <XCircle size={16}/> Cancel Class (in {cls.hours_until_start}h)
                        </button>
                      )}
                    </>
                  )}

                  {cls.status === 'CANCELLED' && (
                    <>
                      {cls.can_restore_12h ? (
                        <button 
                          onClick={() => handleStatusUpdate(cls.class_id, 'SCHEDULED', cls)}
                          className="w-full py-2 bg-blue-50 border border-blue-200 text-blue-600 rounded-lg text-sm font-bold hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
                        >
                          <RefreshCw size={16}/> Restore Class
                        </button>
                      ) : (
                        <button 
                          disabled
                          className="w-full py-2 bg-gray-50 border border-gray-200 text-gray-400 rounded-lg text-sm font-bold cursor-not-allowed flex items-center justify-center gap-2"
                          title={`Cannot restore: Class starts in ${cls.hours_until_start} hours. Must restore 12 hours before.`}
                        >
                          <RefreshCw size={16}/> Restore Class (in {cls.hours_until_start}h)
                        </button>
                      )}
                    </>
                  )}

                  {cls.status === 'COMPLETED' && (
                    <button 
                      onClick={() => handleStatusUpdate(cls.class_id, 'SCHEDULED', cls)}
                      className="w-full py-2 bg-gray-50 border border-gray-200 text-gray-600 rounded-lg text-sm font-bold hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
                    >
                      <RefreshCw size={16}/> Revert
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}