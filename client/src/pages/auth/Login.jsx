import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Mail, Lock, LogIn, AlertCircle, X, CheckCircle } from 'lucide-react';

// Using your existing background image
import GYM_Background from '../../assets/images/GYM_Background.jpg';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Validation State
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // --- VALIDATION LOGIC ---
  const validate = (fieldName, value) => {
    let error = "";
    switch (fieldName) {
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value.trim()) error = "Email is required";
        else if (!emailRegex.test(value)) error = "Invalid email format";
        break;
      case 'password':
        if (!value) error = "Password is required";
        break;
      default:
        break;
    }
    return error;
  };

  // Handle Input Changes with Live Validation
  const handleChange = (setter, fieldName, value) => {
    setter(value);
    if (touched[fieldName]) {
      setErrors(prev => ({ ...prev, [fieldName]: validate(fieldName, value) }));
    }
  };

  // Mark field as touched on blur
  const handleBlur = (fieldName, value) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));
    setErrors(prev => ({ ...prev, [fieldName]: validate(fieldName, value) }));
  };

  // --- SUBMIT HANDLER ---
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Validate all fields
    const newErrors = {
      email: validate('email', email),
      password: validate('password', password)
    };
    setErrors(newErrors);
    setTouched({ email: true, password: true });

    // 2. Stop if errors exist
    if (Object.values(newErrors).some(err => err)) {
      return toast.error("Please fix the errors");
    }

    setLoading(true);
    try {
      const res = await login(email, password);
      
      const role = res.user.role;
      const dashboardMap = {
        'ADMIN': '/admin/dashboard',
        'MEMBER': '/member/dashboard',
        'TRAINER': '/trainer/dashboard',
        'STAFF': '/staff/dashboard'
      };
      
      navigate(dashboardMap[role] || '/member/dashboard');
      toast.success(`Welcome back, ${res.user.name}!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  // Helper for conditional input styling
  const getInputClass = (fieldName) => {
    const baseClass = "w-full pl-10 pr-4 py-3 bg-gray-800/50 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all";
    
    if (errors[fieldName]) {
      // Error State (Red)
      return `${baseClass} border-red-500 focus:border-red-500 focus:ring-red-500/20`;
    }
    if (touched[fieldName] && !errors[fieldName] && fieldName === 'email') {
      // Success State (Green - mainly for Email)
      return `${baseClass} border-green-500/50 focus:border-green-500 focus:ring-green-500/20`;
    }
    // Default State (Gray/Blue)
    return `${baseClass} border-gray-700 focus:border-blue-500 focus:ring-blue-500/50`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gray-900">
      
      {/* Background with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src={GYM_Background} 
          alt="Gym Background" 
          className="w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/80 to-blue-900/30" />
      </div>

      <div className="relative z-10 w-full max-w-md px-4 animate-fade-in-up">
        <div className="glass-card rounded-2xl overflow-hidden shadow-2xl relative border border-gray-700/50 backdrop-blur-md bg-gray-900/60">
          
          {/* Close Button */}
          <Link 
            to="/" 
            className="absolute top-4 right-4 p-2 rounded-full bg-gray-800/50 hover:bg-gray-700 text-gray-400 hover:text-white transition-all z-20"
            title="Back to Home"
          >
            <X size={20} />
          </Link>

          <div className="p-8 md:p-10">
            
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-600/20 text-blue-400 mb-4 ring-1 ring-blue-500/50">
                <LogIn size={28} />
              </div>
              <h2 className="text-3xl font-bold text-white tracking-tight">Welcome Back</h2>
              <p className="text-gray-400 mt-2 text-sm">Sign in to continue your fitness journey</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Email Input */}
              <div className="group">
                <label className="text-xs font-bold text-gray-500 tracking-wider mb-1 block">EMAIL ADDRESS</label>
                <div className="relative">
                  <Mail className={`absolute left-3 top-3.5 h-5 w-5 ${errors.email ? 'text-red-500' : 'text-gray-500'}`} />
                  <input 
                    type="email" 
                    className={getInputClass('email')}
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => handleChange(setEmail, 'email', e.target.value)}
                    onBlur={() => handleBlur('email', email)}
                  />
                  {/* Show Green Check if Valid */}
                  {touched.email && !errors.email && (
                    <CheckCircle className="absolute right-3 top-3.5 h-5 w-5 text-green-500" />
                  )}
                </div>
                {errors.email && (
                  <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle size={10}/> {errors.email}
                  </p>
                )}
              </div>

              {/* Password Input */}
              <div className="group">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-gray-500 tracking-wider">PASSWORD</label>
                  <Link to="/forgot-password" className="text-xs text-blue-400 hover:text-blue-300 hover:underline">
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className={`absolute left-3 top-3.5 h-5 w-5 ${errors.password ? 'text-red-500' : 'text-gray-500'}`} />
                  <input 
                    type="password" 
                    className={getInputClass('password')}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => handleChange(setPassword, 'password', e.target.value)}
                    onBlur={() => handleBlur('password', password)}
                  />
                </div>
                {errors.password && (
                  <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle size={10}/> {errors.password}
                  </p>
                )}
              </div>

              {/* Remember Me */}
              <div className="flex items-center">
                <input 
                  id="remember-me" 
                  type="checkbox" 
                  className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-offset-gray-900 cursor-pointer" 
                />
                <label htmlFor="remember-me" className="ml-2 text-sm text-gray-400 cursor-pointer hover:text-gray-300">
                  Remember me
                </label>
              </div>

              {/* Submit Button */}
              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transform transition hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>

            </form>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-gray-700/50 text-center">
              <p className="text-gray-400 text-sm">
                Don't have an account?{' '}
                <Link to="/register" className="text-blue-400 hover:text-blue-300 font-bold hover:underline">
                  Join Royal Fitness
                </Link>
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}