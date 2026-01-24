import { useState, useRef, useEffect } from 'react'; // Added useEffect
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { User, Lock, Mail, Phone, Save, ShieldCheck, Edit2 } from 'lucide-react';

export default function MemberSettings() {
  const { user } = useAuth(); 
  const [activeTab, setActiveTab] = useState('ACCOUNT');
  const [loading, setLoading] = useState(true); // Loading state

  // Account State - Start empty, populate from DB
  const [accountData, setAccountData] = useState({
    name: '',
    email: '',
    phone: ''
  });

  // Password State
  const [passData, setPassData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Refs
  const nameInputRef = useRef(null);
  const emailInputRef = useRef(null);
  const phoneInputRef = useRef(null);

  // --- NEW: Fetch Fresh Data on Mount ---
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await api.get('/settings/account');
        setAccountData({
          name: res.data.name || '',
          email: res.data.email || '',
          phone: res.data.phone || ''
        });
      } catch (err) {
        console.error("Failed to load user settings", err);
        // Fallback to AuthContext if API fails
        setAccountData({
          name: user?.name || '',
          email: user?.email || '',
          phone: user?.phone || ''
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]); 
  // --------------------------------------

  const clearField = (field, ref) => {
    setAccountData(prev => ({ ...prev, [field]: '' }));
    setTimeout(() => ref.current?.focus(), 0);
  };

  const handleAccountUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.put('/settings/update-account', accountData);
      toast.success("Profile details updated! Please re-login to see changes.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passData.newPassword !== passData.confirmPassword) {
      return toast.error("New passwords do not match");
    }
    try {
      await api.put('/settings/change-password', passData);
      toast.success("Password changed successfully");
      setPassData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to change password");
    }
  };

  if (loading) return <div className="p-10 text-center text-gray-500">Loading settings...</div>;

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200 pb-1">
        <button 
          onClick={() => setActiveTab('ACCOUNT')}
          className={`pb-3 px-4 font-bold text-sm flex items-center gap-2 transition-colors ${
            activeTab === 'ACCOUNT' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <User className="w-4 h-4" /> Personal Details
        </button>
        <button 
          onClick={() => setActiveTab('SECURITY')}
          className={`pb-3 px-4 font-bold text-sm flex items-center gap-2 transition-colors ${
            activeTab === 'SECURITY' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Lock className="w-4 h-4" /> Security
        </button>
      </div>

      {/* --- ACCOUNT TAB --- */}
      {activeTab === 'ACCOUNT' && (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <form onSubmit={handleAccountUpdate} className="space-y-6 max-w-lg">
            
            {/* NAME FIELD */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
              <div className="relative group">
                <User className="absolute left-3 top-3 text-gray-400 w-5 h-5 pointer-events-none" />
                <input 
                  type="text" 
                  ref={nameInputRef}
                  className="w-full pl-10 pr-10 p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  value={accountData.name}
                  onChange={(e) => setAccountData({...accountData, name: e.target.value})}
                  placeholder="Your Full Name"
                />
                <button 
                  type="button"
                  onClick={() => clearField('name', nameInputRef)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-blue-600 transition-colors"
                  title="Clear and Edit"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* EMAIL FIELD */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-3 top-3 text-gray-400 w-5 h-5 pointer-events-none" />
                <input 
                  type="email" 
                  ref={emailInputRef}
                  className="w-full pl-10 pr-10 p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  value={accountData.email}
                  onChange={(e) => setAccountData({...accountData, email: e.target.value})}
                  placeholder="name@example.com"
                />
                <button 
                  type="button"
                  onClick={() => clearField('email', emailInputRef)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-blue-600 transition-colors"
                  title="Clear and Edit"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* PHONE FIELD */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Phone Number</label>
              <div className="relative group">
                <Phone className="absolute left-3 top-3 text-gray-400 w-5 h-5 pointer-events-none" />
                <input 
                  type="text" 
                  ref={phoneInputRef}
                  className="w-full pl-10 pr-10 p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  value={accountData.phone}
                  onChange={(e) => setAccountData({...accountData, phone: e.target.value})}
                  placeholder="e.g. 0712345678"
                />
                <button 
                  type="button"
                  onClick={() => clearField('phone', phoneInputRef)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-blue-600 transition-colors"
                  title="Clear and Edit"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <button type="submit" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 flex items-center gap-2 shadow-lg transition-transform active:scale-95">
              <Save className="w-4 h-4" /> Save Changes
            </button>
          </form>
        </div>
      )}

      {/* --- SECURITY TAB --- */}
      {activeTab === 'SECURITY' && (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <form onSubmit={handlePasswordChange} className="space-y-6 max-w-lg">
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Current Password</label>
              <input type="password" required
                className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                value={passData.currentPassword}
                onChange={(e) => setPassData({...passData, currentPassword: e.target.value})}
              />
            </div>

            <div className="border-t border-gray-100 pt-4">
              <label className="block text-sm font-bold text-gray-700 mb-1">New Password</label>
              <input type="password" required
                className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                value={passData.newPassword}
                onChange={(e) => setPassData({...passData, newPassword: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Confirm New Password</label>
              <input type="password" required
                className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                value={passData.confirmPassword}
                onChange={(e) => setPassData({...passData, confirmPassword: e.target.value})}
              />
            </div>

            <button type="submit" className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 flex items-center gap-2 shadow-lg transition-transform active:scale-95">
              <ShieldCheck className="w-4 h-4" /> Update Password
            </button>
          </form>
        </div>
      )}

    </div>
  );
}