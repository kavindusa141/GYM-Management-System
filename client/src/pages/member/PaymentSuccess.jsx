import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function PaymentSuccess() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const sessionId = searchParams.get('session_id');
    const { fetchUser } = useAuth();
    const [verifying, setVerifying] = useState(true);
    const [errorMsg, setErrorMsg] = useState(null);

    useEffect(() => {
        const verifyPayment = async () => {
            try {
                if (sessionId) {
                    await api.get(`/payments/verify-stripe-session/${sessionId}`);
                }
                if (fetchUser) {
                    await fetchUser();
                }
            } catch (err) {
                console.error("Verification error:", err);
                setErrorMsg("Your payment was received, but there was a slight delay verifying it. Please check your Dashboard in a few minutes.");
            } finally {
                setVerifying(false);
            }
        };

        verifyPayment();
    }, [sessionId, fetchUser]);

    return (
        <div className="min-h-[70vh] flex items-center justify-center animate-fade-in p-4">
            <div className="bg-white p-8 md:p-12 rounded-3xl shadow-2xl max-w-lg w-full text-center border top-4 border-emerald-100 relative overflow-hidden">

                {/* Background glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-gradient-to-b from-emerald-50 to-transparent -z-10 blur-xl"></div>

                {verifying ? (
                    <div className="py-12">
                        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mx-auto mb-4" />
                        <p className="text-gray-500 font-bold">Verifying your payment securely...</p>
                    </div>
                ) : (
                    <>
                        <div className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-inner ${errorMsg ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                            {errorMsg ? <AlertCircle className="w-12 h-12" /> : <CheckCircle className="w-12 h-12" />}
                        </div>

                        <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-3">
                            {errorMsg ? "Payment Received" : "Payment Successful!"}
                        </h1>

                        <p className="text-gray-500 mb-8 leading-relaxed">
                            {errorMsg ? (
                                <span className="text-amber-600 font-bold">{errorMsg}</span>
                            ) : (
                                <>Thank you for choosing Royal Fitness Kingdom. Your transaction was securely processed and your membership is now <strong className="text-emerald-600">Active</strong>.</>
                            )}
                        </p>

                        {sessionId && (
                            <div className="bg-gray-50 rounded-xl p-4 mb-8 text-xs text-gray-400 font-mono break-all text-left border border-gray-100 shadow-inner">
                                <span className="font-bold text-gray-500 block mb-1">Stripe Ref:</span>
                                {sessionId}
                            </div>
                        )}

                        <button
                            onClick={() => navigate('/member/dashboard')}
                            className={`w-full text-white py-4 rounded-xl font-bold hover:-translate-y-1 transition-all flex items-center justify-center gap-2 text-lg group shadow-xl ${errorMsg ? 'bg-gray-900 hover:bg-gray-800 shadow-gray-900/20' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'}`}
                        >
                            Go to Dashboard
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
