import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  Plus, X, CheckCircle, XCircle, User, Trash2, Edit 
} from 'lucide-react';

export default function ManageClasses() {
  const [classes, setClasses] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // New State for Editing
  const [editingId, setEditingId] = useState(null); 

  // Form Data
  const initialFormState = {
    name: '',
    trainer_id: '',
    day_of_week: 'Monday',
    start_time: '',
    duration: 60,
    capacity: 20
  };
  const [formData, setFormData] = useState(initialFormState);

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

  // Open Modal for Creating
  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData(initialFormState);
    setShowModal(true);
  };

  // Open Modal for Editing
  const handleOpenEdit = (cls) => {
    setEditingId(cls.class_id);
    setFormData({
      name: cls.name,
      trainer_id: cls.trainer_id,
      day_of_week: cls.day_of_week,
      start_time: cls.start_time.slice(0, 5), // Format HH:mm
      duration: cls.duration,
      capacity: cls.capacity
    });
    setShowModal(true);
  };

  // Submit Class (Create or Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        // UPDATE Existing
        await api.put(`/classes/${editingId}`, formData);
        toast.success("Class updated successfully!");
      } else {
        // CREATE New
        await api.post('/classes', formData);
        toast.success("Class scheduled!");
      }
      
      setShowModal(false);
      fetchData();
      setFormData(initialFormState);
    } catch (error) {
      toast.error(editingId ? "Failed to update class" : "Failed to create class");
    }
  };

  // Delete Class
  const handleDelete = async (id) => {
    if(!window.confirm("Permanently remove this class from the schedule?")) return;
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
          onClick={handleOpenCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-lg transition-transform active:scale-95"
        >
          <Plus className="w-5 h-5" /> Schedule Class
        </button>
      </div>

      {/* --- ADMIN SCHEDULE LIST --- */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-100 text-xs uppercase tracking-wider">
            <tr>
              <th className="p-4">Status</th>
              <th className="p-4">Day & Time</th>
              <th className="p-4">Class Details</th>
              <th className="p-4">Trainer</th>
              <th className="p-4">Capacity</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan="6" className="p-8 text-center text-gray-500">Loading schedule...</td></tr>
            ) : classes.length === 0 ? (
              <tr><td colSpan="6" className="p-8 text-center text-gray-500">No classes scheduled yet.</td></tr>
            ) : (
              classes.map((cls) => (
                <tr key={cls.class_id} className={`hover:bg-gray-50 transition-colors ${cls.status === 'CANCELLED' ? 'bg-red-50/10' : ''}`}>
                  <td className="p-4">
                    {cls.status === 'CANCELLED' ? (
                      <span className="inline-flex items-center gap-1 bg-red-100 text-red-600 px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wide border border-red-200">
                        <XCircle size={12} /> Cancelled
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wide border border-green-200">
                        <CheckCircle size={12} /> Scheduled
                      </span>
                    )}
                  </td>

                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-700">{cls.day_of_week}</span>
                      <span className="text-xs text-gray-500 font-mono">{cls.start_time.slice(0,5)}</span>
                    </div>
                  </td>

                  <td className="p-4">
                    <span className={`font-bold ${cls.status === 'CANCELLED' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                      {cls.name}
                    </span>
                    <div className="text-xs text-gray-500 mt-0.5">{cls.duration} mins</div>
                  </td>

                  <td className="p-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <User size={14} className="text-blue-500"/>
                      {cls.Trainer?.name || "Unassigned"}
                    </div>
                  </td>

                  <td className="p-4 text-sm text-gray-600">
                    {cls.capacity} spots
                  </td>

                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {/* EDIT BUTTON */}
                      <button 
                        onClick={() => handleOpenEdit(cls)}
                        className="text-gray-400 hover:text-blue-600 p-2 rounded-full hover:bg-blue-50 transition-colors"
                        title="Edit Class"
                      >
                        <Edit size={18} />
                      </button>

                      {/* DELETE BUTTON */}
                      <button 
                        onClick={() => handleDelete(cls.class_id)}
                        className="text-gray-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition-colors"
                        title="Permanently Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* --- MODAL --- */}
      {showModal && (
        <div className="fixed inset-0 z-[100] overflow-y-auto">
          <div 
            className="fixed inset-0 bg-gray-900/60 backdrop-blur-md transition-opacity"
            onClick={() => setShowModal(false)}
          ></div>

          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all border border-gray-100">
              
              <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {editingId ? "Edit Class Details" : "Schedule New Class"}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {editingId ? "Update existing session information." : "Create a new session and assign a trainer."}
                  </p>
                </div>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-200 transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                
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

                <div className="pt-4 border-t border-gray-50 flex justify-end gap-3">
                  <button type="button" onClick={() => setShowModal(false)} 
                    className="px-6 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors">
                    Cancel
                  </button>
                  <button type="submit" 
                    className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-transform active:scale-95">
                    {editingId ? "Update Schedule" : "Save Schedule"}
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