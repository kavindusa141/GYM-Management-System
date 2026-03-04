import { useState } from 'react';
import api from '../../services/api';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Lock, CheckCircle, AlertCircle, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { validatePasswordStrength } from '../../utils/validation';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const [showPasswords, setShowPasswords] = useState({
    new: false,
    confirm: false
  });

  // Validation State
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Logic matches Registration Page (Strong Policy)
  const validate = (name, value) => {
    if (name === 'password') {
      const error = validatePasswordStrength(value);
      if (error) return error;
    }
    if (name === 'confirm') {
      if (value !== password) return "Passwords do not match";
    }
    return "";
  };

  const handleChange = (setter, name, value) => {
    setter(value);
    if (touched[name]) {
      setErrors(prev => ({ ...prev, [name]: validate(name, value) }));
    }
    // Live update confirm error if password changes
    if (name === 'password' && touched.confirm) {
      setErrors(prev => ({ ...prev, confirm: value !== confirm ? "Passwords do not match" : "" }));
    }
  };

  const handleBlur = (name, value) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    setErrors(prev => ({ ...prev, [name]: validate(name, value) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {
      password: validate('password', password),
      confirm: validate('confirm', confirm)
    };
    setErrors(newErrors);
    setTouched({ password: true, confirm: true });

    if (newErrors.password || newErrors.confirm) return;

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

  const getInputClass = (name) => {
    const base = "w-full pl-10 p-3 bg-gray-800/50 border rounded-xl text-white focus:outline-none focus:ring-2 transition-all";
    if (errors[name]) return `${base} border-red-500 focus:border-red-500 focus:ring-red-500/20`;
    if (touched[name] && !errors[name]) return `${base} border-green-500/50 focus:border-green-500 focus:ring-green-500/20`;
    return `${base} border-gray-700 focus:border-blue-500 focus:ring-blue-500/50`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="w-full max-w-md p-8 glass-card border border-gray-700/50 rounded-2xl shadow-2xl bg-gray-900/60 backdrop-blur-xl">
        <h2 className="text-2xl font-bold text-white text-center mb-6">Set New Password</h2>

        <form onSubmit={handleSubmit} className="space-y-6">

          <div className="group">
            <label className="text-xs font-bold text-gray-500 tracking-wider block mb-1">NEW PASSWORD</label>
            <div className="relative">
              <Lock className={`absolute left-3 top-3.5 h-5 w-5 ${errors.password ? 'text-red-500' : 'text-gray-500'}`} />
              <input
                type={showPasswords.new ? "text" : "password"}
                className={getInputClass('password')}
                value={password}
                onChange={(e) => handleChange(setPassword, 'password', e.target.value)}
                onBlur={() => handleBlur('password', password)}
              />
              <button
                type="button"
                onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                className="absolute right-3 top-3.5 text-gray-400 hover:text-blue-500 transition-colors"
              >
                {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.password}</p>}
          </div>

          <div className="group">
            <label className="text-xs font-bold text-gray-500 tracking-wider block mb-1">CONFIRM PASSWORD</label>
            <div className="relative">
              <CheckCircle className={`absolute left-3 top-3.5 h-5 w-5 ${errors.confirm ? 'text-red-500' : 'text-gray-500'}`} />
              <input
                type={showPasswords.confirm ? "text" : "password"}
                className={getInputClass('confirm')}
                value={confirm}
                onChange={(e) => handleChange(setConfirm, 'confirm', e.target.value)}
                onBlur={() => handleBlur('confirm', confirm)}
              />
              <button
                type="button"
                onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                className="absolute right-3 top-3.5 text-gray-400 hover:text-blue-500 transition-colors"
              >
                {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.confirm && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.confirm}</p>}
          </div>

          <button type="submit" disabled={loading} className="w-full py-3.5 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition shadow-lg flex justify-center items-center gap-2 transform active:scale-95">
            {loading ? <RefreshCw className="animate-spin w-5 h-5" /> : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}