import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Activity, Calendar, Plus, Save, ChevronLeft, Ruler, Scale, Edit2, Trash2, X
} from 'lucide-react';

export default function MemberProgress() {
    const { memberId } = useParams();
    const navigate = useNavigate();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [member, setMember] = useState(null);
    const [currentStats, setCurrentStats] = useState({});

    // Editing State
    const [editingLogId, setEditingLogId] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        weight: '',
        bmi: '',
        body_fat_percentage: '',
        notes: '',
        measurements: { chest: '', waist: '', arms: '', legs: '' }
    });

    useEffect(() => {
        fetchProgress();
    }, [memberId]);

    const fetchProgress = async () => {
        try {
            const [dataRes, memberRes] = await Promise.all([
                api.get(`/progress/member/${memberId}`),
                api.get('/assignments/trainer/me')
            ]);

            const { logs, current_stats } = dataRes.data;
            setLogs(logs || []);
            setCurrentStats(current_stats || {});

            // Initial auto-fill for ADD mode (if not editing)
            if (!editingLogId && current_stats) {
                setFormData(prev => ({
                    ...prev,
                    weight: current_stats.weight || '',
                    bmi: current_stats.bmi || ''
                }));
            }

            const found = memberRes.data.find(a => a.Member.user_id === parseInt(memberId));
            if (found) setMember(found.Member);

        } catch (error) {
            toast.error("Failed to load progress data");
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (log) => {
        setEditingLogId(log.log_id);
        setFormData({
            weight: log.weight || '',
            bmi: log.bmi || '',
            body_fat_percentage: log.body_fat_percentage || '',
            notes: log.notes || '',
            measurements: log.measurements || { chest: '', waist: '', arms: '', legs: '' }
        });
        setShowAddForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteClick = async (logId) => {
        if (!window.confirm("Are you sure you want to delete this entry?")) return;
        try {
            await api.delete(`/progress/${logId}`);
            toast.success("Entry deleted");
            fetchProgress();
        } catch (error) {
            toast.error("Failed to delete entry");
        }
    };

    const handleCancelEdit = () => {
        setEditingLogId(null);
        setShowAddForm(false);
        // Reset form to default stats
        setFormData({
            weight: currentStats.weight || '',
            bmi: currentStats.bmi || '',
            body_fat_percentage: '',
            notes: '',
            measurements: { chest: '', waist: '', arms: '', legs: '' }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                member_id: memberId,
                weight: formData.weight,
                bmi: formData.bmi,
                body_fat_percentage: formData.body_fat_percentage,
                notes: formData.notes,
                measurements: formData.measurements
            };

            if (editingLogId) {
                await api.put(`/progress/${editingLogId}`, payload);
                toast.success("Progress updated!");
            } else {
                await api.post('/progress', payload);
                toast.success("Progress logged!");
            }

            handleCancelEdit(); // Resets state and hides form
            fetchProgress();
        } catch (error) {
            toast.error(editingLogId ? "Failed to update progress" : "Failed to log progress");
        }
    };

    return (
        <div className="space-y-6 animate-fade-in pb-20">

            <div className="flex items-center justify-between">
                <div>
                    <button onClick={() => navigate('/trainer/members')} className="text-gray-500 hover:text-gray-900 flex items-center gap-1 text-sm font-bold mb-2 transition-colors">
                        <ChevronLeft size={16} /> Back to My Members
                    </button>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                        <Activity className="text-green-600" />
                        {member ? `${member.name}'s Progress` : 'Member Progress'}
                    </h1>
                </div>
                {!showAddForm && (
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-500/30"
                    >
                        <Plus size={20} /> Add Entry
                    </button>
                )}
            </div>

            {/* --- ADD / EDIT FORM --- */}
            {showAddForm && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-slide-up relative">
                    <button onClick={handleCancelEdit} className="absolute top-4 right-4 text-gray-400 hover:text-gray-900">
                        <X size={24} />
                    </button>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-2">
                            {editingLogId ? 'Edit Progress Entry' : 'New Progress Entry'}
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Weight (kg)</label>
                                <div className="relative">
                                    <Scale className="absolute left-3 top-3 text-gray-400" size={16} />
                                    <input type="number" step="0.1" className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.weight} onChange={e => setFormData({ ...formData, weight: e.target.value })} required />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">BMI</label>
                                <input type="number" step="0.1" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.bmi} onChange={e => setFormData({ ...formData, bmi: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Body Fat %</label>
                                <input type="number" step="0.1" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.body_fat_percentage} onChange={e => setFormData({ ...formData, body_fat_percentage: e.target.value })} />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2"><Ruler size={14} /> Measurements (cm/in)</label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <input placeholder="Chest" className="p-2 border rounded-lg text-sm"
                                    value={formData.measurements?.chest || ''} onChange={e => setFormData({ ...formData, measurements: { ...formData.measurements, chest: e.target.value } })} />
                                <input placeholder="Waist" className="p-2 border rounded-lg text-sm"
                                    value={formData.measurements?.waist || ''} onChange={e => setFormData({ ...formData, measurements: { ...formData.measurements, waist: e.target.value } })} />
                                <input placeholder="Arms" className="p-2 border rounded-lg text-sm"
                                    value={formData.measurements?.arms || ''} onChange={e => setFormData({ ...formData, measurements: { ...formData.measurements, arms: e.target.value } })} />
                                <input placeholder="Legs" className="p-2 border rounded-lg text-sm"
                                    value={formData.measurements?.legs || ''} onChange={e => setFormData({ ...formData, measurements: { ...formData.measurements, legs: e.target.value } })} />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Notes</label>
                            <textarea className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium h-24 resize-none"
                                placeholder="Any improvements or observations..."
                                value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} ></textarea>
                        </div>

                        <div className="flex gap-3">
                            <button type="button" onClick={handleCancelEdit} className="flex-1 bg-gray-100 text-gray-500 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all">
                                Cancel
                            </button>
                            <button type="submit" className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-all flex justify-center items-center gap-2">
                                <Save size={18} /> {editingLogId ? 'Update Entry' : 'Save Entry'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* --- HISTORY LIST --- */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 font-bold text-gray-900">
                    History
                </div>
                <div className="divide-y divide-gray-100">
                    {loading ? <div className="p-10 text-center text-gray-400">Loading...</div> :
                        logs.length === 0 ? <div className="p-10 text-center text-gray-400">No logs yet.</div> :
                            logs.map(log => (
                                <div key={log.log_id} className="p-6 hover:bg-gray-50 transition-colors group relative">
                                    <div className="flex flex-col md:flex-row justify-between gap-4 pr-16 md:pr-0">
                                        <div className="flex gap-4">
                                            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-xl flex flex-col items-center justify-center font-bold border border-blue-100 shrink-0">
                                                <span className="text-[10px] uppercase">{new Date(log.date).toLocaleString('default', { month: 'short' })}</span>
                                                <span className="text-xl leading-none">{new Date(log.date).getDate()}</span>
                                            </div>
                                            <div>
                                                <p className="text-gray-900 font-bold flex items-center gap-3">
                                                    {log.weight && <span>{log.weight} kg</span>}
                                                    {log.bmi && <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">BMI: {log.bmi}</span>}
                                                </p>
                                                <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-500">
                                                    {log.measurements && Object.entries(log.measurements).map(([k, v]) => (
                                                        v && <span key={k}>{k}: {v}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        {log.notes && (
                                            <p className="text-sm text-gray-600 italic max-w-sm bg-yellow-50 p-3 rounded-lg border border-yellow-100">"{log.notes}"</p>
                                        )}
                                    </div>

                                    {/* ACTIONS */}
                                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleEditClick(log)}
                                            className="p-2 bg-white border border-gray-200 rounded-lg text-blue-600 hover:bg-blue-50 shadow-sm"
                                            title="Edit"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteClick(log.log_id)}
                                            className="p-2 bg-white border border-gray-200 rounded-lg text-red-600 hover:bg-red-50 shadow-sm"
                                            title="Delete"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))
                    }
                </div>
            </div>
        </div>
    );
}
