import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  Search, CheckCircle, Banknote, Calendar, 
  History, Receipt, FileText, Upload, Filter, X, ChevronDown 
} from 'lucide-react';
import { formatCurrency } from '../../utils/currencyFormatter';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export default function PointOfSale() {
  // --- TABS STATE ---
  const [activeTab, setActiveTab] = useState('POS');

  // --- DATA STATE ---
  const [members, setMembers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- POS SELECTION STATE ---
  const [selectedMember, setSelectedMember] = useState(null);
  const [showMemberDropdown, setShowMemberDropdown] = useState(false); // UX: Control Dropdown
  const [selectedPlan, setSelectedPlan] = useState(null);
  
  // RESTRICTED: Staff only has CASH or TRANSFER
  const [paymentMethod, setPaymentMethod] = useState('CASH'); 
  
  const [searchTerm, setSearchTerm] = useState('');
  const [processing, setProcessing] = useState(false);
  
  // --- BANK TRANSFER STATE ---
  const [slipFile, setSlipFile] = useState(null);
  const [referenceNo, setReferenceNo] = useState('');

  // --- HISTORY FILTER STATE ---
  const [historySearch, setHistorySearch] = useState('');
  const [historyFilter, setHistoryFilter] = useState('ALL');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  // Ref for clicking outside to close dropdown
  const dropdownRef = useRef(null);

  // --- FETCH DATA ---
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
      toast.error("Failed to load system data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowMemberDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- POS LOGIC: PROCESS PAYMENT ---
  const handleProcessPayment = async () => {
    if (!selectedMember || !selectedPlan) return toast.error("Please select a member and a plan");

    setProcessing(true);
    try {
      const formData = new FormData();
      formData.append('user_id', selectedMember.user_id);
      formData.append('plan_id', selectedPlan.plan_id);
      formData.append('amount', selectedPlan.price);
      formData.append('payment_method', paymentMethod);
      
      const finalRef = referenceNo || `POS-${Date.now()}`;
      formData.append('reference_number', finalRef);

      if (paymentMethod === 'TRANSFER' && slipFile) {
        formData.append('slip_image', slipFile);
      }

      await api.post('/payments/admin-pay', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success("Payment Successful & Membership Active!");
      
      // Reset POS Form
      setSelectedMember(null);
      setSelectedPlan(null);
      setPaymentMethod('CASH');
      setSlipFile(null);
      setReferenceNo('');
      setSearchTerm('');
      
      fetchData();
      setActiveTab('HISTORY');

    } catch (error) {
      toast.error(error.response?.data?.message || "Payment failed");
    } finally {
      setProcessing(false);
    }
  };

  // --- HISTORY LOGIC: FILTERING ---
  const filteredPayments = payments.filter(pay => {
    const userName = (pay.User?.name || '').toLowerCase();
    const userCode = (pay.User?.member_code || '').toLowerCase();
    const search = historySearch.toLowerCase();
    const payDate = new Date(pay.transaction_date || pay.createdAt).toISOString().slice(0, 7);

    const matchesSearch = userName.includes(search) || userCode.includes(search);
    const matchesMethod = historyFilter === 'ALL' || pay.payment_method === historyFilter;
    const matchesMonth = !selectedMonth || payDate === selectedMonth;

    return matchesSearch && matchesMethod && matchesMonth;
  });

  const monthlyRevenue = filteredPayments.reduce((sum, pay) => {
    return (['VERIFIED', 'COMPLETED', 'SUCCESS'].includes(pay.status)) ? sum + Number(pay.amount) : sum;
  }, 0);

  // Filter Members for Dropdown
  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (m.member_code && m.member_code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if(loading) return <div className="p-10 text-center text-gray-500">Loading System...</div>;

  return (
    <div className="space-y-6 animate-fade-in h-[calc(100vh-100px)] flex flex-col">
      
      {/* --- TOP HEADER & TABS --- */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Staff Point of Sale</h1>
          <p className="text-gray-500">Process payments and view transaction history.</p>
        </div>

        <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
          <button
            onClick={() => setActiveTab('POS')}
            className={`px-6 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'POS' 
                ? 'bg-slate-900 text-white shadow-md' 
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <Banknote size={16} /> New Sale
          </button>
          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`px-6 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'HISTORY' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <History size={16} /> History
          </button>
        </div>
      </div>

      {/* ======================= TAB 1: NEW SALE (POS) ======================= */}
      {activeTab === 'POS' && (
        <div className="grid lg:grid-cols-3 gap-8 flex-1 min-h-0">
          
          {/* LEFT: SELECTION AREA (Scrollable) */}
          <div className="lg:col-span-2 flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2 pb-4">
            
            {/* 1. Improved Member Search (Dropdown Style) */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative" ref={dropdownRef}>
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Search className="text-blue-600" size={20} /> Select Member
              </h2>
              
              <div className="relative">
                <input 
                  type="text"
                  placeholder="Type Name or Member ID..."
                  className="w-full pl-4 pr-10 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                  value={searchTerm}
                  onFocus={() => setShowMemberDropdown(true)}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowMemberDropdown(true);
                  }}
                />
                <ChevronDown className="absolute right-3 top-3.5 text-gray-400 w-5 h-5 pointer-events-none" />
                
                {/* SEARCH RESULTS DROPDOWN */}
                {showMemberDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto z-50 custom-scrollbar">
                    {filteredMembers.length === 0 ? (
                      <div className="p-4 text-center text-gray-500 text-sm">No members found</div>
                    ) : (
                      filteredMembers.map(member => (
                        <div 
                          key={member.user_id}
                          onClick={() => {
                            setSelectedMember(member);
                            setSearchTerm(member.name); // Set input to selected name
                            setShowMemberDropdown(false); // Close dropdown
                          }}
                          className={`p-3 px-4 cursor-pointer flex justify-between items-center transition-all border-b border-gray-50 last:border-0 ${
                            selectedMember?.user_id === member.user_id 
                              ? 'bg-blue-50 text-blue-700' 
                              : 'hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          <div>
                            <p className="font-bold text-sm">{member.name}</p>
                            <p className="text-xs text-gray-500">{member.member_code} • {member.email}</p>
                          </div>
                          {selectedMember?.user_id === member.user_id && <CheckCircle size={18} className="text-blue-600"/>}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
              
              {/* Selected Member Indicator */}
              {selectedMember && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                    {selectedMember.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs text-blue-600 font-bold uppercase">Selected Member</p>
                    <p className="font-bold text-gray-900">{selectedMember.name}</p>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Plan Selection */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="text-blue-600" size={20} /> Select Plan
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {plans.map(plan => (
                  <div 
                    key={plan.plan_id}
                    onClick={() => setSelectedPlan(plan)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      selectedPlan?.plan_id === plan.plan_id 
                        ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' 
                        : 'border-gray-100 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-gray-900 text-sm">{plan.name}</h3>
                      <span className="font-black text-blue-600">{formatCurrency(plan.price)}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{plan.duration_months} Months</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: CHECKOUT PANEL (Fixed) */}
          <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-2xl flex flex-col h-full">
            <h2 className="text-2xl font-black mb-6 flex items-center gap-2">
              <Banknote size={28} /> Checkout
            </h2>

            <div className="flex-1 space-y-6 overflow-y-auto custom-scrollbar pr-2">
              {/* Summary */}
              <div className="space-y-4">
                <div>
                  <p className="text-slate-400 text-xs font-bold uppercase">Customer</p>
                  <p className="text-lg font-bold truncate">
                    {selectedMember ? selectedMember.name : <span className="text-slate-600 italic">Select a member...</span>}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs font-bold uppercase">Plan</p>
                  <p className="text-lg font-bold truncate">
                    {selectedPlan ? selectedPlan.name : <span className="text-slate-600 italic">Select a plan...</span>}
                  </p>
                </div>
              </div>

              {/* Payment Method - RESTRICTED TO CASH & TRANSFER ONLY */}
              <div className="pt-6 border-t border-slate-700">
                <p className="text-slate-400 text-xs font-bold uppercase mb-3">Payment Method</p>
                <div className="grid grid-cols-2 gap-3">
                  {['CASH', 'TRANSFER'].map(method => (
                    <button
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      className={`py-2 px-1 rounded-lg text-xs font-bold border transition-all ${
                        paymentMethod === method 
                          ? 'bg-blue-600 border-blue-600 text-white' 
                          : 'bg-transparent border-slate-700 text-slate-400 hover:border-slate-500'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bank Transfer Extra Fields */}
              {paymentMethod === 'TRANSFER' && (
                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 space-y-3 animate-fade-in">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase">Ref Number (Optional)</label>
                    <input 
                      type="text" 
                      className="w-full mt-1 bg-slate-900 border border-slate-600 rounded-lg p-2 text-sm text-white focus:border-blue-500 outline-none"
                      placeholder="e.g. 882211"
                      value={referenceNo}
                      onChange={(e) => setReferenceNo(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase">Attach Slip</label>
                    <label className="mt-1 flex items-center gap-2 cursor-pointer bg-slate-900 border border-slate-600 p-2 rounded-lg hover:bg-slate-700 transition-colors">
                      <Upload className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-bold text-slate-300 truncate">
                        {slipFile ? "File Selected" : "Upload Image"}
                      </span>
                      <input type="file" accept="image/*" className="hidden" 
                        onChange={(e) => setSlipFile(e.target.files[0])}
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Total & Pay Button */}
            <div className="mt-6 pt-6 border-t border-slate-700 shrink-0">
              <div className="flex justify-between items-end mb-4">
                <span className="text-slate-400 font-bold">Total</span>
                <span className="text-3xl font-black text-green-400">
                  {selectedPlan ? formatCurrency(selectedPlan.price) : '0.00'}
                </span>
              </div>

              <button 
                onClick={handleProcessPayment}
                disabled={processing || !selectedMember || !selectedPlan}
                className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
                  processing || !selectedMember || !selectedPlan
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/20 active:scale-95'
                }`}
              >
                {processing ? 'Processing...' : <><CheckCircle size={20}/> Confirm Payment</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================= TAB 2: HISTORY (ADMIN STYLE) ======================= */}
      {activeTab === 'HISTORY' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex-1 overflow-hidden flex flex-col">
          
          {/* Filters Bar */}
          <div className="p-5 border-b border-gray-100 bg-gray-50 flex flex-col gap-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-gray-500" />
                <h3 className="font-bold text-gray-900">Transaction Log</h3>
                <span className="ml-2 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold border border-green-200">
                   Revenue: {formatCurrency(monthlyRevenue)}
                </span>
              </div>
              
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
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Filter by Name or ID..." 
                  className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 w-full bg-white"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                />
              </div>

              <div className="flex bg-white rounded-lg p-1 border border-gray-200 shadow-sm w-fit">
                {['ALL', 'CASH', 'TRANSFER'].map(type => (
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

          {/* Table List */}
          <div className="overflow-y-auto custom-scrollbar flex-1">
            {filteredPayments.length === 0 ? (
              <div className="p-20 text-center text-gray-500 flex flex-col items-center">
                <Filter className="w-12 h-12 text-gray-200 mb-2" />
                <p>No transactions found.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredPayments.map((pay) => (
                  <div key={pay.payment_id} className="p-5 hover:bg-gray-50 transition-colors flex justify-between items-center">
                    
                    <div className="flex gap-4 items-center">
                      {/* UPDATED: Initial Circle instead of Dollar Icon */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm shrink-0 font-bold text-lg border-2
                        ${pay.payment_method === 'CASH' 
                          ? 'bg-green-50 text-green-600 border-green-100' 
                          : 'bg-purple-50 text-purple-600 border-purple-100'}`}>
                        {pay.User?.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      
                      <div>
                        <p className="font-bold text-gray-900">{pay.User?.name || 'Unknown User'}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                           <span className="font-mono bg-gray-100 px-1.5 rounded text-gray-600">{pay.User?.member_code}</span>
                           <span>•</span>
                           <span>{pay.MembershipPlan?.name}</span>
                        </div>
                        {pay.slip_url && (
                          <a href={`${BACKEND_URL}${pay.slip_url}`} target="_blank" rel="noreferrer" 
                             className="text-xs text-blue-600 font-bold underline mt-1 block flex items-center gap-1">
                             <FileText className="w-3 h-3"/> View Slip
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">{formatCurrency(pay.amount)}</p>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase">{new Date(pay.transaction_date).toLocaleDateString()}</span>
                        
                        {(pay.status === 'VERIFIED' || pay.status === 'COMPLETED' || pay.status === 'SUCCESS') ? (
                           <div className="flex items-center gap-2">
                             <span className="text-xs text-green-600 font-bold flex items-center gap-1">
                               <CheckCircle size={12}/> Verified
                             </span>
                             {/* Staff Receipt Button */}
                             <a href={`/receipt/${pay.payment_id}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:bg-blue-50 p-1 rounded">
                               <Receipt size={14} />
                             </a>
                           </div>
                        ) : (
                          <span className="text-xs text-orange-600 font-bold bg-orange-50 px-2 py-0.5 rounded">Pending</span>
                        )}
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}