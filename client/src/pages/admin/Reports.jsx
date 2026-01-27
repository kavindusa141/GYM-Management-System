import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency, formatChartCurrency } from '../../utils/currencyFormatter';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import { Download, FileText, Calendar, Filter, Clock, TrendingUp } from 'lucide-react';

export default function Reports() {
  // Initial State matches new Backend Structure
  const [data, setData] = useState({ 
    financial: [], 
    payment_methods: [], 
    attendance: [], 
    peak_hours: [],
    membership: [] 
  });
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('FINANCIAL');

  // Date Range (Default: Last 30 Days)
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Send selected dates to backend
      const res = await api.get(`/admin/reports?startDate=${dateRange.start}&endDate=${dateRange.end}`);
      setData(res.data);
    } catch (error) {
      toast.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // PDF DOWNLOAD LOGIC
  // ==========================================
  const downloadPDF = (type) => {
    try {
      const doc = new jsPDF();
      const date = new Date().toLocaleDateString();

      doc.setFontSize(18);
      doc.setTextColor(30, 64, 175);
      doc.text(`Royal Fitness - ${type} Report`, 14, 22);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Period: ${dateRange.start} to ${dateRange.end}`, 14, 30);
      doc.text(`Generated: ${date}`, 14, 35);

      let tableColumn = [];
      let tableRows = [];

      if (type === 'Financial') {
        tableColumn = ["Date", "Transactions", "Total Revenue"];
        if (data.financial.length === 0) return toast.error("No data");
        tableRows = data.financial.map(row => [
          row.date,
          row.transaction_count,
          `Rs. ${Number(row.total_revenue).toFixed(2)}`
        ]);
        const totalRev = data.financial.reduce((a, b) => a + b.total_revenue, 0);
        tableRows.push(['TOTAL', '', `Rs. ${totalRev.toFixed(2)}`]);

      } else if (type === 'Attendance') {
        tableColumn = ["Date", "Total Check-ins"];
        if (data.attendance.length === 0) return toast.error("No data");
        tableRows = data.attendance.map(row => [row.date, row.count]);
        const totalVisits = data.attendance.reduce((a, b) => a + b.count, 0);
        tableRows.push(['TOTAL VISITS', totalVisits]);

      } else if (type === 'Membership') {
        tableColumn = ["Plan Name", "Price", "Active Members", "Est. Monthly Value"];
        if (data.membership.length === 0) return toast.error("No data");
        tableRows = data.membership.map(row => [
          row.plan_name,
          `Rs. ${row.plan_price}`,
          row.member_count,
          `Rs. ${row.estimated_value.toFixed(2)}`
        ]);
      }

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 45,
        theme: 'grid',
        headStyles: { fillColor: [30, 64, 175], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 9 },
      });

      doc.save(`RFK_${type}_Report.pdf`);
      toast.success("PDF Downloaded");
    } catch (err) {
      console.error(err);
      toast.error("PDF generation failed");
    }
  };

  // ==========================================
  // CSV DOWNLOAD LOGIC
  // ==========================================
  const downloadCSV = (type) => {
    try {
      let headers = [];
      let rows = [];

      if (type === 'Financial') {
        headers = ["Date", "Transactions", "Total Revenue"];
        rows = data.financial.map(r => [r.date, r.transaction_count, r.total_revenue]);
      } else if (type === 'Attendance') {
        headers = ["Date", "Total Check-ins"];
        rows = data.attendance.map(r => [r.date, r.count]);
      } else if (type === 'Membership') {
        headers = ["Plan Name", "Price", "Active Members", "Est. Value"];
        rows = data.membership.map(r => [r.plan_name, r.plan_price, r.member_count, r.estimated_value]);
      }

      if (rows.length === 0) return toast.error("No data");

      const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `RFK_${type}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("CSV Downloaded");
    } catch (err) {
      toast.error("CSV generation failed");
    }
  };

  const currentType = activeTab.charAt(0) + activeTab.slice(1).toLowerCase();

  // --- CUSTOM TOOLTIP FOR MEMBERSHIP PIE CHART ---
  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-100 shadow-xl rounded-xl">
          <p className="font-bold text-gray-900">{d.plan_name}</p>
          <p className="text-sm text-gray-500">
            Members: <span className="font-bold text-blue-600">{d.member_count}</span>
          </p>
          <p className="text-xs text-gray-400">
            Price: {formatCurrency(d.plan_price)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      
      {/* HEADER & FILTERS */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-500">Track financial health and member activity.</p>
        </div>

        {/* Date Filters */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-200">
            <Calendar size={16} className="text-gray-400 ml-2" />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-gray-400 uppercase px-1">From</span>
              <input 
                type="date" 
                className="bg-transparent text-sm font-bold text-gray-700 outline-none"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              />
            </div>
            <div className="w-px h-8 bg-gray-300 mx-2"></div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-gray-400 uppercase px-1">To</span>
              <input 
                type="date" 
                className="bg-transparent text-sm font-bold text-gray-700 outline-none"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              />
            </div>
          </div>
          <button 
            onClick={fetchData}
            className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-95"
            title="Apply Date Filter"
          >
            <Filter size={20} />
          </button>
        </div>
      </div>

      {/* TABS */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl w-fit">
        {['FINANCIAL', 'ATTENDANCE', 'MEMBERSHIP'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2.5 text-sm font-bold rounded-lg transition-all ${
              activeTab === tab 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.charAt(0) + tab.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="h-96 flex flex-col items-center justify-center text-gray-400">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
          Loading Analysis...
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* LEFT: MAIN CHART */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                {activeTab === 'FINANCIAL' && <><TrendingUp size={20} className="text-green-500"/> Revenue Trend</>}
                {activeTab === 'ATTENDANCE' && <><TrendingUp size={20} className="text-blue-500"/> Check-in Volume</>}
                {activeTab === 'MEMBERSHIP' && <><TrendingUp size={20} className="text-purple-500"/> Membership Distribution</>}
              </h3>
              
              <div className="flex gap-2">
                <button onClick={() => downloadCSV(currentType)} className="flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-100 transition">
                  <FileText size={14} /> CSV
                </button>
                <button onClick={() => downloadPDF(currentType)} className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-100 transition">
                  <Download size={14} /> PDF
                </button>
              </div>
            </div>

            <div className="h-[350px] w-full">
              {activeTab === 'FINANCIAL' && (
                <ResponsiveContainer>
                  <AreaChart data={data.financial}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{fontSize: 11}} />
                    <YAxis tickFormatter={(val) => `${val/1000}k`} tick={{fontSize: 11}} />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Area type="monotone" dataKey="total_revenue" stroke="#3B82F6" strokeWidth={3} fill="url(#colorRev)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}

              {activeTab === 'ATTENDANCE' && (
                <ResponsiveContainer>
                  <LineChart data={data.attendance}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{fontSize: 11}} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#8B5CF6" strokeWidth={3} dot={{r: 4}} />
                  </LineChart>
                </ResponsiveContainer>
              )}

              {activeTab === 'MEMBERSHIP' && (
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={data.membership}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="member_count"
                      nameKey="plan_name" // <--- FIX: Maps the label correctly
                      label={({ plan_name, percent }) => `${plan_name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {data.membership.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* SECONDARY CHART: PEAK HOURS (Only Attendance Tab) */}
            {activeTab === 'ATTENDANCE' && data.peak_hours && data.peak_hours.length > 0 && (
              <div className="mt-8 border-t border-gray-100 pt-6">
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Clock size={20} className="text-orange-500"/> Peak Hours (Busiest Times)
                </h3>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer>
                    <BarChart data={data.peak_hours}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="hour" />
                      <YAxis allowDecimals={false} />
                      <Tooltip cursor={{fill: '#FFF7ED'}} />
                      <Bar dataKey="count" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: INSIGHTS & LISTS */}
          <div className="space-y-6">
            
            {/* KPI Card */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-2xl text-white shadow-xl shadow-blue-500/20">
              <p className="text-blue-100 text-xs font-bold uppercase tracking-wider mb-1">
                Total {activeTab === 'FINANCIAL' ? 'Revenue' : activeTab === 'MEMBERSHIP' ? 'Members' : 'Visits'}
              </p>
              <h2 className="text-3xl font-black">
                {activeTab === 'FINANCIAL' && formatCurrency(data.financial.reduce((a, b) => a + b.total_revenue, 0))}
                {activeTab === 'ATTENDANCE' && data.attendance.reduce((a, b) => a + b.count, 0)}
                {activeTab === 'MEMBERSHIP' && data.membership.reduce((a, b) => a + b.member_count, 0)}
              </h2>
              <p className="text-sm text-blue-200 mt-2 opacity-80">
                Data from {new Date(dateRange.start).toLocaleDateString()} to {new Date(dateRange.end).toLocaleDateString()}
              </p>
            </div>

            {/* Payment Methods Chart (Only Financial Tab) */}
            {activeTab === 'FINANCIAL' && data.payment_methods.length > 0 && (
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h4 className="font-bold text-gray-900 mb-4 text-sm uppercase text-gray-500">Payment Sources</h4>
                <div className="space-y-3">
                  {data.payment_methods.map((method, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">{method.name}</span>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-20 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 rounded-full" 
                            style={{ width: `${(method.value / data.financial.reduce((a,b)=>a+b.total_revenue,0)) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-bold">{formatCurrency(method.value)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Detailed List */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex-1 min-h-[300px] max-h-[500px] overflow-y-auto custom-scrollbar">
              <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Detailed Log</h4>
              <div className="space-y-0 divide-y divide-gray-50">
                
                {activeTab === 'FINANCIAL' && data.financial.map((d, i) => (
                  <div key={i} className="flex justify-between text-sm py-3 hover:bg-gray-50 px-2 rounded-lg transition">
                    <span className="text-gray-600 font-medium">{d.date}</span>
                    <span className="font-bold text-gray-900">{formatCurrency(d.total_revenue)}</span>
                  </div>
                ))}

                {activeTab === 'ATTENDANCE' && data.attendance.map((d, i) => (
                  <div key={i} className="flex justify-between text-sm py-3 hover:bg-gray-50 px-2 rounded-lg transition">
                    <span className="text-gray-600 font-medium">{d.date}</span>
                    <span className="font-bold text-gray-900">{d.count} Visits</span>
                  </div>
                ))}

                {activeTab === 'MEMBERSHIP' && data.membership.map((d, i) => (
                  <div key={i} className="flex justify-between items-center text-sm py-3 hover:bg-gray-50 px-2 rounded-lg transition">
                    <div className="flex flex-col">
                      <span className="text-gray-900 font-bold">{d.plan_name}</span>
                      <span className="text-[10px] text-gray-400">
                        {formatCurrency(d.plan_price)} / month
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="block font-bold text-blue-600">{d.member_count} Active</span>
                      <span className="text-[10px] text-gray-400">
                        Est. {formatCurrency(d.estimated_value)}
                      </span>
                    </div>
                  </div>
                ))}

              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}