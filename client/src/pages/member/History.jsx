import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Calendar, Clock, CheckCircle, TrendingUp, Timer, Activity, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAuth } from '../../context/AuthContext';

export default function History() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('GYM'); // 'GYM' | 'CLASS'
  const [gymHistory, setGymHistory] = useState([]);
  const [classHistory, setClassHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const [gymRes, classRes] = await Promise.all([
        api.get('/attendance/my-history'),
        api.get('/bookings/my-history')
      ]);
      setGymHistory(gymRes.data);
      setClassHistory(classRes.data);
    } catch (error) {
      console.error("Failed to load history");
    } finally {
      setLoading(false);
    }
  };

  // Helper to format date nicely
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  // Helper to format minutes to "1h 30m"
  const formatDuration = (mins) => {
    if (!mins) return "";
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const calculateDuration = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return "-";
    const [inH, inM] = checkIn.split(':').map(Number);
    const [outH, outM] = checkOut.split(':').map(Number);
    let diffMins = (outH * 60 + outM) - (inH * 60 + inM);
    if (diffMins < 0) diffMins += 24 * 60; // crossed midnight
    const h = Math.floor(diffMins / 60);
    const m = diffMins % 60;
    return `${h}h ${m}m`;
  };

  // --- REPORT EXPORT LOGIC ---
  const downloadPDF = async () => {
    try {
      const doc = new jsPDF();
      const date = new Date().toLocaleDateString();
      const userName = user?.name || 'Member';
      const userId = user?.id || 'Unknown';

      const title = activeTab === 'GYM' ? 'My Attendance Report' : 'My Class History Report';

      doc.setFontSize(16);
      doc.setTextColor(30, 64, 175);
      doc.text("Royal Fitness Kingdom", 14, 20);

      doc.setFontSize(12);
      doc.setTextColor(50);
      doc.text(title, 14, 28);

      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Member: ${userName} (RFK-M-${userId})`, 14, 36);
      doc.text(`Generated on: ${date}`, 14, 42);

      let tableColumn = [];
      let tableRows = [];

      if (activeTab === 'GYM') {
        tableColumn = ["Date", "Check-In", "Check-Out", "Duration", "Status"];
        if (!gymHistory.length) return toast.error("No gym history data");
        tableRows = gymHistory.map(a => [
          new Date(a.attendance_date).toLocaleDateString(),
          a.check_in || '-',
          a.check_out || '-',
          calculateDuration(a.check_in, a.check_out),
          a.status
        ]);
      } else if (activeTab === 'CLASS') {
        tableColumn = ["Date", "Class", "Time", "Trainer"];
        if (!classHistory.length) return toast.error("No class history data");
        tableRows = classHistory.map(c => [
          new Date(c.booking_date).toLocaleDateString(),
          c.GymClass?.title,
          `${c.GymClass?.start_time.slice(0, 5)} - ${c.GymClass?.end_time.slice(0, 5)}`,
          c.GymClass?.Trainer?.name || "Staff"
        ]);
      }

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 50,
        theme: 'grid',
        headStyles: { fillColor: [30, 64, 175], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 9 },
        alternateRowStyles: { fillColor: [249, 250, 251] }
      });

      doc.save(`My_${activeTab}_Report_${date.replace(/\//g, '-')}.pdf`);
      toast.success("PDF Downloaded");
    } catch (err) {
      console.error(err);
      toast.error("PDF generation failed");
    }
  };

  const downloadCSV = async () => {
    try {
      let headers = [];
      let rows = [];
      const userName = user?.name || 'Member';
      const userId = user?.id || 'Unknown';

      if (activeTab === 'GYM') {
        headers = ["Date", "Check-In", "Check-Out", "Duration", "Status"];
        if (!gymHistory.length) return toast.error("No gym history data");
        rows = gymHistory.map(a => [
          new Date(a.attendance_date).toLocaleDateString(),
          a.check_in || '-',
          a.check_out || '-',
          calculateDuration(a.check_in, a.check_out),
          a.status
        ]);
      } else if (activeTab === 'CLASS') {
        headers = ["Date", "Class", "Time", "Trainer"];
        if (!classHistory.length) return toast.error("No class history data");
        rows = classHistory.map(c => [
          new Date(c.booking_date).toLocaleDateString(),
          c.GymClass?.title,
          `${c.GymClass?.start_time.slice(0, 5)} - ${c.GymClass?.end_time.slice(0, 5)}`,
          c.GymClass?.Trainer?.name || "Staff"
        ]);
      }

      if (rows.length === 0) return toast.error("No data");

      let csvString = `Member Name: ${userName},Member ID: RFK-M-${userId}\n\n`;
      csvString += [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `My_${activeTab}_Report.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("CSV Downloaded");
    } catch (err) {
      console.error(err);
      toast.error("CSV generation failed");
    }
  };

  // Helper to get stats based on active tab
  const getStats = () => {
    const data = activeTab === 'GYM' ? gymHistory : classHistory;
    const dateField = activeTab === 'GYM' ? 'attendance_date' : 'booking_date';

    const total = data.length;
    const thisMonth = data.filter(h => {
      const d = new Date(h[dateField]);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    return { total, thisMonth };
  };

  const stats = getStats();

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Attendance History</h1>
        <p className="text-gray-500">Track your gym consistency and visits.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-600 text-white p-6 rounded-2xl shadow-lg shadow-blue-200">
          <div className="flex items-center gap-2 mb-2 text-blue-100 text-sm font-bold uppercase tracking-wider">
            <CheckCircle size={16} /> Total Visits
          </div>
          <div className="text-4xl font-black">{stats.total}</div>
        </div>
        <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-gray-400 text-sm font-bold uppercase tracking-wider">
            <TrendingUp size={16} /> This Month
          </div>
          <div className="text-4xl font-black text-gray-900">{stats.thisMonth}</div>
        </div>
      </div>

      {/* Tabs and Export Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-100 w-fit">
          <button
            onClick={() => setActiveTab('GYM')}
            className={`px-6 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${activeTab === 'GYM'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-gray-500 hover:bg-gray-50'
              }`}
          >
            <Timer size={16} /> Gym Visits
          </button>
          <button
            onClick={() => setActiveTab('CLASS')}
            className={`px-6 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${activeTab === 'CLASS'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-gray-500 hover:bg-gray-50'
              }`}
          >
            <Activity size={16} /> Class History
          </button>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <button onClick={downloadCSV} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-green-50 text-green-700 font-bold text-sm rounded-lg hover:bg-green-100 transition-colors">
            <Download size={16} /> Export CSV
          </button>
          <button onClick={downloadPDF} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 font-bold text-sm rounded-lg hover:bg-blue-100 transition-colors">
            <Download size={16} /> Export PDF
          </button>
        </div>
      </div>

      {/* Timeline List */}
      {activeTab === 'GYM' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 font-bold text-gray-900">
            Recent Activity
          </div>

          {loading ? (
            <div className="p-10 text-center text-gray-400">Loading history...</div>
          ) : gymHistory.length === 0 ? (
            <div className="p-10 text-center text-gray-500">
              <Calendar className="w-10 h-10 mx-auto text-gray-300 mb-3" />
              No gym attendance records found yet.
            </div>
          ) : (
            <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
              {gymHistory.map((record) => (
                <div key={record.attendance_id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">

                  <div className="flex items-center gap-4">
                    {/* Date Box */}
                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex flex-col items-center justify-center text-gray-600 font-bold border border-gray-200">
                      <span className="text-[10px] uppercase">{new Date(record.attendance_date).toLocaleString('default', { month: 'short' })}</span>
                      <span className="text-lg leading-none">{new Date(record.attendance_date).getDate()}</span>
                    </div>

                    <div>
                      <h4 className="font-bold text-gray-900">{formatDate(record.attendance_date)}</h4>

                      {/* Status Badge - CHANGED COLORS HERE */}
                      {record.status === 'CHECKED_OUT' ? (
                        <span className="text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100 font-bold flex items-center gap-1 w-fit mt-1">
                          <CheckCircle size={10} /> Completed
                        </span>
                      ) : (
                        <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100 font-bold flex items-center gap-1 w-fit mt-1">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div> Active Now
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    {/* Duration Display */}
                    {record.duration && (
                      <div className="flex justify-end mb-1">
                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded flex items-center gap-1">
                          <Timer size={12} /> {formatDuration(record.duration)}
                        </span>
                      </div>
                    )}

                    {/* Check In -> Check Out - CHANGED ARROW COLOR HERE */}
                    <div className="flex items-center gap-2 text-gray-900 font-mono font-bold text-lg justify-end">
                      <Clock size={16} className="text-gray-400" />
                      {record.check_in.slice(0, 5)}
                      <span className="text-orange-500 font-black">➜</span>
                      <span className={record.check_out ? "text-gray-900" : "text-gray-400 italic"}>
                        {record.check_out ? record.check_out.slice(0, 5) : '--:--'}
                      </span>
                    </div>

                    {/* Session Ended Text - CHANGED COLOR HERE */}
                    <div className={`text-xs font-bold mt-0.5 ${record.check_out ? 'text-blue-600' : 'text-green-600'}`}>
                      {record.check_out ? 'Session Ended' : 'Currently in Gym'}
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CLASS HISTORY */}
      {activeTab === 'CLASS' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 font-bold text-gray-900">
            Attended Classes
          </div>

          {loading ? (
            <div className="p-10 text-center text-gray-400">Loading history...</div>
          ) : classHistory.length === 0 ? (
            <div className="p-10 text-center text-gray-500">
              <Activity className="w-10 h-10 mx-auto text-gray-300 mb-3" />
              No class attendance records found yet.
            </div>
          ) : (
            <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
              {classHistory.map((booking) => (
                <div key={booking.booking_id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">

                  <div className="flex items-center gap-4">
                    {/* Date Box */}
                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex flex-col items-center justify-center text-gray-600 font-bold border border-gray-200">
                      <span className="text-[10px] uppercase">{new Date(booking.booking_date).toLocaleString('default', { month: 'short' })}</span>
                      <span className="text-lg leading-none">{new Date(booking.booking_date).getDate()}</span>
                    </div>

                    <div>
                      <h4 className="font-bold text-gray-900 text-lg">{booking.GymClass?.title}</h4>
                      <span className="text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100 font-bold flex items-center gap-1 w-fit mt-1">
                        <CheckCircle size={10} /> Attended
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center gap-2 text-gray-900 font-mono font-bold justify-end">
                      <Clock size={16} className="text-gray-400" />
                      {booking.GymClass?.start_time.slice(0, 5)} - {booking.GymClass?.end_time.slice(0, 5)}
                    </div>
                    <div className="text-xs font-bold text-gray-500 mt-1">
                      Trainer: <span className="text-gray-900">{booking.GymClass?.Trainer?.name || "Staff"}</span>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}