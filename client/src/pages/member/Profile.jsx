import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Link } from 'react-router-dom';
import { 
  User, Edit, Activity, Calendar, Phone, Weight, Ruler, Heart, FileText 
} from 'lucide-react';

export default function MemberProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/member/profile')
      .then(res => setProfile(res.data))
      .catch(err => console.error("Failed to load profile", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-10 text-center text-gray-500">Loading Profile...</div>;

  if (!profile || !profile.profile_id) {
    return (
      <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
        <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900">Profile Not Setup</h2>
        <p className="text-gray-500 mb-6">Please complete your profile to get started.</p>
        <Link to="/member/profile-setup" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition">
          Setup Profile
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      
      {/* Header Card */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
          
          {/* Avatar Circle */}
          <div className="w-24 h-24 bg-white/10 backdrop-blur rounded-full flex items-center justify-center text-4xl font-bold border-4 border-white/20">
            {profile.User?.name?.charAt(0) || 'U'}
          </div>

          <div className="text-center md:text-left">
            <h1 className="text-3xl font-bold">{profile.User?.name}</h1>
            <p className="text-blue-200 font-mono mt-1">{profile.User?.email}</p>
            <div className="flex items-center justify-center md:justify-start gap-3 mt-3">
              <span className="bg-blue-600/50 px-3 py-1 rounded-full text-xs font-bold border border-blue-400/30">
                {profile.User?.member_code}
              </span>
              <span className="bg-green-600/50 px-3 py-1 rounded-full text-xs font-bold border border-green-400/30">
                Active Member
              </span>
            </div>
          </div>

          <Link to="/member/profile-setup" className="md:ml-auto bg-white text-slate-900 px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-100 transition shadow-lg">
            <Edit className="w-4 h-4" /> Edit Profile
          </Link>
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
                <span className="text-gray-500 text-sm flex items-center gap-2"><Calendar className="w-4 h-4"/> Age</span>
                <span className="font-bold text-gray-900">{profile.age} years</span>
              </li>
              <li className="flex justify-between items-center border-b border-gray-50 pb-2">
                <span className="text-gray-500 text-sm flex items-center gap-2"><Weight className="w-4 h-4"/> Weight</span>
                <span className="font-bold text-gray-900">{profile.weight} kg</span>
              </li>
              <li className="flex justify-between items-center border-b border-gray-50 pb-2">
                <span className="text-gray-500 text-sm flex items-center gap-2"><Ruler className="w-4 h-4"/> Height</span>
                <span className="font-bold text-gray-900">{profile.height} cm</span>
              </li>
              <li className="flex justify-between items-center pt-2">
                <span className="text-gray-500 text-sm flex items-center gap-2"><User className="w-4 h-4"/> Gender</span>
                <span className="font-bold text-gray-900">{profile.gender}</span>
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
            <div className="grid gap-4">
              <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                <p className="text-xs text-orange-600 font-bold uppercase mb-1">Primary Goal</p>
                <p className="text-lg font-bold text-gray-900">{profile.fitness_goal}</p>
              </div>
            </div>
          </div>

          {/* Contact & Medical */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-gray-800 font-bold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-500" /> Personal Details
            </h3>
            
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <label className="text-xs text-gray-400 font-bold uppercase">Phone Number</label>
                <p className="font-medium text-gray-900 mt-1 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" /> {profile.User?.phone}
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-400 font-bold uppercase">Emergency Contact</label>
                <p className="font-medium text-gray-900 mt-1 text-red-600 bg-red-50 inline-block px-2 py-1 rounded text-sm">
                  {profile.emergency_contact}
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