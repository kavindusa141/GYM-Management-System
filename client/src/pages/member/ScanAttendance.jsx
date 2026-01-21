import { useState } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner'; // Modern Scanner Library
import api from '../../services/api';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Camera, AlertCircle } from 'lucide-react';

export default function ScanAttendance() {
  const [scanResult, setScanResult] = useState(null); // 'success' | 'error' | null
  const [message, setMessage] = useState('');
  const [isScanning, setIsScanning] = useState(true);
  const [cameraError, setCameraError] = useState(null);

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

  const handleError = (error) => {
    console.error("Camera error:", error);
    if (error.name === 'NotAllowedError' || error.message.includes('Permission denied')) {
      setCameraError('Camera permission denied. Please allow camera access in your browser settings.');
      toast.error('Camera permission denied');
    } else {
      setCameraError(`Camera error: ${error.message || 'Unknown error'}`);
      toast.error('Camera access error');
    }
  };

  const resetScan = () => {
    setScanResult(null);
    setMessage('');
    setIsScanning(true);
    setCameraError(null);
  };

  return (
    <div className="max-w-md mx-auto space-y-6 animate-fade-in">
      
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Scan QR Code</h1>
        <p className="text-gray-500">Scan the QR code at the reception desk.</p>
      </div>

      {cameraError && (
        <div className="bg-red-50 p-4 rounded-xl flex items-start gap-3 text-sm text-red-800 border border-red-200">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold mb-2">Camera Access Required</p>
            <p>{cameraError}</p>
            <p className="mt-2 text-xs opacity-75">Check your browser's camera permissions and try refreshing the page.</p>
          </div>
        </div>
      )}

      <div className="bg-black rounded-3xl overflow-hidden shadow-2xl relative aspect-square border-4 border-white">
        
        {isScanning && !scanResult && !cameraError ? (
          <Scanner 
            onScan={handleScan}
            onError={handleError}
            components={{ audio: false, torch: true }}
            styles={{ container: { width: '100%', height: '100%' } }}
          />
        ) : cameraError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-gray-900 text-white">
            <AlertCircle size={64} className="text-red-500 mb-4" />
            <h3 className="text-2xl font-bold mb-2">Camera Access Denied</h3>
            <p className="opacity-75 mb-6">Please enable camera access to scan QR codes.</p>
            <button 
              onClick={resetScan}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all"
            >
              Try Again
            </button>
          </div>
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
        {isScanning && !cameraError && (
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