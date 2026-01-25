import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  ClipboardList, Edit, Trash2, Search, User, Dumbbell 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ManagePlans() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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
    const planName = plan.name?.toLowerCase() || '';
    const memberName = plan.Member?.name?.toLowerCase() || ''; // Access nested User data
    const search = searchTerm.toLowerCase();
    return planName.includes(search) || memberName.includes(search);
  });

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <ClipboardList className="text-blue-600" size={28} /> Workout Management
          </h1>
          <p className="text-gray-500">View and manage assigned routines.</p>
        </div>
        <button 
          onClick={() => navigate('/trainer/create-plan')}
          className="px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20"
        >
          + Assign New Plan
        </button>
      </div>

      {/* SEARCH BAR */}
      <div className="relative">
        <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
        <input 
          type="text" 
          placeholder="Search by plan name or client..." 
          className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* PLANS LIST */}
      {loading ? (
        <div className="text-center py-10 text-gray-400">Loading plans...</div>
      ) : filteredPlans.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl">
          <p className="text-gray-500">No matching plans found.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredPlans.map(plan => (
            <div key={plan.plan_id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                  <Dumbbell size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900">{plan.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                    {/* SAFE ACCESS TO MEMBER NAME */}
                    <span className="flex items-center gap-1 font-medium text-gray-700">
                      <User size={14}/> 
                      {plan.Member ? `${plan.Member.name} (${plan.Member.member_code})` : 'Unknown Client'}
                    </span>
                    <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-bold text-gray-600">
                      {plan.WorkoutExercises?.length || 0} Exercises
                    </span>
                  </div>
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