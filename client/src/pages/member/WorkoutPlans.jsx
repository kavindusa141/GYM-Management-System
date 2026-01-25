import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast'; 
import { Dumbbell, Calendar, User, ChevronDown, ChevronUp, Activity, CheckCircle } from 'lucide-react';

export default function WorkoutPlans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedPlan, setExpandedPlan] = useState(null);
  
  // Logging State
  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [logData, setLogData] = useState({ duration_mins: '', notes: '', mood: 'Good' });

  useEffect(() => { fetchMyPlans(); }, []);

  const fetchMyPlans = async () => {
    try {
      const res = await api.get('/workouts/my-plans');
      setPlans(res.data);
    } catch (error) { 
      console.error("Error loading plans"); 
    } finally { 
      setLoading(false); 
    }
  };

  const openLogModal = (e, planId) => {
    e.stopPropagation(); // Prevent toggling accordion
    setSelectedPlanId(planId);
    setShowLogModal(true);
  };

  const handleLogSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/workouts/log', { ...logData, plan_id: selectedPlanId });
      toast.success("Workout Logged!");
      setShowLogModal(false);
      setLogData({ duration_mins: '', notes: '', mood: 'Good' });
    } catch (error) {
      toast.error("Failed to log workout");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in relative pt-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Workout Plans</h1>
        <p className="text-gray-500">View routines and log your progress.</p>
      </div>

      {loading ? ( <div className="text-center py-20 text-gray-400">Loading...</div> ) : 
       plans.length === 0 ? ( <div className="p-10 text-center text-gray-500">No plans yet.</div> ) : (
        <div className="space-y-4">
          {plans.map((plan) => (
            <div key={plan.plan_id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Header */}
              <div onClick={() => setExpandedPlan(expandedPlan === plan.plan_id ? null : plan.plan_id)} className="p-6 cursor-pointer hover:bg-gray-50 flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0"><Activity size={24} /></div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                      <span className="flex items-center gap-1"><User size={14}/> {plan.Trainer?.name || 'Staff'}</span>
                      
                      {/* --- NEW: Date Range Display --- */}
                      {plan.start_date && plan.end_date ? (
                         <span className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded text-xs font-bold text-gray-600">
                           <Calendar size={12}/> 
                           {new Date(plan.start_date).toLocaleDateString()} - {new Date(plan.end_date).toLocaleDateString()}
                         </span>
                      ) : (
                         <span className="flex items-center gap-1"><Calendar size={14}/> {new Date(plan.createdAt || plan.created_at).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                   <button 
                     onClick={(e) => openLogModal(e, plan.plan_id)}
                     className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
                   >
                     <CheckCircle size={16}/> Log Workout
                   </button>
                   {expandedPlan === plan.plan_id ? <ChevronUp size={20} className="text-gray-400"/> : <ChevronDown size={20} className="text-gray-400"/>}
                </div>
              </div>

              {/* Details */}
              {expandedPlan === plan.plan_id && (
                <div className="border-t border-gray-100 bg-gray-50/50 p-6">
                   {plan.description && (
                    <div className="mb-6 bg-blue-50 text-blue-800 p-4 rounded-xl text-sm leading-relaxed">
                      <strong>Trainer Notes:</strong> {plan.description}
                    </div>
                   )}
                   <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-gray-400 uppercase bg-gray-100">
                        <tr><th className="px-4 py-3">Exercise</th><th className="px-4 py-3">Sets</th><th className="px-4 py-3">Reps</th><th className="px-4 py-3">Notes</th></tr>
                      </thead>
                      <tbody className="bg-white">
                        {plan.WorkoutExercises?.map((ex, i) => (
                          <tr key={i} className="border-b border-gray-50">
                            <td className="px-4 py-3 font-bold">{ex.name}</td>
                            <td className="px-4 py-3 font-mono text-blue-600">{ex.sets}</td>
                            <td className="px-4 py-3">{ex.reps}</td>
                            <td className="px-4 py-3 text-gray-500 italic">{ex.notes}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* MODAL for Logging - Position Updated */}
      {showLogModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 pt-24 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-fade-in relative">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><CheckCircle className="text-green-500"/> Log Session</h2>
            <form onSubmit={handleLogSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Duration (Minutes)</label>
                <input type="number" required className="w-full p-3 border rounded-xl" placeholder="e.g. 45" 
                  value={logData.duration_mins} onChange={e => setLogData({...logData, duration_mins: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">How did it feel?</label>
                <select className="w-full p-3 border rounded-xl" value={logData.mood} onChange={e => setLogData({...logData, mood: e.target.value})}>
                  <option value="Great">Great </option>
                  <option value="Good">Good </option>
                  <option value="Hard">Hard </option>
                  <option value="Exhausted">Exhausted </option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Notes (Optional)</label>
                <textarea className="w-full p-3 border rounded-xl" rows="2" placeholder="Heavier weights next time..."
                  value={logData.notes} onChange={e => setLogData({...logData, notes: e.target.value})}></textarea>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowLogModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg">Save Log</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}