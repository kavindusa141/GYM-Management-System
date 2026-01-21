import { useState } from 'react';
import api from '../../services/api';
import { Mail, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      toast.success('Reset link sent! Check your email.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 relative">
      <div className="relative z-10 w-full max-w-md p-8 bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl">
        <h2 className="text-3xl font-bold text-white text-center mb-2">Recover Account</h2>
        <p className="text-gray-400 text-center mb-8 text-sm">Enter your email to receive a reset link</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="group">
            <label className="text-xs font-bold text-gray-400 tracking-wider mb-1 block">EMAIL ADDRESS</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 h-5 w-5 text-gray-500" />
              <input 
                type="email" required 
                className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500"
                placeholder="you@example.com"
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg transition flex justify-center items-center gap-2">
            {loading ? 'Sending...' : <>Send Link <ArrowRight className="w-5 h-5" /></>}
          </button>

          <div className="text-center">
            <Link to="/login" className="text-sm text-gray-400 hover:text-white">Back to Login</Link>
          </div>
        </form>
      </div>
    </div>
  );
}