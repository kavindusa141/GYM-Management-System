import { useState } from 'react';
import api from '../../services/api';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Lock, CheckCircle } from 'lucide-react';

export default function ResetPassword() {
  const { token } = useParams(); // Gets the token from the URL
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) return toast.error("Passwords do not match");
    if (password.length < 6) return toast.error("Password must be at least 6 characters");
    
    setLoading(true);
    try {
      await api.post(`/auth/reset-password/${token}`, { password });
      toast.success('Password updated! Please login.');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid or expired token');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="w-full max-w-md p-8 bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl">
        <h2 className="text-2xl font-bold text-white text-center mb-6">Set New Password</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-xs font-bold text-gray-400 block mb-1">NEW PASSWORD</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 h-5 w-5 text-gray-500" />
              <input type="password" required className="w-full pl-10 p-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white" 
                onChange={(e) => setPassword(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-400 block mb-1">CONFIRM PASSWORD</label>
            <div className="relative">
              <CheckCircle className="absolute left-3 top-3.5 h-5 w-5 text-gray-500" />
              <input type="password" required className="w-full pl-10 p-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white"
                onChange={(e) => setConfirm(e.target.value)} />
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition">
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}