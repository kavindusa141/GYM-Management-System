import { useState } from 'react';
import api from '../../services/api';
import { Mail, ArrowRight, AlertCircle, CheckCircle, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

//Import a background if you want it to match Login
import LoginBG from '../../assets/images/GYM_Background.jpg';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  // Validation State
  const [error, setError] = useState('');
  const [touched, setTouched] = useState(false);

  // --- VALIDATION LOGIC ---
  const validateEmail = (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!value.trim()) return "Email is required";
    if (!emailRegex.test(value)) return "Invalid email format";
    return "";
  };

  const handleChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    if (touched) {
      setError(validateEmail(value));
    }
  };

  const handleBlur = () => {
    setTouched(true);
    setError(validateEmail(email));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError = validateEmail(email);
    if (validationError) {
      setTouched(true);
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      toast.success('Reset link sent! Check your inbox.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Request failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  // Helper for dynamic input styling
  const getInputClass = () => {
    const base = "w-full pl-10 pr-4 py-3 bg-gray-800/50 border rounded-xl text-white focus:outline-none focus:ring-2 transition-all";
    if (error) return `${base} border-red-500 focus:border-red-500 focus:ring-red-500/20`;
    if (touched && !error) return `${base} border-green-500/50 focus:border-green-500 focus:ring-green-500/20`;
    return `${base} border-gray-700 focus:border-blue-500 focus:ring-blue-500/50`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gray-900">

      {/* Background (Matches Login Page) */}
      <div className="absolute inset-0 z-0">
        <img src={LoginBG} alt="Background" className="w-full h-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/80 to-blue-900/30" />
      </div>

      <div className="relative z-10 w-full max-w-md px-4 animate-fade-in-up">
        <div className="glass-card rounded-2xl overflow-hidden shadow-2xl relative border border-gray-700/50 backdrop-blur-md bg-gray-900/60">

          {/* Close Button */}
          <Link
            to="/login"
            className="absolute top-4 right-4 p-2 rounded-full bg-gray-800/50 hover:bg-gray-700 text-gray-400 hover:text-white transition-all z-20"
            title="Back to Login"
          >
            <X size={20} />
          </Link>

          <div className="p-8">
            <h2 className="text-3xl font-bold text-white text-center mb-2">Recover Account</h2>
            <p className="text-gray-400 text-center mb-8 text-sm">Enter your email to receive a reset link</p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="group">
                <label className="text-xs font-bold text-gray-500 tracking-wider mb-1 block">EMAIL ADDRESS</label>
                <div className="relative">
                  <Mail className={`absolute left-3 top-3.5 h-5 w-5 ${error ? 'text-red-500' : 'text-gray-500'}`} />
                  <input
                    type="email"
                    className={getInputClass()}
                    placeholder="you@example.com"
                    value={email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                  {/* Validation Icon */}
                  {touched && !error && <CheckCircle className="absolute right-3 top-3.5 h-5 w-5 text-green-500" />}
                </div>
                {/* Error Message */}
                {error && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle size={10} /> {error}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg transition flex justify-center items-center gap-2 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : <>Send Link <ArrowRight className="w-5 h-5" /></>}
              </button>

              <div className="text-center border-t border-gray-700/50 pt-4 mt-4">
                <Link to="/login" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Remember your password? <span className="text-blue-400 font-bold hover:underline">Log In</span>
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}