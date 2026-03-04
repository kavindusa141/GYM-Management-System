import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  CheckCircle, User, Clock, QrCode, LogOut, Timer, Activity, Search, AlertCircle
} from 'lucide-react';
import QRCode from "react-qr-code"; 

export default function Attendance() {
  const [activeTab, setActiveTab] = useState('MANUAL'); 
  const [memberCode, setMemberCode] = useState('');
  const [todayRecords, setTodayRecords] = useState([]);
  const [qrPayload, setQrPayload] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastScan, setLastScan] = useState(null);

  const inputRef = useRef(null);

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

  // 3. Handle Manual Check-In (Big Card Logic)
  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!memberCode) return;
    setLoading(true);
    setLastScan(null);

    try {
      const res = await api.post('/attendance/checkin', { member_code: memberCode });
      
      // Success Logic
      toast.success(res.data.message);
      setLastScan({ status: 'success', msg: res.data.message, member: res.data.member });
      
      setMemberCode(''); 
      fetchToday(); 
    } catch (error) {
      // Error Logic
      const errMsg = error.response?.data?.message || "Check-in failed";
      toast.error(errMsg);
      setLastScan({ status: 'error', msg: errMsg });
      setMemberCode('');
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance Manager</h1>
          <p className="text-gray-500">Manage daily check-ins and kiosk settings.</p>
        </div>
        
        {/* TABS */}
        <div className="flex p-1 bg-white border border-gray-200 rounded-xl">
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
            <QrCode className="w-4 h-4"/> QR Kiosk Display
          </button>
        </div>
      </div>

      {/* --- ACTION AREA --- */}
      {activeTab === 'MANUAL' ? (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* BIG COLORFUL INPUT CARD */}
          <div className="bg-white p-8 rounded-3xl shadow-xl border-2 border-blue-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Activity size={150} />
            </div>

            <form onSubmit={handleManualSubmit} className="relative z-10 space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Enter Member ID
                </label>
                <div className="relative">
                  <Search className="absolute left-5 top-5 text-gray-400 w-6 h-6" />
                  <input 
                    ref={inputRef}
                    type="text" 
                    placeholder="RFK-M-..." 
                    className="w-full pl-14 pr-4 py-4 text-2xl font-mono font-bold border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all uppercase placeholder:text-gray-300"
                    value={memberCode}
                    onChange={(e) => setMemberCode(e.target.value)}
                    disabled={loading}
                    autoFocus
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className={`w-full py-5 rounded-xl font-black text-xl shadow-lg transform transition-all active:scale-95 flex items-center justify-center gap-3
                  ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-blue-500/30'}
                `}
              >
                {loading ? 'Processing...' : (
                  <>
                    CHECK IN / OUT <Clock className="w-6 h-6" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* FEEDBACK BOX */}
          <div className="flex flex-col justify-center">
            {lastScan ? (
              <div className={`p-6 rounded-2xl border-l-8 shadow-sm animate-fade-in-up h-full flex flex-col justify-center ${
                lastScan.status === 'success' ? 'bg-green-50 border-green-500 text-green-900' : 'bg-red-50 border-red-500 text-red-900'
              }`}>
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-full ${lastScan.status === 'success' ? 'bg-green-200' : 'bg-red-200'}`}>
                    {lastScan.status === 'success' ? <CheckCircle size={32} /> : <AlertCircle size={32} />}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{lastScan.status === 'success' ? 'Success' : 'Error'}</h3>
                    <p className="text-lg font-medium mt-1">{lastScan.msg}</p>
                    {lastScan.member && <p className="text-sm font-bold uppercase opacity-80 mt-1">Member: {lastScan.member}</p>}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center text-gray-400 p-8">
                <Search className="w-12 h-12 mb-2 opacity-50" />
                <p className="font-bold">Ready to Scan</p>
                <p className="text-sm">Enter a Member ID to see details here.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        // QR MODE
        <div className="bg-white p-8 rounded-2xl shadow-xl border-2 border-purple-100 flex flex-col items-center text-center">
          <h3 className="text-xl font-black text-gray-900 mb-2">Scan to Check-In/Out</h3>
          <p className="text-sm text-gray-500 mb-6">Display this screen on a tablet or monitor.</p>
          <div className="p-4 bg-white border-4 border-gray-900 rounded-xl shadow-lg">
            {qrPayload ? <QRCode value={qrPayload} size={250} level="H" /> : <p className="text-sm text-gray-400">Loading Code...</p>}
          </div>
          <div className="mt-6 flex items-center gap-2 text-xs font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-100">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Live Kiosk Active
          </div>
        </div>
      )}

      {/* --- DETAILED HISTORY TABLE (Use for both) --- */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
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
                    <p className="text-lg font-bold text-gray-900 font-mono tracking-tight leading-none">
                      {record.check_in?.slice(0, 5)} 
                      {record.check_out && <span className="text-gray-400 mx-1">➜</span>}
                      <span className="text-gray-500">{record.check_out?.slice(0, 5)}</span>
                    </p>
                    
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
  );
}