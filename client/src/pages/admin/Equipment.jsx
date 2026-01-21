import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  Wrench, Plus, Trash2, Edit2, CheckCircle, AlertTriangle, XCircle, X
} from 'lucide-react';

export default function Equipment() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    id: null,
    name: '',
    category: 'Strength',
    status: 'Operational',
    purchase_date: '',
    last_maintenance: ''
  });

  useEffect(() => {
    fetchEquipment();
  }, []);

  const fetchEquipment = async () => {
    try {
      const res = await api.get('/equipment');
      setItems(res.data);
    } catch (error) {
      toast.error("Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await api.put(`/equipment/${formData.id}`, formData);
        toast.success("Equipment updated");
      } else {
        await api.post('/equipment', formData);
        toast.success("Equipment added");
      }
      setShowModal(false);
      fetchEquipment();
      resetForm();
    } catch (error) {
      toast.error("Operation failed");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this item permanently?")) return;
    try {
      await api.delete(`/equipment/${id}`);
      toast.success("Item removed");
      setItems(items.filter(i => i.equipment_id !== id));
    } catch (error) {
      toast.error("Delete failed");
    }
  };

  const openEdit = (item) => {
    setFormData({
      id: item.equipment_id,
      name: item.name,
      category: item.category,
      status: item.status,
      purchase_date: item.purchase_date,
      last_maintenance: item.last_maintenance
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({ id: null, name: '', category: 'Strength', status: 'Operational', purchase_date: '', last_maintenance: '' });
    setIsEditing(false);
  };

  // Helper for Status Badge
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Operational': return <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded text-xs font-bold"><CheckCircle size={12}/> Working</span>;
      case 'Maintenance': return <span className="flex items-center gap-1 text-orange-600 bg-orange-50 px-2 py-1 rounded text-xs font-bold"><Wrench size={12}/> Service</span>;
      default: return <span className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded text-xs font-bold"><XCircle size={12}/> Broken</span>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Equipment Inventory</h1>
          <p className="text-gray-500">Track machines and maintenance schedules.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setShowModal(true); }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg active:scale-95 transition-all"
        >
          <Plus size={20} /> Add Equipment
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs uppercase">
            <tr>
              <th className="px-6 py-4 font-bold">Equipment Name</th>
              <th className="px-6 py-4 font-bold">Category</th>
              <th className="px-6 py-4 font-bold">Status</th>
              <th className="px-6 py-4 font-bold">Last Service</th>
              <th className="px-6 py-4 text-right font-bold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan="5" className="p-10 text-center text-gray-500">Loading...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan="5" className="p-10 text-center text-gray-500">No equipment found.</td></tr>
            ) : (
              items.map((item) => (
                <tr key={item.equipment_id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-gray-900">{item.name}</td>
                  <td className="px-6 py-4 text-gray-500 text-sm">{item.category}</td>
                  <td className="px-6 py-4">{getStatusBadge(item.status)}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 font-mono">{item.last_maintenance}</td>
                  <td className="px-6 py-4 text-right flex justify-end gap-2">
                    <button onClick={() => openEdit(item)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={16}/></button>
                    <button onClick={() => handleDelete(item.equipment_id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16}/></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* --- MODAL --- */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
          <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl p-8">
            
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">{isEditing ? 'Edit Item' : 'Add New Item'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={24}/></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Equipment Name</label>
                <input type="text" required className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" 
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Category</label>
                  <select className="w-full p-3 border rounded-xl outline-none"
                    value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                    <option>Strength</option><option>Cardio</option><option>Accessories</option><option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Current Status</label>
                  <select className="w-full p-3 border rounded-xl outline-none"
                    value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                    <option value="Operational">Operational</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Out of Order">Out of Order</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-sm font-bold text-gray-700 mb-1">Purchase Date</label>
                   <input type="date" className="w-full p-3 border rounded-xl outline-none text-gray-500"
                    value={formData.purchase_date} onChange={e => setFormData({...formData, purchase_date: e.target.value})} />
                </div>
                <div>
                   <label className="block text-sm font-bold text-gray-700 mb-1">Last Maintenance</label>
                   <input type="date" className="w-full p-3 border rounded-xl outline-none text-gray-500"
                    value={formData.last_maintenance} onChange={e => setFormData({...formData, last_maintenance: e.target.value})} />
                </div>
              </div>

              <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg mt-4">
                {isEditing ? 'Save Changes' : 'Add Equipment'}
              </button>
            </form>

          </div>
        </div>
      )}
    </div>
  );
}