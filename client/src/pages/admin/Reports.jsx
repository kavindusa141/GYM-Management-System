import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; // Updated Import
import { formatCurrency, formatChartCurrency } from '../../utils/currencyFormatter';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { Download, FileText } from 'lucide-react';

export default function Reports() {
  const [data, setData] = useState({ financial: [], attendance: [], membership: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('FINANCIAL');

  // Colors for Pie Chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await api.get('/admin/reports');
      setData(res.data);
    } catch (error) {
      toast.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  // --- PDF GENERATOR ---
  const downloadPDF = (type) => {
    try {
      const doc = new jsPDF();
      const date = new Date().toLocaleDateString();

      // Header
      doc.setFontSize(20);
      doc.setTextColor(41, 128, 185); // Blue
      doc.text(`Royal Fitness - ${type} Report`, 14, 22);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated on: ${date}`, 14, 30);

      let tableColumn = [];
      let tableRows = [];

      // Data Mapping
      if (type === 'Financial') {
        tableColumn = ["Month", "Transactions", "Total Revenue"];
        if (data.financial.length === 0) {
           toast.error("No financial data to export");
           return;
        }
        tableRows = data.financial.map(row => [
          row.month,
          row.transaction_count,
          `Rs. ${Number(row.total_revenue).toFixed(2)}`
        ]);
      } else if (type === 'Attendance') {
        tableColumn = ["Date", "Total Check-ins"];
        if (data.attendance.length === 0) {
           toast.error("No attendance data to export");
           return;
        }
        tableRows = data.attendance.map(row => [
          row.date,
          row.count
        ]);
      } else if (type === 'Membership') {
        tableColumn = ["Plan Name", "Active Members"];
        if (data.membership.length === 0) {
           toast.error("No membership data to export");
           return;
        }
        tableRows = data.membership.map(row => [
          row.plan_name || 'Unassigned',
          row.member_count
        ]);
      }

      // Generate Table
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 40,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 10, cellPadding: 3 },
      });

      // Save File
      doc.save(`${type}_Report.pdf`);
      toast.success(`${type} Report PDF Downloaded`);

    } catch (err) {
      console.error("PDF Generation Error:", err);
      toast.error("Failed to generate PDF. Check console.");
    }
  };

  // --- CSV GENERATOR ---
  const downloadCSV = (type) => {
    try {
      let headers = [];
      let rows = [];

      if (type === 'Financial') {
        headers = ["Month", "Transactions", "Total Revenue"];
        rows = data.financial.map(row => [
          row.month,
          row.transaction_count,
          row.total_revenue
        ]);
      } else if (type === 'Attendance') {
        headers = ["Date", "Total Check-ins"];
        rows = data.attendance.map(row => [
          row.date,
          row.count
        ]);
      } else if (type === 'Membership') {
        headers = ["Plan Name", "Active Members"];
        rows = data.membership.map(row => [
          row.plan_name || 'Unassigned',
          row.member_count
        ]);
      }

      if (rows.length === 0) {
        toast.error("No data available to export");
        return;
      }

      const csvContent = [
        headers.join(","),
        ...rows.map(e => e.join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `${type}_Report.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`${type} Report CSV Downloaded`);
    } catch (err) {
      console.error("CSV Error:", err);
      toast.error("Failed to download CSV");
    }
  };

  const currentType = activeTab.charAt(0) + activeTab.slice(1).toLowerCase();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-500">Visualize performance and export data.</p>
        </div>
      </div>

      {/* --- TABS --- */}
      <div className="flex space-x-2 border-b border-gray-200">
        {['FINANCIAL', 'ATTENDANCE', 'MEMBERSHIP'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 text-sm font-bold border-b-2 transition-all ${
              activeTab === tab 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.charAt(0) + tab.slice(1).toLowerCase()} Analysis
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-500">Loading Analytics...</div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* --- LEFT: MAIN CHART AREA --- */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900">
                {activeTab === 'FINANCIAL' && "Monthly Revenue Trend"}
                {activeTab === 'ATTENDANCE' && "Daily Check-in Volume"}
                {activeTab === 'MEMBERSHIP' && "Membership Distribution"}
              </h3>
              
              {/* EXPORT BUTTONS */}
              <div className="flex gap-2">
                <button 
                  onClick={() => downloadCSV(currentType)}
                  className="flex items-center gap-2 bg-green-600 text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-green-700 transition-colors"
                >
                  <FileText className="w-4 h-4" /> CSV
                </button>
                <button 
                  onClick={() => downloadPDF(currentType)}
                  className="flex items-center gap-2 bg-gray-900 text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-gray-800 transition-colors"
                >
                  <Download className="w-4 h-4" /> PDF
                </button>
              </div>
            </div>

            {/* CHART RENDER LOGIC */}
            <div style={{ width: '100%', height: 350 }}>
              {activeTab === 'FINANCIAL' && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.financial}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatChartCurrency(value)} />
                    <Bar dataKey="total_revenue" name="Revenue" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}

              {activeTab === 'ATTENDANCE' && (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.attendance}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" name="Check-ins" stroke="#8B5CF6" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              )}

              {activeTab === 'MEMBERSHIP' && (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.membership}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="member_count"
                    >
                      {data.membership.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* --- RIGHT: SUMMARY STATS CARD --- */}
          <div className="space-y-6">
            
            {/* Dynamic Summary Card */}
            <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
              <h4 className="text-blue-800 font-bold mb-1 uppercase text-xs tracking-wider">
                Key Insight
              </h4>
              <p className="text-2xl font-black text-gray-900">
                {activeTab === 'FINANCIAL' && formatCurrency(data.financial.reduce((acc, curr) => acc + Number(curr.total_revenue), 0))}
                {activeTab === 'ATTENDANCE' && `${data.attendance.reduce((acc, curr) => acc + Number(curr.count), 0)} Visits`}
                {activeTab === 'MEMBERSHIP' && `${data.membership.reduce((acc, curr) => acc + Number(curr.member_count), 0)} Members`}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {activeTab === 'FINANCIAL' && "Total revenue in selected period"}
                {activeTab === 'ATTENDANCE' && "Total check-ins in last 7 days"}
                {activeTab === 'MEMBERSHIP' && "Active members across all plans"}
              </p>
            </div>

            {/* List Details */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-[280px] overflow-y-auto custom-scrollbar">
              <h4 className="font-bold text-gray-900 mb-4 border-b pb-2">Details</h4>
              
              <div className="space-y-3">
                {activeTab === 'FINANCIAL' && data.financial.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-gray-500">{item.month}</span>
                    <span className="font-bold text-gray-900">{formatCurrency(Number(item.total_revenue))}</span>
                  </div>
                ))}

                {activeTab === 'ATTENDANCE' && data.attendance.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-gray-500">{item.date}</span>
                    <span className="font-bold text-gray-900">{item.count} Check-ins</span>
                  </div>
                ))}

                {activeTab === 'MEMBERSHIP' && data.membership.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-gray-500">{item.plan_name || 'Unknown'}</span>
                    <span className="font-bold text-gray-900">{item.member_count} Members</span>
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