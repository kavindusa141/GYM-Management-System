import { useState } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner'; // Modern Scanner Library
import api from '../../services/api';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Camera } from 'lucide-react';

export default function ScanAttendance() {
  const [scanResult, setScanResult] = useState(null); // 'success' | 'error' | null
  const [message, setMessage] = useState('');
  const [isScanning, setIsScanning] = useState(true);

  const handleScan = async (detectedCodes) => {
    if (!detectedCodes || detectedCodes.length === 0) return;
    
    const rawValue = detectedCodes[0].rawValue;
    if (!rawValue) return;

    // Pause scanning to process
    setIsScanning(false);

    try {
      const res = await api.post('/attendance/qr-scan', { scanned_data: rawValue });
      setScanResult('success');
      setMessage(res.data.message);
      toast.success(res.data.message);
    } catch (error) {
      setScanResult('error');
      setMessage(error.response?.data?.message || "Invalid QR Code");
      toast.error("Scan Failed");
    }
  };

  const resetScan = () => {
    setScanResult(null);
    setMessage('');
    setIsScanning(true);
  };

  return (
    <div className="max-w-md mx-auto space-y-6 animate-fade-in">
      
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Scan QR Code</h1>
        <p className="text-gray-500">Scan the QR code at the reception desk.</p>
      </div>

      <div className="bg-black rounded-3xl overflow-hidden shadow-2xl relative aspect-square border-4 border-white">
        
        {isScanning && !scanResult ? (
          <Scanner 
            onScan={handleScan} 
            components={{ audio: false, torch: true }}
            styles={{ container: { width: '100%', height: '100%' } }}
          />
        ) : (
          <div className={`absolute inset-0 flex flex-col items-center justify-center p-6 text-center
            ${scanResult === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white`}>
            
            {scanResult === 'success' ? <CheckCircle size={64} /> : <XCircle size={64} />}
            
            <h3 className="text-2xl font-bold mt-4">
              {scanResult === 'success' ? 'Checked In!' : 'Failed'}
            </h3>
            <p className="mt-2 opacity-90">{message}</p>
            
            <button 
              onClick={resetScan}
              className="mt-6 bg-white text-black px-6 py-3 rounded-xl font-bold hover:bg-opacity-90 transition-all"
            >
              Scan Again
            </button>
          </div>
        )}

        {/* Overlay Guide */}
        {isScanning && (
          <div className="absolute inset-0 border-2 border-white/30 m-8 rounded-xl pointer-events-none flex items-center justify-center">
             <div className="w-64 h-1 bg-red-500/50 absolute"></div>
          </div>
        )}
      </div>

      <div className="bg-blue-50 p-4 rounded-xl flex items-center gap-3 text-sm text-blue-800">
        <Camera className="w-5 h-5" />
        <p>Please allow camera access when prompted.</p>
      </div>

    </div>
  );
}