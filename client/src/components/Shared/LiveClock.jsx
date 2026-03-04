import { useState, useEffect } from 'react';
import { Calendar, Clock } from 'lucide-react';

export default function LiveClock() {
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setDate(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Format Date: "Mon, 24 Jan 2026"
  const dateStr = date.toLocaleDateString('en-US', { 
    weekday: 'short', 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric' 
  });

  // Format Time: "02:05:30 PM"
  const timeStr = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  return (
    <div className="
      hidden md:flex items-center gap-5 
      bg-white/90 backdrop-blur-md 
      border border-gray-200/60 shadow-sm 
      rounded-2xl px-6 py-3 
      transition-all hover:shadow-md hover:border-blue-200/50
    ">
      {/* Date Section */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
          <Calendar size={18} strokeWidth={2.5} />
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider leading-none mb-0.5">
            Today
          </span>
          <span className="text-sm font-bold text-gray-700 leading-none">
            {dateStr}
          </span>
        </div>
      </div>

      {/* Vertical Divider */}
      <div className="h-8 w-px bg-gradient-to-b from-transparent via-gray-200 to-transparent"></div>

      {/* Time Section */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-orange-50 text-orange-600 rounded-lg relative">
          <Clock size={18} strokeWidth={2.5} />
          {/* Pulsing Dot */}
          <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider leading-none mb-0.5">
            Local Time
          </span>
          <span className="text-sm font-black text-gray-800 leading-none tabular-nums tracking-wide">
            {timeStr}
          </span>
        </div>
      </div>
    </div>
  );
}