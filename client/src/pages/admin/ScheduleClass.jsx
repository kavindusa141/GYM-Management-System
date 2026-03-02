import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
    Calendar, Clock, Users, ArrowLeft, Loader2, Save
} from 'lucide-react';
import TrainerAvailabilityCalendar from '../../components/TrainerAvailabilityCalendar';
import { useAuth } from '../../context/AuthContext';

export default function ScheduleClass() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { id } = useParams(); // If present, we are editing
    const isEditing = Boolean(id);

    const [loading, setLoading] = useState(false);
    const [trainers, setTrainers] = useState([]);

    // UI State for Availability Modal

    const [scheduleTrainerId, setScheduleTrainerId] = useState('');

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        trainer_id: '',
        class_date: new Date().toISOString().split('T')[0],
        start_time: '09:00',
        end_time: '10:00',
        capacity: 20,
        status: 'SCHEDULED'
    });

    useEffect(() => {
        fetchInitialData();
    }, [id]);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Trainers
            const trainersRes = await api.get('/admin/trainers');
            setTrainers(trainersRes.data);

            // 2. If Editing, Fetch Class Details
            if (isEditing) {
                // We might need an endpoint to get single class or filter from list
                // Typically: api.get(`/classes/${id}`)
                // Assuming we might need to fetch from list or single endpoint
                // Let's see if we have a single GET. The controller didn't explicitly show one but usually strictly following REST it might be there or we filter.
                // Re-reading controller: `exports.getAllClasses` and `exports.getTrainerClasses`.
                // It seems we might not have a public `GET /classes/:id` in the snippets I saw earlier? 
                // Wait, `updateClass` uses `findByPk(id)`. 
                // Let's assume we can fetch it. If not, I'll fix it. 
                // Actually `ManageClasses` fetched all. 
                // Let's try to fetch all and find, or assume a get endpoint exists.
                // The `class.controller.js` file showed `exports.updateClass`. 
                // It didn't explicitly show `exports.getClassById`.
                // I'll implement a simple fetch from the list for now to be safe, or just add the endpoint if needed.
                // Actually, let's just use the list endpoint and find it client side for now to minimize backend changes if not needed, 
                // OR better, add the endpoint comfortably. 
                // I will assume for this step I can just fetch all and find. 
                const clsRes = await api.get('/classes');
                const cls = clsRes.data.find(c => c.class_id == id);
                if (cls) {
                    setFormData({
                        title: cls.title || cls.name, // Handle potentially different field names from raw query
                        description: cls.description || '',
                        trainer_id: cls.trainer_id || '',
                        class_date: cls.class_date, // Might need formatting
                        start_time: cls.start_time,
                        end_time: cls.end_time,
                        capacity: cls.capacity,
                        status: cls.status
                    });
                    // Set initial trainer for schedule view if editing
                    if (cls.trainer_id) setScheduleTrainerId(cls.trainer_id);
                } else {
                    toast.error("Class not found");
                    navigate(`/${user?.role?.toLowerCase() || 'admin'}/classes`);
                }
            } else {
                // Set default trainer for schedule view
                if (trainersRes.data.length > 0) setScheduleTrainerId(trainersRes.data[0].user_id);
            }
        } catch (error) {
            console.error("Failed to load data", error);
            toast.error("Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.start_time >= formData.end_time) {
            toast.error("End time must be after start time");
            return;
        }

        setLoading(true);
        try {
            if (isEditing) {
                await api.put(`/classes/${id}`, formData);
                toast.success("Class updated successfully");
            } else {
                await api.post('/classes', formData);
                toast.success("Class scheduled successfully");
            }
            navigate(`/${user?.role?.toLowerCase() || 'admin'}/classes`);
        } catch (error) {
            if (error.response?.status === 409) {
                toast.error(error.response?.data?.message || "Trainer conflict");
            } else {
                toast.error(error.response?.data?.message || "Operation failed");
            }
        } finally {
            setLoading(false);
        }
    };

    const getMinTime = () => {
        const today = new Date().toISOString().split('T')[0];
        if (formData.class_date === today) {
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            return `${hours}:${minutes}`;
        }
        return "00:00";
    };

    return (
        <div className="max-w-5xl mx-auto pb-20 animate-fade-in text-left">
            {/* Back Button */}
            <button
                onClick={() => navigate(`/${user?.role?.toLowerCase() || 'admin'}/classes`)}
                className="mb-6 flex items-center gap-2 text-gray-500 hover:text-blue-600 font-medium transition-colors"
            >
                <ArrowLeft size={20} /> Back to Classes
            </button>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* LEFT: FORM */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-8 border-b border-gray-100 bg-gray-50/50">
                            <div className="flex items-center gap-4 mb-2">
                                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
                                    <Calendar size={24} />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-black text-gray-900">{isEditing ? 'Edit Class' : 'Schedule New Class'}</h1>
                                    <p className="text-gray-500 text-sm">Fill in the details below to schedule a gym class.</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-8">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Class Title</label>
                                    <input required type="text"
                                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:font-normal"
                                        placeholder="e.g. Morning Yoga Flow"
                                        value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    />
                                </div>

                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Date</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                            <input required type="date"
                                                className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gateway-200 rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                                min={new Date().toISOString().split('T')[0]}
                                                value={formData.class_date} onChange={e => setFormData({ ...formData, class_date: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Trainer</label>
                                        <div className="relative">
                                            <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                            <select
                                                className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                                                value={formData.trainer_id}
                                                onChange={(e) => {
                                                    setFormData({ ...formData, trainer_id: e.target.value });
                                                    setScheduleTrainerId(e.target.value); // Sync calendar view
                                                }}>
                                                <option value="">⊘ Unassigned</option>
                                                {trainers.map(t => (
                                                    <option key={t.user_id} value={t.user_id}>
                                                        {t.name} {!t.status ? '(Inactive)' : ''}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Start Time</label>
                                        <div className="relative">
                                            <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                            <input required type="time"
                                                className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                                min={getMinTime()}
                                                value={formData.start_time} onChange={e => setFormData({ ...formData, start_time: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">End Time</label>
                                        <div className="relative">
                                            <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                            <input required type="time"
                                                className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                                min={formData.start_time || "00:00"}
                                                value={formData.end_time} onChange={e => setFormData({ ...formData, end_time: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Capacity</label>
                                    <input required type="number" min="1"
                                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                        value={formData.capacity} onChange={e => setFormData({ ...formData, capacity: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Description</label>
                                    <textarea
                                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-500 resize-none h-32"
                                        placeholder="Details about the class workout..."
                                        value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    ></textarea>
                                </div>

                                <div className="pt-4">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 active:scale-95 flex justify-center items-center gap-2"
                                    >
                                        {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                                        {isEditing ? 'Save Changes' : 'Schedule Class'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                {/* RIGHT: TRAINER AVAILABILITY SIDEBAR */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sticky top-8">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Clock className="text-blue-500" size={20} /> Trainer Schedule
                        </h3>

                        <div className="mb-4">
                            <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Viewing Schedule For</label>
                            <select
                                className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold outline-none"
                                value={scheduleTrainerId}
                                onChange={(e) => setScheduleTrainerId(e.target.value)}
                            >
                                <option value="">Select a Trainer...</option>
                                {trainers.map(t => (
                                    <option key={t.user_id} value={t.user_id}>{t.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="pr-1">
                            <TrainerAvailabilityCalendar
                                trainerId={scheduleTrainerId}
                                trainerName={trainers.find(t => t.user_id == scheduleTrainerId)?.name}
                            />
                        </div>

                        <div className="mt-4 p-4 bg-blue-50 rounded-xl text-xs text-blue-700 leading-relaxed">
                            <strong>Tip:</strong> Check the calendar above to ensure your selected time slot doesn't conflict with the trainer's existing schedule.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
