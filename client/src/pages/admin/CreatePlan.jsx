import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Plus, Trash2, DollarSign, Calendar, CheckCircle, Package } from 'lucide-react';

export default function CreateMembershipPlan() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    duration_months: '1',
    description: '',
    features: '' // We will accept comma-separated text and convert to array
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const res = await api.get('/memberships'); // Uses the new Membership Route
      setPlans(res.data);
    } catch (error) {
      toast.error("Failed to load plans");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Convert "Gym, Sauna, Pool" string into ["Gym", "Sauna", "Pool"] array
      const featuresArray = formData.features.split(',').map(f => f.trim()).filter(f => f !== '');
      
      const payload = { ...formData, features: featuresArray };
      
      await api.post('/memberships', payload);
      toast.success("Membership Plan Created!");
      
      // Reset form and reload list
      setFormData({ name: '', price: '', duration_months: '1', description: '', features: '' });
      fetchPlans();
    } catch (error) {
      toast.error("Failed to create plan");
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Are you sure you want to deactivate this plan?")) return;
    try {
      await api.delete(`/memberships/${id}`);
      toast.success("Plan Deactivated");
      fetchPlans();
    } catch (error) {
      toast.error("Failed to delete plan");
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Membership Plans</h1>
        <p className="text-gray-500">Create and manage gym packages.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Create Form */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Plus className="text-blue-600" size={20}/> Create New Plan
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Plan Name</label>
                <input 
                  type="text" required placeholder="e.g. Gold Access"
                  className="w-full p-3 border rounded-xl"
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Price ($)</label>
                  <input 
                    type="number" required placeholder="50.00"
                    className="w-full p-3 border rounded-xl"
                    value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Duration</label>
                  <select 
                    className="w-full p-3 border rounded-xl bg-white"
                    value={formData.duration_months} onChange={e => setFormData({...formData, duration_months: e.target.value})}
                  >
                    <option value="1">1 Month</option>
                    <option value="3">3 Months</option>
                    <option value="6">6 Months</option>
                    <option value="12">1 Year</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Short Description</label>
                <textarea 
                  rows="2" placeholder="Best for beginners..."
                  className="w-full p-3 border rounded-xl"
                  value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Features (Comma separated)</label>
                <input 
                  type="text" placeholder="Gym Access, Free Towel, Sauna"
                  className="w-full p-3 border rounded-xl"
                  value={formData.features} onChange={e => setFormData({...formData, features: e.target.value})}
                />
                <p className="text-xs text-gray-400 mt-1">Separate perks with commas.</p>
              </div>

              <button type="submit" className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg">
                Create Package
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: Existing Plans List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Package className="text-blue-600" size={20}/> Active Plans
          </h2>

          {loading ? (
            <div className="text-center py-10 text-gray-400">Loading plans...</div>
          ) : plans.length === 0 ? (
            <div className="bg-slate-50 p-10 rounded-2xl text-center text-gray-500 border border-dashed border-gray-300">
              No active membership plans found. Create one!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {plans.map((plan) => (
                <div key={plan.plan_id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
                  
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-black text-gray-900">{plan.name}</h3>
                      <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                        {plan.duration_months === 1 ? 'Monthly' : `${plan.duration_months} Months`}
                      </span>
                    </div>
                    
                    <div className="text-3xl font-black text-slate-800 mb-4">
                      ${plan.price}
                    </div>

                    <p className="text-sm text-gray-500 mb-4 h-10 overflow-hidden">{plan.description}</p>

                    {/* Features List */}
                    <div className="space-y-2 mb-6">
                      {plan.features && typeof plan.features === 'object' && plan.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                          <CheckCircle size={16} className="text-green-500 shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button 
                    onClick={() => handleDelete(plan.plan_id)}
                    className="w-full flex items-center justify-center gap-2 py-2 text-red-500 hover:bg-red-50 rounded-lg text-sm font-bold transition-colors"
                  >
                    <Trash2 size={16} /> Deactivate Plan
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}