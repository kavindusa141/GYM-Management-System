import { useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
    User, Mail, Lock, Phone, UserPlus, ArrowLeft, Loader2
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function AddMember() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            return toast.error("Please enter a valid email address");
        }
        
        if (formData.phone && formData.phone.length !== 10) {
            return toast.error("Phone number must be exactly 10 digits");
        }

        setLoading(true);
        try {
            await api.post('/admin/members', formData);
            toast.success("Member registered successfully!");
            navigate(-1); // Go back to member list
        } catch (error) {
            toast.error(error.response?.data?.message || "Registration failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto pb-20 animate-fade-in">

            {/* Back Button */}
            <button
                onClick={() => navigate(-1)}
                className="mb-6 flex items-center gap-2 text-gray-500 hover:text-blue-600 font-medium transition-colors"
            >
                <ArrowLeft size={20} /> Back to Members
            </button>

            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden relative">

                {/* Decorative Background Elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-bl-full -mr-16 -mt-16 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-gray-50/50 rounded-tr-full -ml-12 -mb-12 pointer-events-none"></div>

                <div className="grid md:grid-cols-5 relative z-10">

                    {/* Left Side: Summary / Info (Optional, can be just form) */}
                    <div className="md:col-span-2 bg-slate-900 text-white p-8 flex flex-col justify-between">
                        <div>
                            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/30">
                                <UserPlus size={24} className="text-white" />
                            </div>
                            <h2 className="text-2xl font-black mb-2">New Registration</h2>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Create a new member profile. They will receive an email with their login credentials if configured, or you can set a temporary password here.
                            </p>
                        </div>

                        <div className="mt-12 text-xs font-bold text-slate-500 uppercase tracking-wider">
                            Gym Management System
                        </div>
                    </div>

                    {/* Right Side: Form */}
                    <div className="md:col-span-3 p-8 md:p-10">
                        <h3 className="text-xl font-bold text-gray-900 mb-6">Account Details</h3>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Full Name</label>
                                <div className="relative group">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                                    <input
                                        required
                                        type="text"
                                        className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gateway-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none font-bold text-gray-900 transition-all placeholder:text-gray-400"
                                        placeholder="e.g. John Doe"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Email</label>
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                                        <input
                                            required
                                            type="email"
                                            className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none font-bold text-gray-900 transition-all placeholder:text-gray-400"
                                            placeholder="john@example.com"
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Phone</label>
                                    <div className="relative group">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                                        <input
                                            required
                                            type="tel"
                                            maxLength="10"
                                            className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none font-bold text-gray-900 transition-all placeholder:text-gray-400"
                                            placeholder="0771234567"
                                            value={formData.phone}
                                            onChange={e => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Initial Password</label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                                    <input
                                        required
                                        type="text"
                                        className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none font-bold text-gray-900 transition-all placeholder:text-gray-400"
                                        placeholder="Create a password"
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 active:scale-95 flex justify-center items-center gap-2"
                                >
                                    {loading ? <Loader2 className="animate-spin" /> : <UserPlus size={20} />}
                                    {loading ? 'Registering...' : 'Create Member Account'}
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
