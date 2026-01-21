import { useEffect, useState } from 'react';
import api from '../../services/api';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Trash2, Plus, Calendar, Clock, User } from 'lucide-react';

export default function ManageClasses() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const { data } = await api.get('/classes');
      setClasses(data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Are you sure you want to cancel this class?")) return;
    try {
      await api.delete(`/classes/${id}`);
      toast.success('Class cancelled');
      fetchClasses(); // Refresh list
    } catch (error) {
      toast.error('Failed to delete class');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Class Schedule</h1>
        <Link 
          to="/admin/create-class" 
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Schedule New Class
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-500 font-semibold border-b">
            <tr>
              <th className="p-4">Title</th>
              <th className="p-4">Date & Time</th>
              <th className="p-4">Trainer ID</th>
              <th className="p-4">Capacity</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {classes.length === 0 ? (
              <tr><td colSpan="5" className="p-8 text-center text-gray-500">No classes scheduled.</td></tr>
            ) : (
              classes.map((cls) => (
                <tr key={cls.class_id} className="hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-900">{cls.title}</td>
                  <td className="p-4 text-gray-600">
                    <div className="flex flex-col text-sm">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/> {new Date(cls.class_date).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> {cls.start_time} - {cls.end_time}</span>
                    </div>
                  </td>
                  <td className="p-4 text-gray-600 flex items-center gap-2">
                    <User className="w-4 h-4"/> {cls.trainer_id}
                  </td>
                  <td className="p-4 text-gray-600">
                     {cls.bookedCount || 0} / {cls.capacity}
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => handleDelete(cls.class_id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-full transition"
                      title="Cancel Class"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}