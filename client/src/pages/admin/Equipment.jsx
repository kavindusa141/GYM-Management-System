import { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  Wrench, Plus, Trash2, Edit2, CheckCircle, AlertTriangle, XCircle, X, Search, Filter, Activity
} from 'lucide-react';

export default function Equipment() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

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

  // --- DERIVED DATA (Stats & Filtering) ---
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'All' || item.category === filterCategory;
      const matchesStatus = filterStatus === 'All' || item.status === filterStatus;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [items, searchTerm, filterCategory, filterStatus]);

  const stats = useMemo(() => {
    return {
      total: items.length,
      operational: items.filter(i => i.status === 'Operational').length,
      maintenance: items.filter(i => i.status === 'Maintenance').length,
      broken: items.filter(i => i.status === 'Out of Order').length,
    };
  }, [items]);

  // --- ACTIONS ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await api.put(`/equipment/${formData.id}`, formData);
        toast.success("Equipment updated successfully");
      } else {
        await api.post('/equipment', formData);
        toast.success("New equipment added");
      }
      setShowModal(false);
      fetchEquipment();
      resetForm();
    } catch (error) {
      console.error(error);
      toast.error("Operation failed. Please check server logs.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to permanently remove this item?")) return;
    try {
      await api.delete(`/equipment/${id}`);
      toast.success("Item removed from inventory");
      setItems(items.filter(i => i.equipment_id !== id));
    } catch (error) {
      toast.error("Could not delete item");
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
    setFormData({ 
      id: null, 
      name: '', 
      category: 'Strength', 
      status: 'Operational', 
      purchase_date: new Date().toISOString().split('T')[0], // Default today
      last_maintenance: new Date().toISOString().split('T')[0] 
    });
    setIsEditing(false);
  };

  // --- HELPERS ---
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Operational': 
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200"><CheckCircle size={12}/> Operational</span>;
      case 'Maintenance': 
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200"><Wrench size={12}/> Maintenance</span>;
      default: 
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200"><XCircle size={12}/> Out of Order</span>;
    }
  };

  const checkMaintenanceHealth = (dateString) => {
    if (!dateString) return null;
    const lastDate = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today - lastDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 180) { // 6 months alert
      return (
        <div className="group relative flex items-center text-amber-600">
           <AlertTriangle size={16} />
           {/* FIX: Use &gt; for the greater than symbol */}
           <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-2 py-1 bg-gray-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity">
             Overdue (&gt;6 months)
           </span>
        </div>
      );
    }
    return <span className="text-emerald-500"><CheckCircle size={16} /></span>;
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      
      {/* HEADER & STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Activity size={24}/></div>
          <div><p className="text-sm text-gray-500 font-bold">Total Assets</p><p className="text-2xl font-black text-gray-800">{stats.total}</p></div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><CheckCircle size={24}/></div>
          <div><p className="text-sm text-gray-500 font-bold">Operational</p><p className="text-2xl font-black text-gray-800">{stats.operational}</p></div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><Wrench size={24}/></div>
          <div><p className="text-sm text-gray-500 font-bold">In Service</p><p className="text-2xl font-black text-gray-800">{stats.maintenance}</p></div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-red-50 text-red-600 rounded-xl"><AlertTriangle size={24}/></div>
          <div><p className="text-sm text-gray-500 font-bold">Broken</p><p className="text-2xl font-black text-gray-800">{stats.broken}</p></div>
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
              placeholder="Search equipment..." 
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filters */}
          <select 
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="All">All Categories</option>
            <option value="Strength">Strength</option>
            <option value="Cardio">Cardio</option>
            <option value="Accessories">Accessories</option>
            <option value="Other">Other</option>
          </select>

          <select 
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="Operational">Operational</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Out of Order">Out of Order</option>
          </select>
        </div>

        <button 
          onClick={() => { resetForm(); setShowModal(true); }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-500/30 active:scale-95 transition-all"
        >
          <Plus size={20} /> Add Equipment
        </button>
      </div>

      {/* DATA TABLE */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Equipment Details</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Last Service</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan="4" className="p-8 text-center text-gray-500">Loading inventory...</td></tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-12 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <Filter size={48} className="mb-2 opacity-20"/>
                      <p>No equipment matches your filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.equipment_id} className="hover:bg-blue-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-gray-900">{item.name}</p>
                        <p className="text-xs font-medium text-gray-500 bg-gray-100 inline-block px-2 py-0.5 rounded mt-1">{item.category}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(item.status)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {checkMaintenanceHealth(item.last_maintenance)}
                        <div>
                          <p className="text-sm font-medium text-gray-900">{item.last_maintenance || 'N/A'}</p>
                          <p className="text-xs text-gray-400">
                             {item.last_maintenance ? new Date(item.last_maintenance).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : ''}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(item)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors" title="Edit">
                          <Edit2 size={16}/>
                        </button>
                        <button onClick={() => handleDelete(item.equipment_id)} className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors" title="Delete">
                          <Trash2 size={16}/>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODAL (Modernized) --- */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setShowModal(false)}></div>
          <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-scale-up">
            
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{isEditing ? 'Edit Equipment' : 'Add New Equipment'}</h3>
                <p className="text-sm text-gray-500 mt-0.5">Fill in the details below</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                <X size={20}/>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Equipment Name</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. Treadmill 3000"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-blue-500 outline-none transition-all font-medium" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Category</label>
                  <div className="relative">
                    <select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none appearance-none font-medium"
                      value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                      <option>Strength</option>
                      <option>Cardio</option>
                      <option>Accessories</option>
                      <option>Other</option>
                    </select>
                    <Filter size={16} className="absolute right-3 top-3.5 text-gray-400 pointer-events-none"/>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Status</label>
                  <div className="relative">
                    <select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none appearance-none font-medium"
                      value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                      <option value="Operational">Operational</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Out of Order">Out of Order</option>
                    </select>
                    <Activity size={16} className="absolute right-3 top-3.5 text-gray-400 pointer-events-none"/>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Purchase Date</label>
                   <input 
                    type="date" 
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-700 font-medium"
                    value={formData.purchase_date} 
                    onChange={e => setFormData({...formData, purchase_date: e.target.value})} 
                   />
                </div>
                <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Last Service</label>
                   <input 
                    type="date" 
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-700 font-medium"
                    value={formData.last_maintenance} 
                    onChange={e => setFormData({...formData, last_maintenance: e.target.value})} 
                   />
                </div>
              </div>

              <div className="pt-2">
                <button type="submit" className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transform transition hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2">
                  {isEditing ? <><Edit2 size={18}/> Save Changes</> : <><Plus size={18}/> Add to Inventory</>}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
}