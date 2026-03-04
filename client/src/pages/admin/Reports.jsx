import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency } from '../../utils/currencyFormatter';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import { Download, FileText, Calendar, Filter, Clock, TrendingUp, UserMinus, AlertCircle, UserCheck, Search } from 'lucide-react';

export default function Reports() {
  // Initial State matches new Backend Structure
  const [data, setData] = useState({
    financial: [],
    payment_methods: [],
    attendance: [],
    peak_hours: [],
    membership: [],
    retention: {
      churn_count: 0,
      at_risk_count: 0,
      at_risk_members: [],
      expiring_count: 0,
      expiring_members: []
    },
    attendance_logs: [],
    heatmap: []
  });

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('FINANCIAL');

  // New states for Member Specific tab
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState("");
  const [memberReport, setMemberReport] = useState(null);
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [memberReportTab, setMemberReportTab] = useState('ATTENDANCE');

  // Date Range (Default: Last 30 Days)
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1'];

  useEffect(() => {
    fetchData();
    fetchMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchMembers = async () => {
    try {
      // Pass a high limit so the datalist dropdown has all members searchable
      const res = await api.get('/admin/members', { params: { limit: 5000 } });
      setMembers(res.data.members || res.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (activeTab === 'MEMBER SPECIFIC' && selectedMember) {
      fetchMemberReport();
    }
  }, [activeTab, selectedMember, dateRange]);

  const fetchMemberReport = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/reports/member/${selectedMember}?startDate=${dateRange.start}&endDate=${dateRange.end}`);
      setMemberReport(res.data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch member report");
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Send selected dates to backend
      const res = await api.get(`/admin/reports?startDate=${dateRange.start}&endDate=${dateRange.end}`);
      setData(res.data);
    } catch (error) {
      console.error(error);
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

      let startY = 45;
      if (type.startsWith('Member ')) {
        const mName = selectedMember ? members.find(m => m.user_id === selectedMember)?.name : "";
        doc.text(`Member: ${mName} (RFK-M-${selectedMember})`, 14, 36);
        doc.text(`Generated: ${date}`, 14, 42);
        startY = 50;
      } else {
        doc.text(`Generated: ${date}`, 14, 36);
        startY = 45;
      }

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
        tableColumn = ["Date", "Time", "Member", "Status"];
        if (!data.attendance_logs || data.attendance_logs.length === 0) return toast.error("No data");
        tableRows = data.attendance_logs.map(log => [
          log.date,
          log.check_in,
          log.member_name,
          log.status
        ]);
        tableRows.push(['', '', 'TOTAL VISITS', data.attendance_logs.length]);

      } else if (type === 'Membership') {
        tableColumn = ["Plan Name", "Price", "Active Members", "Est. Monthly Value"];
        if (data.membership.length === 0) return toast.error("No data");
        tableRows = data.membership.map(row => [
          row.plan_name,
          `Rs. ${row.plan_price}`,
          row.member_count,
          `Rs. ${row.estimated_value.toFixed(2)}`
        ]);

      } else if (type === 'Retention') {
        tableColumn = ["At-Risk Member", "Phone", "Email", "Status"];
        if (data.retention.at_risk_members.length === 0) return toast.error("No at-risk members");
        tableRows = data.retention.at_risk_members.map(row => [
          row.name,
          row.phone || 'N/A',
          row.email,
          'No Visit 21+ Days'
        ]);
      } else if (type === 'Member ATTENDANCE') {
        tableColumn = ["Date", "Check-In", "Check-Out", "Duration", "Status"];
        if (!memberReport || !memberReport.attendance.length) return toast.error("No attendance data");
        tableRows = memberReport.attendance.map(a => [
          a.date,
          a.check_in || '-',
          a.check_out || '-',
          calculateDuration(a.check_in, a.check_out),
          a.status
        ]);
      } else if (type === 'Member CLASSES') {
        tableColumn = ["Date", "Class", "Status"];
        if (!memberReport || !memberReport.classes.length) return toast.error("No classes data");
        tableRows = memberReport.classes.map(c => [c.date, `${c.class_name} (${c.start_time})`, c.status]);
      } else if (type === 'Member PAYMENTS') {
        tableColumn = ["Date", "Plan", "Amount", "Status"];
        if (!memberReport || !memberReport.payments.length) return toast.error("No payments data");
        tableRows = memberReport.payments.map(p => [new Date(p.date).toLocaleDateString(), p.plan_name, `Rs. ${p.amount}`, p.status]);
      }

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: startY,
        theme: 'grid',
        headStyles: { fillColor: [30, 64, 175], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 9 },
      });

      doc.save(`RFK_${type.replace(' ', '_')}_Report.pdf`);
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
        headers = ["Date", "Time", "Member", "Status"];
        rows = data.attendance_logs.map(r => [r.date, r.check_in, r.member_name, r.status]);
      } else if (type === 'Membership') {
        headers = ["Plan Name", "Price", "Active Members", "Est. Value"];
        rows = data.membership.map(r => [r.plan_name, r.plan_price, r.member_count, r.estimated_value]);
      } else if (type === 'Retention') {
        headers = ["At-Risk Member", "Phone", "Email"];
        rows = data.retention.at_risk_members.map(r => [r.name, r.phone, r.email]);
      } else if (type === 'Member ATTENDANCE') {
        headers = ["Date", "Check-In", "Check-Out", "Duration", "Status"];
        if (!memberReport || !memberReport.attendance.length) return toast.error("No attendance data");
        rows = memberReport.attendance.map(a => [
          a.date,
          a.check_in || '-',
          a.check_out || '-',
          calculateDuration(a.check_in, a.check_out),
          a.status
        ]);
      } else if (type === 'Member CLASSES') {
        headers = ["Date", "Class", "Status"];
        if (!memberReport || !memberReport.classes.length) return toast.error("No classes data");
        rows = memberReport.classes.map(c => [c.date, `${c.class_name} (${c.start_time})`, c.status]);
      } else if (type === 'Member PAYMENTS') {
        headers = ["Date", "Plan", "Amount", "Status"];
        if (!memberReport || !memberReport.payments.length) return toast.error("No payments data");
        rows = memberReport.payments.map(p => [new Date(p.date).toLocaleDateString(), p.plan_name, p.amount, p.status]);
      }

      if (rows.length === 0) return toast.error("No data");

      let csvString = "";
      if (type.startsWith('Member ')) {
        const mName = selectedMember ? members.find(m => m.user_id === selectedMember)?.name : "";
        csvString += `Member Name: ${mName},Member ID: RFK-M-${selectedMember}\n\n`;
      }
      csvString += [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `RFK_${type.replace(' ', '_')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("CSV Downloaded");
    } catch (err) {
      console.error(err);
      toast.error("CSV generation failed");
    }
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
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl w-fit overflow-x-auto max-w-full">
        {['FINANCIAL', 'ATTENDANCE', 'MEMBERSHIP', 'RETENTION', 'MEMBER SPECIFIC'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2.5 text-sm font-bold rounded-lg transition-all whitespace-nowrap ${activeTab === tab
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            {tab}
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
          <div className={`bg-white p-6 rounded-2xl shadow-sm border border-gray-100 ${activeTab === 'MEMBER SPECIFIC' ? 'col-span-1 lg:col-span-3' : 'lg:col-span-2'}`}>
            {activeTab !== 'MEMBER SPECIFIC' && (
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  {activeTab === 'FINANCIAL' && <><TrendingUp size={20} className="text-green-500" /> Revenue Trend</>}
                  {activeTab === 'ATTENDANCE' && <><TrendingUp size={20} className="text-blue-500" /> Check-in Volume</>}
                  {activeTab === 'MEMBERSHIP' && <><TrendingUp size={20} className="text-purple-500" /> Membership Distribution</>}
                  {activeTab === 'RETENTION' && <><AlertCircle size={20} className="text-red-500" /> At-Risk & Expiring Members</>}
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
            )}

            {activeTab !== 'MEMBER SPECIFIC' && (
              <div className="h-[350px] w-full">
                {activeTab === 'FINANCIAL' && (
                  <ResponsiveContainer>
                    <AreaChart data={data.financial}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1} />
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tickFormatter={(val) => `${val / 1000}k`} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Area type="monotone" dataKey="total_revenue" stroke="#3B82F6" strokeWidth={3} fill="url(#colorRev)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}

                {activeTab === 'ATTENDANCE' && (
                  <ResponsiveContainer>
                    <LineChart data={data.attendance}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Line type="monotone" dataKey="count" stroke="#8B5CF6" strokeWidth={3} dot={{ r: 4 }} />
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
                        nameKey="plan_name"
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

                {activeTab === 'RETENTION' && (
                  <div className="h-[350px] w-full overflow-y-auto custom-scrollbar space-y-6">
                    {/* At Risk Table */}
                    <div>
                      <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                        <UserMinus size={16} className="text-red-500" /> At-Risk Members (No visit 21+ days)
                      </h4>
                      {data.retention.at_risk_members.length > 0 ? (
                        <table className="w-full text-sm text-left">
                          <thead className="text-xs text-gray-400 uppercase bg-gray-50">
                            <tr>
                              <th className="px-3 py-2">Name</th>
                              <th className="px-3 py-2">Contact</th>
                              <th className="px-3 py-2">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {data.retention.at_risk_members.map(m => (
                              <tr key={m.user_id} className="hover:bg-gray-50">
                                <td className="px-3 py-2 font-medium text-gray-900">{m.name}</td>
                                <td className="px-3 py-2 text-gray-500">
                                  <div className="flex flex-col">
                                    <span>{m.phone || 'No Phone'}</span>
                                    <span className="text-xs">{m.email}</span>
                                  </div>
                                </td>
                                <td className="px-3 py-2">
                                  <button className="text-blue-600 hover:underline text-xs font-bold">Call</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <p className="text-sm text-gray-400 italic">No at-risk members found.</p>
                      )}
                    </div>

                    {/* Expiring Table */}
                    <div>
                      <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                        <Clock size={16} className="text-orange-500" /> Expiring Soon (Next 30 Days)
                      </h4>
                      {data.retention.expiring_members.length > 0 ? (
                        <table className="w-full text-sm text-left">
                          <thead className="text-xs text-gray-400 uppercase bg-gray-50">
                            <tr>
                              <th className="px-3 py-2">Name</th>
                              <th className="px-3 py-2">Plan</th>
                              <th className="px-3 py-2">Expires</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {data.retention.expiring_members.map(m => (
                              <tr key={m.subscription_id} className="hover:bg-gray-50">
                                <td className="px-3 py-2 font-medium text-gray-900">{m.member_name}</td>
                                <td className="px-3 py-2 text-gray-500">{m.plan_name}</td>
                                <td className="px-3 py-2 font-bold text-orange-600">{m.end_date}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <p className="text-sm text-gray-400 italic">No memberships expiring soon.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SECONDARY CHART: PEAK HOURS (Only Attendance Tab) */}
            {activeTab === 'ATTENDANCE' && data.peak_hours && data.peak_hours.length > 0 && (
              <div className="mt-8 border-t border-gray-100 pt-6">
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Clock size={20} className="text-orange-500" /> Peak Hours (Busiest Times)
                </h3>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer>
                    <BarChart data={data.peak_hours}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="hour" />
                      <YAxis allowDecimals={false} />
                      <Tooltip cursor={{ fill: '#FFF7ED' }} />
                      <Bar dataKey="count" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* MEMBER SPECIFIC CONTENT */}
            {activeTab === 'MEMBER SPECIFIC' && (
              <div className="space-y-6">
                {/* Member Search/Select */}
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
                    <UserCheck size={20} className="text-teal-500" /> Member Specific History
                  </h3>
                  <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      list="members-list"
                      placeholder="Search member by Name or Member ID..."
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                      value={memberSearchQuery}
                      onChange={(e) => {
                        const val = e.target.value;
                        setMemberSearchQuery(val);
                        const match = members.find(m => `${m.name} (RFK-M-${m.user_id})` === val || `RFK-M-${m.user_id}` === val || m.name === val);
                        if (match) {
                          setSelectedMember(match.user_id);
                          setMemberSearchQuery(`${match.name} (RFK-M-${match.user_id})`);
                        } else {
                          setSelectedMember("");
                        }
                      }}
                    />
                    <datalist id="members-list">
                      {members.map(m => (
                        <option key={m.user_id} value={`${m.name} (RFK-M-${m.user_id})`} />
                      ))}
                    </datalist>
                  </div>
                </div>

                {/* Report Data Display */}
                {selectedMember && memberReport && (
                  <div className="mt-6">
                    {/* Sub-tabs for Member Report Types */}
                    <div className="flex space-x-2 mb-6 bg-gray-50 p-1.5 rounded-xl w-fit">
                      {['ATTENDANCE', 'CLASSES', 'PAYMENTS'].map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setMemberReportTab(tab)}
                          className={`px-5 py-2.5 text-sm font-bold rounded-lg transition-all ${memberReportTab === tab
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                          {tab.charAt(0) + tab.slice(1).toLowerCase()}
                        </button>
                      ))}
                    </div>

                    <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm w-full min-h-[300px] max-h-[500px] overflow-y-auto custom-scrollbar">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 sticky top-0 bg-white pb-3 border-b border-gray-50 z-10 gap-4">
                        <h4 className="font-bold text-gray-900 flex items-center gap-2">
                          {memberReportTab === 'ATTENDANCE' && "Attendance Log"}
                          {memberReportTab === 'CLASSES' && "Class Bookings"}
                          {memberReportTab === 'PAYMENTS' && "Payment History"}
                          <span className="bg-blue-100 text-blue-700 text-xs px-2.5 py-1 rounded-full">
                            {memberReportTab === 'ATTENDANCE' && memberReport.attendance.length}
                            {memberReportTab === 'CLASSES' && memberReport.classes.length}
                            {memberReportTab === 'PAYMENTS' && memberReport.payments.length}
                          </span>
                        </h4>

                        <div className="flex gap-2 w-full md:w-auto">
                          <button onClick={() => downloadCSV(`Member ${memberReportTab}`)} className="flex-1 md:flex-none justify-center items-center gap-1.5 bg-green-50 text-green-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-100 transition flex">
                            <FileText size={16} /> Export CSV
                          </button>
                          <button onClick={() => downloadPDF(`Member ${memberReportTab}`)} className="flex-1 md:flex-none justify-center items-center gap-1.5 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-100 transition flex">
                            <Download size={16} /> Export PDF
                          </button>
                        </div>
                      </div>

                      {memberReportTab === 'ATTENDANCE' && (
                        memberReport.attendance.length > 0 ? (
                          <table className="w-full text-sm text-left border-separate border-spacing-y-2">
                            <thead className="text-xs text-gray-400 uppercase bg-gray-50">
                              <tr>
                                <th className="px-4 py-3 rounded-l-lg">Date</th>
                                <th className="px-4 py-3">Check-In</th>
                                <th className="px-4 py-3">Check-Out</th>
                                <th className="px-4 py-3">Duration</th>
                                <th className="px-4 py-3 rounded-r-lg">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y-0">
                              {memberReport.attendance.map(a => (
                                <tr key={a.id} className="bg-white hover:bg-gray-50 transition border-b border-gray-50">
                                  <td className="px-4 py-4 font-bold text-gray-800 rounded-l-lg border-y border-l border-gray-100">{a.date}</td>
                                  <td className="px-4 py-4 text-gray-600 border-y border-gray-100">{a.check_in || '-'}</td>
                                  <td className="px-4 py-4 text-gray-600 border-y border-gray-100">{a.check_out || '-'}</td>
                                  <td className="px-4 py-4 font-medium text-blue-600 border-y border-gray-100">{calculateDuration(a.check_in, a.check_out)}</td>
                                  <td className="px-4 py-4 border-y border-r border-gray-100 rounded-r-lg">
                                    <span className="text-xs font-bold text-green-700 bg-green-100 px-3 py-1.5 rounded-full">{a.status}</span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                            <Clock size={40} className="text-gray-200 mb-3" />
                            <p className="text-sm italic">No attendance records in this period.</p>
                          </div>
                        )
                      )}

                      {memberReportTab === 'CLASSES' && (
                        memberReport.classes.length > 0 ? (
                          <div className="space-y-3">
                            {memberReport.classes.map(c => (
                              <div key={c.id} className="flex justify-between items-center text-sm p-4 hover:bg-gray-50 rounded-lg bg-gray-50/50 transition border border-transparent hover:border-gray-100">
                                <div>
                                  <p className="font-bold text-gray-800 text-base">{c.class_name}</p>
                                  <p className="text-sm text-gray-500 mt-0.5">{c.date} ({c.start_time})</p>
                                </div>
                                <span className={`text-xs font-bold px-3 py-1.5 rounded-lg ${c.status === 'ATTENDED' ? 'text-green-700 bg-green-100' : 'text-blue-700 bg-blue-100'}`}>{c.status}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                            <Calendar size={40} className="text-gray-200 mb-3" />
                            <p className="text-sm italic">No class bookings in this period.</p>
                          </div>
                        )
                      )}

                      {memberReportTab === 'PAYMENTS' && (
                        memberReport.payments.length > 0 ? (
                          <table className="w-full text-sm text-left border-separate border-spacing-y-2">
                            <thead className="text-xs text-gray-400 uppercase bg-gray-50">
                              <tr>
                                <th className="px-4 py-3 rounded-l-lg">Date</th>
                                <th className="px-4 py-3">Plan</th>
                                <th className="px-4 py-3">Amount</th>
                                <th className="px-4 py-3">Method</th>
                                <th className="px-4 py-3 rounded-r-lg">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y-0">
                              {memberReport.payments.map(p => (
                                <tr key={p.id} className="bg-white hover:bg-gray-50 transition border-b border-gray-50">
                                  <td className="px-4 py-4 text-gray-600 rounded-l-lg border-y border-l border-gray-100">
                                    {new Date(p.date).toLocaleDateString()}
                                  </td>
                                  <td className="px-4 py-4 font-medium text-gray-900 border-y border-gray-100">{p.plan_name}</td>
                                  <td className="px-4 py-4 font-bold text-gray-900 border-y border-gray-100">{formatCurrency(p.amount)}</td>
                                  <td className="px-4 py-4 text-gray-500 border-y border-gray-100">{p.method}</td>
                                  <td className="px-4 py-4 border-y border-r border-gray-100 rounded-r-lg">
                                    <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${p.status === 'COMPLETED' || p.status === 'VERIFIED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                      {p.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                            <TrendingUp size={40} className="text-gray-200 mb-3" />
                            <p className="text-sm italic">No payments in this period.</p>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

                {!selectedMember && (
                  <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                    <UserCheck size={48} className="text-gray-300 mb-4" />
                    <p className="text-gray-500 text-base font-medium">Please select a member to view their customized report.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RIGHT: INSIGHTS (Hidden for Member Specific) */}
          {activeTab !== 'MEMBER SPECIFIC' && (
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
                  {activeTab === 'RETENTION' && data.retention.at_risk_count}
                </h2>
                <p className="text-sm text-blue-200 mt-2 opacity-80">
                  {activeTab === 'RETENTION'
                    ? 'Members at risk of leaving (No visit in 21 days)'
                    : `Data from ${new Date(dateRange.start).toLocaleDateString()} to ${new Date(dateRange.end).toLocaleDateString()}`
                  }
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
                              style={{ width: `${(method.value / data.financial.reduce((a, b) => a + b.total_revenue, 0)) * 100}%` }}
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

                  {activeTab === 'ATTENDANCE' && (
                    <div className="space-y-0 divide-y divide-gray-50">
                      {data.attendance_logs?.length > 0 ? (
                        data.attendance_logs.map((log) => (
                          <div key={log.id} className="flex justify-between items-center text-sm py-3 hover:bg-gray-50 px-2 rounded-lg transition">
                            <div className="flex flex-col">
                              <span className="text-gray-900 font-bold">{log.member_name}</span>
                              <span className="text-[10px] text-gray-400">{log.date} at {log.check_in}</span>
                            </div>
                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${log.status === 'PRESENT' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                              {log.status}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-400 text-sm text-center py-4">No attendance records found.</p>
                      )}
                    </div>
                  )}

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

                {activeTab === 'RETENTION' && (
                  <div className="space-y-4 pt-2">
                    <div className="flex justify-between items-center p-3 bg-red-50 rounded-xl border border-red-100">
                      <span className="text-red-800 font-bold text-sm">Churned (Range)</span>
                      <span className="text-2xl font-black text-red-600">{data.retention.churn_count}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-orange-50 rounded-xl border border-orange-100">
                      <span className="text-orange-800 font-bold text-sm">Expiring Soon</span>
                      <span className="text-2xl font-black text-orange-600">{data.retention.expiring_count}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-xl border border-blue-100">
                      <span className="text-blue-800 font-bold text-sm">Active Members</span>
                      <span className="text-2xl font-black text-blue-600">
                        {data.membership.reduce((a, b) => a + b.member_count, 0)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}