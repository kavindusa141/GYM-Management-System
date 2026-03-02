import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { User, Lock, Save, Settings as SettingsIcon, Globe, Edit2, Phone, Mail } from 'lucide-react';
import MemberSettings from '../member/Settings';

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState('SYSTEM');

  // System Config State (Added email/phone)
  const [systemConfig, setSystemConfig] = useState({
    system_name: '',
    gym_location: '',
    contact_email: '',
    contact_phone: ''
  });

  const sysNameRef = useRef(null);
  const locationRef = useRef(null);
  const emailRef = useRef(null);
  const phoneRef = useRef(null);

  useEffect(() => {
    api.get('/settings/public-config')
      .then(res => setSystemConfig(res.data))
      .catch(err => console.error(err));
  }, []);

  const clearField = (field, ref) => {
    setSystemConfig(prev => ({ ...prev, [field]: '' }));
    setTimeout(() => ref.current?.focus(), 0);
  };

  const handleSystemUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.put('/settings/system-config', systemConfig);
      toast.success("System updated! Refresh to see changes.");
    } catch (err) {
      toast.error("Failed to update system settings");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900">Admin Settings</h1>

      <div className="flex gap-4 border-b border-gray-200 pb-1">
        <button
          onClick={() => setActiveTab('SYSTEM')}
          className={`pb-3 px-4 font-bold text-sm flex items-center gap-2 transition-colors ${activeTab === 'SYSTEM' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          <Globe className="w-4 h-4" /> System Config
        </button>
        <button
          onClick={() => setActiveTab('PERSONAL')}
          className={`pb-3 px-4 font-bold text-sm flex items-center gap-2 transition-colors ${activeTab === 'PERSONAL' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          <User className="w-4 h-4" /> My Account
        </button>
      </div>

      {activeTab === 'SYSTEM' ? (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <div className="mb-6 p-4 bg-purple-50 text-purple-800 rounded-xl text-sm flex items-start gap-3">
            <SettingsIcon className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Global Configuration</p>
              <p>Updates here reflect on the public Landing Page immediately.</p>
            </div>
          </div>

          <form onSubmit={handleSystemUpdate} className="space-y-6 max-w-lg">

            {/* SYSTEM NAME */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">System Name (Brand)</label>
              <div className="relative group">
                <input type="text" ref={sysNameRef}
                  className="w-full pr-10 p-3 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                  value={systemConfig.system_name}
                  onChange={(e) => setSystemConfig({ ...systemConfig, system_name: e.target.value })}
                />
                <button type="button" onClick={() => clearField('system_name', sysNameRef)} className="absolute right-3 top-3 text-gray-400 hover:text-purple-600">
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* GYM LOCATION */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Gym Location</label>
              <div className="relative group">
                <input type="text" ref={locationRef}
                  className="w-full pr-10 p-3 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                  value={systemConfig.gym_location}
                  onChange={(e) => setSystemConfig({ ...systemConfig, gym_location: e.target.value })}
                />
                <button type="button" onClick={() => clearField('gym_location', locationRef)} className="absolute right-3 top-3 text-gray-400 hover:text-purple-600">
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* CONTACT EMAIL */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Public Contact Email</label>
              <div className="relative group">
                <Mail className="absolute left-3 top-3 text-gray-400 w-5 h-5 pointer-events-none" />
                <input type="email" ref={emailRef}
                  className="w-full pl-10 pr-10 p-3 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                  value={systemConfig.contact_email}
                  onChange={(e) => setSystemConfig({ ...systemConfig, contact_email: e.target.value })}
                />
                <button type="button" onClick={() => clearField('contact_email', emailRef)} className="absolute right-3 top-3 text-gray-400 hover:text-purple-600">
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* CONTACT PHONE */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Public Contact Phone</label>
              <div className="relative group">
                <Phone className="absolute left-3 top-3 text-gray-400 w-5 h-5 pointer-events-none" />
                <input type="text" ref={phoneRef}
                  className="w-full pl-10 pr-10 p-3 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                  value={systemConfig.contact_phone}
                  onChange={(e) => setSystemConfig({ ...systemConfig, contact_phone: e.target.value })}
                />
                <button type="button" onClick={() => clearField('contact_phone', phoneRef)} className="absolute right-3 top-3 text-gray-400 hover:text-purple-600">
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <button type="submit" className="bg-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-purple-700 flex items-center gap-2 shadow-lg transition-transform active:scale-95">
              <Save className="w-4 h-4" /> Save Configuration
            </button>
          </form>
        </div>
      ) : (
        <MemberSettings />
      )}
    </div>
  );
}