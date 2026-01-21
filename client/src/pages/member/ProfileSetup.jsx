import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Save, Activity, Ruler, Weight, Calendar, Phone, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function MemberProfileSetup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    date_of_birth: '',
    gender: 'Male', 
    weight: '', 
    height: '',
    fitness_goal: 'General Health', 
    activity_level: 'Moderately Active',
    emergency_contact: '',
    medical_conditions: ''
  });

  // Fetch existing data to pre-fill form
  useEffect(() => {
    api.get('/member/profile')
      .then(res => {
        if(res.data && res.data.profile_id) {
          const formattedData = { ...res.data };
          // Format date for input field (YYYY-MM-DD)
          if (formattedData.date_of_birth) {
            formattedData.date_of_birth = formattedData.date_of_birth.split('T')[0];
          }
          setFormData(formattedData);
        }
      })
      .catch(err => console.error("No existing profile"));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Basic Frontend Validations
    if (formData.weight <= 0 || formData.height <= 0) {
      return toast.error("Weight and Height must be positive numbers");
    }

    try {
      await api.post('/member/profile', formData);
      toast.success('Profile Saved! Redirecting...');
      setTimeout(() => navigate('/member/dashboard'), 1500);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        
        <div className="bg-gradient-to-r from-blue-900 to-blue-800 p-8 text-white">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="w-6 h-6" /> Complete Your Profile
          </h1>
          <p className="text-blue-100 mt-2">Fill in your details to get a personalized plan.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 grid md:grid-cols-2 gap-6">
          
          {/* Date of Birth */}
          <div className="relative">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Date of Birth</label>
            <Calendar className="absolute right-3 top-9 w-5 h-5 text-gray-400" />
            <input type="date" name="date_of_birth" required value={formData.date_of_birth} onChange={handleChange}
              className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 bg-gray-50" />
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Gender</label>
            <select name="gender" value={formData.gender} onChange={handleChange}
              className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 bg-white">
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
          </div>

          {/* Weight */}
          <div className="relative">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Weight (kg)</label>
            <Weight className="absolute right-3 top-9 w-5 h-5 text-gray-400" />
            <input type="number" name="weight" required value={formData.weight} onChange={handleChange}
              className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 bg-gray-50" placeholder="e.g. 70" />
          </div>

          {/* Height */}
          <div className="relative">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Height (cm)</label>
            <Ruler className="absolute right-3 top-9 w-5 h-5 text-gray-400" />
            <input type="number" name="height" required value={formData.height} onChange={handleChange}
              className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 bg-gray-50" placeholder="e.g. 175" />
          </div>

          {/* Emergency Contact */}
          <div className="relative">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Emergency Contact</label>
            <Phone className="absolute right-3 top-9 w-5 h-5 text-gray-400" />
            <input type="text" name="emergency_contact" required value={formData.emergency_contact} onChange={handleChange}
              className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 bg-gray-50" placeholder="Mom: 077..." />
          </div>

          {/* Fitness Goal */}
          <div className="md:col-span-1">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Primary Goal</label>
            <select name="fitness_goal" value={formData.fitness_goal} onChange={handleChange}
              className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 bg-white">
              {['Weight Loss', 'Muscle Gain', 'Endurance', 'Flexibility', 'General Health'].map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          {/* Activity Level */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Activity Level</label>
            <select name="activity_level" value={formData.activity_level} onChange={handleChange}
              className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 bg-white">
              <option>Sedentary (Little or no exercise)</option>
              <option>Lightly Active (1-3 days/week)</option>
              <option>Moderately Active (3-5 days/week)</option>
              <option>Very Active (6-7 days/week)</option>
            </select>
          </div>

          {/* Medical Conditions */}
          <div className="md:col-span-2 relative">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Medical Conditions (Optional)</label>
            <FileText className="absolute right-3 top-9 w-5 h-5 text-gray-400" />
            <textarea name="medical_conditions" rows="2" value={formData.medical_conditions} onChange={handleChange}
              className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 bg-gray-50" placeholder="Any injuries or conditions..." />
          </div>

          {/* Submit */}
          <div className="md:col-span-2 mt-4">
            <button type="submit" disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all">
              {loading ? 'Calculating BMI & Age...' : <><Save className="w-5 h-5" /> Save & Continue</>}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}