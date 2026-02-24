import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  Search, UserPlus, Trash2, Mail, Phone,
  CheckCircle, Clock, X, Loader2, Eye, User, Lock // Added Icons
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function MemberManagement() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  // Removed showAddModal state

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
    if (!window.confirm("Are you sure? This will soft-delete the member.")) return;
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
        <Link
          to="new"
          className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-500/30 active:scale-95 transition-all"
        >
          <UserPlus size={20} /> Add Member
        </Link>
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
                          <Mail size={12} /> {member.email}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <Phone size={12} /> {member.phone}
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
                    <td className="p-5 text-right flex justify-end gap-2">
                      <Link
                        to={`${member.user_id}`}
                        className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                        title="View Profile"
                      >
                        <Eye size={18} />
                      </Link>
                      <button
                        onClick={() => handleDelete(member.user_id)}
                        className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                        title="Delete Member"
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
      className={`p-3 rounded-xl border transition-all flex flex-col items-center justify-center gap-1 ${active
        ? `${activeClasses[color]} shadow-lg border-transparent`
        : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
        }`}
    >
      <span className={`text-xl font-black ${active ? 'text-white' : 'text-gray-900'}`}>{count}</span>
      <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
    </button>
  );
}

