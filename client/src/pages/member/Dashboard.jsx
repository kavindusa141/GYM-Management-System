import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { Calendar, User, Activity } from 'lucide-react';

export default function MemberDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Hello, {user?.name}</h1>
          <p className="text-gray-600">Welcome to your fitness dashboard.</p>
        </div>
        <Link to="/member/profile-setup" className="px-4 py-2 text-sm text-blue-600 bg-blue-100 rounded hover:bg-blue-200">
          Edit Profile
        </Link>
      </header>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Quick Actions */}
        <Link to="/member/classes" className="p-6 transition bg-white shadow rounded-xl hover:shadow-md group">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-700">Book a Class</h3>
            <Calendar className="w-8 h-8 text-blue-500 group-hover:scale-110" />
          </div>
          <p className="text-sm text-gray-500">Reserve your spot in upcoming yoga, cardio, or lifting sessions.</p>
        </Link>

        <div className="p-6 bg-white shadow rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-700">Membership Status</h3>
            <User className="w-8 h-8 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">Active</p>
          <p className="text-sm text-green-600">Standard Plan</p>
        </div>

        <div className="p-6 bg-white shadow rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-700">Workout Streak</h3>
            <Activity className="w-8 h-8 text-orange-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">0 Days</p>
          <p className="text-sm text-gray-500">Get moving today!</p>
        </div>
      </div>
    </div>
  );
}