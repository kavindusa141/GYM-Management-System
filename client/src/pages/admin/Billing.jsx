import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  FileText, Receipt, Upload, CheckCircle, Calendar, 
  Search, ChevronDown, Filter, X, XCircle, AlertCircle
} from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export default function Billing() {
  const [payments, setPayments] = useState([]);
  const [members, setMembers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);

  // --- Search & Filter States ---
  const [historySearch, setHistorySearch] = useState(''); 
  const [historyFilter, setHistoryFilter] = useState('ALL');
  
  // New: Month Filter (Default to current month: YYYY-MM)
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  // --- Smart Dropdown State ---
  const [memberQuery, setMemberQuery] = useState(''); 
  const [showMemberList, setShowMemberList] = useState(false); 
  const dropdownRef = useRef(null); 

  // Form State
  const [formData, setFormData] = useState({
    user_id: '',
    plan_id: '',
    amount: '',
    payment_method: 'CASH',
    reference_number: ''
  });
  
  const [slipFile, setSlipFile] = useState(null);

  // Fetch Data
  const fetchData = async () => {
    try {
      const [membersRes, plansRes, paymentsRes] = await Promise.all([
        api.get('/admin/members'),
        api.get('/memberships'),
        api.get('/payments')
      ]);
      setMembers(membersRes.data);
      setPlans(plansRes.data);
      setPayments(paymentsRes.data);
    } catch (error) {
      toast.error("Failed to load billing data");
    }
  };

  useEffect(() => { fetchData(); }, []);

  // --- LOGIC: Member Search ---
  const filteredMembers = members.filter(m => {
    const name = (m.name || '').toLowerCase();
    const code = (m.member_code || '').toLowerCase();
    const query = memberQuery.toLowerCase();
    return name.includes(query) || code.includes(query);
  });

  const selectMember = (member) => {
    setFormData({ ...formData, user_id: member.user_id });
    setMemberQuery(`${member.name} (${member.member_code || 'No ID'})`); 
    setShowMemberList(false);
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowMemberList(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  // --- LOGIC: History Filter (Includes Month) ---
  const filteredPayments = payments.filter(pay => {
    const userName = (pay.User?.name || '').toLowerCase();
    const userCode = (pay.User?.member_code || '').toLowerCase();
    const search = historySearch.toLowerCase();
    
    // Use transaction_date instead of created_at
    const payDate = new Date(pay.transaction_date || pay.createdAt).toISOString().slice(0, 7);

    // 1. Search Logic
    const matchesSearch = userName.includes(search) || userCode.includes(search);
    
    // 2. Payment Method Filter
    const matchesMethod = historyFilter === 'ALL' || pay.payment_method === historyFilter;

    // 3. Month Filter (Only if a month is selected)
    const matchesMonth = !selectedMonth || payDate === selectedMonth;

    return matchesSearch && matchesMethod && matchesMonth;
  });

  // --- LOGIC: Calculate Total for filtered view ---
  const monthlyTotal = filteredPayments.reduce((sum, pay) => {
      // Only sum up verified/completed payments
      if(pay.status === 'VERIFIED' || pay.status === 'COMPLETED' || pay.status === 'SUCCESS') {
          return sum + Number(pay.amount);
      }
      return sum;
  }, 0);


  const handlePlanChange = (e) => {
    const selectedPlanId = e.target.value;
    const selectedPlan = plans.find(p => p.plan_id.toString() === selectedPlanId);
    setFormData({
      ...formData,
      plan_id: selectedPlanId,
      amount: selectedPlan ? selectedPlan.price : ''
    });
  };

  // --- UPDATED: Verify Functionality with Reason ---
  const handleVerify = async (id, action) => {
    let reason = null;

    if (action === 'REJECT') {
        // Prompt for reason
        reason = window.prompt("Please provide a reason for rejection (required):");
        if (reason === null) return; // User cancelled
        if (reason.trim() === "") {
            toast.error("Rejection reason is required");
            return;
        }
    } else {
        if(!window.confirm(`Are you sure you want to approve this payment?`)) return;
    }

    try {
      await api.post(`/payments/verify/${id}`, { action, reason });
      toast.success(action === 'APPROVE' ? "Payment Verified" : "Payment Rejected");
      fetchData();
    } catch(err) { 
        toast.error("Action failed"); 
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.user_id) {
      toast.error("Please select a member first");
      return;
    }
    setLoading(true);

    try {
      const data = new FormData();
      data.append('user_id', formData.user_id);
      data.append('plan_id', formData.plan_id);
      data.append('amount', formData.amount);
      data.append('payment_method', formData.payment_method);
      if (formData.reference_number) data.append('reference_number', formData.reference_number);
      if (slipFile) data.append('slip_image', slipFile);

      await api.post('/payments/admin-pay', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success("Payment recorded successfully!");
      setFormData({ user_id: '', plan_id: '', amount: '', payment_method: 'CASH', reference_number: '' });
      setMemberQuery(''); 
      setSlipFile(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to record payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-900">Billing & Transactions</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* --- LEFT: Secure Payment Form --- */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-6">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" /> New Payment
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div ref={dropdownRef} className="relative">
                <label className="text-sm font-medium text-gray-700">Select Member</label>
                <div className="relative mt-1">
                  <input 
                    type="text" 
                    placeholder="Type Name or ID (e.g. RFK...)"
                    className="w-full p-3 pl-10 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white transition-all shadow-sm"
                    value={memberQuery}
                    onChange={(e) => {
                      setMemberQuery(e.target.value);
                      setShowMemberList(true);
                      setFormData({...formData, user_id: ''}); 
                    }}
                    onFocus={() => setShowMemberList(true)}
                  />
                  <Search className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                  <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-gray-400" />
                </div>
                {showMemberList && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl max-h-60 overflow-y-auto animate-fade-in-up">
                    {filteredMembers.length === 0 ? (
                      <div className="p-3 text-sm text-gray-500 text-center">No members found.</div>
                    ) : (
                      filteredMembers.map(m => (
                        <div 
                          key={m.user_id}
                          onClick={() => selectMember(m)}
                          className="p-3 hover:bg-blue-50 cursor-pointer flex justify-between items-center transition-colors border-b border-gray-50 last:border-0"
                        >
                          <div>
                            <p className="font-bold text-gray-800 text-sm">{m.name}</p>
                            <p className="text-xs text-gray-500">{m.email}</p>
                          </div>
                          <span className="text-xs font-mono font-bold bg-gray-100 px-2 py-1 rounded text-gray-600">
                            {m.member_code || 'No ID'}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Membership Plan</label>
                <select required 
                  className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white mt-1 shadow-sm"
                  value={formData.plan_id}
                  onChange={handlePlanChange}
                >
                  <option value="">-- Choose Plan --</option>
                  {plans.map(p => (
                    <option key={p.plan_id} value={p.plan_id}>
                      {p.name} - Rs. {p.price}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Amount (Rs.)</label>
                  <input type="number" required readOnly
                    className="w-full p-3 border rounded-xl bg-gray-50 text-gray-600 font-bold mt-1"
                    value={formData.amount}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Method</label>
                  <select 
                    className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white mt-1 shadow-sm"
                    value={formData.payment_method}
                    onChange={(e) => setFormData({...formData, payment_method: e.target.value})}
                  >
                    <option value="CASH">Cash (Desk)</option>
                    <option value="TRANSFER">Bank Slip</option>
                  </select>
                </div>
              </div>

              {formData.payment_method === 'TRANSFER' && (
                <div className="bg-blue-50 p-4 rounded-xl space-y-3 border border-blue-100 animate-fade-in">
                  <div>
                    <label className="text-xs font-bold text-blue-800 uppercase">Bank Reference No</label>
                    <input type="text" placeholder="e.g. REF-882211"
                      className="w-full p-2 mt-1 border rounded-lg text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                      value={formData.reference_number}
                      onChange={(e) => setFormData({...formData, reference_number: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-blue-800 uppercase">Upload Slip Image</label>
                    <div className="mt-1 flex items-center gap-2">
                      <label className="flex-1 cursor-pointer bg-white border border-blue-200 text-blue-600 px-4 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-blue-50 transition-colors">
                        <Upload className="w-4 h-4" />
                        {slipFile ? "Change File" : "Choose Image"}
                        <input type="file" accept="image/*" className="hidden" 
                          onChange={(e) => setSlipFile(e.target.files[0])}
                        />
                      </label>
                    </div>
                    {slipFile && <p className="text-xs text-green-600 mt-1 truncate font-medium">Selected: {slipFile.name}</p>}
                  </div>
                </div>
              )}

              <button type="submit" disabled={loading} className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg mt-2 flex justify-center items-center gap-2 transition-all active:scale-95">
                {loading ? "Processing..." : (
                  <>
                    <CheckCircle className="w-5 h-5" /> 
                    {formData.payment_method === 'CASH' ? 'Proceed Payment' : 'Verify & Save'}
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* --- RIGHT: History with Month Filter --- */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[500px]">
            
            {/* 1. Header & Filters */}
            <div className="p-5 border-b border-gray-100 bg-gray-50 flex flex-col gap-4">
              
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-gray-500" />
                  <h3 className="font-bold text-gray-900">History</h3>
                  
                  {/* Revenue Badge */}
                  <span className="ml-2 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold border border-green-200">
                    Revenue: Rs. {monthlyTotal.toLocaleString()}
                  </span>
                </div>

                {/* MONTH PICKER */}
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-gray-200 shadow-sm">
                  <span className="text-xs font-bold text-gray-400 uppercase">Month:</span>
                  <input 
                    type="month" 
                    className="text-sm font-bold text-gray-700 outline-none cursor-pointer"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                  />
                  {selectedMonth && (
                    <button onClick={() => setSelectedMonth('')} className="text-gray-400 hover:text-red-500">
                      <X className="w-4 h-4"/>
                    </button>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row gap-3 justify-between">
                {/* Search */}
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Search by Name or ID..." 
                    className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 w-full bg-white"
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                  />
                </div>

                {/* Tabs */}
                <div className="flex bg-white rounded-lg p-1 border border-gray-200 shadow-sm w-fit">
                  {['ALL', 'CASH', 'TRANSFER', 'CARD'].map(type => (
                    <button
                      key={type}
                      onClick={() => setHistoryFilter(type)}
                      className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
                        historyFilter === type 
                          ? 'bg-gray-900 text-white shadow-sm' 
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. Transactions List */}
            {filteredPayments.length === 0 ? (
              <div className="p-10 text-center text-gray-500 flex flex-col items-center gap-2 mt-10">
                <Filter className="w-12 h-12 text-gray-200" />
                <p>No transactions found for this month.</p>
                {selectedMonth && (
                  <button onClick={() => setSelectedMonth('')} className="text-blue-600 text-sm hover:underline">
                    View All Time
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredPayments.map((pay) => (
                  <div key={pay.payment_id} className="p-5 hover:bg-gray-50 transition-colors flex justify-between items-start">
                    
                    <div className="flex gap-4">
                      {/* Initial Circle */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mt-1 shrink-0 shadow-sm font-bold text-lg border-2
                        ${pay.payment_method === 'CASH' 
                          ? 'bg-green-50 text-green-600 border-green-100' 
                          : 'bg-purple-50 text-purple-600 border-purple-100'}`}>
                        {pay.User?.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      
                      <div>
                        <p className="font-bold text-gray-900">{pay.User?.name || 'Unknown User'}</p>
                        <p className="text-xs text-blue-600 font-mono font-bold bg-blue-50 inline-block px-1 rounded mt-0.5">
                          {pay.User?.member_code || `ID: ${pay.user_id}`}
                        </p>
                        
                        <div className="flex flex-wrap gap-2 text-xs text-gray-500 mt-2">
                          <span className="bg-gray-100 px-2 py-0.5 rounded border border-gray-200">{pay.MembershipPlan?.name || 'Unknown Plan'}</span>
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/> {new Date(pay.transaction_date).toLocaleDateString()}</span>
                        </div>
                        
                        {pay.slip_url && (
                          <a href={`${BACKEND_URL}${pay.slip_url}`} target="_blank" rel="noreferrer" 
                             className="text-xs text-blue-600 font-bold underline mt-2 block hover:text-blue-800 flex items-center gap-1">
                             <FileText className="w-3 h-3"/> View Bank Slip
                          </a>
                        )}
                        {pay.reference_number && (
                           <p className="text-[10px] text-gray-400 font-mono mt-1">Ref: {pay.reference_number}</p>
                        )}

                        {/* --- REJECTION REASON DISPLAY (New) --- */}
                        {pay.status === 'FAILED' && pay.rejection_reason && (
                          <div className="mt-2 bg-red-50 text-red-700 text-xs p-2 rounded border border-red-100 flex items-start gap-2 max-w-xs">
                              <AlertCircle size={14} className="mt-0.5 shrink-0"/>
                              <span><span className="font-bold">Reason:</span> {pay.rejection_reason}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">Rs. {pay.amount}</p>
                      
                      <div className="flex flex-col items-end gap-1 mt-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide border shadow-sm
                          ${pay.payment_method === 'CASH' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-purple-50 text-purple-700 border-purple-200'}`}>
                          {pay.payment_method}
                        </span>
                        
                        {/* STATUS BADGES & ACTIONS */}
                        {(pay.status === 'VERIFIED' || pay.status === 'COMPLETED' || pay.status === 'SUCCESS') ? (
                          <div className="flex flex-col gap-2">
                            <span className="flex items-center gap-1 text-xs text-green-600 font-bold mt-1">
                               <CheckCircle className="w-3 h-3" /> Verified
                            </span>
                            <a
                              href={`/receipt/${pay.payment_id}`}
                              className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                              <Receipt className="w-3 h-3" />
                                   View Receipt
                                </a>
                          </div>
                        ) : pay.status === 'FAILED' ? (
                           <span className="flex items-center gap-1 text-xs text-red-600 font-bold mt-1">
                             <XCircle className="w-3 h-3" /> Rejected
                          </span>
                        ) : (
                           // PENDING STATUS - SHOW ACTION BUTTONS
                           <div className="flex items-center gap-2 mt-2">
                             <button 
                               onClick={() => handleVerify(pay.payment_id, 'APPROVE')}
                               className="bg-green-100 text-green-700 hover:bg-green-200 p-1.5 rounded-lg transition-colors"
                               title="Approve Payment"
                             >
                               <CheckCircle className="w-4 h-4" />
                             </button>
                             <button 
                               onClick={() => handleVerify(pay.payment_id, 'REJECT')}
                               className="bg-red-100 text-red-700 hover:bg-red-200 p-1.5 rounded-lg transition-colors"
                               title="Reject Payment"
                             >
                               <XCircle className="w-4 h-4" />
                             </button>
                           </div>
                        )}
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}