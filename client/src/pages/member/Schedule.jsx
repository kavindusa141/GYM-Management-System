import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import {
  Calendar as CalendarIcon, List, Clock, User, CheckCircle, XCircle, AlertCircle, Info, Filter
} from 'lucide-react';

// --- Calendar Setup ---
const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

export default function Schedule() {
  const [activeTab, setActiveTab] = useState('BROWSE'); // 'BROWSE' | 'MY_BOOKINGS' | 'HISTORY'
  const [viewMode, setViewMode] = useState('LIST'); // 'LIST' | 'CALENDAR'
  const [classes, setClasses] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null); // For Modal
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

      // Filter out past classes for the list view (keep for calendar/history if needed)
      // Sorting by date/time ascending
      const upcoming = classRes.data.sort((a, b) => {
        return new Date(`${a.class_date}T${a.start_time}`) - new Date(`${b.class_date}T${b.start_time}`);
      });

      setClasses(upcoming);
      setMyBookings(myRes.data);
    } catch (error) {
      console.error("Load Error:", error);
      toast.error("Could not load schedule");
    } finally {
      setLoading(false);
    }
  };

  // --- Helpers ---

  // Check if current user already booked a class
  const isAlreadyBooked = (classId) => {
    return myBookings.some(b => b.class_id === classId && b.status === 'CONFIRMED');
  };

  // Convert API data to Calendar Events
  const getCalendarEvents = () => {
    return classes.map(cls => ({
      id: cls.class_id,
      title: cls.title,
      start: new Date(`${cls.class_date}T${cls.start_time}`),
      end: new Date(`${cls.class_date}T${cls.end_time}`),
      resource: cls,
    }));
  };

  // --- Actions ---

  const handleBook = async (classId) => {
    try {
      const res = await api.post('/bookings/book', { class_id: classId });
      toast.success(res.data.message);
      setSelectedClass(null);
      fetchData(); // Refresh to update counts
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
      toast.error(error.response?.data?.message || "Cancellation Failed");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in h-[calc(100vh-100px)] flex flex-col">

      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Class Schedule</h1>
          <p className="text-gray-500">Browse upcoming classes and manage your bookings.</p>
        </div>

        {/* View Toggles */}
        {activeTab === 'BROWSE' && (
          <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
            <button
              onClick={() => setViewMode('LIST')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center gap-2 transition-all ${viewMode === 'LIST' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              <List size={16} /> List View
            </button>
            <button
              onClick={() => setViewMode('CALENDAR')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center gap-2 transition-all ${viewMode === 'CALENDAR' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              <CalendarIcon size={16} /> Calendar
            </button>
          </div>
        )}
      </div>

      {/* Main Tabs */}
      <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-100 w-fit shrink-0">
        <button
          onClick={() => setActiveTab('BROWSE')}
          className={`px-6 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${activeTab === 'BROWSE'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-gray-500 hover:bg-gray-50'
            }`}
        >
          <CalendarIcon size={16} /> Browse Classes
        </button>
        <button
          onClick={() => setActiveTab('MY_BOOKINGS')}
          className={`px-6 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${activeTab === 'MY_BOOKINGS'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-gray-500 hover:bg-gray-50'
            }`}
        >
          <CheckCircle size={16} /> My Reservations
          {(myBookings.filter(b => b.GymClass?.status !== 'COMPLETED').length) > 0 && (
            <span className={`text-xs py-0.5 px-2 rounded-full shadow-sm ml-1 ${activeTab === 'MY_BOOKINGS' ? 'bg-white text-blue-600' : 'bg-blue-100 text-blue-600'
              }`}>
              {myBookings.filter(b => b.GymClass?.status !== 'COMPLETED').length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('HISTORY')}
          className={`px-6 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${activeTab === 'HISTORY'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-gray-500 hover:bg-gray-50'
            }`}
        >
          <Clock size={16} /> Class History
        </button>
      </div>

      {/* --- CONTENT AREA --- */}
      <div className="flex-1 min-h-0 relative bg-gray-50/50 rounded-xl border border-gray-100 overflow-hidden">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-20 backdrop-blur-sm">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
              <div className="text-gray-500 font-medium">Loading Schedule...</div>
            </div>
          </div>
        )}

        {/* TAB 1: BROWSE */}
        {activeTab === 'BROWSE' && (
          <>
            {/* VIEW: LIST */}
            {viewMode === 'LIST' && (
              <div className="h-full overflow-y-auto p-4">
                {classes.filter(c => !c.class_has_ended).length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                    <Info size={40} className="mb-2 text-gray-300" />
                    <p>No upcoming classes scheduled.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {classes.filter(c => !c.class_has_ended).map((cls) => {
                      const isBooked = isAlreadyBooked(cls.class_id);
                      const isCancelled = cls.status === 'CANCELLED';
                      const isFull = cls.is_full;
                      const percentFull = Math.min((cls.booking_count / cls.capacity) * 100, 100);

                      return (
                        <div key={cls.class_id} className={`bg-white rounded-2xl p-5 shadow-sm border transition-all hover:shadow-md flex flex-col gap-4 group ${isCancelled ? 'border-red-100 bg-red-50/10' : 'border-gray-100'}`}>

                          {/* Header: Date & Status Badges */}
                          <div className="flex justify-between items-start">
                            <div className="bg-gray-100 rounded-lg px-3 py-1.5 flex flex-col items-center min-w-[60px]">
                              <span className="text-xs font-bold text-gray-500 uppercase">
                                {format(new Date(cls.class_date), 'MMM')}
                              </span>
                              <span className="text-xl font-black text-gray-900">
                                {format(new Date(cls.class_date), 'd')}
                              </span>
                            </div>

                            <div className="flex gap-2">
                              {isCancelled && (
                                <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide border border-red-200">
                                  Cancelled
                                </span>
                              )}
                              {isFull && !isCancelled && (
                                <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide border border-orange-200">
                                  Full
                                </span>
                              )}
                              {isBooked && !isCancelled && (
                                <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide border border-green-200 flex items-center gap-1">
                                  <CheckCircle size={10} /> Booked
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Class Info */}
                          <div>
                            <h3 className={`font-bold text-lg text-gray-900 line-clamp-1 ${isCancelled ? 'line-through text-gray-400' : ''}`}>
                              {cls.title}
                            </h3>
                            <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                              <span className="flex items-center gap-1.5"><Clock size={14} className="text-blue-500" /> {cls.start_time.slice(0, 5)} - {cls.end_time.slice(0, 5)}</span>
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                              <span className="flex items-center gap-1.5"><User size={14} className="text-blue-500" /> {cls.Trainer?.name || "Staff"}</span>
                            </div>
                          </div>

                          {/* Capacity Bar */}
                          <div className="mt-auto">
                            <div className="flex justify-between text-xs font-semibold mb-1.5">
                              <span className={isFull ? 'text-orange-600' : 'text-gray-500'}>
                                {isCancelled ? 'Unavailable' : isFull ? 'Class Full' : 'Availability'}
                              </span>
                              <span className="text-gray-700">
                                {cls.booking_count}/{cls.capacity} Spots
                              </span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${isCancelled ? 'bg-gray-300' :
                                    isFull ? 'bg-orange-500' : 'bg-blue-500'
                                  }`}
                                style={{ width: `${isCancelled ? 0 : percentFull}%` }}
                              ></div>
                            </div>
                          </div>

                          {/* Action Button */}
                          {isBooked ? (
                            <button disabled className="w-full py-2.5 bg-green-50 text-green-700 font-bold rounded-xl border border-green-100 text-sm cursor-default">
                              Reservered
                            </button>
                          ) : isCancelled ? (
                            <button disabled className="w-full py-2.5 bg-gray-100 text-gray-400 font-bold rounded-xl border border-gray-200 text-sm cursor-not-allowed">
                              Cancelled
                            </button>
                          ) : (
                            <button
                              onClick={() => handleBook(cls.class_id)}
                              disabled={isFull || cls.hours_until_start < 12}
                              className={`w-full py-2.5 font-bold rounded-xl text-sm transition-all shadow-sm active:scale-95 ${isFull
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : cls.hours_until_start < 12
                                    ? 'bg-amber-100 text-amber-700 cursor-not-allowed border border-amber-200'
                                    : 'bg-slate-900 text-white hover:bg-slate-800'
                                }`}
                            >
                              {isFull ? 'Waitlist Full' : cls.hours_until_start < 12 ? 'Booking Closed' : 'Book Spot'}
                            </button>
                          )}

                          {/* 12h Warning */}
                          {!isBooked && !isCancelled && cls.hours_until_start < 12 && cls.hours_until_start > 0 && (
                            <div className="text-[10px] text-center text-amber-600 font-medium">
                              Booking closes 12h before start
                            </div>
                          )}

                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* VIEW: CALENDAR */}
            {viewMode === 'CALENDAR' && (
              <div className="h-full p-4 bg-white">
                <BigCalendar
                  localizer={localizer}
                  events={getCalendarEvents()}
                  startAccessor="start"
                  endAccessor="end"
                  style={{ height: '100%' }}
                  onSelectEvent={(event) => setSelectedClass(event.resource)}
                  views={['month', 'week', 'day']}
                  defaultView='month'
                  eventPropGetter={(event) => {
                    const isBooked = isAlreadyBooked(event.resource.class_id);
                    const isCancelled = event.resource.status === 'CANCELLED';
                    const isFull = event.resource.is_full;

                    let bgColor = '#3B82F6';
                    if (isCancelled) bgColor = '#9CA3AF';
                    else if (isBooked) bgColor = '#10B981';
                    else if (isFull) bgColor = '#F97316';

                    return {
                      style: {
                        backgroundColor: bgColor,
                        borderRadius: '4px',
                        opacity: isCancelled ? 0.6 : 1,
                        fontSize: '12px'
                      }
                    };
                  }}
                />
              </div>
            )}
          </>
        )}

        {/* TAB 2: MY BOOKINGS LIST */}
        {activeTab === 'MY_BOOKINGS' && (
          <div className="h-full overflow-y-auto bg-white p-4">
            {myBookings.filter(b => b.GymClass?.status !== 'COMPLETED').length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <CalendarIcon className="w-12 h-12 text-gray-200 mb-4" />
                <p>You have no upcoming reservations.</p>
                <button onClick={() => setActiveTab('BROWSE')} className="mt-4 text-blue-600 font-bold hover:underline">
                  Browse Classes
                </button>
              </div>
            ) : (
              <div className="space-y-4 max-w-4xl mx-auto">
                {myBookings.filter(b => b.GymClass?.status !== 'COMPLETED').map((booking) => {
                  const canCancel = booking.hours_until_start >= 12;

                  return (
                    <div key={booking.booking_id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                      <div className="flex items-center gap-5">
                        <div className="w-16 h-16 bg-blue-50 text-blue-700 rounded-xl flex flex-col items-center justify-center shrink-0 border border-blue-100">
                          <span className="text-xs font-bold uppercase">
                            {format(new Date(booking.booking_date), 'MMM')}
                          </span>
                          <span className="text-2xl font-black">
                            {format(new Date(booking.booking_date), 'd')}
                          </span>
                        </div>

                        <div>
                          <h4 className="font-bold text-gray-900 text-lg">{booking.GymClass?.title}</h4>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock size={14} />
                              {booking.GymClass?.start_time?.slice(0, 5)} - {booking.GymClass?.end_time?.slice(0, 5)}
                            </span>
                            <span className="flex items-center gap-1">
                              <User size={14} />
                              {booking.GymClass?.Trainer?.name || "Staff"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 pl-20 md:pl-0">
                        {/* Cancel Button */}
                        <div className="relative group">
                          <button
                            onClick={() => handleCancel(booking.booking_id)}
                            disabled={!canCancel}
                            className={`px-4 py-2 text-sm font-bold rounded-lg border transition-all flex items-center gap-2 ${canCancel
                                ? 'text-red-600 hover:bg-red-50 border-transparent hover:border-red-100'
                                : 'text-gray-400 bg-gray-100 border-gray-200 cursor-not-allowed'
                              }`}
                          >
                            <XCircle size={16} /> Cancel Booking
                          </button>

                          {/* Tooltip */}
                          {!canCancel && (
                            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-56 bg-gray-800 text-white text-xs p-2 rounded shadow-lg hidden group-hover:block z-50 text-center">
                              Cannot cancel less than 12h before start.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: HISTORY LIST */}
        {activeTab === 'HISTORY' && (
          <div className="h-full overflow-y-auto bg-white p-4">
            {myBookings.filter(b => b.GymClass?.status === 'COMPLETED').length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <Clock className="w-12 h-12 text-gray-200 mb-4" />
                <p>You haven't attended any completed classes yet.</p>
                <button onClick={() => setActiveTab('BROWSE')} className="mt-4 text-blue-600 font-bold hover:underline">
                  Browse Upcoming Classes
                </button>
              </div>
            ) : (
              <div className="space-y-4 max-w-4xl mx-auto">
                {myBookings.filter(b => b.GymClass?.status === 'COMPLETED').map((booking) => {
                  return (
                    <div key={booking.booking_id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50 rounded-2xl border border-gray-100 shadow-sm opacity-80">
                      <div className="flex items-center gap-5">
                        <div className="w-16 h-16 bg-gray-200 text-gray-600 rounded-xl flex flex-col items-center justify-center shrink-0 border border-gray-300">
                          <span className="text-xs font-bold uppercase">
                            {format(new Date(booking.booking_date), 'MMM')}
                          </span>
                          <span className="text-2xl font-black">
                            {format(new Date(booking.booking_date), 'd')}
                          </span>
                        </div>

                        <div>
                          <h4 className="font-bold text-gray-900 text-lg line-through">{booking.GymClass?.title}</h4>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock size={14} />
                              {booking.GymClass?.start_time?.slice(0, 5)} - {booking.GymClass?.end_time?.slice(0, 5)}
                            </span>
                            <span className="flex items-center gap-1">
                              <User size={14} />
                              {booking.GymClass?.Trainer?.name || "Staff"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 pl-20 md:pl-0">
                        <span className="bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2">
                          <CheckCircle size={16} /> Completed
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* --- CLASS DETAILS MODAL (Used only in Calendar View) --- */}
      {selectedClass && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            {/* Reusing Modal Logic from List View Logic for consistency */}
            <div className="p-6 bg-slate-900 text-white flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold">{selectedClass.title}</h2>
                <p className="text-slate-400 text-sm mt-1">{format(new Date(selectedClass.class_date), 'EEEE, MMMM do')}</p>
              </div>
              <button onClick={() => setSelectedClass(null)} className="text-white/50 hover:text-white"><XCircle /></button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-gray-600">{selectedClass.description || "No description provided."}</p>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-bold text-gray-500">Status</span>
                {selectedClass.status === 'CANCELLED' ? (
                  <span className="text-red-600 font-bold flex items-center gap-1"><AlertCircle size={14} /> Cancelled</span>
                ) : selectedClass.is_full ? (
                  <span className="text-orange-600 font-bold">Full</span>
                ) : (
                  <span className="text-green-600 font-bold">Available</span>
                )}
              </div>

              {/* Booking Button inside Modal */}
              {!isAlreadyBooked(selectedClass.class_id) && selectedClass.status !== 'CANCELLED' && (
                <button
                  onClick={() => handleBook(selectedClass.class_id)}
                  disabled={selectedClass.is_full || selectedClass.hours_until_start < 12}
                  className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {selectedClass.hours_until_start < 12 ? 'Booking Closed (12h Rule)' : 'Book Now'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}