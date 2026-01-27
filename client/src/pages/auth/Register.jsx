import { useState } from 'react';
import api from '../../services/api';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { User, Mail, Lock, Phone, Trophy, CheckCircle, Key, X, AlertCircle } from 'lucide-react';
import RegisterBG from '../../assets/images/RegisterBG.jpg';

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1 = Register, 2 = Verify OTP
  
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', phone: ''
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');

  // Validation State
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // --- VALIDATION LOGIC ---
  const validate = (fieldName, value) => {
    let error = "";
    
    switch (fieldName) {
      case 'name':
        if (value.trim().length < 3) error = "Name must be at least 3 characters";
        break;
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) error = "Invalid email address";
        break;
      case 'phone':
        const phoneRegex = /^[0-9]{10}$/; // Assumes 10 digit number
        if (!phoneRegex.test(value)) error = "Phone must be exactly 10 digits";
        break;
      case 'password':
        // Regex: Min 8 chars, 1 Uppercase, 1 Lowercase, 1 Number OR Symbol
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[\d\W]).{8,}$/;
        if (!passwordRegex.test(value)) {
          error = "Must be 8+ chars, with 1 Capital, 1 Simple & 1 Number/Symbol";
        }
        break;
      case 'confirmPassword':
        if (value !== formData.password) error = "Passwords do not match";
        break;
      default:
        break;
    }
    return error;
  };

  // Handle Input Changes with Live Validation
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Validate immediately if field was already touched
    if (touched[name]) {
      setErrors(prev => ({ ...prev, [name]: validate(name, value) }));
    }
  };

  // Handle Confirm Password separately
  const handleConfirmChange = (e) => {
    const value = e.target.value;
    setConfirmPassword(value);
    if (touched.confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: validate('confirmPassword', value) }));
    }
  };

  // Mark field as touched on blur (focus loss)
  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    setErrors(prev => ({ ...prev, [name]: validate(name, value) }));
  };

  // Step 1: Submit Registration Details
  const handleRegister = async (e) => {
    e.preventDefault();

    // Run full validation before submit
    const newErrors = {
      name: validate('name', formData.name),
      email: validate('email', formData.email),
      phone: validate('phone', formData.phone),
      password: validate('password', formData.password),
      confirmPassword: validate('confirmPassword', confirmPassword)
    };

    setErrors(newErrors);
    setTouched({ name: true, email: true, phone: true, password: true, confirmPassword: true });

    // If any error exists, stop
    if (Object.values(newErrors).some(err => err !== "")) {
      return toast.error("Please fix the errors in the form");
    }

    setLoading(true);
    try {
      await api.post('/auth/register', formData);
      toast.success('OTP Sent to your email!');
      setStep(2); 
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerify = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) return toast.error("OTP must be 6 digits");

    setLoading(true);
    try {
      await api.post('/auth/verify-otp', { email: formData.email, otp });
      toast.success('Account Verified! Logging you in...');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  // Helper class for inputs based on error state
  const getInputClass = (fieldName) => {
    const baseClass = "w-full pl-10 pr-4 py-3 bg-gray-800/50 border rounded-xl text-white focus:outline-none focus:ring-2 transition-all";
    if (errors[fieldName]) return `${baseClass} border-red-500 focus:border-red-500 focus:ring-red-500/20`;
    if (touched[fieldName] && !errors[fieldName]) return `${baseClass} border-green-500/50 focus:border-green-500 focus:ring-green-500/20`;
    return `${baseClass} border-gray-700 focus:border-blue-500 focus:ring-blue-500/50`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gray-900 py-10">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img src={RegisterBG} alt="Gym Register Background" className="w-full h-full object-cover opacity-30"/>
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-900/90 to-blue-900/40" />
      </div>

      <div className="relative z-10 w-full max-w-2xl px-4 animate-fade-in">
        <div className="glass-card rounded-2xl overflow-hidden shadow-2xl relative">
          
          <Link 
            to="/" 
            className="absolute top-4 right-4 p-2 rounded-full bg-gray-800/50 hover:bg-gray-700 text-gray-400 hover:text-white transition-all z-20"
            title="Close"
          >
            <X size={20} />
          </Link>

          <div className="p-8 md:p-12">
            
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-tr from-yellow-400 to-orange-500 mb-4 shadow-lg shadow-orange-500/20">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white">
                {step === 1 ? "Become a Member" : "Verify Email"}
              </h2>
              <p className="text-gray-400 mt-2">
                {step === 1 ? "Start your premium fitness journey today" : `Enter the code sent to ${formData.email}`}
              </p>
            </div>

            {step === 1 ? (
              // --- STEP 1: REGISTRATION FORM ---
              <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Name */}
                <div className="group md:col-span-2">
                  <label className="text-xs font-bold text-gray-500 tracking-wider mb-1 block">FULL NAME</label>
                  <div className="relative">
                    <User className={`absolute left-3 top-3.5 h-5 w-5 ${errors.name ? 'text-red-500' : 'text-gray-500'}`} />
                    <input 
                      type="text" name="name"
                      className={getInputClass('name')}
                      value={formData.name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />
                  </div>
                  {errors.name && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle size={10}/> {errors.name}</p>}
                </div>

                {/* Email */}
                <div className="group">
                  <label className="text-xs font-bold text-gray-500 tracking-wider mb-1 block">EMAIL</label>
                  <div className="relative">
                    <Mail className={`absolute left-3 top-3.5 h-5 w-5 ${errors.email ? 'text-red-500' : 'text-gray-500'}`} />
                    <input 
                      type="email" name="email"
                      className={getInputClass('email')}
                      value={formData.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />
                  </div>
                  {errors.email && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle size={10}/> {errors.email}</p>}
                </div>

                {/* Phone */}
                <div className="group">
                  <label className="text-xs font-bold text-gray-500 tracking-wider mb-1 block">PHONE</label>
                  <div className="relative">
                    <Phone className={`absolute left-3 top-3.5 h-5 w-5 ${errors.phone ? 'text-red-500' : 'text-gray-500'}`} />
                    <input 
                      type="tel" name="phone"
                      placeholder="07XXXXXXXX"
                      className={getInputClass('phone')}
                      value={formData.phone}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />
                  </div>
                  {errors.phone && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle size={10}/> {errors.phone}</p>}
                </div>

                {/* Password */}
                <div className="group">
                  <label className="text-xs font-bold text-gray-500 tracking-wider mb-1 block">PASSWORD</label>
                  <div className="relative">
                    <Lock className={`absolute left-3 top-3.5 h-5 w-5 ${errors.password ? 'text-red-500' : 'text-gray-500'}`} />
                    <input 
                      type="password" name="password"
                      className={getInputClass('password')}
                      value={formData.password}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />
                  </div>
                  {errors.password && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle size={10}/> {errors.password}</p>}
                </div>

                {/* Confirm Password */}
                <div className="group">
                  <label className="text-xs font-bold text-gray-500 tracking-wider mb-1 block">CONFIRM</label>
                  <div className="relative">
                    <CheckCircle className={`absolute left-3 top-3.5 h-5 w-5 ${errors.confirmPassword ? 'text-red-500' : 'text-gray-500'}`} />
                    <input 
                      type="password" name="confirmPassword"
                      className={getInputClass('confirmPassword')}
                      value={confirmPassword}
                      onChange={handleConfirmChange}
                      onBlur={handleBlur}
                    />
                  </div>
                  {errors.confirmPassword && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle size={10}/> {errors.confirmPassword}</p>}
                </div>

                <div className="md:col-span-2 mt-4 space-y-6">
                  <button 
                    type="submit" 
                    disabled={loading} 
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold rounded-xl shadow-lg transform transition hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Processing...' : 'Next Step'}
                  </button>

                  <p className="text-center text-gray-400 text-sm">
                    Already have an account?{' '}
                    <Link to="/login" className="text-blue-400 hover:text-blue-300 font-semibold hover:underline transition-all">
                      Sign In
                    </Link>
                  </p>
                </div>
              </form>

            ) : (
              // --- STEP 2: OTP VERIFICATION FORM ---
              <form onSubmit={handleVerify} className="max-w-xs mx-auto space-y-6">
                <div className="group">
                  <label className="text-xs font-bold text-gray-500 tracking-wider mb-1 block text-center">ONE-TIME PASSWORD</label>
                  <div className="relative">
                    <Key className="absolute left-3 top-3.5 h-5 w-5 text-gray-500" />
                    <input 
                      type="text" 
                      required 
                      maxLength="6"
                      className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white text-center text-2xl tracking-widest focus:ring-2 focus:ring-green-500"
                      placeholder="000000"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} // Digits only
                    />
                  </div>
                </div>

                <button type="submit" disabled={loading} className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 text-white font-bold rounded-xl shadow-lg transform transition hover:-translate-y-0.5">
                  {loading ? 'Verifying...' : 'Verify & Join'}
                </button>
                
                <button type="button" onClick={() => setStep(1)} className="w-full text-sm text-gray-400 hover:text-white">
                  Back to Registration
                </button>
              </form>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}