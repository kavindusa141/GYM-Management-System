import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  CheckCircle, Smartphone, User, Clock, QrCode, LogOut, Timer
} from 'lucide-react';
import QRCode from "react-qr-code"; 

export default function Attendance() {
  const [activeTab, setActiveTab] = useState('MANUAL'); 
  const [memberCode, setMemberCode] = useState('');
  const [todayRecords, setTodayRecords] = useState([]);
  const [qrPayload, setQrPayload] = useState('');
  const [loading, setLoading] = useState(false);

  // 1. Fetch Today's List
  const fetchToday = async () => {
    try {
      const res = await api.get('/attendance/today');
      setTodayRecords(res.data);
    } catch (error) {
      console.error("Error loading list");
    }
  };

  // 2. Fetch QR Payload
  const fetchQR = async () => {
    try {
      const res = await api.get('/attendance/qr-generate');
      setQrPayload(res.data.payload);
    } catch (error) {
      toast.error("Failed to generate QR");
    }
  };

  useEffect(() => {
    fetchToday();
    if (activeTab === 'QR') fetchQR();
    const interval = setInterval(fetchToday, 10000);
    return () => clearInterval(interval);
  }, [activeTab]);

  // 3. Handle Manual Check-In
  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!memberCode) return;
    setLoading(true);

    try {
      const res = await api.post('/attendance/checkin', { member_code: memberCode });
      toast.success(res.data.message);
      setMemberCode(''); 
      fetchToday(); 
    } catch (error) {
      toast.error(error.response?.data?.message || "Check-in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance Manager</h1>
          <p className="text-gray-500">Track check-ins via Manual Entry or QR Kiosk.</p>
        </div>
      </div>

      {/* --- TABS --- */}
      <div className="flex p-1 bg-white border border-gray-200 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('MANUAL')}
          className={`px-4 py-2 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${activeTab === 'MANUAL' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          <User className="w-4 h-4"/> Manual Entry
        </button>
        <button
          onClick={() => setActiveTab('QR')}
          className={`px-4 py-2 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${activeTab === 'QR' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          <QrCode className="w-4 h-4"/> QR Kiosk
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* --- LEFT COLUMN: ACTION AREA --- */}
        <div className="lg:col-span-1">
          
          {activeTab === 'MANUAL' ? (
            // MODE A: MANUAL FORM
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-6">
              <h3 className="text-lg font-bold mb-4 text-gray-800">Front Desk Check-in</h3>
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Member ID / Code</label>
                  <input 
                    type="text" 
                    placeholder="e.g. RFK-M-001"
                    className="w-full p-4 text-lg font-mono border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none uppercase bg-gray-50 focus:bg-white transition-all"
                    value={memberCode}
                    onChange={(e) => setMemberCode(e.target.value)}
                    autoFocus
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg active:scale-95"
                >
                  {loading ? "Processing..." : "Mark Present / Out"}
                </button>
              </form>
            </div>
          ) : (
            // MODE B: QR KIOSK DISPLAY
            <div className="bg-white p-8 rounded-2xl shadow-xl border-2 border-purple-100 flex flex-col items-center text-center sticky top-6">
              <h3 className="text-xl font-black text-gray-900 mb-2">Scan to Check-In/Out</h3>
              <p className="text-sm text-gray-500 mb-6">Display this screen to members.</p>
              
              <div className="p-4 bg-white border-4 border-gray-900 rounded-xl shadow-lg">
                {qrPayload ? (
                  <QRCode 
                    value={qrPayload} 
                    size={200}
                    level="H" 
                  />
                ) : (
                  <p className="text-sm text-gray-400">Loading Code...</p>
                )}
              </div>

              <div className="mt-6 flex items-center gap-2 text-xs font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-100">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Live Kiosk Active
              </div>
            </div>
          )}
        </div>

        {/* --- RIGHT COLUMN: LIVE LOG --- */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[500px]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-500"/> Today's Activity
              </h3>
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold border border-green-200">
                {todayRecords.length} Records
              </span>
            </div>

            <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
              {todayRecords.length === 0 ? (
                <div className="p-10 text-center text-gray-500 flex flex-col items-center justify-center h-64">
                   <Clock className="w-10 h-10 text-gray-200 mb-2"/>
                   <p>No activity yet today.</p>
                </div>
              ) : (
                todayRecords.map((record) => (
                  <div key={record.attendance_id} className="p-4 flex items-center justify-between hover:bg-blue-50 transition-colors animate-fade-in">
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg 
                        ${record.status === 'CHECKED_OUT' ? 'bg-gray-100 text-gray-500' : 'bg-blue-100 text-blue-600'}`}>
                        {record.User?.name?.charAt(0) || '?'}
                      </div>
                      
                      {/* User Info */}
                      <div>
                        <p className="font-bold text-gray-900">{record.User?.name || 'Unknown'}</p>
                        <p className="text-xs text-gray-500 font-mono font-bold bg-gray-100 inline px-1 rounded">
                          {record.User?.member_code}
                        </p>
                      </div>
                    </div>

                    {/* Time Stamp & Status */}
                    <div className="text-right">
                      <div className="flex flex-col items-end">
                        {/* Check-In Time */}
                        <p className="text-lg font-bold text-gray-900 font-mono tracking-tight leading-none">
                          {record.check_in?.slice(0, 5)} 
                          {record.check_out && <span className="text-gray-400 mx-1">➜</span>}
                          <span className="text-gray-500">{record.check_out?.slice(0, 5)}</span>
                        </p>
                        
                        {/* Status Badge */}
                        <div className="flex items-center gap-2 mt-1">
                          {record.status === 'CHECKED_OUT' ? (
                            <>
                              <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded flex items-center gap-1">
                                <LogOut className="w-3 h-3" /> Checked Out
                              </span>
                              {record.duration && (
                                <span className="text-xs font-bold text-blue-600 flex items-center gap-1">
                                  <Timer className="w-3 h-3" /> {record.duration}m
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded flex items-center gap-1 border border-green-100">
                              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> In Gym
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}