import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
    Users, UserPlus, Trash2, Search, CheckCircle, X, Loader2, Filter, UserCheck, Dumbbell, MoreVertical, Edit2
} from 'lucide-react';

export default function AssignTrainer() {
    const [members, setMembers] = useState([]);
    const [trainers, setTrainers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterAssigned, setFilterAssigned] = useState('ALL'); // ALL, ASSIGNED, UNASSIGNED

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState(null);
    const [selectedTrainer, setSelectedTrainer] = useState(null);
    const [assigning, setAssigning] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [membersRes, trainersRes] = await Promise.all([
                api.get('/assignments/eligible-members'), // Now returns augmented data
                api.get('/assignments/trainers-load')     // New endpoint
            ]);
            setMembers(membersRes.data);
            setTrainers(trainersRes.data);
        } catch (error) {
            toast.error("Failed to load data");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Filter Logic
    const filteredMembers = members.filter(m => {
        if (filterAssigned === 'ASSIGNED') return m.is_assigned;
        if (filterAssigned === 'UNASSIGNED') return !m.is_assigned;
        return true;
    });

    const openAssignModal = (member) => {
        setSelectedMember(member);
        setSelectedTrainer(member.assigned_trainer?.user_id || null); // Pre-select if editing
        setIsModalOpen(true);
    };

    const handleAssignSubscriber = async () => {
        if (!selectedTrainer) {
            toast.error("Please select a trainer");
            return;
        }

        setAssigning(true);
        try {
            await api.post('/assignments', {
                member_id: selectedMember.user_id,
                trainer_id: selectedTrainer
            });
            toast.success(selectedMember.is_assigned ? "Assignment updated!" : "Trainer assigned successfully!");

            // Refresh Data
            await fetchData();
            setIsModalOpen(false);
        } catch (error) {
            toast.error(error.response?.data?.message || "Assignment failed");
        } finally {
            setAssigning(false);
        }
    };

    const handleRemoveAssignment = async (assignmentId) => {
        if (!window.confirm("Are you sure you want to remove this trainer?")) return;
        try {
            await api.delete(`/assignments/${assignmentId}`);
            toast.success("Assignment removed");
            fetchData();
        } catch (error) {
            toast.error("Failed to remove assignment");
        }
    };

    return (
        <div className="space-y-6 animate-fade-in pb-20">

            {/* HEADINGS & FILTERS */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Member Assignments</h1>
                    <p className="text-gray-500">Manage personal trainer allocations.</p>
                </div>

                <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
                    <button
                        onClick={() => setFilterAssigned('ALL')}
                        className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${filterAssigned === 'ALL' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setFilterAssigned('UNASSIGNED')}
                        className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${filterAssigned === 'UNASSIGNED' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        Needs Trainer
                    </button>
                    <button
                        onClick={() => setFilterAssigned('ASSIGNED')}
                        className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${filterAssigned === 'ASSIGNED' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        Assigned
                    </button>
                </div>
            </div>

            {/* MEMBER GRID */}
            {loading ? (
                <div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-600" size={40} /></div>
            ) : filteredMembers.length === 0 ? (
                <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-gray-300">
                    <Users className="mx-auto text-gray-300 mb-4" size={48} />
                    <p className="text-gray-500 font-medium">No members match your filter.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {filteredMembers.map(member => (
                        <div key={member.user_id} className="group bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-lg transition-all duration-300 relative overflow-hidden">

                            {/* Status Stripe */}
                            <div className={`absolute top-0 left-0 w-1 h-full ${member.is_assigned ? 'bg-green-500' : 'bg-orange-400'}`} />

                            <div className="flex justify-between items-start mb-4 pl-3">
                                <div>
                                    <h3 className="font-bold text-gray-900 text-lg leading-tight">{member.name}</h3>
                                    <p className="text-xs text-gray-400 mt-1">{member.email}</p>
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600 px-2 py-1 rounded-md">
                                    {member.current_plan}
                                </span>
                            </div>

                            <div className="pl-3 space-y-4">
                                {member.is_assigned ? (
                                    <div className="bg-green-50 rounded-xl p-3 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-green-200 flex items-center justify-center text-green-700">
                                                <UserCheck size={16} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-green-600 uppercase">Assigned To</p>
                                                <p className="text-sm font-bold text-green-900">{member.assigned_trainer?.name}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveAssignment(member.assignment_id)}
                                            className="p-1.5 hover:bg-white rounded-full text-green-600 hover:text-red-500 transition-colors"
                                            title="Remove Assignment"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="bg-orange-50 rounded-xl p-3 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-orange-200 flex items-center justify-center text-orange-700 shrink-0">
                                            <Search size={16} />
                                        </div>
                                        <p className="text-xs font-medium text-orange-800">
                                            This member needs a trainer.
                                        </p>
                                    </div>
                                )}

                                <button
                                    onClick={() => openAssignModal(member)}
                                    className={`w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${member.is_assigned
                                            ? 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                            : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/30'
                                        }`}
                                >
                                    {member.is_assigned ? (
                                        <> <Edit2 size={16} /> Change Trainer </>
                                    ) : (
                                        <> <UserPlus size={16} /> Assign Trainer </>
                                    )}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ASSIGNMENT MODAL */}
            {isModalOpen && selectedMember && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />

                    <div className="bg-white rounded-2xl w-full max-w-md p-6 relative z-10 animate-in fade-in zoom-in duration-200 shadow-2xl">
                        <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-900">
                            <X size={24} />
                        </button>

                        <h2 className="text-xl font-black text-gray-900 mb-1">Select Trainer</h2>
                        <p className="text-sm text-gray-500 mb-6">Assigning for <span className="font-bold text-gray-800">{selectedMember.name}</span></p>

                        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                            {trainers.map(trainer => (
                                <button
                                    key={trainer.user_id}
                                    onClick={() => setSelectedTrainer(trainer.user_id)}
                                    className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${selectedTrainer === trainer.user_id
                                            ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500/20'
                                            : 'border-gray-100 hover:border-blue-200 hover:bg-gray-50'
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${selectedTrainer === trainer.user_id ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                                            }`}>
                                            {trainer.name.charAt(0)}
                                        </div>
                                        <div className="text-left">
                                            <p className={`font-bold ${selectedTrainer === trainer.user_id ? 'text-blue-900' : 'text-gray-900'}`}>{trainer.name}</p>
                                            <p className="text-xs text-gray-500">Personal Trainer</p>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <div className={`text-xs font-bold px-2 py-1 rounded-full ${trainer.active_members_count > 5
                                                ? 'bg-orange-100 text-orange-700'
                                                : 'bg-green-100 text-green-700'
                                            }`}>
                                            {trainer.active_members_count} Clients
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>

                        <div className="mt-6 pt-4 border-t border-gray-100 flex gap-3">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="flex-1 py-3 font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAssignSubscriber}
                                disabled={assigning || !selectedTrainer}
                                className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:shadow-none flex justify-center items-center gap-2"
                            >
                                {assigning ? <Loader2 className="animate-spin" /> : <CheckCircle size={20} />}
                                Confirm Assignment
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
