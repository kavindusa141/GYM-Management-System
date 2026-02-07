import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
    Users, Activity, Dumbbell, ChevronRight, Mail
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TrainerMembers() {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchMembers();
    }, []);

    const fetchMembers = async () => {
        try {
            const res = await api.get('/assignments/trainer/me');
            setMembers(res.data);
        } catch (error) {
            toast.error("Failed to load assigned members");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in pb-20">

            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-black text-gray-900">My Members</h1>
                <p className="text-gray-500">Manage workout plans and progress for your assigned members.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {loading ? (
                    <div className="col-span-full p-10 text-center text-gray-400">Loading members...</div>
                ) : members.length === 0 ? (
                    <div className="col-span-full p-10 text-center text-gray-400">No members assigned to you yet.</div>
                ) : (
                    members.map(assignment => {
                        const member = assignment.Member;
                        return (
                            <div key={assignment.assignment_id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col gap-4 hover:shadow-md transition-all">

                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg">
                                        {member.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">{member.name}</h3>
                                        <div className="flex items-center gap-1 text-xs text-gray-500">
                                            <Mail size={12} /> {member.email}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 mt-2">
                                    <button
                                        onClick={() => navigate(`/trainer/members/${member.user_id}/progress`)}
                                        className="flex flex-col items-center justify-center gap-2 p-3 bg-green-50 text-green-700 rounded-xl hover:bg-green-100 transition-colors font-bold text-xs"
                                    >
                                        <Activity size={18} /> Track Progress
                                    </button>
                                    <button
                                        onClick={() => navigate('/trainer/create-plan', { state: { memberId: member.user_id } })}
                                        className="flex flex-col items-center justify-center gap-2 p-3 bg-orange-50 text-orange-700 rounded-xl hover:bg-orange-100 transition-colors font-bold text-xs"
                                    >
                                        <Dumbbell size={18} /> Workout Plan
                                    </button>
                                </div>

                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
