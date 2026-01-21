import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Plus, Dumbbell, User, Calendar } from 'lucide-react';

export default function TrainerDashboard() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyPlans = async () => {
      try {
        const res = await api.get('/workouts/created');
        setPlans(res.data);
      } catch (error) {
        console.error("Failed to load plans");
      } finally {
        setLoading(false);
      }
    };
    fetchMyPlans();
  }, []);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <div><h1 className="text-2xl font-bold text-gray-900">Trainer Dashboard</h1><p className="text-gray-500">Manage your clients.</p></div>
        <Link to="/trainer/create-plan" className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:bg-blue-700">
          <Plus size={20} /> Assign New Plan
        </Link>
      </div>

      {/* Stats Card */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 w-fit pr-10">
        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center"><Dumbbell size={24} /></div>
        <div><p className="text-sm font-bold text-gray-400 uppercase">Active Plans</p><p className="text-2xl font-black text-gray-900">{plans.length}</p></div>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 font-bold text-gray-900">Recent Assignments</div>
        {loading ? <div className="p-10 text-center text-gray-400">Loading...</div> : 
          <div className="divide-y divide-gray-100">
            {plans.map((plan) => (
              <div key={plan.plan_id} className="p-6 flex justify-between items-center hover:bg-gray-50">
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500"><Dumbbell size={20} /></div>
                  <div>
                    <h4 className="font-bold text-gray-900">{plan.name}</h4>
                    {/* DATE FIX HERE */}
                    <p className="text-sm text-gray-500 flex items-center gap-2">
                       <User size={14}/> {plan.Member?.name} • 
                       {new Date(plan.createdAt || plan.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">{plan.status}</span>
              </div>
            ))}
          </div>
        }
      </div>
    </div>
  );
}