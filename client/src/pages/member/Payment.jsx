import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  CreditCard, CheckCircle, XCircle, Clock, FileText, Package, LayoutList, History 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

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
  const [showReplaceWarning, setShowReplaceWarning] = useState(false);

  useEffect(() => {
    fetchData();
    api.get('/member/member-stats')
      .then(res => setMemberStats(res.data))
      .catch(() => setMemberStats(null));
  }, []);

  const fetchData = async () => {
    try {
      const [pRes, hRes] = await Promise.all([
        api.get('/memberships'),
        api.get('/payments')
      ]);
      setPlans(pRes.data);
      setHistory(hRes.data);
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

  const handlePay = async (e) => {
    e.preventDefault();

    if (memberStats?.active && !showReplaceWarning) {
      setShowReplaceWarning(true);
      return;
    }

    const payload = new FormData();
    payload.append('plan_id', selectedPlan.plan_id);
    payload.append('amount', selectedPlan.price);
    payload.append('payment_method', method);

    if (file) payload.append('slip_image', file);

    try {
      await api.post('/payments/pay', payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success(
        method === 'CARD'
          ? "Payment successful! Membership updated."
          : "Slip uploaded! Waiting for admin approval."
      );

      setSelectedPlan(null);
      setFile(null);
      setShowReplaceWarning(false);
      fetchData();
      setActiveTab('HISTORY'); // Switch to history tab to show the new record

    } catch (err) {
      toast.error("Payment failed");
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
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'PLANS' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <LayoutList className="w-4 h-4" /> Packages
          </button>
          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'HISTORY' 
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
                  {/* Card Header */}
                  <div className="bg-slate-900 p-6 text-white relative overflow-hidden shrink-0">
                    <div className="absolute top-0 right-0 p-4 opacity-5 transform group-hover:scale-110 transition-transform duration-700">
                      <Package size={100} />
                    </div>
                    <div className="relative z-10">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-2xl font-black tracking-tight leading-tight">{plan.name}</h3>
                          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-1.5">
                            {plan.duration_months} Month Access
                          </p>
                        </div>
                        {plan.duration_months >= 12 && (
                          <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-lg">
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
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Features</p>
                      <ul className="space-y-2.5">
                        {features.slice(0, 5).map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-3 text-sm text-gray-700 font-semibold">
                            <CheckCircle size={16} className="text-blue-600 shrink-0 mt-0.5" />
                            <span className="leading-tight">{feature}</span>
                          </li>
                        ))}
                        {features.length > 5 && (
                          <li className="text-xs text-blue-600 font-bold pl-7 pt-1">
                            + {features.length - 5} more features
                          </li>
                        )}
                        {features.length === 0 && (
                          <li className="text-sm text-gray-400 italic">Standard gym access included.</li>
                        )}
                      </ul>
                    </div>

                    <button
                      onClick={() => setSelectedPlan(plan)}
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
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-500"/> Transaction Log
            </h3>
            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">
              {history.length} Records
            </span>
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
                        {pay.status === 'VERIFIED' || pay.status === 'COMPLETED'
                          ? <CheckCircle size={12} />
                          : pay.status === 'PENDING'
                          ? <Clock size={12} />
                          : <XCircle size={12} />
                        }
                        {pay.status}
                      </span>

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

              {/* WARNING: ACTIVE SUBSCRIPTION */}
              {showReplaceWarning && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-800 animate-fade-in-up">
                  <p className="font-bold mb-1 flex items-center gap-2">
                    <Clock size={16} /> Active Membership Detected
                  </p>
                  <p className="mb-3">
                    You already have an active plan. Continuing will <b>replace it immediately</b>.
                  </p>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handlePay}
                      className="flex-1 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 shadow-sm"
                    >
                      Confirm Replace
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowReplaceWarning(false)}
                      className="flex-1 py-2 bg-white border border-gray-200 font-bold rounded-lg hover:bg-gray-50 text-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

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

              {/* DYNAMIC INPUTS */}
              {method === 'CARD' ? (
                <div className="p-4 border border-dashed border-gray-300 rounded-xl bg-gray-50 text-center text-gray-500 text-sm">
                  <p className="font-medium">Secure Payment Gateway Simulation</p>
                  <p className="text-xs mt-1">Click "Pay Now" to complete transaction.</p>
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
                  onClick={() => setSelectedPlan(null)}
                  className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all"
                >
                  Pay Rs. {selectedPlan.price}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}