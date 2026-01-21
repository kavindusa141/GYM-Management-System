import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  Plus, Trash2, CheckCircle, Package, X, CreditCard, Layout, Edit2, RotateCcw 
} from 'lucide-react';

export default function CreateMembershipPlan() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentFeature, setCurrentFeature] = useState("");
  const [editingId, setEditingId] = useState(null); 

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    duration_months: '1',
    description: '',
    features: [] 
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const res = await api.get('/memberships');
      setPlans(res.data);
    } catch (error) {
      toast.error("Failed to load plans");
    } finally {
      setLoading(false);
    }
  };

  const addFeature = (e) => {
    e.preventDefault();
    if (!currentFeature.trim()) return;
    const currentFeatures = Array.isArray(formData.features) ? formData.features : [];
    setFormData({ ...formData, features: [...currentFeatures, currentFeature.trim()] });
    setCurrentFeature(""); 
  };

  const removeFeature = (indexToRemove) => {
    const currentFeatures = Array.isArray(formData.features) ? formData.features : [];
    setFormData({
      ...formData,
      features: currentFeatures.filter((_, index) => index !== indexToRemove)
    });
  };

  const handleEditClick = (plan) => {
    setEditingId(plan.plan_id);
    let safeFeatures = [];
    if (Array.isArray(plan.features)) {
      safeFeatures = plan.features;
    } else if (typeof plan.features === 'string') {
      try { safeFeatures = JSON.parse(plan.features); } catch (e) { safeFeatures = []; }
    }
    setFormData({
      name: plan.name,
      price: plan.price,
      duration_months: plan.duration_months,
      description: plan.description,
      features: safeFeatures
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ name: '', price: '', duration_months: '1', description: '', features: [] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const featuresToSend = Array.isArray(formData.features) ? formData.features : [];
    if (featuresToSend.length === 0) return toast.error("Please add at least one feature.");

    try {
      if (editingId) {
        await api.put(`/memberships/${editingId}`, { ...formData, features: featuresToSend });
        toast.success("Plan Updated Successfully!");
        setEditingId(null);
      } else {
        await api.post('/memberships', { ...formData, features: featuresToSend });
        toast.success("Plan Created Successfully!");
      }
      setFormData({ name: '', price: '', duration_months: '1', description: '', features: [] });
      fetchPlans();
    } catch (error) {
      toast.error("Operation Failed");
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Delete this plan?")) return;
    try {
      await api.delete(`/memberships/${id}`);
      toast.success("Plan Deleted");
      fetchPlans();
    } catch (error) {
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Membership Packages</h1>
        <p className="text-gray-500">Create, Edit and Manage your gym plans.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* LEFT: FORM */}
        <div className={`p-6 rounded-2xl shadow-sm border h-fit transition-colors ${editingId ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-100'}`}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              {editingId ? <Edit2 className="text-blue-600" size={20}/> : <Layout className="text-gray-600" size={20}/>}
              {editingId ? "Edit Plan" : "Create New Plan"}
            </h2>
            {editingId && (
              <button onClick={cancelEdit} className="text-sm text-gray-500 hover:text-red-600 flex items-center gap-1">
                <RotateCcw size={14}/> Cancel Edit
              </button>
            )}
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Plan Name</label>
                <input type="text" required className="w-full p-3 border rounded-xl bg-white"
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                {/* UPDATED LABEL */}
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Price (Rs.)</label>
                <input type="number" required className="w-full p-3 border rounded-xl bg-white"
                  value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
              </div>
            </div>

            {/* (Keep Duration, Description, Features inputs same as before) */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Duration</label>
              <select className="w-full p-3 border rounded-xl bg-white"
                value={formData.duration_months} onChange={e => setFormData({...formData, duration_months: e.target.value})}>
                <option value="1">1 Month</option>
                <option value="3">3 Months</option>
                <option value="6">6 Months</option>
                <option value="12">1 Year</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Description</label>
              <textarea rows="2" className="w-full p-3 border rounded-xl bg-white"
                value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Features</label>
              <div className="flex gap-2">
                <input type="text" placeholder="Type & Enter" className="w-full p-3 border rounded-xl bg-white"
                  value={currentFeature} onChange={e => setCurrentFeature(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addFeature(e)} />
                <button type="button" onClick={addFeature} className="bg-slate-200 text-slate-600 px-4 rounded-xl"><Plus size={20}/></button>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {Array.isArray(formData.features) && formData.features.map((f, i) => (
                  <span key={i} className="bg-white border border-gray-200 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                    {f} <button type="button" onClick={() => removeFeature(i)}><X size={14}/></button>
                  </span>
                ))}
              </div>
            </div>

            <button type="submit" className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all ${editingId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-900 hover:bg-slate-800'}`}>
              {editingId ? "Update Plan" : "Create Plan"}
            </button>
          </form>
        </div>

        {/* RIGHT: Live Preview */}
        <div>
           <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <CreditCard className="text-blue-600" size={20}/> Live Preview
          </h2>
          <div className="bg-white border-2 border-blue-600 rounded-3xl p-8 shadow-xl relative overflow-hidden max-w-sm mx-auto">
            <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-4 py-1 rounded-bl-xl">PREVIEW</div>
            <h3 className="text-2xl font-black text-gray-900 mb-2">{formData.name || "Plan Name"}</h3>
            <div className="flex items-end gap-1 mb-6">
              {/* UPDATED CURRENCY */}
              <span className="text-4xl font-black text-slate-800">Rs. {formData.price || "0"}</span>
              <span className="text-gray-500 font-medium mb-1">/ {formData.duration_months} mo</span>
            </div>
            
            <ul className="space-y-3 mb-8">
              {Array.isArray(formData.features) && formData.features.map((f, i) => (
                <li key={i} className="flex items-center text-sm font-bold text-gray-700"><CheckCircle className="w-5 h-5 text-green-500 mr-3"/>{f}</li>
              ))}
            </ul>
          </div>
        </div>

      </div>

      {/* ACTIVE PLANS LIST */}
      <div className="mt-12">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Package className="text-blue-600" size={24}/> Active Plans
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div key={plan.plan_id} className={`bg-white p-6 rounded-2xl shadow-sm border flex flex-col justify-between transition-all ${editingId === plan.plan_id ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-100 hover:shadow-md'}`}>
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-black text-gray-900">{plan.name}</h3>
                  <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase">{plan.duration_months} Mo</span>
                </div>
                {/* UPDATED CURRENCY */}
                <div className="text-3xl font-black text-slate-800 mb-4">Rs. {plan.price}</div>
                <p className="text-sm text-gray-500 mb-4">{plan.description}</p>
                
                <div className="space-y-2 mb-6 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                  {Array.isArray(plan.features) && plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle size={16} className="text-green-500 shrink-0 mt-0.5" />
                      <span className="leading-tight">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 mt-auto pt-4 border-t border-gray-100">
                <button onClick={() => handleEditClick(plan)} className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-sm font-bold">
                  <Edit2 size={16} /> Edit
                </button>
                <button onClick={() => handleDelete(plan.plan_id)} className="flex-1 flex items-center justify-center gap-2 py-2 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg text-sm font-bold">
                  <Trash2 size={16} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}