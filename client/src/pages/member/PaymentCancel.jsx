import { useNavigate } from 'react-router-dom';
import { XCircle, ArrowLeft } from 'lucide-react';

export default function PaymentCancel() {
    const navigate = useNavigate();

    return (
        <div className="min-h-[70vh] flex items-center justify-center animate-fade-in p-4">
            <div className="bg-white p-8 md:p-12 rounded-3xl shadow-2xl max-w-lg w-full text-center border top-4 border-red-100 relative overflow-hidden">

                {/* Background glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-gradient-to-b from-red-50 to-transparent -z-10 blur-xl"></div>

                <div className="mx-auto w-24 h-24 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6 shadow-inner">
                    <XCircle className="w-12 h-12" />
                </div>

                <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-3">
                    Payment Cancelled
                </h1>

                <p className="text-gray-500 mb-8 leading-relaxed">
                    Your secure Stripe checkout session was aborted. No charges were made to your credit card. You can try again whenever you're ready!
                </p>

                <button
                    onClick={() => navigate('/member/payment')}
                    className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold hover:bg-gray-800 hover:-translate-y-1 shadow-xl shadow-gray-900/20 transition-all flex items-center justify-center gap-2 text-lg group"
                >
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    Back to Memberships
                </button>
            </div>
        </div>
    );
}
