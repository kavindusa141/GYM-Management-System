import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { User, Lock, Save, Settings as SettingsIcon, Globe, Edit2, Phone, Mail, MessageSquare } from 'lucide-react';
import MemberSettings from '../member/Settings';

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState('SYSTEM');

  // System Config State (Added email/phone/whatsapp)
  const [systemConfig, setSystemConfig] = useState({
    system_name: '',
    gym_location: '',
    contact_email: '',
    contact_phone: '',
    whatsapp_enabled: 'false',
    whatsapp_provider: 'mock',
    whatsapp_api_key: '',
    whatsapp_instance_id: ''
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
        <button
          onClick={() => setActiveTab('NOTIFICATIONS')}
          className={`pb-3 px-4 font-bold text-sm flex items-center gap-2 transition-colors ${activeTab === 'NOTIFICATIONS' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          <MessageSquare className="w-4 h-4" /> Notifications
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
      ) : activeTab === 'NOTIFICATIONS' ? (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <div className="mb-6 p-4 bg-green-50 text-green-800 rounded-xl text-sm flex items-start gap-3">
            <MessageSquare className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">WhatsApp API Configuration</p>
              <p>Configure automated WhatsApp reminders for members (e.g., expiring subscriptions, upcoming classes).</p>
            </div>
          </div>

          <form onSubmit={handleSystemUpdate} className="space-y-6 max-w-lg">

            {/* ENABLE/DISABLE TOGGLE */}
            <div className="flex items-center justify-between p-4 border rounded-xl bg-slate-50">
              <div>
                <h3 className="font-bold text-gray-900">Enable WhatsApp Notifications</h3>
                <p className="text-sm text-gray-500">Master switch to turn on/off all automated messages.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={systemConfig.whatsapp_enabled === 'true'}
                  onChange={(e) => setSystemConfig({ ...systemConfig, whatsapp_enabled: e.target.checked ? 'true' : 'false' })}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>

            {/* PROVIDER DROPDOWN */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">API Provider</label>
              <select
                className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-green-500 outline-none bg-white"
                value={systemConfig.whatsapp_provider || 'mock'}
                onChange={(e) => setSystemConfig({ ...systemConfig, whatsapp_provider: e.target.value })}
              >
                <option value="mock">Mock Console Logging (Testing)</option>
                <option value="ultramsg">UltraMsg API Provider</option>
                <option value="meta">Official Meta Cloud API</option>
                <option value="twilio">Twilio WhatsApp API</option>
              </select>
            </div>

            {/* API KEY */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">API Key / Token</label>
              <input type="text"
                className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                value={systemConfig.whatsapp_api_key || ''}
                onChange={(e) => setSystemConfig({ ...systemConfig, whatsapp_api_key: e.target.value })}
                placeholder="Enter provider API key/token"
              />
            </div>

            {/* INSTANCE ID */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Instance ID / Origin</label>
              <input type="text"
                className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                value={systemConfig.whatsapp_instance_id || ''}
                onChange={(e) => setSystemConfig({ ...systemConfig, whatsapp_instance_id: e.target.value })}
                placeholder="Enter instance ID (e.g. for UltraMsg/WATI)"
              />
            </div>

            <button type="submit" className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700 flex items-center gap-2 shadow-lg transition-transform active:scale-95">
              <Save className="w-4 h-4" /> Save API Config
            </button>
          </form>
        </div>
      ) : (
        <MemberSettings />
      )}
    </div>
  );
}