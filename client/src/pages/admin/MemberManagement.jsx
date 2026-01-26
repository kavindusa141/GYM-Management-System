import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  Search, UserPlus, Trash2, Mail, Phone, 
  CheckCircle, Clock, X, Loader2
} from 'lucide-react';

export default function MemberManagement() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false); // <--- State for Modal

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const res = await api.get('/admin/members');
      setMembers(res.data);
    } catch (error) {
      toast.error("Failed to load members");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Are you sure? This will soft-delete the member.")) return;
    try {
      await api.delete(`/admin/members/${id}`);
      toast.success("Member removed");
      fetchMembers();
    } catch (err) {
      toast.error("Failed to delete member");
    }
  };

  // --- FILTER LOGIC ---
  const filteredMembers = members.filter(member => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      member.name.toLowerCase().includes(searchLower) || 
      member.email.toLowerCase().includes(searchLower) || 
      (member.member_code && member.member_code.toLowerCase().includes(searchLower));

    let matchesCategory = true;
    if (filterType === 'ACTIVE_SUB') matchesCategory = member.subscription_status === 'ACTIVE';
    else if (filterType === 'EXPIRED_SUB') matchesCategory = member.subscription_status === 'EXPIRED';
    else if (filterType === 'PENDING_VERIFICATION') matchesCategory = member.is_verified === false;
    else if (filterType === 'NO_PLAN') matchesCategory = member.subscription_status === 'NO_PLAN';

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-20 relative">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Member Management</h1>
          <p className="text-gray-500">Manage accounts, subscriptions, and verifications.</p>
        </div>
        {/* BUTTON NOW OPENS MODAL */}
        <button 
           className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-500/30 active:scale-95 transition-all"
           onClick={() => setShowAddModal(true)}
        >
          <UserPlus size={20} /> Add Member
        </button>
      </div>

      {/* FILTERS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <FilterTab 
          label="All Members" 
          count={members.length} 
          active={filterType === 'ALL'} 
          onClick={() => setFilterType('ALL')} 
        />
        <FilterTab 
          label="Active Plan" 
          count={members.filter(m => m.subscription_status === 'ACTIVE').length} 
          active={filterType === 'ACTIVE_SUB'} 
          onClick={() => setFilterType('ACTIVE_SUB')}
          color="green"
        />
        <FilterTab 
          label="Expired Plan" 
          count={members.filter(m => m.subscription_status === 'EXPIRED').length} 
          active={filterType === 'EXPIRED_SUB'} 
          onClick={() => setFilterType('EXPIRED_SUB')}
          color="red"
        />
        <FilterTab 
          label="No Plan" 
          count={members.filter(m => m.subscription_status === 'NO_PLAN').length} 
          active={filterType === 'NO_PLAN'} 
          onClick={() => setFilterType('NO_PLAN')}
          color="gray"
        />
        <FilterTab 
          label="Unverified" 
          count={members.filter(m => !m.is_verified).length} 
          active={filterType === 'PENDING_VERIFICATION'} 
          onClick={() => setFilterType('PENDING_VERIFICATION')}
          color="orange"
        />
      </div>

      {/* SEARCH */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input 
          type="text" 
          placeholder="Search by Name, Email or Member ID..." 
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 font-bold text-xs uppercase tracking-wider border-b border-gray-100">
              <tr>
                <th className="p-5">Member</th>
                <th className="p-5">Contact</th>
                <th className="p-5">Status</th>
                <th className="p-5">Membership</th>
                <th className="p-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan="5" className="p-10 text-center text-gray-400">Loading...</td></tr>
              ) : filteredMembers.length === 0 ? (
                <tr><td colSpan="5" className="p-10 text-center text-gray-400">No members found.</td></tr>
              ) : (
                filteredMembers.map(member => (
                  <tr key={member.user_id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center font-bold">
                          {member.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{member.name}</p>
                          <p className="text-xs text-gray-500 font-mono">{member.member_code || 'No ID'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                           <Mail size={12}/> {member.email}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                           <Phone size={12}/> {member.phone}
                        </div>
                      </div>
                    </td>
                    <td className="p-5">
                      {member.is_verified ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                          <CheckCircle size={12} /> Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                          <Clock size={12} /> Pending
                        </span>
                      )}
                    </td>
                    <td className="p-5">
                      <div className="space-y-1">
                        {member.subscription_status === 'ACTIVE' && (
                          <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md">
                            Active: {member.current_plan}
                          </span>
                        )}
                        {member.subscription_status === 'EXPIRED' && (
                          <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-md">
                            Expired: {member.current_plan}
                          </span>
                        )}
                        {member.subscription_status === 'NO_PLAN' && (
                          <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                            No Plan
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-5 text-right">
                      <button 
                        onClick={() => handleDelete(member.user_id)}
                        className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- ADD MEMBER MODAL --- */}
      {showAddModal && (
        <AddMemberModal 
          onClose={() => setShowAddModal(false)} 
          onSuccess={() => {
            setShowAddModal(false);
            fetchMembers();
          }} 
        />
      )}
    </div>
  );
}

// --- INTERNAL COMPONENTS ---

function FilterTab({ label, count, active, onClick, color = 'blue' }) {
  const activeClasses = {
    blue: 'bg-blue-600 text-white shadow-blue-500/30',
    green: 'bg-green-600 text-white shadow-green-500/30',
    red: 'bg-red-600 text-white shadow-red-500/30',
    orange: 'bg-orange-500 text-white shadow-orange-500/30',
    gray: 'bg-gray-600 text-white shadow-gray-500/30'
  };

  return (
    <button 
      onClick={onClick}
      className={`p-3 rounded-xl border transition-all flex flex-col items-center justify-center gap-1 ${
        active 
          ? `${activeClasses[color]} shadow-lg border-transparent` 
          : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
      }`}
    >
      <span className={`text-xl font-black ${active ? 'text-white' : 'text-gray-900'}`}>{count}</span>
      <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
    </button>
  );
}

// Modal Component
function AddMemberModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', password: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/admin/members', formData);
      toast.success("Member added successfully!");
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add member");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 relative">
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-black text-gray-900 mb-1">Add New Member</h2>
        <p className="text-sm text-gray-500 mb-6">Create a basic account. They can set up details later.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Full Name</label>
            <input 
              required
              type="text"
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
              placeholder="e.g. John Doe"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Email Address</label>
            <input 
              required
              type="email"
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
              placeholder="john@example.com"
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Phone Number</label>
            <input 
              required
              type="text"
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
              placeholder="077 123 4567"
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Initial Password</label>
            <input 
              required
              type="text" // Visible for admin to copy
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
              placeholder="Create a password"
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30 flex justify-center items-center gap-2 mt-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : <UserPlus size={20} />}
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}