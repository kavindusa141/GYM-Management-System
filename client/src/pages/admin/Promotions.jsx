import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Calendar, Tag, Percent, DollarSign, Save } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function Promotions() {
    const [promotions, setPromotions] = useState([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingPromo, setEditingPromo] = useState(null);

    // System Setup State
    const [regFee, setRegFee] = useState('');

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        discountType: 'PERCENTAGE',
        discountValue: '',
        target: 'REGISTRATION_FEE',
        startDate: '',
        endDate: '',
        isActive: false
    });

    useEffect(() => {
        fetchPromotions();
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const res = await api.get('/settings/public-config');
            if (res.data?.registration_fee) {
                setRegFee(res.data.registration_fee);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleSaveFee = async () => {
        try {
            const res = await api.get('/settings/public-config');
            const currentConfig = res.data || {};
            await api.put('/settings/system-config', { ...currentConfig, registration_fee: regFee });
            toast.success("Registration fee updated successfully");
        } catch (err) {
            toast.error("Failed to update base fee");
        }
    };

    const fetchPromotions = async () => {
        try {
            const res = await api.get('/promotions');
            setPromotions(res.data);
        } catch (err) {
            toast.error('Failed to load promotions');
        }
    };

    const openForm = (promo = null) => {
        if (promo) {
            setEditingPromo(promo);
            setFormData({
                title: promo.title,
                description: promo.description || '',
                discountType: promo.discountType,
                discountValue: promo.discountValue,
                target: promo.target,
                startDate: promo.startDate.split('T')[0],
                endDate: promo.endDate.split('T')[0],
                isActive: promo.isActive
            });
        } else {
            setEditingPromo(null);
            setFormData({
                title: '',
                description: '',
                discountType: 'PERCENTAGE',
                discountValue: '',
                target: 'REGISTRATION_FEE',
                startDate: '',
                endDate: '',
                isActive: false
            });
        }
        setIsFormOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingPromo) {
                await api.put(`/promotions/${editingPromo.id}`, formData);
                toast.success('Promotion updated successfully');
            } else {
                await api.post('/promotions', formData);
                toast.success('Promotion created successfully');
            }
            setIsFormOpen(false);
            fetchPromotions();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save promotion');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this promotion?')) return;
        try {
            await api.delete(`/promotions/${id}`);
            toast.success('Promotion deleted');
            fetchPromotions();
        } catch (err) {
            toast.error('Failed to delete promotion');
        }
    };

    const toggleStatus = async (promo) => {
        try {
            await api.put(`/promotions/${promo.id}`, { isActive: !promo.isActive });
            toast.success(`Promotion ${promo.isActive ? 'deactivated' : 'activated'}`);
            fetchPromotions();
        } catch (err) {
            toast.error('Failed to update status');
        }
    };

    return (
        <div className="space-y-8 animate-fade-in max-w-6xl mx-auto pb-10">

            {/* SECTION 1: Base Setup */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">Base Registration Fee</h2>
                    <p className="text-gray-500 text-sm mt-1">This is the generic fee collected from all new members unless discounted.</p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-48">
                        <span className="absolute left-4 top-3 text-gray-500 font-bold pointer-events-none">Rs.</span>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            className="w-full pl-12 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 font-bold shadow-inner"
                            value={regFee}
                            onChange={(e) => setRegFee(e.target.value)}
                            placeholder="0.00"
                        />
                    </div>
                    <button
                        onClick={handleSaveFee}
                        className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-black flex items-center gap-2 shadow-lg transition-transform active:scale-95 shrink-0"
                    >
                        <Save size={18} /> Save Fee
                    </button>
                </div>
            </div>

            {/* SECTION 2: Promotions */}
            {!isFormOpen && (
                <>
                    <div className="flex justify-between items-end mt-8">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Promotions & Discounts</h1>
                            <p className="text-gray-500 text-sm mt-1">Create time-based special offers that discount the registration fee.</p>
                        </div>
                        <button
                            onClick={() => openForm()}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all active:scale-95 shrink-0"
                        >
                            <Plus size={18} /> New Offer
                        </button>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-sm">
                                        <th className="p-4 font-semibold">Promotion Details</th>
                                        <th className="p-4 font-semibold">Discount</th>
                                        <th className="p-4 font-semibold">Target</th>
                                        <th className="p-4 font-semibold">Valid Period</th>
                                        <th className="p-4 font-semibold">Status</th>
                                        <th className="p-4 font-semibold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {promotions.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="p-8 text-center text-gray-500">
                                                No promotions found. Click "New Offer" to create one.
                                            </td>
                                        </tr>
                                    ) : promotions.map((promo) => (
                                        <tr key={promo.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="p-4">
                                                <div className="font-bold text-gray-900">{promo.title}</div>
                                                <div className="text-sm text-gray-500 truncate max-w-xs">{promo.description}</div>
                                            </td>
                                            <td className="p-4">
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-sm">
                                                    {promo.discountType === 'PERCENTAGE' ? <Percent size={14} /> : <DollarSign size={14} />}
                                                    {promo.discountValue}{promo.discountType === 'PERCENTAGE' ? '%' : ' OFF'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-sm text-gray-600 font-medium whitespace-nowrap">
                                                {promo.target.replace(/_/g, ' ')}
                                            </td>
                                            <td className="p-4 text-sm text-gray-600 whitespace-nowrap">
                                                <div className="flex items-center gap-1.5"><Calendar size={14} className="text-gray-400" /> {new Date(promo.startDate).toLocaleDateString()}</div>
                                                <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-1 pl-5">to {new Date(promo.endDate).toLocaleDateString()}</div>
                                            </td>
                                            <td className="p-4">
                                                <button
                                                    onClick={() => toggleStatus(promo)}
                                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${promo.isActive ? 'bg-blue-600' : 'bg-gray-200'}`}
                                                >
                                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${promo.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                                                </button>
                                                <span className="text-xs ml-2 text-gray-500 font-medium">{promo.isActive ? 'Active' : 'Inactive'}</span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => openForm(promo)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                                        <Edit2 size={18} />
                                                    </button>
                                                    <button onClick={() => handleDelete(promo.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {isFormOpen && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in-up">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-slate-50">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Tag className="text-blue-600" />
                            {editingPromo ? 'Edit Promotion' : 'New Promotion'}
                        </h2>
                        <button onClick={() => setIsFormOpen(false)} className="text-gray-400 hover:text-gray-600 text-2xl font-light">&times;</button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 space-y-6 max-w-3xl">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Title</label>
                            <input required type="text" className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. New Year Special" />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Description (Optional)</label>
                            <textarea className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" rows="3" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Show on landing page..." />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Discount Type</label>
                                <select className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white" value={formData.discountType} onChange={e => setFormData({ ...formData, discountType: e.target.value })}>
                                    <option value="PERCENTAGE">Percentage (%)</option>
                                    <option value="FIXED_AMOUNT">Fixed Amount ($)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Discount Value</label>
                                <input required type="number" step="0.01" min="0" className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={formData.discountValue} onChange={e => setFormData({ ...formData, discountValue: e.target.value })} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Start Date</label>
                                <input required type="date" className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">End Date</label>
                                <input required type="date" className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} />
                            </div>
                        </div>

                        <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                            <input type="checkbox" id="isActive" className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} />
                            <label htmlFor="isActive" className="font-bold text-gray-700 cursor-pointer select-none">Make active immediately?</label>
                        </div>

                        <div className="pt-6 flex justify-end gap-3">
                            <button type="button" onClick={() => setIsFormOpen(false)} className="px-6 py-3 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors">Cancel</button>
                            <button type="submit" className="px-8 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl active:scale-95">
                                {editingPromo ? 'Update Promotion' : 'Create Promotion'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
