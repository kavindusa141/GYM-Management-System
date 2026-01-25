import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Clock, Save, Check, Calendar } from 'lucide-react';

export default function MyAvailability() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Default Schedule Structure
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  // Hours: 6 AM (6) to 9 PM (21)
  const hours = Array.from({ length: 16 }, (_, i) => i + 6); 

  // State: { "Monday": [6, 7, 8], "Tuesday": [] ... }
  const [schedule, setSchedule] = useState(
    days.reduce((acc, day) => ({ ...acc, [day]: [] }), {})
  );

  useEffect(() => {
    fetchAvailability();
  }, []);

  const fetchAvailability = async () => {
    try {
      const res = await api.get('/availability');
      if (res.data.length > 0) {
        const newSchedule = { ...schedule };
        res.data.forEach(record => {
          newSchedule[record.day_of_week] = record.slots || [];
        });
        setSchedule(newSchedule);
      }
    } catch (error) {
      toast.error("Failed to load availability");
    } finally {
      setLoading(false);
    }
  };

  const toggleSlot = (day, hour) => {
    setSchedule(prev => {
      const daySlots = prev[day];
      if (daySlots.includes(hour)) {
        // Remove slot
        return { ...prev, [day]: daySlots.filter(h => h !== hour) };
      } else {
        // Add slot
        return { ...prev, [day]: [...daySlots, hour] };
      }
    });
  };

  const handleSave = async () => {
    setSaving(true);
    // Convert state object to array for backend
    const payload = Object.entries(schedule).map(([day, slots]) => ({
      day_of_week: day,
      slots
    }));

    try {
      await api.post('/availability', { schedule: payload });
      toast.success("Availability Updated!");
    } catch (error) {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  // Helper to format 24h to 12h (e.g., 13 -> 1 PM)
  const formatHour = (h) => {
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12} ${ampm}`;
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Clock className="text-blue-600" size={28} /> Availability Manager
          </h1>
          <p className="text-gray-500">Mark your available time slots (6 AM - 9 PM).</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 shadow-lg active:scale-95 transition-all flex items-center gap-2"
        >
          {saving ? 'Saving...' : <><Save size={18} /> Save Changes</>}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading schedule...</div>
      ) : (
        <div className="grid gap-6">
          {days.map(day => (
            <div key={day} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="text-blue-500" size={20} />
                <h3 className="font-bold text-lg text-gray-900">{day}</h3>
                <span className="text-xs font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded ml-2">
                  {schedule[day].length} hours selected
                </span>
              </div>
              
              <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                {hours.map(hour => {
                  const isSelected = schedule[day].includes(hour);
                  return (
                    <button
                      key={hour}
                      onClick={() => toggleSlot(day, hour)}
                      className={`
                        py-2 px-1 rounded-lg text-xs font-bold transition-all border
                        flex flex-col items-center justify-center gap-1
                        ${isSelected 
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200 transform scale-105' 
                          : 'bg-gray-50 text-gray-400 border-gray-100 hover:bg-gray-100 hover:border-gray-200'
                        }
                      `}
                    >
                      <span>{formatHour(hour)}</span>
                      {isSelected && <Check size={12} strokeWidth={4} />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}