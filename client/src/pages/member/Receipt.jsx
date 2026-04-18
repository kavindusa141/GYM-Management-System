import { useEffect, useState } from "react";
import api from "../../services/api";
import { FileText, Download, Printer, ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import logo from '../../assets/images/logo.png';

export default function Receipt() {
  const { payment_id } = useParams();
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get(`/payments/receipt/${payment_id}`)
      .then(res => {
        setReceipt(res.data);
        setLoading(false);
      })
      .catch(err => {
        toast.error("Failed to load receipt");
        setLoading(false);
      });
  }, [payment_id]);

  const handleDownloadPDF = async () => {
    try {
      setDownloading(true);
      const response = await api.get(`/payments/receipt/${payment_id}/download-pdf`);

      if (response.data.html) {
        // Create a blob from the HTML
        const element = document.createElement('div');
        element.innerHTML = response.data.html;

        // Create an iframe to print
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
        iframe.contentDocument.write(response.data.html);
        iframe.contentDocument.close();

        // Trigger print dialog for PDF save
        iframe.onload = () => {
          iframe.contentWindow.print();
          document.body.removeChild(iframe);
          setDownloading(false);
        };
      }
    } catch (err) {
      toast.error("Failed to download receipt");
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-10">
        <div className="bg-white p-10 rounded-xl text-center">
          <p className="text-gray-600">Loading receipt...</p>
        </div>
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="max-w-2xl mx-auto py-10">
        <div className="bg-white p-10 rounded-xl text-center">
          <p className="text-red-600 font-bold">Receipt not available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 print:p-0">
      {/* Back Button (Hidden on Print) */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6 print:hidden"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {/* Receipt Container */}
      <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">

        {/* Header */}
        <div className="flex flex-col items-center border-b-4 border-blue-600 pb-6 mb-6">
          <img src={logo} alt={receipt.gym_name || "Royal Fitness"} className="h-24 w-auto object-contain mb-2" />
          <h1 className="text-2xl font-black text-blue-900 tracking-wider mt-2">{receipt.gym_name || "ROYAL FITNESS KINGDOM"}</h1>
        </div>

        {/* Receipt Title */}
        <div className="text-center mb-8">
          <h2 className="text-xl font-bold text-gray-900">PAYMENT RECEIPT</h2>
          <p className="text-sm text-gray-600 font-mono mt-2">
            Receipt No: {receipt.receipt_no}
          </p>
        </div>

        {/* Member Information */}
        <div className="mb-8">
          <h3 className="text-xs font-bold text-gray-500 uppercase mb-3 pb-2 border-b">
            Member Information
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="font-bold text-gray-700">Name:</span>
              <span className="text-gray-900">{receipt.member.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold text-gray-700">Member ID:</span>
              <span className="text-blue-600 font-mono font-bold">
                {receipt.member.member_code || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold text-gray-700">Email:</span>
              <span className="text-gray-600">{receipt.member.email}</span>
            </div>
          </div>
        </div>

        {/* Transaction Details */}
        <div className="mb-8">
          <h3 className="text-xs font-bold text-gray-500 uppercase mb-3 pb-2 border-b">
            Transaction Details
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="font-bold text-gray-700">Date:</span>
              <span className="text-gray-900">
                {new Date(receipt.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold text-gray-700">Payment Method:</span>
              <span className="text-gray-900">
                {receipt.method === 'CASH' ? '💵 Cash (Desk)' :
                  receipt.method === 'TRANSFER' ? '🏦 Bank Transfer' : '💳 Card'}
              </span>
            </div>
            {receipt.reference && (
              <div className="flex justify-between">
                <span className="font-bold text-gray-700">Reference:</span>
                <span className="text-gray-600 font-mono">{receipt.reference}</span>
              </div>
            )}
          </div>
        </div>

        {/* Plan Details */}
        <div className="mb-8">
          <h3 className="text-xs font-bold text-gray-500 uppercase mb-3 pb-2 border-b">
            Plan Details
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="font-bold text-gray-700">Plan:</span>
              <span className="text-gray-900">{receipt.plan.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold text-gray-700">Duration:</span>
              <span className="text-gray-900">
                {receipt.plan.duration_months} Month(s)
              </span>
            </div>
          </div>
        </div>

        {/* Amount Section */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg mb-8 border-2 border-blue-200">
          <div className="flex justify-between items-center">
            <span className="font-bold text-lg text-gray-900">Total Amount Paid:</span>
            <span className="text-2xl font-black text-blue-600">
              Rs. {receipt.amount.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Status Badge */}
        <div className="text-center mb-8">
          <span className="inline-block bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-bold border-2 border-green-300">
            ✓ PAYMENT VERIFIED
          </span>
        </div>

        {/* Footer */}
        <div className="text-center pt-6 border-t border-gray-200 text-xs text-gray-500 space-y-1">
          <p>Thank you for choosing Royal Fitness!</p>
          <p>This is an electronically generated receipt.</p>
          <p className="text-[10px] text-gray-400">
            Generated on {new Date().toLocaleString()}
          </p>
        </div>

        {/* Action Buttons (Hidden on Print) */}
        <div className="flex gap-3 mt-8 print:hidden">
          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold transition-colors active:scale-95 disabled:opacity-50"
          >
            <Download className="w-5 h-5" />
            {downloading ? 'Generating...' : 'Download PDF'}
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-lg font-bold transition-colors active:scale-95"
          >
            <Printer className="w-5 h-5" />
            Print
          </button>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            background: white;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:p-0 {
            padding: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
