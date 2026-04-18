import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  User, Mail, Lock, Phone, UserPlus, Search, Hash, 
  UserCheck, Filter, Users 
} from 'lucide-react';

export default function RegisterMember() {
  const [activeTab, setActiveTab] = useState('REGISTER'); // 'REGISTER' | 'DIRECTORY'
  const [loading, setLoading] = useState(false);

  // --- REGISTER FORM STATE ---
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  });

  // --- DIRECTORY STATE ---
  const [members, setMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingMembers, setLoadingMembers] = useState(false);

  // --- FETCH MEMBERS (On Tab Change) ---
  useEffect(() => {
    if (activeTab === 'DIRECTORY' && members.length === 0) {
      fetchMembers();
    }
  }, [activeTab]);

  const fetchMembers = async () => {
    setLoadingMembers(true);
    try {
      const res = await api.get('/admin/members');
      setMembers(res.data);
    } catch (error) {
      toast.error("Failed to load directory");
    } finally {
      setLoadingMembers(false);
    }
  };

  // --- REGISTER HANDLER ---
  const handleRegister = async (e) => {
    e.preventDefault();
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
        return toast.error("Please enter a valid email address");
    }
    
    if (formData.phone && formData.phone.length !== 10) {
        return toast.error("Phone number must be exactly 10 digits");
    }

    setLoading(true);
    try {
      await api.post('/admin/members', formData);
      toast.success("Member registered successfully!");
      setFormData({ name: '', email: '', phone: '', password: '' });
      
      // Refresh directory if already loaded
      if (members.length > 0) fetchMembers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  // --- FILTER LOGIC ---
  const filteredMembers = members.filter(member => {
    const term = searchTerm.toLowerCase();
    return (
      member.name?.toLowerCase().includes(term) ||
      member.email?.toLowerCase().includes(term) ||
      (member.member_code && member.member_code.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto pb-20">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Users className="text-blue-600" size={28} /> Member Management
          </h1>
          <p className="text-gray-500">Register new walk-ins or search existing members.</p>
        </div>

        {/* TABS */}
        <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
          <button
            onClick={() => setActiveTab('REGISTER')}
            className={`px-6 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'REGISTER' 
                ? 'bg-slate-900 text-white shadow-md' 
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <UserPlus size={16} /> New Registration
          </button>
          <button
            onClick={() => setActiveTab('DIRECTORY')}
            className={`px-6 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'DIRECTORY' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <Search size={16} /> Member Directory
          </button>
        </div>
      </div>

      {/* ==================== TAB 1: REGISTER FORM ==================== */}
      {activeTab === 'REGISTER' && (
        <div className="max-w-2xl mx-auto mt-8">
          <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100 relative overflow-hidden">
            {/* Decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -mr-8 -mt-8 opacity-50"></div>

            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2 relative z-10">
              <UserPlus className="text-blue-500" size={24} /> Create New Account
            </h2>

            <form onSubmit={handleRegister} className="space-y-6 relative z-10">
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
                  <input 
                    type="text" required
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
                    <input 
                      type="email" required
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
                    <input 
                      type="tel" required
                      maxLength="10"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      placeholder="0771234567"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10)})}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Initial Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
                  <input 
                    type="text" required
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="Set a temporary password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                  />
                </div>
              </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-200 active:scale-95"
                >
                  {loading ? 'Registering...' : 'Create Member Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== TAB 2: DIRECTORY ==================== */}
      {activeTab === 'DIRECTORY' && (
        <div className="space-y-6">
          
          {/* Search Bar */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
             <Search className="text-gray-400 ml-2" />
             <input 
                type="text" 
                placeholder="Search by Name, Email, or Member ID..." 
                className="w-full p-2 outline-none font-medium text-gray-700"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
             />
          </div>

          {/* Members Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {loadingMembers ? (
               <div className="p-10 text-center text-gray-400">Loading Directory...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-gray-500 font-bold text-xs uppercase tracking-wider border-b border-gray-100">
                    <tr>
                      <th className="p-5">Member Details</th>
                      <th className="p-5">Contact</th>
                      <th className="p-5">ID Code</th>
                      <th className="p-5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredMembers.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="p-12 text-center text-gray-400">
                          <div className="flex flex-col items-center gap-2">
                            <Filter size={40} className="text-gray-200" />
                            <p>No members found.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredMembers.map((member) => (
                        <tr key={member.user_id} className="hover:bg-gray-50 transition-colors">
                          <td className="p-5">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm">
                                {member.name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-bold text-gray-900">{member.name}</p>
                                <p className="text-xs text-gray-500">Joined: {new Date(member.created_at).toLocaleDateString()}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-5 text-sm text-gray-600">
                             <div className="flex items-center gap-2"><Mail size={12}/> {member.email}</div>
                             {member.phone && <div className="flex items-center gap-2 mt-1"><Phone size={12}/> {member.phone}</div>}
                          </td>
                          <td className="p-5">
                            <div className="flex items-center gap-2">
                              <Hash size={14} className="text-gray-400" />
                              <span className="font-mono font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded text-xs">
                                {member.member_code || 'N/A'}
                              </span>
                            </div>
                          </td>
                          <td className="p-5">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">
                              <UserCheck size={12} /> Active
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
            
            <div className="p-4 border-t border-gray-100 bg-gray-50 text-xs text-gray-500 flex justify-between">
               <span>Showing {filteredMembers.length} results</span>
               <span>Total Database: {members.length}</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}