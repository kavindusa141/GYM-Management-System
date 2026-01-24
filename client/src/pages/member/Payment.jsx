import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { CreditCard, CheckCircle, XCircle, Clock, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext'; // ✅ Needed to identify logged-in member
import { useNavigate } from 'react-router-dom';

export default function MemberPayment() {
  const { user } = useAuth(); // Logged-in user
  const navigate = useNavigate();

  // Membership plans
  const [plans, setPlans] = useState([]);

  // Payment history
  const [history, setHistory] = useState([]);

  // Selected plan for checkout
  const [selectedPlan, setSelectedPlan] = useState(null);

  // Payment method
  const [method, setMethod] = useState('CARD');

  // Uploaded slip file
  const [file, setFile] = useState(null);

  // Member dashboard stats (used to detect active subscription)
  const [memberStats, setMemberStats] = useState(null);

  // Controls warning before replacing existing subscription
  const [showReplaceWarning, setShowReplaceWarning] = useState(false);

  /* =====================================================
     LOAD PLANS, PAYMENT HISTORY & MEMBER STATS
  ===================================================== */
  useEffect(() => {
    fetchData();

    // 🔹 Get member dashboard stats to check active subscription
    api.get('/member/member-stats')
      .then(res => setMemberStats(res.data))
      .catch(() => setMemberStats(null));
  }, []);

  /* =====================================================
     FETCH PLANS + PAYMENT HISTORY
  ===================================================== */
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

  /* =====================================================
     HANDLE PAYMENT SUBMISSION
     - Shows warning if active subscription exists
     - Replaces old subscription after confirmation
  ===================================================== */
  const handlePay = async (e) => {
    e.preventDefault();

    // 🚨 STEP 1: Warn user if active membership exists
    if (memberStats?.active && !showReplaceWarning) {
      setShowReplaceWarning(true);
      return;
    }

    // STEP 2: Prepare form data (supports slip upload)
    const payload = new FormData();
    payload.append('plan_id', selectedPlan.plan_id);
    payload.append('amount', selectedPlan.price);
    payload.append('payment_method', method);

    if (file) payload.append('slip_image', file);

    try {
      // STEP 3: Submit payment
      await api.post('/payments/pay', payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success(
        method === 'CARD'
          ? "Payment successful! Membership updated."
          : "Slip uploaded! Waiting for admin approval. Old plan will be replaced."
      );

      // Reset UI
      setSelectedPlan(null);
      setFile(null);
      setShowReplaceWarning(false);

      // Reload payment history
      fetchData();

    } catch (err) {
      toast.error("Payment failed");
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <h1 className="text-2xl font-bold text-gray-900">Membership & Billing</h1>

      {/* ===================== PLANS GRID ===================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map(plan => (
          <div
            key={plan.plan_id}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-shadow"
          >
            <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
            <div className="text-3xl font-black text-blue-600 my-2">
              Rs. {plan.price}
            </div>
            <p className="text-gray-500 mb-6 flex-1 text-sm">
              {plan.description}
            </p>
            <button
              onClick={() => setSelectedPlan(plan)}
              className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-blue-600 transition-colors"
            >
              Choose Plan
            </button>
          </div>
        ))}
      </div>

      {/* ===================== PAYMENT MODAL ===================== */}
      {selectedPlan && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-4">
              Checkout: {selectedPlan.name}
            </h2>

            <form onSubmit={handlePay} className="space-y-4">

              {/* ⚠ WARNING: ACTIVE SUBSCRIPTION */}
              {showReplaceWarning && (
                <div className="p-4 bg-yellow-50 border border-yellow-300 rounded-lg text-sm text-yellow-800">
                  <p className="font-bold mb-1">⚠ Active Membership Detected</p>
                  <p>
                    You already have an active membership.
                    Continuing will <b>replace your current plan</b> with the new one.
                  </p>

                  <div className="flex gap-3 mt-3">
                    <button
                      type="button"
                      onClick={handlePay}
                      className="flex-1 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700"
                    >
                      Continue
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowReplaceWarning(false)}
                      className="flex-1 py-2 bg-gray-200 font-bold rounded-lg hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* PAYMENT METHOD */}
              <div className="flex gap-4 p-4 bg-gray-50 rounded-xl">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={method === 'CARD'}
                    onChange={() => setMethod('CARD')}
                  />
                  <span className="font-bold text-sm">Debit Card</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={method === 'TRANSFER'}
                    onChange={() => setMethod('TRANSFER')}
                  />
                  <span className="font-bold text-sm">Bank Transfer</span>
                </label>
              </div>

              {/* PAYMENT UI */}
              {method === 'CARD' ? (
                <div className="p-4 border rounded-xl bg-gray-50 text-center text-gray-500 text-sm">
                  <CreditCard className="mx-auto mb-2 text-blue-500" />
                  Simulated Payment Gateway
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-bold mb-1">
                    Upload Bank Slip
                  </label>
                  <input
                    type="file"
                    required
                    onChange={e => setFile(e.target.files[0])}
                    className="w-full text-sm"
                  />
                </div>
              )}

              {/* ACTION BUTTONS */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedPlan(null)}
                  className="flex-1 py-3 bg-gray-100 font-bold rounded-xl hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700"
                >
                  Pay Rs. {selectedPlan.price}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ===================== PAYMENT HISTORY ===================== */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 font-bold text-lg">
          Payment History
        </div>

        {history.length === 0 ? (
          <div className="p-10 text-center text-gray-400">
            No payment history found.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {history.map(pay => (
              <div key={pay.payment_id} className="p-5 hover:bg-gray-50 transition-colors flex justify-between items-start">
                
                <div className="flex gap-4 flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mt-0.5 shrink-0
                    ${pay.status === 'VERIFIED' || pay.status === 'COMPLETED' ? 'bg-green-100 text-green-600' : 
                      pay.status === 'PENDING' ? 'bg-orange-100 text-orange-600' :
                      'bg-red-100 text-red-600'}`}>
                    <CreditCard className="w-5 h-5" />
                  </div>
                  
                  <div className="flex-1">
                    <p className="font-bold text-gray-900">{pay.MembershipPlan?.name || 'Unknown Plan'}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(pay.transaction_date || pay.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                    {pay.payment_method === 'TRANSFER' && (
                      <p className="text-xs text-gray-400 mt-1">Method: Bank Transfer</p>
                    )}
                  </div>
                </div>

                <div className="text-right flex flex-col items-end gap-2">
                  <p className="text-lg font-bold text-gray-900">Rs. {pay.amount.toLocaleString()}</p>
                  
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold
                    ${pay.status === 'VERIFIED' || pay.status === 'COMPLETED'
                      ? 'bg-green-100 text-green-700'
                      : pay.status === 'PENDING'
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-red-100 text-red-700'
                    }`}>
                    {pay.status === 'VERIFIED' || pay.status === 'COMPLETED'
                      ? <CheckCircle size={14} />
                      : pay.status === 'PENDING'
                      ? <Clock size={14} />
                      : <XCircle size={14} />
                    }
                    {pay.status}
                  </span>

                  {/* RECEIPT LINK FOR VERIFIED/COMPLETED PAYMENTS */}
                  {(pay.status === 'VERIFIED' || pay.status === 'COMPLETED' || pay.status === 'SUCCESS') && (
                    <button
                      onClick={() => navigate(`/receipt/${pay.payment_id}`)}
                      className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                    >
                      <FileText className="w-3 h-3" />
                      View Receipt
                    </button>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
