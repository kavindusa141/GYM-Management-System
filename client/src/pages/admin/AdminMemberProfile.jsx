import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useParams, Link, useLocation } from 'react-router-dom';
import {
    User, Activity, Calendar, Phone, Weight, Ruler, Heart, FileText, ArrowLeft, Mail, Clock
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminMemberProfile() {
    const { id } = useParams();
    const location = useLocation();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState(null);

    const backLink = location.pathname.includes('/staff') ? '/staff/members' : '/admin/members';

    useEffect(() => {
        fetchMemberProfile();
    }, [id]);

    const fetchMemberProfile = async () => {
        try {
            const res = await api.get(`/admin/members/${id}/profile`);
            setProfile(res.data);
            // If the backend sends 'User' object nested in profile or as separate fields, handle it.
            // Our controller sends the profile object which INCLUDES 'User'.
            // If profile is null (just user info), the controller constructs a fake profile with User object.
            if (res.data.User) {
                setUserData(res.data.User);
            }
        } catch (error) {
            console.error("Failed to load profile", error);
            toast.error("Failed to load member profile");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    );

    if (!profile) return (
        <div className="p-10 text-center text-gray-500">Member not found.</div>
    );

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-fade-in pb-20">

            {/* Back Button */}
            <Link to={backLink} className="inline-flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors font-medium">
                <ArrowLeft size={20} /> Back to Members
            </Link>

            {/* Header Card */}
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">

                    {/* Avatar Circle */}
                    <div className="w-24 h-24 bg-white/10 backdrop-blur rounded-full flex items-center justify-center text-4xl font-bold border-4 border-white/20">
                        {userData?.name?.charAt(0) || 'U'}
                    </div>

                    <div className="text-center md:text-left flex-1">
                        <h1 className="text-3xl font-bold">{userData?.name}</h1>
                        <div className="flex flex-col md:flex-row gap-4 mt-2 text-gray-300 text-sm">
                            <span className="flex items-center gap-1 justify-center md:justify-start">
                                <Mail size={14} /> {userData?.email}
                            </span>
                            <span className="flex items-center gap-1 justify-center md:justify-start">
                                <Phone size={14} /> {userData?.phone}
                            </span>
                        </div>

                        <div className="flex items-center justify-center md:justify-start gap-3 mt-4">
                            <span className="bg-blue-600/50 px-3 py-1 rounded-full text-xs font-bold border border-blue-400/30">
                                {userData?.member_code || 'NO ID'}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${userData?.status
                                ? 'bg-green-600/50 border-green-400/30'
                                : 'bg-red-600/50 border-red-400/30'
                                }`}>
                                {userData?.status ? 'Verified' : 'Unverified'}
                            </span>
                            <span className="bg-gray-700/50 px-3 py-1 rounded-full text-xs font-bold border border-gray-600/30 flex items-center gap-1">
                                <Clock size={12} /> Joined: {new Date(userData?.created_at).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">

                {/* Left Column: Physical Stats */}
                <div className="md:col-span-1 space-y-6">
                    {/* BMI Card */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
                        <h3 className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-2">BMI Score</h3>
                        <div className="text-4xl font-black text-blue-600 mb-1">{profile.bmi || '--'}</div>
                        <p className="text-xs text-gray-400">Body Mass Index</p>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-gray-800 font-bold mb-4 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-blue-500" /> Physical Stats
                        </h3>
                        <ul className="space-y-4">
                            <li className="flex justify-between items-center border-b border-gray-50 pb-2">
                                <span className="text-gray-500 text-sm flex items-center gap-2"><Calendar className="w-4 h-4" /> Age</span>
                                <span className="font-bold text-gray-900">{profile.age ? `${profile.age} years` : '--'}</span>
                            </li>
                            <li className="flex justify-between items-center border-b border-gray-50 pb-2">
                                <span className="text-gray-500 text-sm flex items-center gap-2"><Weight className="w-4 h-4" /> Weight</span>
                                <span className="font-bold text-gray-900">{profile.weight ? `${profile.weight} kg` : '--'}</span>
                            </li>
                            <li className="flex justify-between items-center border-b border-gray-50 pb-2">
                                <span className="text-gray-500 text-sm flex items-center gap-2"><Ruler className="w-4 h-4" /> Height</span>
                                <span className="font-bold text-gray-900">{profile.height ? `${profile.height} cm` : '--'}</span>
                            </li>
                            <li className="flex justify-between items-center pt-2">
                                <span className="text-gray-500 text-sm flex items-center gap-2"><User className="w-4 h-4" /> Gender</span>
                                <span className="font-bold text-gray-900">{profile.gender || '--'}</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Right Column: Detailed Info */}
                <div className="md:col-span-2 space-y-6">

                    {/* Goals Section */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-gray-800 font-bold mb-4 flex items-center gap-2">
                            <Heart className="w-5 h-5 text-red-500" /> Goals & Activity
                        </h3>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                                <p className="text-xs text-orange-600 font-bold uppercase mb-1">Primary Goal</p>
                                <p className="text-lg font-bold text-gray-900">{profile.fitness_goal || 'Not specified'}</p>
                            </div>
                            <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                                <p className="text-xs text-purple-600 font-bold uppercase mb-1">Activity Level</p>
                                <p className="text-lg font-bold text-gray-900">{profile.activity_level || 'Not specified'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Contact & Medical */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-gray-800 font-bold mb-4 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-gray-500" /> Medical & Emergency
                        </h3>

                        <div className="grid sm:grid-cols-2 gap-6">
                            <div>
                                <label className="text-xs text-gray-400 font-bold uppercase">Emergency Contact</label>
                                <p className="font-medium text-gray-900 mt-1 text-red-600 bg-red-50 inline-block px-2 py-1 rounded text-sm">
                                    {profile.emergency_contact || 'None'}
                                </p>
                            </div>
                            <div className="sm:col-span-2">
                                <label className="text-xs text-gray-400 font-bold uppercase">Medical Conditions</label>
                                <p className="font-medium text-gray-700 mt-1 bg-gray-50 p-3 rounded-xl text-sm leading-relaxed">
                                    {profile.medical_conditions || "None listed."}
                                </p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
