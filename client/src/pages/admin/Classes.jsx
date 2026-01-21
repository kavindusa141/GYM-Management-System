import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  Calendar, Clock, User, Trash2, Plus, X 
} from 'lucide-react';

export default function Classes() {
  const [classes, setClasses] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form Data
  const [formData, setFormData] = useState({
    name: '',
    trainer_id: '',
    day_of_week: 'Monday',
    start_time: '',
    duration: 60,
    capacity: 20
  });

  // Fetch Data
  const fetchData = async () => {
    try {
      const [classRes, trainerRes] = await Promise.all([
        api.get('/classes'),
        api.get('/admin/trainers')
      ]);
      setClasses(classRes.data);
      setTrainers(trainerRes.data);
    } catch (error) {
      toast.error("Failed to load schedule");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Submit Class
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/classes', formData);
      toast.success("Class scheduled!");
      setShowModal(false);
      fetchData();
      setFormData({ name: '', trainer_id: '', day_of_week: 'Monday', start_time: '', duration: 60, capacity: 20 });
    } catch (error) {
      toast.error("Failed to create class");
    }
  };

  // Delete Class
  const handleDelete = async (id) => {
    if(!window.confirm("Remove this class from the schedule?")) return;
    try {
      await api.delete(`/classes/${id}`);
      toast.success("Class removed");
      setClasses(classes.filter(c => c.class_id !== id));
    } catch (error) {
      toast.error("Failed to delete");
    }
  };

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div className="space-y-6 animate-fade-in">
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Weekly Schedule</h1>
          <p className="text-gray-500">Manage gym classes and trainer assignments.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-lg transition-transform active:scale-95"
        >
          <Plus className="w-5 h-5" /> Schedule Class
        </button>
      </div>

      {/* --- SCHEDULE GRID --- */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <p className="text-gray-500">Loading schedule...</p>
        ) : classes.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-dashed border-gray-300">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No classes scheduled yet.</p>
            <button onClick={() => setShowModal(true)} className="text-blue-600 text-sm mt-2 hover:underline">Add your first class</button>
          </div>
        ) : (
          classes.map((cls) => (
            <div key={cls.class_id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative hover:shadow-md transition-all group">
              
              <button onClick={() => handleDelete(cls.class_id)} 
                className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-2 hover:bg-red-50 rounded-full">
                <Trash2 className="w-5 h-5" />
              </button>

              <div className="flex items-start justify-between mb-4">
                <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wide">
                  {cls.day_of_week}
                </span>
                <span className="flex items-center gap-1 text-sm font-bold text-gray-900">
                  <Clock className="w-4 h-4 text-gray-400" />
                  {cls.start_time.slice(0, 5)}
                </span>
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-2">{cls.name}</h3>

              <div className="space-y-2 pt-2 border-t border-gray-50 mt-4">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <User className="w-4 h-4 text-purple-500" />
                  <span className="font-medium">Trainer: {cls.Trainer?.name}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span>{cls.duration} min • {cls.capacity} spots</span>
                </div>
              </div>

            </div>
          ))
        )}
      </div>

      {/* --- IMPROVED MODAL (Wider & Grid Layout) --- */}
      {showModal && (
        <div className="fixed inset-0 z-[100] overflow-y-auto">
          <div 
            className="fixed inset-0 bg-gray-900/60 backdrop-blur-md transition-opacity"
            onClick={() => setShowModal(false)}
          ></div>

          <div className="flex min-h-full items-center justify-center p-4">
            {/* CHANGED: max-w-2xl makes it wider */}
            <div className="relative w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all border border-gray-100">
              
              {/* Header */}
              <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Schedule New Class</h3>
                  <p className="text-xs text-gray-500 mt-1">Create a new session and assign a trainer.</p>
                </div>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-200 transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              {/* Form - Uses Grid for compact layout */}
              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                
                {/* Row 1: Name & Trainer (Side by Side) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Class Name</label>
                    <input type="text" placeholder="e.g. Advanced HIIT" required
                      className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-gray-50 focus:bg-white"
                      value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Assign Trainer</label>
                    <select required 
                      className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white"
                      value={formData.trainer_id}
                      onChange={(e) => setFormData({...formData, trainer_id: e.target.value})}
                    >
                      <option value="">-- Select Trainer --</option>
                      {trainers.map(t => (
                        <option key={t.user_id} value={t.user_id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Row 2: Day & Time (Side by Side) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Day of Week</label>
                    <select 
                      className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white"
                      value={formData.day_of_week}
                      onChange={(e) => setFormData({...formData, day_of_week: e.target.value})}
                    >
                      {days.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Start Time</label>
                    <input type="time" required
                      className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white"
                      value={formData.start_time}
                      onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                    />
                  </div>
                </div>

                {/* Row 3: Duration & Capacity (Smaller inputs) */}
                <div className="grid grid-cols-2 gap-6">
                   <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Duration (min)</label>
                    <input type="number" required placeholder="60"
                      className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white"
                      value={formData.duration}
                      onChange={(e) => setFormData({...formData, duration: e.target.value})}
                    />
                  </div>
                   <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Capacity</label>
                    <input type="number" required placeholder="20"
                      className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white"
                      value={formData.capacity}
                      onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                    />
                  </div>
                </div>

                {/* Footer Action */}
                <div className="pt-4 border-t border-gray-50 flex justify-end gap-3">
                  <button type="button" onClick={() => setShowModal(false)} 
                    className="px-6 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors">
                    Cancel
                  </button>
                  <button type="submit" 
                    className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-transform active:scale-95">
                    Save Schedule
                  </button>
                </div>

              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}