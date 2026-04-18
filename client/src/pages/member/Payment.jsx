import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  CreditCard, CheckCircle, XCircle, Clock, FileText, Package, LayoutList, History,
  Dumbbell, Footprints, Calendar, Upload, AlertCircle, RefreshCw, Download, Tag
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

// --- GRADIENT HELPER ---
const getCardColor = (name = "") => {
  const n = name.toLowerCase();
  if (n.includes('gold')) return 'bg-gradient-to-br from-yellow-500 to-amber-600';
  if (n.includes('silver')) return 'bg-gradient-to-br from-gray-400 to-slate-500';
  if (n.includes('platinum')) return 'bg-gradient-to-br from-slate-300 to-gray-400 text-gray-800';
  if (n.includes('bronze')) return 'bg-gradient-to-br from-orange-700 to-orange-900';
  return 'bg-gradient-to-br from-blue-700 to-indigo-800';
};

export default function MemberPayment() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // TABS STATE
  const [activeTab, setActiveTab] = useState('PLANS'); // 'PLANS' or 'HISTORY'

  const [plans, setPlans] = useState([]);
  const [history, setHistory] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [method, setMethod] = useState('CARD');
  const [file, setFile] = useState(null);
  const [memberStats, setMemberStats] = useState(null);
  const [pendingPlan, setPendingPlan] = useState(null);

  // --- NEW: Re-upload State ---
  const [reuploadId, setReuploadId] = useState(null);
  const [reuploadFile, setReuploadFile] = useState(null);

  // --- NEW: Config & Promo State ---
  const [publicConfig, setPublicConfig] = useState(null);
  const [activePromo, setActivePromo] = useState(null);

  useEffect(() => {
    fetchData();
    api.get('/member/member-stats')
      .then(res => setMemberStats(res.data))
      .catch(() => setMemberStats(null));
  }, []);

  const fetchData = async () => {
    try {
      const [pRes, hRes, configRes, promoRes] = await Promise.all([
        api.get('/memberships'),
        api.get('/payments'),
        api.get('/settings/public-config').catch(() => ({ data: {} })),
        api.get('/promotions/active').catch(() => ({ data: null }))
      ]);
      setPlans(pRes.data);
      setHistory(hRes.data);
      setPublicConfig(configRes.data);
      setActivePromo(promoRes.data);
    } catch (err) {
      console.error("Failed to load data");
    }
  };

  // Helper: Safely parse features
  const getSafeFeatures = (featuresData) => {
    if (Array.isArray(featuresData)) return featuresData;
    if (typeof featuresData === 'string') {
      try {
        const parsed = JSON.parse(featuresData);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        return [];
      }
    }
    return [];
  };

  // --- CALCULATION LOGIC ---
  const isFirstPayment = history.length === 0;
  let regFee = 0;
  let discount = 0;

  if (isFirstPayment && publicConfig?.registration_fee) {
    regFee = parseFloat(publicConfig.registration_fee) || 0;
    if (activePromo && activePromo.target === 'REGISTRATION_FEE') {
      if (activePromo.discountType === 'PERCENTAGE') {
        discount = regFee * (parseFloat(activePromo.discountValue) / 100);
      } else {
        discount = parseFloat(activePromo.discountValue);
      }
      if (discount > regFee) discount = regFee; // Don't discount more than the fee itself
    }
  }

  const finalAmount = selectedPlan ? parseFloat(selectedPlan.price) + regFee - discount : 0;

  // --- Handle New Payment ---
  const handlePay = async (e) => {
    e.preventDefault();

    try {
      if (method === 'CARD') {
        // STRIPE CHECKOUT FLOW
        const payload = {
          plan_id: selectedPlan.plan_id,
          amount: finalAmount,
          registration_fee: regFee > 0 ? regFee : 0,
          discount_amount: discount > 0 ? discount : 0,
          promo_id: (discount > 0 && activePromo) ? (activePromo.id || activePromo.promo_id) : null
        };

        const res = await api.post('/payments/create-checkout-session', payload);

        // Redirect to Stripe Checkout
        if (res.data && res.data.url) {
          window.location.href = res.data.url;
        } else {
          toast.error("Failed to initialize payment gateway");
        }

      } else {
        // MANUAL BANK SLIP UPLOAD FLOW
        const payload = new FormData();
        payload.append('plan_id', selectedPlan.plan_id);
        payload.append('amount', finalAmount);
        payload.append('payment_method', method);

        if (regFee > 0) payload.append('registration_fee', regFee);
        if (discount > 0) {
          payload.append('discount_amount', discount);
          if (activePromo) payload.append('promo_id', activePromo.id || activePromo.promo_id);
        }

        if (file) payload.append('slip_image', file);

        await api.post('/payments/pay', payload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        toast.success("Slip uploaded! Waiting for admin approval.");
        setSelectedPlan(null);
        setFile(null);
        fetchData();
        setActiveTab('HISTORY');
      }

    } catch (err) {
      toast.error(err.response?.data?.message || "Payment failed");
    }
  };

  // --- NEW: Handle Re-upload ---
  const handleReupload = async (e) => {
    e.preventDefault();
    if (!reuploadFile || !reuploadId) return;

    const formData = new FormData();
    formData.append('slip_image', reuploadFile);

    try {
      await api.post(`/payments/reupload/${reuploadId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success("Slip re-uploaded successfully!");
      setReuploadId(null);
      setReuploadFile(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Re-upload failed");
    }
  };

  // --- REPORT EXPORT LOGIC ---
  const downloadPDF = async () => {
    try {
      const doc = new jsPDF();
      const date = new Date().toLocaleDateString();
      const userName = user?.name || 'Member';
      const userId = user?.id || 'Unknown';

      const title = 'My Payment History Report';

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

      let tableColumn = ["Date", "Plan", "Amount", "Method", "Status"];
      if (!history.length) return toast.error("No payment history data");

      let tableRows = history.map(pay => [
        new Date(pay.transaction_date || pay.createdAt).toLocaleDateString(),
        pay.MembershipPlan?.name || "Unknown",
        `Rs. ${pay.amount.toLocaleString()}`,
        pay.payment_method === 'TRANSFER' ? 'Transfer' : 'Card',
        pay.status
      ]);

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 50,
        theme: 'grid',
        headStyles: { fillColor: [30, 64, 175], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 9 },
        alternateRowStyles: { fillColor: [249, 250, 251] }
      });

      doc.save(`My_Payment_Report_${date.replace(/\//g, '-')}.pdf`);
      toast.success("PDF Downloaded");
    } catch (err) {
      console.error(err);
      toast.error("PDF generation failed");
    }
  };

  const downloadCSV = async () => {
    try {
      if (!history.length) return toast.error("No data");
      const userName = user?.name || 'Member';
      const userId = user?.id || 'Unknown';

      const headers = ["Date", "Plan", "Amount", "Method", "Status"];
      const rows = history.map(pay => [
        new Date(pay.transaction_date || pay.createdAt).toLocaleDateString(),
        pay.MembershipPlan?.name || "Unknown",
        pay.amount,
        pay.payment_method === 'TRANSFER' ? 'Transfer' : 'Card',
        pay.status
      ]);

      let csvString = `Member Name: ${userName},Member ID: RFK-M-${userId}\n\n`;
      csvString += [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `My_Payment_Report.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("CSV Downloaded");
    } catch (err) {
      console.error(err);
      toast.error("CSV generation failed");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">

      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Membership & Billing</h1>
          <p className="text-gray-500">Manage your subscription and view past payments.</p>
        </div>

        {/* --- TABS --- */}
        <div className="flex p-1 bg-white border border-gray-200 rounded-xl shadow-sm">
          <button
            onClick={() => setActiveTab('PLANS')}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${activeTab === 'PLANS'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-gray-500 hover:bg-gray-50'
              }`}
          >
            <LayoutList className="w-4 h-4" /> Packages
          </button>
          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${activeTab === 'HISTORY'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-gray-500 hover:bg-gray-50'
              }`}
          >
            <History className="w-4 h-4" /> History
          </button>
        </div>
      </div>

      {/* ===================== TAB 1: MEMBERSHIP PACKAGES ===================== */}
      {activeTab === 'PLANS' && (
        <div className="animate-fade-in-up">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {plans.map(plan => {
              const features = getSafeFeatures(plan.features);

              return (
                <div
                  key={plan.plan_id}
                  className="relative group bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
                >
                  {/* --- CARD HEADER --- */}
                  <div className={`${getCardColor(plan.name)} p-6 text-white relative overflow-hidden shrink-0`}>
                    <div className="absolute top-0 right-0 p-4 opacity-5 transform group-hover:scale-110 transition-transform duration-700">
                      <Package size={100} />
                    </div>
                    <div className="relative z-10">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-2xl font-black tracking-tight leading-tight">{plan.name}</h3>
                          <p className="text-white/80 text-xs font-bold uppercase tracking-wider mt-1.5">
                            {plan.duration_months} Month Access
                          </p>
                        </div>
                        {plan.duration_months >= 12 && (
                          <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-lg">
                            Best Value
                          </span>
                        )}
                      </div>
                      <div className="mt-6 flex items-baseline gap-1">
                        <span className="text-3xl font-black tracking-tight">
                          Rs. {parseInt(plan.price).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-6 flex flex-col flex-1">
                    <p className="text-gray-500 text-sm mb-6 leading-relaxed min-h-[40px] line-clamp-2">
                      {plan.description || "Unlock full access to gym facilities and equipment."}
                    </p>

                    <div className="space-y-3 mb-8 flex-1">
                      {plan.includes_trainer && (
                        <div className="flex items-center text-sm font-bold text-gray-800">
                          <Dumbbell className="w-5 h-5 text-emerald-500 mr-3 shrink-0" /> Personal Trainer Included
                        </div>
                      )}
                      {plan.visit_limit_per_week ? (
                        <div className="flex items-center text-sm font-bold text-gray-800">
                          <Footprints className="w-5 h-5 text-blue-500 mr-3 shrink-0" /> {plan.visit_limit_per_week} Gym Visits per Week
                        </div>
                      ) : (
                        <div className="flex items-center text-sm font-bold text-gray-800">
                          <CheckCircle className="w-5 h-5 text-blue-600 mr-3 shrink-0" /> Unlimited Gym Access
                        </div>
                      )}
                      {plan.class_limit_per_week ? (
                        <div className="flex items-center text-sm font-bold text-gray-800">
                          <Calendar className="w-5 h-5 text-purple-500 mr-3 shrink-0" /> {plan.class_limit_per_week} Classes per Week
                        </div>
                      ) : (
                        <div className="flex items-center text-sm font-bold text-gray-800">
                          <CheckCircle className="w-5 h-5 text-blue-600 mr-3 shrink-0" /> Unlimited Classes
                        </div>
                      )}
                      {(plan.access_start_time && plan.access_end_time && plan.access_start_time !== '00:00:00') && (
                        <div className="flex items-center text-sm font-bold text-gray-800">
                          <Clock className="w-5 h-5 text-orange-500 mr-3 shrink-0" /> Access: {plan.access_start_time.slice(0, 5)} - {plan.access_end_time.slice(0, 5)}
                        </div>
                      )}

                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pt-2 border-t border-gray-100 mt-2">More Features</p>
                      <ul className="space-y-2.5">
                        {features.slice(0, 5).map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-3 text-sm text-gray-600 font-medium">
                            <CheckCircle size={16} className="text-gray-400 shrink-0 mt-0.5" />
                            <span className="leading-tight">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      onClick={() => {
                        if (memberStats?.active) {
                          setPendingPlan(plan);
                        } else {
                          setSelectedPlan(plan);
                        }
                      }}
                      className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-blue-600 transition-all shadow-lg shadow-slate-900/20 group-hover:shadow-blue-600/30"
                    >
                      Choose Plan
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===================== TAB 2: PAYMENT HISTORY ===================== */}
      {activeTab === 'HISTORY' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in-up">
          <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50">
            <div className="flex items-center gap-4">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-500" /> Transaction Log
              </h3>
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">
                {history.length} Records
              </span>
            </div>

            {/* Export Buttons */}
            <div className="flex gap-2 w-full md:w-auto">
              <button onClick={downloadCSV} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-green-50 text-green-700 font-bold text-sm rounded-lg hover:bg-green-100 transition-colors">
                <Download size={16} /> Export CSV
              </button>
              <button onClick={downloadPDF} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 font-bold text-sm rounded-lg hover:bg-blue-100 transition-colors">
                <Download size={16} /> Export PDF
              </button>
            </div>
          </div>

          {history.length === 0 ? (
            <div className="p-10 text-center text-gray-400 flex flex-col items-center">
              <History size={48} className="mb-4 opacity-20" />
              <p>No payment history found.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {history.map(pay => (
                <div key={pay.payment_id} className="p-5 hover:bg-blue-50 transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-4">

                  <div className="flex gap-4 flex-1">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0
                      ${pay.status === 'VERIFIED' || pay.status === 'COMPLETED' ? 'bg-green-100 text-green-600' :
                        pay.status === 'PENDING' ? 'bg-orange-100 text-orange-600' :
                          'bg-red-100 text-red-600'}`}>
                      <CreditCard className="w-6 h-6" />
                    </div>

                    <div>
                      <p className="font-bold text-gray-900 text-lg">{pay.MembershipPlan?.name || 'Unknown Plan'}</p>

                      {/* --- REJECTION REASON DISPLAY --- */}
                      {pay.status === 'FAILED' && pay.rejection_reason && (
                        <div className="mt-2 bg-red-50 text-red-700 text-xs p-2 rounded-lg border border-red-100 flex items-start gap-2 max-w-md">
                          <AlertCircle size={14} className="mt-0.5 shrink-0" />
                          <span>
                            <span className="font-bold">Admin Note:</span> {pay.rejection_reason}
                          </span>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 mt-1 font-mono">
                        <span>
                          {new Date(pay.transaction_date || pay.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                        <span>•</span>
                        <span>{pay.payment_method === 'TRANSFER' ? 'Bank Transfer' : 'Card Payment'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-row md:flex-col items-center md:items-end gap-3 md:gap-1 w-full md:w-auto justify-between md:justify-end">
                    <p className="text-xl font-bold text-gray-900">Rs. {pay.amount.toLocaleString()}</p>

                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border
                        ${pay.status === 'VERIFIED' || pay.status === 'COMPLETED'
                          ? 'bg-green-50 text-green-700 border-green-100'
                          : pay.status === 'PENDING'
                            ? 'bg-orange-50 text-orange-700 border-orange-100'
                            : 'bg-red-50 text-red-700 border-red-100'
                        }`}>
                        {pay.status}
                      </span>

                      {/* --- RETRY BUTTON --- */}
                      {pay.status === 'FAILED' && pay.payment_method === 'TRANSFER' && (
                        <button
                          onClick={() => setReuploadId(pay.payment_id)}
                          className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                        >
                          <RefreshCw className="w-3 h-3" /> Retry
                        </button>
                      )}

                      {/* --- VIEW RECEIPT BUTTON --- */}
                      {(pay.status === 'VERIFIED' || pay.status === 'COMPLETED' || pay.status === 'SUCCESS') && (
                        <button
                          onClick={() => navigate(`/receipt/${pay.payment_id}`)}
                          className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 hover:text-blue-600 transition-colors shadow-sm"
                        >
                          <FileText className="w-3 h-3" />
                          Receipt
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===================== PAYMENT MODAL ===================== */}
      {selectedPlan && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl relative">
            <h2 className="text-2xl font-black text-gray-900 mb-2">
              Checkout
            </h2>
            <p className="text-gray-500 mb-6">You are subscribing to <span className="text-blue-600 font-bold">{selectedPlan.name}</span></p>

            <form onSubmit={handlePay} className="space-y-5">

              {/* PAYMENT METHOD */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Select Payment Method</label>
                <div className="grid grid-cols-2 gap-4">
                  <label className={`cursor-pointer border-2 rounded-xl p-4 flex flex-col items-center gap-2 transition-all ${method === 'CARD' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-100 hover:border-gray-200'}`}>
                    <input type="radio" className="hidden" checked={method === 'CARD'} onChange={() => setMethod('CARD')} />
                    <CreditCard className="w-6 h-6" />
                    <span className="font-bold text-sm">Card</span>
                  </label>

                  <label className={`cursor-pointer border-2 rounded-xl p-4 flex flex-col items-center gap-2 transition-all ${method === 'TRANSFER' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-100 hover:border-gray-200'}`}>
                    <input type="radio" className="hidden" checked={method === 'TRANSFER'} onChange={() => setMethod('TRANSFER')} />
                    <FileText className="w-6 h-6" />
                    <span className="font-bold text-sm">Transfer</span>
                  </label>
                </div>
              </div>

              {/* FEE BREAKDOWN */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 mb-4 text-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Membership (<span className="font-bold">{selectedPlan.name}</span>)</span>
                  <span className="font-bold text-gray-900">Rs. {parseInt(selectedPlan.price).toLocaleString()}</span>
                </div>
                {regFee > 0 && (
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Registration Fee (One-time)</span>
                    <span className="font-bold text-gray-900">Rs. {regFee.toLocaleString()}</span>
                  </div>
                )}
                {discount > 0 && (
                  <div className="flex justify-between items-center mb-2 text-emerald-600">
                    <span className="font-bold flex items-center gap-1">
                      <Tag size={14} /> Promotion Applied
                    </span>
                    <span className="font-bold">- Rs. {discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between items-center text-lg font-black text-blue-700">
                  <span>Total Due</span>
                  <span>Rs. {finalAmount.toLocaleString()}</span>
                </div>
              </div>

              {/* DYNAMIC INPUTS */}
              {method === 'CARD' ? (
                <div className="p-4 border border-dashed border-gray-300 rounded-xl bg-gray-50 text-center text-gray-500 text-sm">
                  <p className="font-bold text-gray-800">Pay Securely with Stripe</p>
                  <p className="text-xs mt-1">Clicking "Pay Now" will redirect you to our secure payment portal.</p>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Upload Bank Slip
                  </label>
                  <input
                    type="file"
                    required
                    onChange={e => setFile(e.target.files[0])}
                    className="w-full text-sm p-2 border border-gray-200 rounded-xl file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
              )}

              {/* ACTIONS */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPlan(null);
                  }}
                  className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all"
                >
                  Pay Rs. {finalAmount.toLocaleString()}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ===================== WARNING MODAL ===================== */}
      {pendingPlan && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl relative">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Active Membership Detected</h3>
              <p className="text-sm text-gray-500 mb-6">
                You already have an active plan. Continuing will <b className="text-gray-700">replace it immediately</b>.
              </p>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setPendingPlan(null)}
                  className="flex-1 py-2.5 bg-white border border-gray-200 font-bold rounded-xl hover:bg-gray-50 text-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPlan(pendingPlan);
                    setPendingPlan(null);
                  }}
                  className="flex-1 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-lg shadow-red-600/20 transition-all"
                >
                  Confirm Replace
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== RE-UPLOAD MODAL ===================== */}
      {reuploadId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Re-upload Payment Slip</h3>
            <p className="text-sm text-gray-500 mb-4">Please upload a clear image of your valid bank transfer slip.</p>

            <form onSubmit={handleReupload}>
              <label className="block w-full cursor-pointer bg-blue-50 border-2 border-dashed border-blue-200 rounded-xl p-6 text-center hover:bg-blue-100 transition-colors mb-4">
                <Upload className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <span className="text-sm font-bold text-blue-700">
                  {reuploadFile ? reuploadFile.name : "Tap to choose file"}
                </span>
                <input type="file" className="hidden" accept="image/*" required onChange={(e) => setReuploadFile(e.target.files[0])} />
              </label>

              <div className="flex gap-3">
                <button type="button" onClick={() => { setReuploadId(null); setReuploadFile(null); }} className="flex-1 py-2 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700">
                  Upload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}