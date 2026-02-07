import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  Save, Plus, Trash2, Dumbbell, User, FileText, ClipboardList, ChevronLeft, Search, CheckCircle, Calendar, Clock, Globe
} from 'lucide-react';
// ... imports ...

import { useNavigate, useParams, useLocation } from 'react-router-dom';

export default function CreatePlan() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const preSelectedMemberId = location.state?.memberId;

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Search/Dropdown State
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const searchContainerRef = useRef(null);

  // Form State
  const [planData, setPlanData] = useState({
    member_id: '',
    name: '',
    description: '',
    start_date: new Date().toISOString().split('T')[0], // Default Today
    end_date: '',
    is_common: false, // New Field
    duration: '' // New Field
  });

  // Duration State (Helper for UI)
  const [duration, setDuration] = useState('');

  const [exercises, setExercises] = useState([
    { name: '', sets: 3, reps: '10', weight: '', notes: '' }
  ]);

  // --- AUTO CALCULATE END DATE ---
  useEffect(() => {
    if (planData.start_date && duration && !planData.is_common) {
      const days = parseInt(duration);
      const result = new Date(planData.start_date);
      result.setDate(result.getDate() + days);
      setPlanData(prev => ({ ...prev, end_date: result.toISOString().split('T')[0] }));
    }
  }, [planData.start_date, duration, planData.is_common]);

  useEffect(() => {
    api.get('/workouts/members')
      .then(res => setMembers(res.data))
      .catch(() => toast.error("Error loading member list"))
      .finally(() => setLoading(false));

    if (id && id !== 'new') {
      api.get(`/workouts/${id}`)
        .then(res => {
          const p = res.data;
          setPlanData({
            member_id: p.member_id || '',
            name: p.name,
            description: p.description || '',
            start_date: p.start_date || new Date().toISOString().split('T')[0],
            end_date: p.end_date || '',
            is_common: p.is_common || false,
            duration: p.duration || ''
          });
          if (p.duration) setDuration(p.duration);
          setExercises(p.WorkoutExercises || []);
          if (p.Member) {
            setSearchTerm(`${p.Member.name} (${p.Member.member_code})`);
          } else if (p.is_common) {
            setSearchTerm("Common Plan (All Members)");
          }
        })
        .catch(() => toast.error("Failed to load plan details"));
    } else if (preSelectedMemberId) {
      // If creating new plan and member is passed in state
      setPlanData(prev => ({ ...prev, member_id: preSelectedMemberId }));
    }

    // Click outside handler for dropdown
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [id]);

  // Effect to set search term when members load and we have a member_id
  useEffect(() => {
    if (members.length > 0 && planData.member_id && !planData.is_common) {
      const member = members.find(m => m.user_id === parseInt(planData.member_id) || m.user_id === planData.member_id);
      if (member) {
        setSearchTerm(`${member.name} (${member.member_code})`);
      }
    }
  }, [members, planData.member_id, planData.is_common]);

  const handleSelectMember = (member) => {
    setPlanData({ ...planData, member_id: member.user_id });
    setSearchTerm(`${member.name} (${member.member_code})`);
    setShowDropdown(false);
  };

  const updateExercise = (index, field, val) => {
    const updated = [...exercises];
    updated[index][field] = val;
    setExercises(updated);
  };

  const removeExercise = (index) => {
    if (exercises.length === 1) return;
    setExercises(exercises.filter((_, idx) => idx !== index));
  };

  const addExercise = () => {
    setExercises([...exercises, { name: '', sets: 3, reps: '10', weight: '', notes: '' }]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!planData.is_common && !planData.member_id) return toast.error("Please select a member or mark as Common Plan");

    // expiry check
    if (!planData.is_common && isExpired) {
      toast.error("Cannot create plan: Member's subscription is expired.");
      return;
    }

    // Date validation only for non-common plans
    if (!planData.is_common && (!planData.start_date || !planData.end_date)) return toast.error("Please select start and end dates");
    // Duration validation for common plans
    if (planData.is_common && !duration) return toast.error("Please select a duration");
    if (exercises.length === 0) return toast.error("Add at least one exercise");

    setSubmitting(true);
    // ... rest of submit logic
    try {
      if (id && id !== 'new') {
        await api.put(`/workouts/${id}`, { ...planData, exercises });
        toast.success("Updated Successfully!");
      } else {
        await api.post('/workouts', { ...planData, exercises, duration });
        toast.success("Created Successfully!");
      }
      navigate(planData.member_id ? `/trainer/plans?memberId=${planData.member_id}` : '/trainer/plans');
    } catch (err) {
      toast.error(err.response?.data?.message || "Operation failed");
      setSubmitting(false);
    }
  };

  const filteredMembers = members.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.member_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Helper to check expiry
  const selectedMember = members.find(m => m.user_id === planData.member_id);
  const isExpired = selectedMember && (
    selectedMember.subscription_status === 'EXPIRED' ||
    (selectedMember.subscription_end && new Date(selectedMember.subscription_end) < new Date().toISOString().split('T')[0])
  );

  // ...

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-20">
      {/* ... header ... */}

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* --- SECTION 1: DETAILS --- */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-visible relative z-20">
          <div className="bg-slate-50 border-b border-gray-100 p-6 flex items-center gap-3">
            <User size={20} className="text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900">Program Details</h2>
          </div>

          <div className="p-8 grid md:grid-cols-2 gap-6">

            {/* COMMON PLAN TOGGLE */}
            <div className="md:col-span-2 bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <Globe size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">Common Workout Plan</h3>
                  <p className="text-xs text-gray-500">Visible to all members regardless of trainer assignment</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={planData.is_common}
                  onChange={e => {
                    const isCommon = e.target.checked;
                    setPlanData(prev => ({
                      ...prev,
                      is_common: isCommon,
                      member_id: isCommon ? '' : prev.member_id
                    }));
                    if (isCommon) setSearchTerm('');
                  }}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* MESSAGE FOR COMMON PLANS */}
            {planData.is_common && (
              <div className="md:col-span-2 bg-indigo-50 text-indigo-800 text-sm p-3 rounded-xl border border-indigo-100 flex items-center gap-2">
                <Clock size={16} />
                <span>Common plans are templates. Just set a duration, and Start/End dates will be set when assigned to a member.</span>
              </div>
            )}

            {/* MEMBER SEARCH (Hidden if Common) */}
            {!planData.is_common && (
              <div ref={searchContainerRef} className="relative">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Select Member</label>
                <div className="relative">
                  <Search className="absolute left-4 top-4 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Type Name or Member ID..."
                    className={`w-full pl-12 pr-4 py-4 border rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition-all font-bold text-gray-900 ${planData.member_id ? 'border-green-500 ring-1 ring-green-500/20' : 'border-gray-200'}`}
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setShowDropdown(true);
                      setPlanData({ ...planData, member_id: '' });
                    }}
                    onFocus={() => setShowDropdown(true)}
                    disabled={loading}
                  />
                  {planData.member_id && <CheckCircle className="absolute right-4 top-4 text-green-500" size={20} />}
                </div>
                {showDropdown && (
                  <div className="absolute top-full left-0 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-60 overflow-y-auto z-50 custom-scrollbar">
                    {filteredMembers.length === 0 ? <div className="p-4 text-gray-400 text-sm text-center">No members found.</div> :
                      filteredMembers.map(m => (
                        <button key={m.user_id} type="button" onClick={() => handleSelectMember(m)} className="w-full text-left px-4 py-3 hover:bg-blue-50 flex items-center justify-between border-b border-gray-50 last:border-0 transition-colors">
                          <div><p className="font-bold text-gray-900">{m.name}</p><p className="text-xs text-gray-500 font-mono">{m.member_code}</p></div>
                          {planData.member_id === m.user_id && <CheckCircle size={16} className="text-blue-600" />}
                        </button>
                      ))
                    }
                  </div>
                )}
              </div>
            )}

            {/* EXPIRY WARNING */}
            {!planData.is_common && isExpired && (
              <div className="md:col-span-2 bg-red-50 text-red-800 p-4 rounded-xl border border-red-200 flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-full text-red-600">
                  <Clock size={20} />
                </div>
                <div>
                  <h3 className="font-bold">Membership Expired</h3>
                  <p className="text-sm">This member's subscription has expired. You cannot assign a new workout plan until they renew.</p>
                </div>
              </div>
            )}

            {/* ROUTINE NAME */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Routine Name</label>
              <div className="relative">
                <FileText className="absolute left-4 top-4 text-gray-400" size={20} />
                <input type="text" placeholder="e.g. Hypertrophy Phase 1" className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition-all font-bold text-gray-900" required value={planData.name} onChange={e => setPlanData({ ...planData, name: e.target.value })} />
              </div>
            </div>

            {/* --- NEW: DATE SELECTION --- */}
            <div className="md:col-span-2 grid md:grid-cols-3 gap-6 pt-4 border-t border-gray-100 mt-2">

              {/* START DATE (Hidden if Common) */}
              {!planData.is_common && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Start Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input type="date" required className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl font-bold text-gray-900 outline-none focus:border-blue-500"
                      value={planData.start_date} onChange={e => setPlanData({ ...planData, start_date: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {/* DURATION (Auto-Calc or Manual for Common) */}
              <div className={planData.is_common ? "md:col-span-3" : ""}>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Duration</label>
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <select className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl font-bold text-gray-900 outline-none focus:border-blue-500 appearance-none bg-white"
                    value={duration} onChange={e => {
                      setDuration(e.target.value);
                      setPlanData(prev => ({ ...prev, duration: e.target.value }));
                    }}
                  >
                    <option value="">Select Duration...</option>
                    <option value="7">1 Week</option>
                    <option value="14">2 Weeks</option>
                    <option value="21">3 Weeks</option>
                    <option value="30">1 Month</option>
                    <option value="60">2 Months</option>
                    <option value="90">3 Months</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div>
                </div>
              </div>

              {/* END DATE (Calculated) - Hidden if Common */}
              {!planData.is_common && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">End Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input type="date" required className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl font-bold text-gray-900 outline-none focus:border-blue-500 bg-gray-50"
                      value={planData.end_date} onChange={e => setPlanData({ ...planData, end_date: e.target.value })}
                    />
                  </div>
                </div>
              )}

            </div>

            {/* DESCRIPTION */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Instructions / Goals</label>
              <textarea rows="2" placeholder="Add specific instructions..." className="w-full p-4 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition-all font-medium text-gray-700 resize-none" value={planData.description} onChange={e => setPlanData({ ...planData, description: e.target.value })}></textarea>
            </div>

          </div>
        </div>

        {/* --- SECTION 2: EXERCISES (Same as before) --- */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden relative z-10">
          {/* ... Exercise Builder UI (Same as previous code) ... */}
          <div className="bg-slate-900 text-white p-6 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Dumbbell size={20} />
              <h2 className="text-lg font-bold">Exercise Builder</h2>
            </div>
            <button type="button" onClick={addExercise} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20 active:scale-95 transition-all">
              <Plus size={16} /> Add Exercise
            </button>
          </div>
          <div className="p-4 md:p-6 space-y-3">
            {exercises.map((ex, i) => (
              <div key={i} className="group flex flex-col md:flex-row gap-3 items-start md:items-center bg-gray-50 hover:bg-white hover:shadow-md border border-gray-200 p-4 rounded-2xl transition-all duration-300">
                <div className="hidden md:flex w-8 h-8 bg-slate-200 text-slate-600 rounded-full items-center justify-center font-bold text-xs shrink-0">{i + 1}</div>
                <div className="flex-1 w-full grid grid-cols-2 md:grid-cols-12 gap-3">
                  <div className="col-span-2 md:col-span-4">
                    <input className="w-full p-2 bg-white border border-gray-200 rounded-lg font-bold text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Exercise Name" value={ex.name} onChange={e => updateExercise(i, 'name', e.target.value)} required />
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <input type="number" className="w-full p-2 bg-white border border-gray-200 rounded-lg font-bold text-center focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Sets" value={ex.sets} onChange={e => updateExercise(i, 'sets', e.target.value)} />
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <input type="text" className="w-full p-2 bg-white border border-gray-200 rounded-lg font-bold text-center focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Reps" value={ex.reps} onChange={e => updateExercise(i, 'reps', e.target.value)} />
                  </div>
                  <div className="col-span-2 md:col-span-2">
                    <input className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Weight" value={ex.weight} onChange={e => updateExercise(i, 'weight', e.target.value)} />
                  </div>
                  <div className="col-span-2 md:col-span-2">
                    <input className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-500 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Notes" value={ex.notes} onChange={e => updateExercise(i, 'notes', e.target.value)} />
                  </div>
                </div>
                <button type="button" onClick={() => removeExercise(i)} className="p-2 text-gray-400 hover:text-red-500 transition-colors" disabled={exercises.length === 1}>
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button type="submit" disabled={submitting} className="px-10 py-4 bg-slate-900 text-white rounded-xl font-bold text-lg shadow-xl hover:bg-slate-800 transition-all flex items-center gap-3">
            {submitting ? 'Saving...' : <><Save size={20} /> Save Plan</>}
          </button>
        </div>
      </form>
    </div>
  );
}