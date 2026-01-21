import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { CreditCard, Upload, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function MemberPayment() {
  const [plans, setPlans] = useState([]);
  const [history, setHistory] = useState([]);
  
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [method, setMethod] = useState('CARD');
  const [file, setFile] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [pRes, hRes] = await Promise.all([api.get('/memberships'), api.get('/payments')]);
      setPlans(pRes.data);
      setHistory(hRes.data);
    } catch (err) {
      console.error("Failed to load data");
    }
  };

  const handlePay = async (e) => {
    e.preventDefault();
    const payload = new FormData();
    payload.append('plan_id', selectedPlan.plan_id);
    payload.append('amount', selectedPlan.price);
    payload.append('payment_method', method);
    if (file) payload.append('slip_image', file);

    try {
      await api.post('/payments/pay', payload);
      toast.success(method === 'CARD' ? "Payment Successful!" : "Slip Uploaded! Waiting for verification.");
      setSelectedPlan(null);
      setFile(null); // Reset file
      fetchData(); // Reload history
    } catch (err) {
      toast.error("Payment Failed");
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <h1 className="text-2xl font-bold text-gray-900">Membership & Billing</h1>
      
      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map(plan => (
          <div key={plan.plan_id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-shadow">
            <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
            <div className="text-3xl font-black text-blue-600 my-2">${plan.price}</div>
            <p className="text-gray-500 mb-6 flex-1 text-sm">{plan.description}</p>
            <button onClick={() => setSelectedPlan(plan)} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-blue-600 transition-colors">
              Choose Plan
            </button>
          </div>
        ))}
      </div>

      {/* Payment Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-fade-in-up">
            <h2 className="text-xl font-bold mb-4">Checkout: {selectedPlan.name}</h2>
            <form onSubmit={handlePay} className="space-y-4">
              <div className="flex gap-4 p-4 bg-gray-50 rounded-xl">
                 <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={method === 'CARD'} onChange={() => setMethod('CARD')} /> 
                    <span className="font-bold text-sm">Debit Card</span>
                 </label>
                 <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={method === 'TRANSFER'} onChange={() => setMethod('TRANSFER')} /> 
                    <span className="font-bold text-sm">Bank Transfer</span>
                 </label>
              </div>

              {method === 'CARD' ? (
                <div className="p-4 border rounded-xl bg-gray-50 text-center text-gray-500 text-sm">
                  <CreditCard className="mx-auto mb-2 text-blue-500"/>
                  Simulated Payment Gateway (Click Pay to Confirm)
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-bold mb-1">Upload Slip</label>
                  <input type="file" required onChange={e => setFile(e.target.files[0])} className="w-full text-sm"/>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setSelectedPlan(null)} className="flex-1 py-3 bg-gray-100 font-bold rounded-xl hover:bg-gray-200">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700">Pay ${selectedPlan.price}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* --- ADDED: History Table --- */}
       <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 font-bold text-lg">Payment History</div>
          
          {history.length === 0 ? (
            <div className="p-10 text-center text-gray-400">No payment history found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs">
                  <tr>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Plan</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Method</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {history.map((pay) => (
                    <tr key={pay.payment_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">{new Date(pay.transaction_date || pay.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4 font-bold">{pay.MembershipPlan?.name || 'Unknown Plan'}</td>
                      <td className="px-6 py-4">${pay.amount}</td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold px-2 py-1 bg-gray-100 rounded uppercase">{pay.payment_method}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`flex items-center gap-1 w-fit px-2 py-1 rounded text-xs font-bold uppercase ${
                          pay.status === 'VERIFIED' || pay.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                          pay.status === 'PENDING' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {pay.status === 'VERIFIED' || pay.status === 'COMPLETED' ? <CheckCircle size={14}/> : 
                           pay.status === 'PENDING' ? <Clock size={14}/> : <XCircle size={14}/>}
                          {pay.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
       </div>
    </div>
  );
}