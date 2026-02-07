import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  ClipboardList, Edit, Trash2, Search, User, Dumbbell, Globe
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function ManagePlans() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const memberIdParam = searchParams.get('memberId');

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('assigned'); // 'assigned' | 'common'

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const res = await api.get('/workouts/trainer/my-plans');
      setPlans(res.data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load plans");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this plan?")) return;
    try {
      await api.delete(`/workouts/${id}`);
      toast.success("Deleted!");
      setPlans(plans.filter(p => p.plan_id !== id));
    } catch (error) {
      toast.error("Failed to delete");
    }
  };

  // Safe Filtering
  const filteredPlans = plans.filter(plan => {
    const isCommon = plan.is_common;
    const matchesFilter = filter === 'common' ? isCommon : !isCommon;

    const planName = plan.name?.toLowerCase() || '';
    const memberName = plan.Member?.name?.toLowerCase() || '';
    const search = searchTerm.toLowerCase();

    // For common plans, we only search by plan name since there is no member
    const matchesSearch = isCommon ? planName.includes(search) : (planName.includes(search) || memberName.includes(search));

    const matchesMemberParam = memberIdParam ? plan.member_id === parseInt(memberIdParam) : true;

    return matchesFilter && matchesSearch && matchesMemberParam;
  });

  const clearMemberFilter = () => {
    setSearchParams({});
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">

      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <ClipboardList className="text-blue-600" size={28} /> Workout Management
          </h1>
          <p className="text-gray-500">View and manage assigned routines.</p>
          {memberIdParam && (
            <div className="mt-2 flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-sm font-bold w-fit">
              <span>Filtering by Member ID: {memberIdParam}</span>
              <button onClick={clearMemberFilter} className="hover:text-blue-900"><Trash2 size={14} /></button>
            </div>
          )}
        </div>
        <button
          onClick={() => navigate('/trainer/create-plan')}
          className="px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20"
        >
          + Assign New Plan
        </button>
      </div>

      {/* TABS & SEARCH */}
      <div className="flex flex-col gap-4">

        {/* TABS */}
        <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
          <button
            onClick={() => setFilter('assigned')}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${filter === 'assigned' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Assigned Plans
          </button>
          <button
            onClick={() => setFilter('common')}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${filter === 'common' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Globe size={14} /> Common Plans
          </button>
        </div>

        {/* SEARCH BAR */}
        <div className="relative">
          <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
          <input
            type="text"
            placeholder={filter === 'common' ? "Search by plan name..." : "Search by plan name or client..."}
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* PLANS LIST */}
      {loading ? (
        <div className="text-center py-10 text-gray-400">Loading plans...</div>
      ) : filteredPlans.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl">
          <p className="text-gray-500">No {filter} plans found.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredPlans.map(plan => (
            <div key={plan.plan_id} className={`p-5 rounded-2xl shadow-sm border hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${plan.is_common ? 'bg-indigo-50/20 border-indigo-100' : 'bg-white border-gray-100'}`}>

              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${plan.is_common ? 'bg-indigo-100 text-indigo-600' : 'bg-blue-50 text-blue-600'}`}>
                  {plan.is_common ? <Globe size={24} /> : <Dumbbell size={24} />}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900">{plan.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                    {/* MEMBER NAME OR COMMON LABEL */}
                    {plan.is_common ? (
                      <span className="flex items-center gap-1 font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-xs">
                        <Globe size={12} /> Common Plan
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 font-medium text-gray-700">
                        <User size={14} />
                        {plan.Member ? `${plan.Member.name} (${plan.Member.member_code})` : 'Unknown Client'}
                      </span>
                    )}

                    <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-bold text-gray-600">
                      {plan.WorkoutExercises?.length || 0} Exercises
                    </span>
                  </div>

                  {/* Audit Info for Common Plans */}
                  {plan.is_common && (
                    <div className="mt-3 text-xs text-gray-400 space-y-1">
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-gray-500">Created by:</span>
                        {plan.Trainer?.name || 'Unknown'}
                        <span className="opacity-70">({plan.Trainer?.member_code || 'N/A'})</span>
                      </div>
                      {plan.Updater && (
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-orange-500">Updated by:</span>
                          {plan.Updater.name}
                          <span className="opacity-70">({plan.Updater.member_code})</span>
                          <span className="opacity-50">• {new Date(plan.updated_at || plan.updatedAt).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <button
                  onClick={() => navigate(`/trainer/edit-plan/${plan.plan_id}`)}
                  className="flex-1 md:flex-none px-4 py-2 bg-blue-50 text-blue-700 font-bold rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
                >
                  <Edit size={16} /> Edit
                </button>
                <button
                  onClick={() => handleDelete(plan.plan_id)}
                  className="px-4 py-2 bg-red-50 text-red-600 font-bold rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center"
                >
                  <Trash2 size={18} />
                </button>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}