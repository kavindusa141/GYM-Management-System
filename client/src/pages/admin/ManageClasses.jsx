import { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  Calendar, Plus, Trash2, Edit2, Users, Search, Filter, 
  X, Ban, RefreshCw, Clock, CheckCircle, AlertTriangle 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function ManageClasses() {
  const { user } = useAuth(); // Get current user for permission checks
  const [classes, setClasses] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // --- UI STATE ---
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // --- FILTERS STATE ---
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('SCHEDULED'); // Tabs: SCHEDULED, COMPLETED, CANCELLED, ALL
  const [filterDay, setFilterDay] = useState('All'); 
  const [filterTrainer, setFilterTrainer] = useState('All');
  const [trainerAvailability, setTrainerAvailability] = useState({}); // { trainer_id: { available: bool, message: string } }
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  // --- FORM STATE ---
  const [formData, setFormData] = useState({
    id: null,
    title: '', 
    description: '', 
    trainer_id: '',
    class_date: '', 
    start_time: '',
    end_time: '',
    capacity: 20,
    status: 'SCHEDULED'
  });

  // --- INITIAL DATA LOAD ---
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [clsRes, trainersRes] = await Promise.all([
        api.get('/classes'),
        api.get('/admin/trainers') // Fetch trainers specifically
      ]);
      setClasses(clsRes.data);
      // Filter list to get only trainers
      setTrainers(trainersRes.data);
    } catch (error) {
      console.error("Failed to load data", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  // --- FILTERING LOGIC ---
  const filteredClasses = useMemo(() => {
    return classes.filter(cls => {
      // 1. Search (Title or Trainer Name)
      const matchesSearch = (cls.title || cls.name).toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (cls.Trainer?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      // 2. Status Filter
      // 'ALL' shows everything, otherwise strict match
      const matchesStatus = filterStatus === 'ALL' || cls.status === filterStatus;

      // 3. Day Filter (Derived from Date)
      // We convert the specific date (2023-10-25) to a Day Name (Wednesday) for the filter
      const dayName = cls.class_date ? new Date(cls.class_date).toLocaleDateString('en-US', { weekday: 'long' }) : '';
      const matchesDay = filterDay === 'All' || dayName === filterDay;

      // 4. Trainer Filter
      const matchesTrainer = filterTrainer === 'All' || String(cls.trainer_id) === filterTrainer;

      return matchesSearch && matchesStatus && matchesDay && matchesTrainer;
    });
  }, [classes, searchTerm, filterStatus, filterDay, filterTrainer]);

  // --- HEADER STATISTICS ---
  const stats = useMemo(() => {
    return {
      totalClasses: classes.length,
      cancelled: classes.filter(c => c.status === 'CANCELLED').length,
      activeTrainers: new Set(classes.map(c => c.trainer_id)).size
    };
  }, [classes]);

  // Check trainer availability when date/time/trainer changes
  const checkTrainerAvailability = async (trainerId, classDate, startTime, endTime) => {
    if (!trainerId || !classDate || !startTime || !endTime) {
      setTrainerAvailability({});
      return true;
    }

    setCheckingAvailability(true);
    try {
      // Simulate availability check - would be real API call if needed
      // For now, we'll validate at submission time
      const availabilityKey = `${trainerId}-${classDate}`;
      setTrainerAvailability(prev => ({
        ...prev,
        [availabilityKey]: { checking: true }
      }));
      
      // Mark as ready to check
      return true;
    } finally {
      setCheckingAvailability(false);
    }
  };

  // Get minimum time for today
  const getMinTime = () => {
    const today = new Date().toISOString().split('T')[0];
    if (formData.class_date === today) {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    }
    return "00:00";
  };

  // Debounce availability check on form change
  const isPastClass = (dateStr, timeStr) => {
    if (!dateStr || !timeStr) return false;
    const classEnd = new Date(`${dateStr}T${timeStr}`);
    return classEnd < new Date();
  };

  // 2. Format Time (HH:MM:SS -> 12h AM/PM)
  const formatTime = (timeStr) => {
    if(!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const date = new Date(); 
    date.setHours(hours, minutes);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  // 3. Get Initials from Name
  const getInitials = (name) => {
    if (!name) return 'NA';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  // 4. Generate Status Badge UI
  const getStatusBadge = (cls) => {
    if (cls.status === 'COMPLETED') return <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-[10px] font-bold uppercase border border-green-200 flex items-center gap-1"><CheckCircle size={10}/> Completed</span>;
    if (cls.status === 'CANCELLED') return <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-[10px] font-bold uppercase border border-red-200 flex items-center gap-1"><Ban size={10}/> Cancelled</span>;
    if (cls.is_full) return <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-[10px] font-bold uppercase border border-orange-200">FULL</span>;
    
    // Logic: If scheduled but end time has passed, show "Needs Update" alert
    if (cls.status === 'SCHEDULED' && isPastClass(cls.class_date, cls.end_time)) {
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 border border-yellow-200 rounded text-[10px] font-bold uppercase flex items-center gap-1"><AlertTriangle size={10}/> Needs Update</span>;
    }
    return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-[10px] font-bold uppercase border border-blue-200">Scheduled</span>;
  };

  // --- ACTIONS ---

  // Submit Create/Edit Form
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate times
    if (formData.start_time >= formData.end_time) {
      toast.error("End time must be after start time");
      return;
    }

    try {
      if (isEditing) {
        await api.put(`/classes/${formData.id}`, formData); 
        toast.success("Class updated successfully");
      } else {
        await api.post('/classes', formData);
        toast.success("Class scheduled successfully");
      }
      setShowModal(false);
      fetchData();
      resetForm();
    } catch (error) {
      // Check if it's an availability error (409 status)
      if (error.response?.status === 409) {
        toast.error(error.response?.data?.message || "Trainer is not available at this time");
      } else {
        toast.error(error.response?.data?.message || "Operation failed");
      }
    }
  };

  // Update Status (Complete/Cancel/Restore)
  const handleStatusUpdate = async (id, newStatus) => {
    if (!window.confirm(`Mark class as ${newStatus}?`)) return;
    try {
      await api.put(`/classes/${id}/status`, { status: newStatus });
      toast.success(`Class marked as ${newStatus}`);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Update failed");
    }
  };

  // Delete Class
  const handleDelete = async (id) => {
    if (!window.confirm("Permanently delete this class?")) return;
    try {
      await api.delete(`/classes/${id}`);
      toast.success("Class deleted");
      setClasses(classes.filter(c => c.class_id !== id));
    } catch (error) {
      toast.error("Delete failed");
    }
  };

  // Reset Form
  const resetForm = () => {
    setFormData({
      id: null, title: '', description: '', trainer_id: trainers[0]?.user_id || '',
      class_date: new Date().toISOString().split('T')[0], start_time: '09:00', end_time: '10:00',
      capacity: 20, status: 'SCHEDULED'
    });
    setIsEditing(false);
  };

  // Open Edit Modal
  const openEdit = (cls) => {
    setFormData({
      id: cls.class_id, title: cls.title || cls.name, description: cls.description || '',
      trainer_id: cls.trainer_id, class_date: cls.class_date,
      start_time: cls.start_time, end_time: cls.end_time, capacity: cls.capacity,
      status: cls.status
    });
    setIsEditing(true);
    setShowModal(true);
  };

  // --- RENDER ---
  return (
    <div className="space-y-8 animate-fade-in pb-10">
      
      {/* 1. HEADER STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Calendar size={24}/></div>
          <div><p className="text-sm text-gray-500 font-bold">Total Classes</p><p className="text-2xl font-black text-gray-800">{stats.totalClasses}</p></div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-red-50 text-red-600 rounded-xl"><Ban size={24}/></div>
          <div><p className="text-sm text-gray-500 font-bold">Cancelled</p><p className="text-2xl font-black text-gray-800">{stats.cancelled}</p></div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl"><Users size={24}/></div>
          <div><p className="text-sm text-gray-500 font-bold">Active Trainers</p><p className="text-2xl font-black text-gray-800">{stats.activeTrainers}</p></div>
        </div>
      </div>

      {/* 2. FILTERS & TOOLBAR */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row justify-between gap-4">
           {/* Status Tabs */}
           <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm w-fit overflow-x-auto">
            {['SCHEDULED', 'COMPLETED', 'CANCELLED', 'ALL'].map(status => (
              <button key={status} onClick={() => setFilterStatus(status)}
                className={`px-5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  filterStatus === status ? 'bg-slate-900 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'
                }`}>
                {status.charAt(0) + status.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          {/* Create Button (Admin/Staff Only) */}
          {(user.role === 'ADMIN' || user.role === 'STAFF') && (
            <button onClick={() => { resetForm(); setShowModal(true); }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-500/30 active:scale-95 transition-all w-fit self-end md:self-auto">
              <Plus size={20} /> Schedule Class
            </button>
          )}
        </div>

        {/* Detailed Filters Row */}
        <div className="flex flex-col md:flex-row gap-3">
           <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" placeholder="Search by Class Name..." className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>

          <div className="relative">
            <select className="px-4 py-2.5 pl-10 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer w-full md:w-40"
              value={filterDay} onChange={(e) => setFilterDay(e.target.value)}>
              <option value="All">All Days</option>
              <option>Monday</option><option>Tuesday</option><option>Wednesday</option>
              <option>Thursday</option><option>Friday</option><option>Saturday</option><option>Sunday</option>
            </select>
            <Calendar size={16} className="absolute left-3 top-3 text-gray-400 pointer-events-none"/>
          </div>

          <div className="relative">
            <select className="px-4 py-2.5 pl-10 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer w-full md:w-48"
              value={filterTrainer} onChange={(e) => setFilterTrainer(e.target.value)}>
              <option value="All">All Trainers</option>
              {trainers.map(t => <option key={t.user_id} value={t.user_id}>{t.name}</option>)}
            </select>
            <Users size={16} className="absolute left-3 top-3 text-gray-400 pointer-events-none"/>
          </div>
        </div>
      </div>

      {/* 3. CLASS GRID */}
      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading Schedule...</div>
      ) : filteredClasses.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
          <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">No classes match your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClasses.map((cls) => {
            const isCancelled = cls.status === 'CANCELLED';
            const isCompleted = cls.status === 'COMPLETED';
            const isOverdue = cls.status === 'SCHEDULED' && isPastClass(cls.class_date, cls.end_time);
            const percentage = cls.capacity > 0 ? Math.min((cls.booking_count / cls.capacity) * 100, 100) : 0;
            
            return (
              <div key={cls.class_id} className={`bg-white p-6 rounded-2xl border shadow-sm transition-all hover:shadow-md flex flex-col gap-4 relative group ${isCancelled ? 'opacity-60 bg-gray-50' : ''} ${isOverdue ? 'ring-2 ring-yellow-400/50' : ''}`}>
                
                {/* Header: Date & Status */}
                <div className="flex justify-between items-start">
                   <div className="flex flex-col">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                        <Calendar size={12}/> {new Date(cls.class_date).toLocaleDateString()}
                      </span>
                      <h3 className={`text-xl font-black ${isCancelled ? 'line-through text-gray-400' : 'text-gray-900'}`}>{cls.title || cls.name}</h3>
                   </div>
                   <div className="flex gap-1">{getStatusBadge(cls)}</div>
                </div>

                {/* Time & Trainer Info */}
                <div className="flex justify-between items-center text-sm text-gray-600">
                   <div className="flex items-center gap-2">
                      <Clock size={16} className="text-blue-500"/> 
                      <span className="font-bold">{formatTime(cls.start_time)} - {formatTime(cls.end_time)}</span>
                   </div>
                   <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold">
                        {getInitials(cls.Trainer?.name)}
                      </div>
                      <span className="text-xs font-medium">{cls.Trainer?.name || 'Unassigned'}</span>
                   </div>
                </div>

                <div className="h-px bg-gray-100 w-full"></div>

                {/* Booking Progress Bar */}
                <div>
                   <div className="flex justify-between text-xs font-bold mb-1">
                      <span className={cls.is_full ? 'text-red-500' : 'text-gray-500'}>
                        {cls.booking_count} / {cls.capacity} Booked
                      </span>
                   </div>
                   <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${cls.is_full ? 'bg-red-500' : 'bg-blue-500'}`} 
                        style={{ width: `${percentage}%` }}></div>
                   </div>
                </div>

                {/* ACTION BUTTONS (Role Protected) */}
                <div className="grid grid-cols-4 gap-2 pt-2">
                   {/* Status Actions: Admin, Staff, Trainer */}
                   {(user.role === 'ADMIN' || user.role === 'STAFF' || user.role === 'TRAINER') && (
                     <>
                        {cls.status === 'SCHEDULED' && (
                          <>
                            <button onClick={() => handleStatusUpdate(cls.class_id, 'COMPLETED')} className="col-span-1 p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 flex justify-center" title="Mark Completed"><CheckCircle size={18}/></button>
                            <button onClick={() => handleStatusUpdate(cls.class_id, 'CANCELLED')} className="col-span-1 p-2 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 flex justify-center" title="Cancel Class"><Ban size={18}/></button>
                          </>
                        )}
                        {cls.status === 'CANCELLED' && (
                           <button onClick={() => handleStatusUpdate(cls.class_id, 'SCHEDULED')} className="col-span-2 p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 flex items-center justify-center gap-2 text-xs font-bold" title="Restore"><RefreshCw size={16}/> Restore</button>
                        )}
                     </>
                   )}

                   {/* Edit/Delete: Admin & Staff Only */}
                   {(user.role === 'ADMIN' || user.role === 'STAFF') && (
                     <>
                       {cls.status === 'SCHEDULED' && (
                         <button onClick={() => openEdit(cls)} className="col-span-1 p-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 flex justify-center" title="Edit"><Edit2 size={18}/></button>
                       )}
                       <button onClick={() => handleDelete(cls.class_id)} className="col-span-1 p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 flex justify-center" title="Delete"><Trash2 size={18}/></button>
                     </>
                   )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl animate-fade-in-up">
            <h2 className="text-2xl font-black text-gray-900 mb-6">{isEditing ? 'Edit Class Details' : 'Schedule New Class'}</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Class Title *</label>
                <input required type="text" className="w-full p-3 bg-gray-50 border rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Yoga Sunrise"
                  value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Date *</label>
                  <input required type="date" className="w-full p-3 bg-gray-50 border rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-500"
                    min={new Date().toISOString().split('T')[0]} 
                    value={formData.class_date} onChange={e => setFormData({...formData, class_date: e.target.value})} />
                </div>
                <div>
                  <label className="label">Trainer (Optional)</label>
                  <select className="w-full p-3 bg-gray-50 border rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                    value={formData.trainer_id} 
                    onChange={(e) => {
                      setFormData({...formData, trainer_id: e.target.value});
                      if (e.target.value) {
                        checkTrainerAvailability(e.target.value, formData.class_date, formData.start_time, formData.end_time);
                      }
                    }}>
                    <option value="">⊘ Unassigned</option>
                    {trainers.map(t => (
                      <option key={t.user_id} value={t.user_id}>
                        {t.name} {!t.status ? '(Inactive)' : ''}
                      </option>
                    ))}
                  </select>
                  {checkingAvailability && (
                    <p className="text-xs text-blue-500 mt-1">Checking availability...</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Start Time *</label>
                  <input required type="time" className="w-full p-3 bg-gray-50 border rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-500"
                    min={getMinTime()}
                    value={formData.start_time} onChange={e => setFormData({...formData, start_time: e.target.value})} />
                  {formData.class_date === new Date().toISOString().split('T')[0] && (
                    <p className="text-xs text-gray-500 mt-1">Must be current time or later</p>
                  )}
                </div>
                <div>
                  <label className="label">End Time *</label>
                  <input required type="time" className="w-full p-3 bg-gray-50 border rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-500"
                    min={formData.start_time || "00:00"}
                    value={formData.end_time} onChange={e => setFormData({...formData, end_time: e.target.value})} />
                  {formData.end_time && formData.start_time && formData.start_time >= formData.end_time && (
                    <p className="text-xs text-red-500 mt-1">End time must be after start time</p>
                  )}
                </div>
              </div>

              <div>
                <label className="label">Capacity</label>
                <input required type="number" min="1" className="w-full p-3 bg-gray-50 border rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.capacity} onChange={e => setFormData({...formData, capacity: e.target.value})} />
              </div>

              <div>
                <label className="label">Description</label>
                <textarea className="w-full p-3 bg-gray-50 border rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-500 resize-none" rows="3" placeholder="Class details..."
                  value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg">
                  {isEditing ? 'Save Changes' : 'Create Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}