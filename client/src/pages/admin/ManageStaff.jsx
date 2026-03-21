import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  Users, Trash2, Plus, X, Briefcase, Mail, Phone, CheckCircle, Search, Filter 
} from 'lucide-react';

export default function ManageStaff() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // --- NEW: Search & Filter State ---
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('ALL'); // Options: 'ALL', 'TRAINER', 'STAFF'

  // Form State
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', password: '', role: 'TRAINER'
  });

  // Fetch Data
  const fetchEmployees = async () => {
    try {
      const res = await api.get('/admin/employees');
      setEmployees(res.data);
    } catch (error) {
      toast.error("Failed to load staff list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEmployees(); }, []);

  // --- NEW: Calculate Counts ---
  const trainerCount = employees.filter(e => e.role === 'TRAINER').length;
  const staffCount = employees.filter(e => e.role === 'STAFF').length;

  // --- NEW: Filter Logic ---
  const filteredEmployees = employees.filter(emp => {
    // 1. Filter by Role Tab
    const matchesRole = filterRole === 'ALL' || emp.role === filterRole;
    
    // 2. Filter by Search (Name, Email, or ID)
    const lowerSearch = searchTerm.toLowerCase();
    const matchesSearch = 
      emp.name.toLowerCase().includes(lowerSearch) ||
      emp.email.toLowerCase().includes(lowerSearch) ||
      (emp.member_code && emp.member_code.toLowerCase().includes(lowerSearch));

    return matchesRole && matchesSearch;
  });

  // Handle Create
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
        return toast.error("Please enter a valid email address");
    }
    
    if (formData.phone && formData.phone.length !== 10) {
        return toast.error("Phone number must be exactly 10 digits");
    }

    try {
      await api.post('/admin/employees', formData);
      toast.success(`${formData.role} added successfully!`);
      setShowModal(false);
      setFormData({ name: '', email: '', phone: '', password: '', role: 'TRAINER' });
      fetchEmployees();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add employee");
    }
  };

  // Handle Delete
  const handleDelete = async (id) => {
    if(!window.confirm("Are you sure? This user will be removed permanently.")) return;
    try {
      await api.delete(`/admin/users/${id}`);
      toast.success("User removed");
      setEmployees(employees.filter(e => e.user_id !== id));
    } catch (error) {
      toast.error("Failed to delete user");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
          <div className="flex gap-4 mt-2 text-sm">
            <span className="flex items-center gap-1.5 text-gray-600 bg-white px-3 py-1 rounded-full border border-gray-100 shadow-sm">
              <Briefcase className="w-4 h-4 text-purple-600" /> 
              Trainers: <b>{trainerCount}</b>
            </span>
            <span className="flex items-center gap-1.5 text-gray-600 bg-white px-3 py-1 rounded-full border border-gray-100 shadow-sm">
              <Users className="w-4 h-4 text-orange-600" /> 
              Staff: <b>{staffCount}</b>
            </span>
          </div>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-lg transition-transform active:scale-95"
        >
          <Plus className="w-5 h-5" /> Add Employee
        </button>
      </div>

      {/* --- Controls Bar (Search & Filter) --- */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center">
        
        {/* Search Input */}
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search by Name, ID (RFK...), or Email" 
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-transparent focus:bg-white border focus:border-blue-500 rounded-xl outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex p-1 bg-gray-100 rounded-xl w-full md:w-auto">
          {['ALL', 'TRAINER', 'STAFF'].map((role) => (
            <button
              key={role}
              onClick={() => setFilterRole(role)}
              className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                filterRole === role 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {role === 'ALL' ? 'All Members' : role === 'TRAINER' ? 'Trainers' : 'Staff'}
            </button>
          ))}
        </div>
      </div>

      {/* Employees Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <p className="text-gray-500 col-span-full text-center py-10">Loading team...</p>
        ) : filteredEmployees.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-dashed border-gray-300">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No matching team members found.</p>
            {searchTerm && <button onClick={() => setSearchTerm('')} className="text-blue-600 text-sm mt-2 hover:underline">Clear Search</button>}
          </div>
        ) : (
          filteredEmployees.map((emp) => (
            <div key={emp.user_id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative group hover:shadow-md transition-all">
              
              <button onClick={() => handleDelete(emp.user_id)} 
                className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                <Trash2 className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-4 mb-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-white text-xl shadow-md
                  ${emp.role === 'TRAINER' ? 'bg-gradient-to-br from-purple-500 to-indigo-600' : 'bg-gradient-to-br from-orange-400 to-red-500'}`}>
                  {emp.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">{emp.name}</h3>
                  
                  {/* ID Display */}
                  <p className="text-xs text-blue-600 font-mono font-bold mb-1.5 bg-blue-50 inline-block px-1.5 py-0.5 rounded">
                    {emp.member_code ? emp.member_code : `ID: ${emp.user_id}`}
                  </p>

                  <div className="flex">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide border
                      ${emp.role === 'TRAINER' 
                        ? 'bg-purple-50 text-purple-700 border-purple-100' 
                        : 'bg-orange-50 text-orange-700 border-orange-100'}`}>
                      {emp.role}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 text-sm text-gray-600 mt-4 pt-4 border-t border-gray-50">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-gray-100 rounded-lg"><Mail className="w-3.5 h-3.5 text-gray-500" /></div>
                  <span className="truncate">{emp.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-gray-100 rounded-lg"><Phone className="w-3.5 h-3.5 text-gray-500" /></div>
                  <span>{emp.phone || 'No phone number'}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* --- REDESIGNED MODAL (CENTERED & BLURRED) --- */}
      {showModal && (
        <div className="fixed inset-0 z-[100] overflow-y-auto">
          <div 
            className="fixed inset-0 bg-gray-900/60 backdrop-blur-md transition-opacity"
            onClick={() => setShowModal(false)}
          ></div>

          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all border border-gray-100">
              
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="text-lg font-bold text-gray-900">Add New Team Member</h3>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                
                {/* Role Selection */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Assign Role</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button"
                      onClick={() => setFormData({...formData, role: 'TRAINER'})}
                      className={`py-3 px-4 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                        formData.role === 'TRAINER' ? 'bg-purple-50 border-purple-500 text-purple-700 ring-1 ring-purple-500 shadow-sm' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <Briefcase className="w-4 h-4" /> Trainer
                    </button>
                    <button type="button"
                      onClick={() => setFormData({...formData, role: 'STAFF'})}
                      className={`py-3 px-4 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                        formData.role === 'STAFF' ? 'bg-orange-50 border-orange-500 text-orange-700 ring-1 ring-orange-500 shadow-sm' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <Users className="w-4 h-4" /> Staff
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input type="text" required 
                    className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                    value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" required 
                    className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                    value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input type="tel" required maxLength="10"
                    className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                    placeholder="0771234567"
                    value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10)})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input type="text" required placeholder="e.g. gym123"
                    className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-mono transition-all text-sm"
                    value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})}
                  />
                </div>

                <button type="submit" className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg mt-4 transition-all active:scale-95">
                  Create Account
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}