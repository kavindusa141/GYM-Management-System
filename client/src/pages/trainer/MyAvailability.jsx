import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Clock, Save, Check, Calendar, ChevronRight, ChevronLeft } from 'lucide-react';

export default function MyAvailability() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dates, setDates] = useState([]);

  // Hours: 6 AM (6) to 9 PM (21)
  const hours = Array.from({ length: 16 }, (_, i) => i + 6);

  // State: { "2024-05-20": [6, 7], "2024-05-21": [] ... }
  const [schedule, setSchedule] = useState({});

  useEffect(() => {
    generateDates();
    fetchAvailability();
  }, []);

  const generateDates = () => {
    const next14Days = [];
    const today = new Date();

    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;

      next14Days.push({
        fullDate: dateString,
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        displayDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      });
    }
    setDates(next14Days);

    // Initialize schedule state
    const initialSchedule = {};
    next14Days.forEach(d => {
      initialSchedule[d.fullDate] = [];
    });
    setSchedule(prev => ({ ...initialSchedule, ...prev }));
  };

  const fetchAvailability = async () => {
    try {
      const res = await api.get('/availability');
      if (res.data.length > 0) {
        setSchedule(prev => {
          const newSchedule = { ...prev };
          res.data.forEach(record => {
            // Only update if date exists in our range (or keep all?)
            // keeping all is safer but UI only shows range
            newSchedule[record.date] = record.slots || [];
          });
          return newSchedule;
        });
      }
    } catch (error) {
      toast.error("Failed to load availability");
    } finally {
      setLoading(false);
    }
  };

  const toggleSlot = (dateStr, hour) => {
    setSchedule(prev => {
      const currentSlots = prev[dateStr] || [];
      if (currentSlots.includes(hour)) {
        return { ...prev, [dateStr]: currentSlots.filter(h => h !== hour) };
      } else {
        return { ...prev, [dateStr]: [...currentSlots, hour] };
      }
    });
  };

  const handleSave = async () => {
    setSaving(true);
    // Convert state to backend format
    const payload = Object.entries(schedule).map(([date, slots]) => ({
      date,
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

  // Helper to format 24h to 12h
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
          <p className="text-gray-500">Mark your available time slots for the next 2 weeks.</p>
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
        <div className="space-y-8">
          {dates.map((dateObj) => (
            <div key={dateObj.fullDate} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-4 border-b border-gray-100 pb-3">
                <div className="flex flex-col items-center bg-blue-50 text-blue-700 px-3 py-1 rounded-lg">
                  <span className="text-xs font-bold uppercase">{dateObj.dayName}</span>
                  <span className="text-lg font-black">{dateObj.displayDate}</span>
                </div>
                <div>
                  <span className="text-sm text-gray-400 block">
                    {schedule[dateObj.fullDate]?.length || 0} hours available
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-4 md:grid-cols-8 lg:grid-cols-16 gap-2">
                {hours.map(hour => {
                  const isSelected = schedule[dateObj.fullDate]?.includes(hour);
                  return (
                    <button
                      key={hour}
                      onClick={() => toggleSlot(dateObj.fullDate, hour)}
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