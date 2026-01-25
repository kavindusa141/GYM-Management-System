import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  Calendar, Clock, User, CheckCircle, XCircle, MapPin, Search, ArrowRight
} from 'lucide-react';

export default function Schedule() {
  const [activeTab, setActiveTab] = useState('BROWSE'); // 'BROWSE' | 'MY_BOOKINGS'
  const [classes, setClasses] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load Data
  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [classRes, myRes] = await Promise.all([
        api.get('/classes'),
        api.get('/bookings/my-bookings')
      ]);
      
      setClasses(classRes.data);
      setMyBookings(myRes.data);
    } catch (error) {
      toast.error("Could not load schedule");
    } finally {
      setLoading(false);
    }
  };

  // Helper: Get Next Date
  const getNextDate = (dayName) => {
    if (!dayName) return "N/A";
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const targetDay = days.indexOf(dayName);
    const today = new Date();
    const currentDay = today.getDay();
    
    let daysUntil = targetDay - currentDay;
    if (daysUntil <= 0) {
      daysUntil += 7; 
    }
    
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + daysUntil);
    return nextDate.toISOString().split('T')[0]; 
  };

  // Actions
  const handleBook = async (classId) => {
    try {
      const res = await api.post('/bookings/book', { class_id: classId });
      toast.success(res.data.message);
      fetchData(); 
    } catch (error) {
      toast.error(error.response?.data?.message || "Booking Failed");
    }
  };

  const handleCancel = async (bookingId) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;
    try {
      await api.post(`/bookings/cancel/${bookingId}`);
      toast.success("Booking Cancelled");
      fetchData();
    } catch (error) {
      toast.error("Cancellation Failed");
    }
  };

  const isBookedForNextSession = (classId, dayOfWeek) => {
    const nextDate = getNextDate(dayOfWeek);
    return myBookings.some(b => 
      b.class_id === classId && 
      b.booking_date === nextDate && 
      b.status === 'CONFIRMED'
    );
  };

  const formatDisplayDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', { 
      weekday: 'short', month: 'short', day: 'numeric' 
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Class Schedule</h1>
          <p className="text-gray-500">Book your spot in our upcoming weekly sessions.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-100 w-fit">
        <button
          onClick={() => setActiveTab('BROWSE')}
          className={`px-6 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${
            activeTab === 'BROWSE' 
              ? 'bg-blue-600 text-white shadow-md' 
              : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          <Calendar size={16} /> Browse Classes
        </button>
        <button
          onClick={() => setActiveTab('MY_BOOKINGS')}
          className={`px-6 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${
            activeTab === 'MY_BOOKINGS' 
              ? 'bg-blue-600 text-white shadow-md' 
              : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          <CheckCircle size={16} /> My Reservations
          {myBookings.length > 0 && (
            <span className="bg-white text-blue-600 text-xs py-0.5 px-2 rounded-full shadow-sm ml-1">
              {myBookings.length}
            </span>
          )}
        </button>
      </div>

      {/* --- CONTENT AREA --- */}
      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading Schedule...</div>
      ) : (
        <>
          {/* TAB 1: BROWSE ALL CLASSES */}
          {activeTab === 'BROWSE' && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {classes.length === 0 ? (
                <div className="col-span-full text-center py-10 text-gray-500">No classes scheduled yet.</div>
              ) : (
                classes.map((cls) => {
                  const nextSessionDate = getNextDate(cls.day_of_week);
                  const alreadyBooked = isBookedForNextSession(cls.class_id, cls.day_of_week);
                  const isCancelled = cls.status === 'CANCELLED'; // CHECK STATUS
                  
                  return (
                    <div key={cls.class_id} className={`relative bg-white rounded-2xl p-6 border shadow-sm transition-all flex flex-col h-full overflow-hidden group ${
                       isCancelled ? 'border-red-100 bg-red-50/20 grayscale-[0.8] hover:grayscale-0' : 'border-gray-100 hover:shadow-md'
                    }`}>
                      
                      {/* --- CANCELLED OVERLAY --- */}
                      {isCancelled && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-[1px] pointer-events-none group-hover:bg-white/40 transition-all">
                          <span className="bg-red-600 text-white px-4 py-2 rounded-xl font-black uppercase tracking-widest text-sm shadow-xl transform -rotate-12 border-2 border-white">
                            Cancelled
                          </span>
                        </div>
                      )}

                      {/* Decorative Accent */}
                      <div className={`absolute top-0 left-0 w-1 h-full ${isCancelled ? 'bg-red-300' : 'bg-blue-600'}`}></div>

                      {/* Header */}
                      <div className="flex justify-between items-start mb-4 pl-2">
                        <div>
                          <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded ${
                             isCancelled ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-blue-600'
                          }`}>
                            Every {cls.day_of_week}
                          </span>
                          <h3 className="text-xl font-black text-gray-900 mt-2">{cls.name}</h3>
                        </div>
                        {alreadyBooked && !isCancelled && (
                          <span className="bg-green-100 text-green-700 p-1.5 rounded-full">
                            <CheckCircle size={20}/>
                          </span>
                        )}
                      </div>

                      {/* Details */}
                      <div className="space-y-3 mt-2 mb-6 pl-2 flex-1">
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <Clock size={16} className="text-blue-500"/>
                          <span className="font-mono font-bold">
                            {cls.start_time.slice(0,5)} ({cls.duration} min)
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <User size={16} className="text-blue-500"/>
                          <span className="font-medium">{cls.Trainer?.name || "Staff Trainer"}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <ArrowRight size={16} className="text-blue-500"/>
                          <span className="text-xs text-gray-400">Next Session: {formatDisplayDate(nextSessionDate)}</span>
                        </div>
                      </div>

                      {/* Button */}
                      <div className="pl-2 relative z-20">
                        {isCancelled ? (
                           <button disabled className="w-full py-3 bg-gray-200 text-gray-500 font-bold rounded-xl cursor-not-allowed border border-gray-300">
                             Class Cancelled
                           </button>
                        ) : alreadyBooked ? (
                          <button 
                            disabled
                            className="w-full py-3 bg-gray-100 text-gray-400 font-bold rounded-xl cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            Reserved for {formatDisplayDate(nextSessionDate)}
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleBook(cls.class_id)}
                            className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200"
                          >
                            Book Next Session
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 2: MY BOOKINGS */}
          {activeTab === 'MY_BOOKINGS' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {myBookings.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto text-gray-200 mb-4" />
                  <p>You haven't booked any classes yet.</p>
                  <button onClick={() => setActiveTab('BROWSE')} className="mt-4 text-blue-600 font-bold hover:underline">Browse Classes</button>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {myBookings.map((booking) => (
                    <div key={booking.booking_id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50 transition-colors">
                      
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 bg-blue-50 text-blue-700 rounded-xl flex flex-col items-center justify-center shrink-0 border border-blue-100">
                          <span className="text-xs font-bold uppercase">{new Date(booking.booking_date).toLocaleString('default', { month: 'short' })}</span>
                          <span className="text-xl font-black">{new Date(booking.booking_date).getDate()}</span>
                        </div>
                        
                        <div>
                          <h4 className="font-bold text-gray-900 text-lg">{booking.GymClass?.name}</h4>
                          <div className="flex flex-wrap gap-4 mt-1 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock size={14}/> 
                              {booking.GymClass?.start_time.slice(0,5)} ({booking.GymClass?.duration} min)
                            </span>
                            <span className="flex items-center gap-1">
                              <User size={14}/> 
                              {booking.GymClass?.Trainer?.name || "Staff"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full border border-green-200 flex items-center gap-1">
                          <CheckCircle size={12}/> Confirmed
                        </span>
                        <button 
                          onClick={() => handleCancel(booking.booking_id)}
                          className="px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-100 transition-all flex items-center gap-2"
                        >
                          <XCircle size={16} /> Cancel
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}