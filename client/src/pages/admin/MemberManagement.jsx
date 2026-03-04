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

  // NEW: Pagination State
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1, totalRecords: 0 });
  const [summary, setSummary] = useState({ ALL: 0, ACTIVE_SUB: 0, EXPIRED_SUB: 0, NO_PLAN: 0, PENDING_VERIFICATION: 0 });

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMembers();
    }, 500); // 500ms debounce to prevent API spam while typing
    return () => clearTimeout(timer);
  }, [searchTerm, filterType, page]);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/members', {
        params: { page, limit: 10, search: searchTerm, filter: filterType }
      });
      setMembers(res.data.members);
      setPagination(res.data.pagination);

      if (res.data.summary && Object.keys(res.data.summary).length > 0) {
        setSummary(res.data.summary);
      }
    } catch (error) {
      toast.error("Failed to load members");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPage(1); // Reset to page 1 on new search
  };

  const handleFilterChange = (type) => {
    setFilterType(type);
    setPage(1); // Reset to page 1 on new filter
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
          count={summary.ALL || 0}
          active={filterType === 'ALL'}
          onClick={() => handleFilterChange('ALL')}
        />
        <FilterTab
          label="Active Plan"
          count={summary.ACTIVE_SUB || 0}
          active={filterType === 'ACTIVE_SUB'}
          onClick={() => handleFilterChange('ACTIVE_SUB')}
          color="green"
        />
        <FilterTab
          label="Expired Plan"
          count={summary.EXPIRED_SUB || 0}
          active={filterType === 'EXPIRED_SUB'}
          onClick={() => handleFilterChange('EXPIRED_SUB')}
          color="red"
        />
        <FilterTab
          label="No Plan"
          count={summary.NO_PLAN || 0}
          active={filterType === 'NO_PLAN'}
          onClick={() => handleFilterChange('NO_PLAN')}
          color="gray"
        />
        <FilterTab
          label="Unverified"
          count={summary.PENDING_VERIFICATION || 0}
          active={filterType === 'PENDING_VERIFICATION'}
          onClick={() => handleFilterChange('PENDING_VERIFICATION')}
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
          onChange={handleSearchChange}
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
                <tr><td colSpan="5" className="p-10 text-center text-gray-400">Loading Members...</td></tr>
              ) : members.length === 0 ? (
                <tr><td colSpan="5" className="p-10 text-center text-gray-400">No members found matching your criteria.</td></tr>
              ) : (
                members.map(member => (
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

        {/* SERVER-SIDE PAGINATION CONTROLS */}
        {!loading && pagination.totalPages > 1 && (
          <div className="p-5 border-t border-gray-100 flex items-center justify-between text-sm bg-gray-50/50">
            <span className="text-gray-500">
              Showing <span className="font-bold text-gray-900">{members.length}</span> of <span className="font-bold text-gray-900">{pagination.totalRecords}</span> matching members
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-white border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-100 transition-colors font-medium text-gray-700 shadow-sm"
              >
                Previous
              </button>

              <div className="px-4 py-2 bg-blue-50 text-blue-700 font-bold rounded-lg border border-blue-100 shadow-sm">
                Page {page} of {pagination.totalPages}
              </div>

              <button
                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
                className="px-4 py-2 bg-white border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-100 transition-colors font-medium text-gray-700 shadow-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}
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

