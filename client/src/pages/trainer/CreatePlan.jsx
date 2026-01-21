import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Save, Plus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CreatePlan() {
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [planData, setPlanData] = useState({ member_id: '', name: '', description: '' });
  const [exercises, setExercises] = useState([{ name: '', sets: 3, reps: '10', weight: '', notes: '' }]);

  useEffect(() => {
    api.get('/workouts/members').then(res => setMembers(res.data)).catch(() => toast.error("Error loading members"));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/workouts', { ...planData, exercises });
      toast.success("Plan Created!");
      navigate('/trainer/dashboard');
    } catch { toast.error("Failed to create plan"); }
  };

  const updateEx = (index, field, val) => {
    const updated = [...exercises];
    updated[index][field] = val;
    setExercises(updated);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-10">
      <h1 className="text-2xl font-bold text-gray-900">Assign New Workout</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <select className="p-3 border rounded-xl" required onChange={e => setPlanData({...planData, member_id: e.target.value})}>
              <option value="">-- Select Member --</option>
              {members.map(m => <option key={m.user_id} value={m.user_id}>{m.name}</option>)}
            </select>
            <input type="text" placeholder="Plan Name" className="p-3 border rounded-xl" required onChange={e => setPlanData({...planData, name: e.target.value})}/>
          </div>
          <textarea placeholder="Notes" className="w-full p-3 border rounded-xl" onChange={e => setPlanData({...planData, description: e.target.value})}></textarea>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
           <div className="flex justify-between mb-4"><h3 className="font-bold">Exercises</h3><button type="button" onClick={() => setExercises([...exercises, {name:'', sets:3, reps:'10'}])} className="text-blue-600 font-bold flex gap-1"><Plus size={16}/> Add</button></div>
           <div className="space-y-3">
             {exercises.map((ex, i) => (
               <div key={i} className="flex gap-3 items-center bg-gray-50 p-3 rounded-xl">
                 <span className="font-bold text-gray-400">{i+1}</span>
                 <input className="flex-1 p-2 border rounded" placeholder="Exercise Name" value={ex.name} onChange={e => updateEx(i, 'name', e.target.value)} required/>
                 <input className="w-16 p-2 border rounded" type="number" value={ex.sets} onChange={e => updateEx(i, 'sets', e.target.value)}/>
                 <input className="w-20 p-2 border rounded" placeholder="Reps" value={ex.reps} onChange={e => updateEx(i, 'reps', e.target.value)}/>
                 <input className="w-20 p-2 border rounded" placeholder="Weight" value={ex.weight} onChange={e => updateEx(i, 'weight', e.target.value)}/>
                 <button type="button" onClick={() => setExercises(exercises.filter((_, idx) => idx !== i))} className="text-red-400"><Trash2 size={16}/></button>
               </div>
             ))}
           </div>
        </div>
        <button className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold">Save Plan</button>
      </form>
    </div>
  );
}