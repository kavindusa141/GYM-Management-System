import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  Plus, Trash2, CheckCircle, Package, X, Layout, Edit2, RotateCcw, Sparkles, 
  ShieldCheck, Dumbbell, Clock, List, Calendar, Footprints
} from 'lucide-react';

// --- CONSTANTS: Vibrant Gradients Palette ---
const GRADIENTS = [
  'bg-gradient-to-br from-blue-700 to-indigo-800',
  'bg-gradient-to-br from-purple-700 to-fuchsia-800',
  'bg-gradient-to-br from-emerald-600 to-teal-800',
  'bg-gradient-to-br from-rose-600 to-pink-800',
  'bg-gradient-to-br from-amber-600 to-orange-800',
  'bg-gradient-to-br from-cyan-600 to-blue-800',
  'bg-gradient-to-br from-indigo-600 to-violet-800',
  'bg-gradient-to-br from-slate-700 to-gray-900',
  'bg-gradient-to-br from-fuchsia-600 to-purple-800',
  'bg-gradient-to-br from-teal-500 to-emerald-700'
];

export default function CreateMembershipPlan() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentFeature, setCurrentFeature] = useState("");
  const [editingId, setEditingId] = useState(null); 

  // --- STATE ---
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    duration_months: '1',
    description: '',
    features: [],
    visit_limit_per_week: '', 
    class_limit_per_week: '', 
    access_start_time: '00:00',
    access_end_time: '23:59',
    includes_trainer: false
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

  const getSafeFeatures = (featuresData) => {
    if (Array.isArray(featuresData)) return featuresData;
    if (typeof featuresData === 'string') {
      try {
        const parsed = JSON.parse(featuresData);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) { return []; }
    }
    return [];
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
    const safeFeatures = getSafeFeatures(plan.features);
    setFormData({
      name: plan.name,
      price: plan.price,
      duration_months: plan.duration_months,
      description: plan.description || '',
      features: safeFeatures,
      visit_limit_per_week: plan.visit_limit_per_week === null ? '' : plan.visit_limit_per_week,
      class_limit_per_week: plan.class_limit_per_week === null ? '' : plan.class_limit_per_week,
      access_start_time: plan.access_start_time || '00:00',
      access_end_time: plan.access_end_time || '23:59',
      includes_trainer: plan.includes_trainer || false
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ 
      name: '', price: '', duration_months: '1', description: '', features: [],
      visit_limit_per_week: '', class_limit_per_week: '', 
      access_start_time: '00:00', access_end_time: '23:59', includes_trainer: false
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const featuresToSend = Array.isArray(formData.features) ? formData.features : [];
    const payload = {
      ...formData,
      features: featuresToSend,
      visit_limit_per_week: formData.visit_limit_per_week === '' ? null : formData.visit_limit_per_week,
      class_limit_per_week: formData.class_limit_per_week === '' ? null : formData.class_limit_per_week
    };

    try {
      if (editingId) {
        await api.put(`/memberships/${editingId}`, payload);
        toast.success("Plan Updated Successfully!");
        setEditingId(null);
      } else {
        await api.post('/memberships', payload);
        toast.success("Plan Created Successfully!");
      }
      setFormData({ 
        name: '', price: '', duration_months: '1', description: '', features: [],
        visit_limit_per_week: '', class_limit_per_week: '', 
        access_start_time: '00:00', access_end_time: '23:59', includes_trainer: false
      });
      fetchPlans();
    } catch (error) {
      toast.error(error.response?.data?.message || "Operation Failed");
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

  // --- HELPER: Smart Random Color Generator ---
  const getCardColor = (name = "") => {
    const n = name.toLowerCase();
    // 1. Check for specific keywords first
    if (n.includes('gold')) return 'bg-gradient-to-br from-yellow-500 to-amber-600';
    if (n.includes('silver')) return 'bg-gradient-to-br from-gray-400 to-slate-500';
    if (n.includes('platinum')) return 'bg-gradient-to-br from-slate-300 to-gray-400 text-gray-800';
    if (n.includes('bronze')) return 'bg-gradient-to-br from-orange-700 to-orange-900';
    
    // 2. Else, generate a consistent "Random" color based on the name string
    // This ensures the color stays the same for the same plan name, but varies across plans
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % GRADIENTS.length;
    return GRADIENTS[index];
  };

  return (
    <div className="space-y-12 animate-fade-in pb-10">
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Membership Packages</h1>
        <p className="text-gray-500 mt-1">Design your gym's offerings and manage pricing tiers.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* LEFT: FORM */}
        <div className={`p-8 rounded-3xl shadow-lg border h-fit transition-all duration-300 ${editingId ? 'bg-blue-50 border-blue-200 ring-4 ring-blue-500/10' : 'bg-white border-gray-100'}`}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              {editingId ? <Edit2 className="text-blue-600" size={24}/> : <Layout className="text-slate-800" size={24}/>}
              {editingId ? "Edit Existing Package" : "Create New Package"}
            </h2>
            {editingId && (
              <button onClick={cancelEdit} className="text-sm font-bold text-gray-500 hover:text-red-600 flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm hover:shadow transition-all">
                <RotateCcw size={14}/> Cancel
              </button>
            )}
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* SECTION 1: BASIC DETAILS */}
            <div className="space-y-5">
               <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wider border-b border-blue-100 pb-2 flex items-center gap-2">
                  <List size={16}/> Basic Details
               </h3>
               <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Package Name</label>
                  <input type="text" required placeholder="e.g. Gold Tier" className="w-full p-4 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-slate-900 outline-none font-bold text-gray-900"
                    value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Price (LKR)</label>
                  <input type="number" required placeholder="0.00" className="w-full p-4 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-slate-900 outline-none font-bold text-gray-900"
                    value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Duration</label>
                <div className="relative">
                  <select className="w-full p-4 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-slate-900 outline-none appearance-none font-medium text-gray-700 cursor-pointer"
                    value={formData.duration_months} onChange={e => setFormData({...formData, duration_months: e.target.value})}>
                    <option value="1">1 Month (Monthly)</option>
                    <option value="3">3 Months (Quarterly)</option>
                    <option value="6">6 Months (Semi-Annual)</option>
                    <option value="12">12 Months (Annual)</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Short Description</label>
                <textarea rows="2" placeholder="Briefly describe who this plan is for..." className="w-full p-4 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-slate-900 outline-none transition-all font-medium text-gray-700 resize-none"
                  value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
              </div>
            </div>

            {/* SECTION 2: ACCESS & LIMITS */}
            <div className="space-y-5">
               <h3 className="text-sm font-bold text-emerald-600 uppercase tracking-wider border-b border-emerald-100 pb-2 flex items-center gap-2">
                  <ShieldCheck size={16}/> Access & Limits
               </h3>
               
               {/* Trainer Toggle */}
               <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-gray-900 flex items-center gap-2">
                      <Dumbbell size={16} className="text-emerald-600"/> Personal Trainer Access
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">Can trainers assign workouts to this plan?</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" 
                      checked={formData.includes_trainer}
                      onChange={e => setFormData({...formData, includes_trainer: e.target.checked})}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
               </div>

               <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Weekly Visits (Max 7)</label>
                    <input 
                        type="number" 
                        placeholder="Unlimited" 
                        className="w-full p-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500 outline-none font-bold"
                        value={formData.visit_limit_per_week} 
                        onChange={e => {
                            const val = e.target.value;
                            if (val === '') {
                                setFormData({...formData, visit_limit_per_week: ''});
                            } else {
                                const num = parseInt(val);
                                if (num > 7) {
                                    toast.error("Maximum 7 visits per week allowed");
                                    setFormData({...formData, visit_limit_per_week: '7'});
                                } else if (num < 0) {
                                    setFormData({...formData, visit_limit_per_week: '0'});
                                } else {
                                    setFormData({...formData, visit_limit_per_week: val});
                                }
                            }
                        }} 
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Weekly Classes (Max 10)</label>
                    <input 
                        type="number" 
                        placeholder="Unlimited" 
                        className="w-full p-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500 outline-none font-bold"
                        value={formData.class_limit_per_week} 
                        onChange={e => {
                            const val = e.target.value;
                            if (val === '') {
                                setFormData({...formData, class_limit_per_week: ''});
                            } else {
                                const num = parseInt(val);
                                if (num > 10) {
                                    toast.error("Maximum 10 classes per week allowed");
                                    setFormData({...formData, class_limit_per_week: '10'});
                                } else if (num < 0) {
                                    setFormData({...formData, class_limit_per_week: '0'});
                                } else {
                                    setFormData({...formData, class_limit_per_week: val});
                                }
                            }
                        }} 
                    />
                 </div>
               </div>

               <div>
                 <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Access Hours (Start - End)</label>
                 <div className="flex gap-2 items-center">
                    <div className="relative flex-1">
                      <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                      <input type="time" className="w-full pl-9 pr-3 py-3 border border-gray-200 rounded-xl bg-white font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                        value={formData.access_start_time} onChange={e => setFormData({...formData, access_start_time: e.target.value})} />
                    </div>
                    <span className="text-gray-400 font-bold">-</span>
                    <div className="relative flex-1">
                      <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                      <input type="time" className="w-full pl-9 pr-3 py-3 border border-gray-200 rounded-xl bg-white font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                        value={formData.access_end_time} onChange={e => setFormData({...formData, access_end_time: e.target.value})} />
                    </div>
                 </div>
               </div>
            </div>

            {/* SECTION 3: DISPLAY FEATURES */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-orange-600 uppercase tracking-wider border-b border-orange-100 pb-2 flex items-center gap-2">
                  <CheckCircle size={16}/> Visual Features
               </h3>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Bullet Points (For Display Only)</label>
              <div className="flex gap-2">
                <input type="text" placeholder="Type feature & press Enter" className="w-full p-4 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-slate-900 outline-none transition-all"
                  value={currentFeature} onChange={e => setCurrentFeature(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addFeature(e)} />
                <button type="button" onClick={addFeature} className="bg-slate-900 text-white px-5 rounded-xl hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20"><Plus size={24}/></button>
              </div>
              
              <div className="flex flex-wrap gap-2 mt-4 min-h-[40px]">
                {Array.isArray(formData.features) && formData.features.map((f, i) => (
                  <span key={i} className="animate-fade-in bg-white border border-gray-200 pl-3 pr-2 py-1.5 rounded-lg text-sm font-medium text-gray-700 flex items-center gap-2 shadow-sm group">
                    {f} 
                    <button type="button" onClick={() => removeFeature(i)} className="text-gray-400 hover:text-red-500 hover:bg-red-50 rounded p-0.5 transition-colors">
                      <X size={14}/>
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <button type="submit" className={`w-full py-4 rounded-xl font-black text-lg text-white shadow-xl transform transition-all active:scale-95 flex items-center justify-center gap-2 ${editingId ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30' : 'bg-slate-900 hover:bg-slate-800 shadow-slate-900/30'}`}>
              {editingId ? "Update Package" : "Create Package"} <Sparkles size={20} className={editingId ? "" : "text-yellow-400"} />
            </button>
          </form>
        </div>

        {/* RIGHT: Live Preview */}
        <div className="hidden lg:block space-y-4">
           <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
             Live Preview
           </h2>
           <div className="sticky top-8">
            <div className="bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-100 max-w-sm mx-auto transform hover:scale-[1.02] transition-transform duration-500">
              
              {/* Preview Header (Dynamic Color) */}
              <div className={`${getCardColor(formData.name)} p-8 text-white relative overflow-hidden`}>
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Package size={120} />
                </div>
                <div className="relative z-10">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-3xl font-black tracking-tight">{formData.name || "Package Name"}</h3>
                      <p className="text-white/80 font-medium mt-1">{formData.duration_months} Month Access</p>
                    </div>
                  </div>
                  <div className="mt-8 flex items-baseline gap-1">
                    <span className="text-5xl font-black tracking-tight">Rs. {formData.price ? parseInt(formData.price).toLocaleString() : "0"}</span>
                  </div>
                </div>
              </div>

              {/* Preview Body */}
              <div className="p-8">
                <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                  {formData.description || "Package description will appear here..."}
                </p>
                
                <div className="space-y-4">
                  {/* --- INJECTED LOGIC FEATURES --- */}
                  {formData.includes_trainer && (
                    <div className="flex items-center text-sm font-bold text-gray-800">
                      <Dumbbell className="w-5 h-5 text-emerald-500 mr-3 shrink-0"/> Personal Trainer Included
                    </div>
                  )}
                  {formData.visit_limit_per_week ? (
                    <div className="flex items-center text-sm font-bold text-gray-800">
                      <Footprints className="w-5 h-5 text-blue-500 mr-3 shrink-0"/> {formData.visit_limit_per_week} Gym Visits per Week
                    </div>
                  ) : (
                    <div className="flex items-center text-sm font-bold text-gray-800">
                      <CheckCircle className="w-5 h-5 text-blue-600 mr-3 shrink-0"/> Unlimited Gym Access
                    </div>
                  )}
                  {formData.class_limit_per_week ? (
                    <div className="flex items-center text-sm font-bold text-gray-800">
                      <Calendar className="w-5 h-5 text-purple-500 mr-3 shrink-0"/> {formData.class_limit_per_week} Classes per Week
                    </div>
                  ) : (
                    <div className="flex items-center text-sm font-bold text-gray-800">
                      <CheckCircle className="w-5 h-5 text-blue-600 mr-3 shrink-0"/> Unlimited Classes
                    </div>
                  )}
                  {/* Time Access Feature */}
                  {(formData.access_start_time !== '00:00' && formData.access_end_time) && (
                     <div className="flex items-center text-sm font-bold text-gray-800">
                       <Clock className="w-5 h-5 text-orange-500 mr-3 shrink-0"/> Access: {formData.access_start_time} - {formData.access_end_time}
                     </div>
                  )}

                  {/* --- MANUAL FEATURES --- */}
                  {Array.isArray(formData.features) && formData.features.map((f, i) => (
                    <div key={i} className="flex items-center text-sm font-bold text-gray-600">
                      <CheckCircle className="w-5 h-5 text-gray-400 mr-3 shrink-0"/>{f}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <p className="text-center text-xs text-gray-400 mt-6">This is how the card will appear to members.</p>
           </div>
        </div>
      </div>

      {/* ACTIVE PLANS LIST */}
      <div className="mt-16 pt-10 border-t border-gray-100">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
            <Package className="text-blue-600" size={28}/> Active Packages
          </h2>
          <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">
            {plans.length} Live
          </span>
        </div>

        {plans.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
            <Package size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">No active packages found.</p>
            <p className="text-gray-400 text-sm">Create your first plan above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {plans.map((plan) => {
              const planFeatures = getSafeFeatures(plan.features);

              return (
                <div 
                  key={plan.plan_id} 
                  className={`relative group bg-white rounded-3xl overflow-hidden transition-all duration-300 flex flex-col ${
                    editingId === plan.plan_id 
                      ? 'ring-4 ring-blue-500/20 border-2 border-blue-600 shadow-2xl scale-[1.02] z-10' 
                      : 'border border-gray-100 shadow-lg hover:shadow-xl hover:-translate-y-1'
                  }`}
                >
                  <div className={`${getCardColor(plan.name)} p-6 text-white relative overflow-hidden shrink-0`}>
                    <div className="absolute top-0 right-0 p-4 opacity-5 transform group-hover:scale-110 transition-transform duration-700">
                      <Package size={100} />
                    </div>
                    <div className="relative z-10">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-2xl font-black tracking-tight leading-tight">{plan.name}</h3>
                          <p className="text-white/80 text-xs font-bold uppercase tracking-wider mt-1.5">{plan.duration_months} Month Access</p>
                        </div>
                        {plan.duration_months >= 12 && (
                          <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-lg">
                            Best Value
                          </span>
                        )}
                      </div>
                      <div className="mt-6 flex items-baseline gap-1">
                        <span className="text-3xl font-black tracking-tight">Rs. {parseInt(plan.price).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 flex flex-col flex-1">
                    <p className="text-gray-500 text-sm mb-6 leading-relaxed min-h-[40px] line-clamp-2">
                      {plan.description || "No description provided."}
                    </p>
                    
                    <div className="space-y-3 mb-8 flex-1">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Included Features</p>
                      <ul className="space-y-2.5">
                        
                        {/* --- INJECTED LOGIC FEATURES IN LIST --- */}
                        {plan.includes_trainer && (
                          <li className="flex items-start gap-3 text-sm text-gray-800 font-bold">
                            <Dumbbell size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                            Personal Trainer Included
                          </li>
                        )}

                        {plan.visit_limit_per_week ? (
                          <li className="flex items-start gap-3 text-sm text-gray-800 font-bold">
                            <Footprints size={16} className="text-blue-500 shrink-0 mt-0.5" />
                            {plan.visit_limit_per_week} Visits per Week
                          </li>
                        ) : (
                          <li className="flex items-start gap-3 text-sm text-gray-800 font-bold">
                             <CheckCircle size={16} className="text-blue-600 shrink-0 mt-0.5" />
                             Unlimited Gym Access
                          </li>
                        )}

                        {plan.class_limit_per_week ? (
                           <li className="flex items-start gap-3 text-sm text-gray-800 font-bold">
                             <Calendar size={16} className="text-purple-500 shrink-0 mt-0.5" />
                             {plan.class_limit_per_week} Classes per Week
                           </li>
                        ) : (
                            <li className="flex items-start gap-3 text-sm text-gray-800 font-bold">
                             <CheckCircle size={16} className="text-blue-600 shrink-0 mt-0.5" />
                             Unlimited Classes
                           </li>
                        )}

                        {(plan.access_start_time && plan.access_end_time && plan.access_start_time !== '00:00:00') && (
                          <li className="flex items-start gap-3 text-sm text-gray-800 font-bold">
                            <Clock size={16} className="text-orange-500 shrink-0 mt-0.5" />
                            Access: {plan.access_start_time.slice(0,5)} - {plan.access_end_time.slice(0,5)}
                          </li>
                        )}

                        {/* --- MANUAL FEATURES --- */}
                        {planFeatures.slice(0, 5).map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-3 text-sm text-gray-600 font-medium">
                            <CheckCircle size={16} className="text-gray-400 shrink-0 mt-0.5" />
                            <span className="leading-tight">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-gray-100 mt-auto">
                      <button 
                        onClick={() => handleEditClick(plan)} 
                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 rounded-xl text-sm font-bold transition-colors"
                      >
                        <Edit2 size={16} /> Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(plan.plan_id)} 
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 rounded-xl text-sm font-bold transition-colors group/delete"
                      >
                        <Trash2 size={18} className="group-hover/delete:scale-110 transition-transform"/>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}