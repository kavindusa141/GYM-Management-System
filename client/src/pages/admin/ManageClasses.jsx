import { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  Calendar, Plus, Trash2, Edit2, Users, Search, Filter, 
  X, Ban, RefreshCw
} from 'lucide-react';

export default function ManageClasses() {
  const [classes, setClasses] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDay, setFilterDay] = useState('All');

  // Form State
  const [formData, setFormData] = useState({
    id: null,
    name: '',
    trainer_id: '',
    day_of_week: 'Monday',
    start_time: '',
    duration: 60,
    capacity: 20,
    status: 'SCHEDULED'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [classRes, trainerRes] = await Promise.all([
        api.get('/classes'),
        api.get('/admin/trainers')
      ]);
      setClasses(classRes.data);
      setTrainers(trainerRes.data);
    } catch (error) {
      toast.error("Failed to load schedule data");
    } finally {
      setLoading(false);
    }
  };

  // --- STATS & FILTERING ---
  const filteredClasses = useMemo(() => {
    return classes.filter(cls => {
      const matchesSearch = cls.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            cls.Trainer?.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDay = filterDay === 'All' || cls.day_of_week === filterDay;
      return matchesSearch && matchesDay;
    });
  }, [classes, searchTerm, filterDay]);

  const stats = useMemo(() => {
    return {
      totalClasses: classes.length,
      cancelled: classes.filter(c => c.status === 'CANCELLED').length,
      activeTrainers: new Set(classes.map(c => c.trainer_id)).size
    };
  }, [classes]);

  // --- ACTIONS ---
  const handleSubmit = async (e) => {
    e.preventDefault();
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
      toast.error(error.response?.data?.message || "Operation failed");
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Mark this class as Cancelled? Members will be notified.")) return;
    try {
      await api.patch(`/classes/${id}/cancel`);
      toast.success("Class marked as Cancelled");
      // Optimistic update
      setClasses(classes.map(c => 
        c.class_id === id ? { ...c, status: 'CANCELLED' } : c
      ));
    } catch (error) {
      toast.error("Cancel failed");
    }
  };

  const handleReactivate = async (cls) => {
     try {
       // We reuse update to set status back to SCHEDULED
       await api.put(`/classes/${cls.class_id}`, { ...cls, status: 'SCHEDULED' });
       toast.success("Class Reactivated");
       setClasses(classes.map(c => 
        c.class_id === cls.class_id ? { ...c, status: 'SCHEDULED' } : c
       ));
     } catch (error) {
       toast.error("Reactivation failed");
     }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Permanently delete this class? This cannot be undone.")) return;
    try {
      await api.delete(`/classes/${id}`);
      toast.success("Class deleted permanently");
      setClasses(classes.filter(c => c.class_id !== id));
    } catch (error) {
      toast.error("Delete failed");
    }
  };

  const openEdit = (cls) => {
    setFormData({
      id: cls.class_id,
      name: cls.name,
      trainer_id: cls.trainer_id,
      day_of_week: cls.day_of_week,
      start_time: cls.start_time,
      duration: cls.duration,
      capacity: cls.capacity,
      status: cls.status
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      id: null,
      name: '',
      trainer_id: trainers.length > 0 ? trainers[0].user_id : '',
      day_of_week: 'Monday',
      start_time: '09:00',
      duration: 60,
      capacity: 20,
      status: 'SCHEDULED'
    });
    setIsEditing(false);
  };

  // --- HELPERS ---
  const formatTime = (timeStr) => {
    const [hours, minutes] = timeStr.split(':');
    const date = new Date();
    date.setHours(hours, minutes);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const getDayConfig = (day) => {
    const configs = {
      'Monday': { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-500' },
      'Tuesday': { color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-500' },
      'Wednesday': { color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-500' },
      'Thursday': { color: 'text-pink-600', bg: 'bg-pink-50', border: 'border-pink-500' },
      'Friday': { color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-500' },
      'Saturday': { color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-500' },
      'Sunday': { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-500' },
    };
    return configs[day] || { color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-500' };
  };

  const getInitials = (name) => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      
      {/* HEADER & STATS */}
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

      {/* TOOLBAR */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex flex-1 gap-2 w-full md:w-auto">
          {/* Search */}
          <div className="relative flex-1 md:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search classes or trainers..." 
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Day Filter */}
          <div className="relative">
            <select 
              className="px-4 py-2.5 pl-10 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer min-w-[150px]"
              value={filterDay}
              onChange={(e) => setFilterDay(e.target.value)}
            >
              <option value="All">All Days</option>
              <option>Monday</option><option>Tuesday</option><option>Wednesday</option>
              <option>Thursday</option><option>Friday</option><option>Saturday</option><option>Sunday</option>
            </select>
            <Filter size={16} className="absolute left-3 top-3 text-gray-400 pointer-events-none"/>
          </div>
        </div>

        <button 
          onClick={() => { resetForm(); setShowModal(true); }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-500/30 active:scale-95 transition-all"
        >
          <Plus size={20} /> Schedule Class
        </button>
      </div>

      {/* --- CARD GRID LAYOUT --- */}
      {loading ? (
        <div className="text-center py-20 text-gray-500">Loading schedule...</div>
      ) : filteredClasses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">
          <Calendar size={48} className="mb-4 opacity-20"/>
          <p className="text-lg font-medium">No classes found</p>
          <p className="text-sm">Try adjusting your filters or search terms</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClasses.map((cls) => {
            const dayConfig = getDayConfig(cls.day_of_week);
            const isCancelled = cls.status === 'CANCELLED';
            
            return (
              <div 
                key={cls.class_id} 
                className={`
                  relative rounded-2xl p-0 shadow-sm border transition-all duration-300 group overflow-hidden flex flex-col
                  ${isCancelled ? 'bg-gray-50 border-gray-200 opacity-80 grayscale-[0.5]' : 'bg-white border-gray-100 hover:shadow-xl'}
                `}
              >
                {/* Colored Side Accent */}
                <div className={`absolute top-0 bottom-0 left-0 w-1.5 ${isCancelled ? 'bg-red-500' : dayConfig.bg.replace('bg-', 'bg-').replace('50', '500')}`}></div>
                
                {/* Cancelled Overlay Stripe */}
                {isCancelled && (
                  <div className="absolute top-3 right-3 bg-red-100 text-red-600 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border border-red-200 z-10 shadow-sm">
                    CANCELLED
                  </div>
                )}

                <div className="p-6 flex-1 flex flex-col">
                  {/* Top Row: Time & Day Badge */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className={`text-2xl font-black leading-tight ${isCancelled ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                        {formatTime(cls.start_time)}
                      </h3>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">{cls.duration} min session</p>
                    </div>
                    
                    {!isCancelled && (
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${dayConfig.bg} ${dayConfig.color} ${dayConfig.border}`}>
                        {cls.day_of_week}
                      </span>
                    )}
                  </div>

                  {/* Class Name */}
                  <h4 className={`text-lg font-bold mb-6 transition-colors line-clamp-2 ${isCancelled ? 'text-gray-400' : 'text-gray-800 group-hover:text-blue-600'}`}>
                    {cls.name}
                  </h4>

                  {/* Divider */}
                  <div className="h-px bg-gray-100 w-full mb-4"></div>

                  {/* Footer Info */}
                  <div className="flex justify-between items-center mt-auto">
                    {/* Trainer */}
                    <div className={`flex items-center gap-3 ${isCancelled ? 'opacity-50' : ''}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ring-2 ring-white ${isCancelled ? 'bg-gray-200 text-gray-500' : `${dayConfig.bg} ${dayConfig.color}`}`}>
                        {cls.Trainer?.name ? getInitials(cls.Trainer.name) : 'NA'}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-400 uppercase">Trainer</span>
                        <span className="text-xs font-bold text-gray-700">{cls.Trainer?.name || 'Unassigned'}</span>
                      </div>
                    </div>

                    {/* Capacity Badge */}
                    <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1.5 rounded-lg border border-gray-100">
                      <Users size={14} className="text-gray-400"/>
                      <span className="text-xs font-bold text-gray-600">{cls.capacity}</span>
                    </div>
                  </div>
                </div>

                {/* Actions (Floating on Hover) */}
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-x-2 group-hover:translate-x-0 z-20">
                  
                  {isCancelled ? (
                     <button 
                     onClick={() => handleReactivate(cls)}
                     className="p-2 bg-white text-green-600 shadow-md rounded-lg hover:bg-green-50 border border-gray-100" 
                     title="Reactivate Class"
                   >
                     <RefreshCw size={16}/>
                   </button>
                  ) : (
                    <>
                      <button 
                        onClick={() => openEdit(cls)}
                        className="p-2 bg-white text-blue-600 shadow-md rounded-lg hover:bg-blue-50 border border-gray-100" 
                        title="Edit Class"
                      >
                        <Edit2 size={16}/>
                      </button>
                      <button 
                        onClick={() => handleCancel(cls.class_id)}
                        className="p-2 bg-white text-orange-600 shadow-md rounded-lg hover:bg-orange-50 border border-gray-100" 
                        title="Cancel Class (Soft Delete)"
                      >
                        <Ban size={16}/>
                      </button>
                    </>
                  )}
                  
                  <button 
                    onClick={() => handleDelete(cls.class_id)}
                    className="p-2 bg-white text-red-600 shadow-md rounded-lg hover:bg-red-50 border border-gray-100" 
                    title="Permanently Delete"
                  >
                    <Trash2 size={16}/>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* --- MODAL --- */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setShowModal(false)}></div>
          <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-scale-up">
            
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{isEditing ? 'Edit Class' : 'Schedule New Class'}</h3>
                <p className="text-sm text-gray-500 mt-0.5">Manage weekly gym schedule</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                <X size={20}/>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              
              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Class Name</label>
                <input 
                  type="text" required placeholder="e.g. Yoga Sunrise"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium" 
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} 
                />
              </div>

              {/* Trainer */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Assign Trainer</label>
                <select 
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium appearance-none"
                  value={formData.trainer_id} onChange={e => setFormData({...formData, trainer_id: e.target.value})}
                  required
                >
                  <option value="" disabled>Select a Trainer</option>
                  {trainers.map(t => (
                    <option key={t.user_id} value={t.user_id}>{t.name} ({t.member_code})</option>
                  ))}
                </select>
              </div>

              {/* Day & Time Row */}
              <div className="grid grid-cols-2 gap-5">
                <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Day of Week</label>
                   <select 
                     className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                     value={formData.day_of_week} onChange={e => setFormData({...formData, day_of_week: e.target.value})}
                   >
                     {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(d => (
                       <option key={d}>{d}</option>
                     ))}
                   </select>
                </div>
                <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Start Time</label>
                   <input 
                    type="time" required
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                    value={formData.start_time} onChange={e => setFormData({...formData, start_time: e.target.value})} 
                   />
                </div>
              </div>

              {/* Duration & Capacity Row */}
              <div className="grid grid-cols-2 gap-5">
                <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Duration (min)</label>
                   <input 
                    type="number" min="15" step="15" required
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                    value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} 
                   />
                </div>
                <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Max Capacity</label>
                   <input 
                    type="number" min="1" required
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                    value={formData.capacity} onChange={e => setFormData({...formData, capacity: e.target.value})} 
                   />
                </div>
              </div>

              {/* Status Row (Only when Editing) */}
              {isEditing && (
                <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Status</label>
                   <select 
                     className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                     value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}
                   >
                     <option value="SCHEDULED">Scheduled</option>
                     <option value="CANCELLED">Cancelled</option>
                     <option value="COMPLETED">Completed</option>
                   </select>
                </div>
              )}

              <div className="pt-2">
                <button type="submit" className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transform transition hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2">
                  {isEditing ? <><Edit2 size={18}/> Save Changes</> : <><Plus size={18}/> Add to Schedule</>}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}