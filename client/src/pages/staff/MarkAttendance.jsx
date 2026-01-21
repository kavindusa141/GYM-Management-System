import { useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function MarkAttendance() {
  const [memberId, setMemberId] = useState('');

  const handleMark = async (e) => {
    e.preventDefault();
    try {
      // Calls POST /api/attendance
      await api.post('/attendance', { member_id: memberId });
      toast.success(`Attendance marked for ID: ${memberId}`);
      setMemberId(''); // Reset form
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to mark attendance');
    }
  };

  return (
    <div className="max-w-md p-6 mx-auto bg-white shadow-lg rounded-xl">
      <h2 className="mb-6 text-2xl font-bold text-gray-800">Mark Member Attendance</h2>
      
      <form onSubmit={handleMark} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Member ID</label>
          <input 
            type="number" 
            placeholder="Enter User ID" 
            className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
            value={memberId}
            onChange={(e) => setMemberId(e.target.value)}
            required
            autoFocus
          />
        </div>
        
        <button type="submit" className="w-full p-3 font-bold text-white bg-green-600 rounded hover:bg-green-700">
          Confirm Check-In
        </button>
      </form>
    </div>
  );
}