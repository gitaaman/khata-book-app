import React, { useState, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FiArrowLeft, FiPlus, FiTrash2, FiPrinter, FiCheck, FiUser } from 'react-icons/fi';
import { useKhata } from './KhataContext';
import { useToast } from './ToastContext';
import { BillPrintModal } from './BillPrintModal';
import type { BillItem, Bill } from './database.types';

export const BillCreate: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedCustomerId = searchParams.get('customerId') || '';

  const { shop, customers, bills, addBill } = useKhata();
  const { showToast } = useToast();

  const [selectedCustomerId, setSelectedCustomerId] = useState(preselectedCustomerId);
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid'>('pending');
  const [items, setItems] = useState<BillItem[]>([
    { name: '', rate: 0, quantity: 1, unit: 'kg', total: 0 },
  ]);

  // Saved bill for immediate printing
  const [createdBill, setCreatedBill] = useState<Bill | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Generate next bill number
  const nextBillNumber = useMemo(() => {
    const count = bills.length + 1001;
    return `KB-${count}`;
  }, [bills]);

  // Selected customer object
  const currentCustomer = customers.find((c) => c.id === selectedCustomerId);

  // Grand total calculation
  const grandTotal = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.total || item.rate * item.quantity || 0), 0);
  }, [items]);

  // Handle item row change
  const handleItemChange = (index: number, field: keyof BillItem, value: any) => {
    setItems((prev) => {
      const updated = [...prev];
      const target = { ...updated[index], [field]: value };

      if (field === 'rate' || field === 'quantity') {
        const r = field === 'rate' ? parseFloat(value) || 0 : target.rate;
        const q = field === 'quantity' ? parseFloat(value) || 0 : target.quantity;
        target.total = r * q;
      }

      updated[index] = target;
      return updated;
    });
  };

  const handleAddItemRow = () => {
    setItems((prev) => [...prev, { name: '', rate: 0, quantity: 1, unit: 'kg', total: 0 }]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (items.length === 1) {
      setItems([{ name: '', rate: 0, quantity: 1, unit: 'kg', total: 0 }]);
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveBill = async (andPrint: boolean = false) => {
    if (!selectedCustomerId) {
      showToast('कृपया ग्राहक का चयन करें', 'error');
      return;
    }

    const validItems = items.filter((it) => it.name.trim().length > 0);
    if (validItems.length === 0) {
      showToast('कृपया कम से कम एक सामान का नाम दर्ज करें', 'error');
      return;
    }

    setSaving(true);
    try {
      const newBill = await addBill({
        billNumber: nextBillNumber,
        customerId: selectedCustomerId,
        billDate,
        items: validItems,
        totalAmount: grandTotal,
        paymentStatus,
      });

      showToast(`बिल ${newBill.billNumber} सफलतापूर्वक सहेजा गया!`, 'success');

      if (andPrint) {
        setCreatedBill(newBill);
        setIsPrintModalOpen(true);
      } else {
        navigate(`/customer/${selectedCustomerId}`);
      }
    } catch (err: any) {
      showToast('बिल सहेजने में त्रुटि: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-28">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigate(-1)}
          className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer"
        >
          <FiArrowLeft className="w-4 h-4" /> वापस
        </button>

        <span className="text-xs font-mono font-bold text-slate-500">
          रसीद संख्या: <strong className="text-blue-600 font-black">{nextBillNumber}</strong>
        </span>
      </div>

      <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-6">
        {/* Customer & Date Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              ग्राहक चुनें (Select Customer) *
            </label>
            <div className="relative">
              <FiUser className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="">-- ग्राहक का चयन करें --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone}) - बकाया: ₹{c.runningBalance.toFixed(2)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              बिल तारीख (Bill Date)
            </label>
            <input
              type="date"
              value={billDate}
              onChange={(e) => setBillDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Payment Status Toggle */}
        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
          <span className="text-xs font-black text-slate-700">भुगतान स्थिति (Status):</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPaymentStatus('pending')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                paymentStatus === 'pending'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              🔴 उधार (खाते में जुड़ेगा)
            </button>
            <button
              type="button"
              onClick={() => setPaymentStatus('paid')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                paymentStatus === 'paid'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              🟢 चुकता (नकद भुगतान)
            </button>
          </div>
        </div>

        {/* Items Table */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
              सामान की सूची (Item Rows)
            </h3>
            <span className="text-xs font-bold text-slate-500">{items.length} पंक्तियाँ</span>
          </div>

          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white font-black text-[11px]">
                  <th className="p-2.5 text-center w-10">क्र.</th>
                  <th className="p-2.5">सामान का नाम (Item Description)</th>
                  <th className="p-2.5 w-24 text-right">दर (₹)</th>
                  <th className="p-2.5 w-20 text-center">मात्रा</th>
                  <th className="p-2.5 w-16 text-center">इकाई</th>
                  <th className="p-2.5 w-24 text-right">कुल (₹)</th>
                  <th className="p-2.5 w-10 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((it, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="p-2 text-center font-bold text-slate-400">{idx + 1}</td>
                    <td className="p-2">
                      <input
                        type="text"
                        placeholder="उदा. चीनी, तेल, कपड़ा, साबुन"
                        value={it.name}
                        onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        step="any"
                        placeholder="0.00"
                        value={it.rate || ''}
                        onChange={(e) => handleItemChange(idx, 'rate', e.target.value)}
                        className="w-full text-right px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        step="any"
                        value={it.quantity || ''}
                        onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                        className="w-full text-center px-1.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                      />
                    </td>
                    <td className="p-2">
                      <select
                        value={it.unit || 'kg'}
                        onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                        className="w-full text-center py-1.5 rounded-lg border border-slate-200 text-xs font-semibold focus:outline-none"
                      >
                        <option value="kg">kg</option>
                        <option value="gm">gm</option>
                        <option value="pkt">पैकेट</option>
                        <option value="pc">नग</option>
                        <option value="ltr">लीटर</option>
                        <option value="mtr">मीटर</option>
                      </select>
                    </td>
                    <td className="p-2 text-right font-black text-slate-900">
                      ₹{it.total.toFixed(2)}
                    </td>
                    <td className="p-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItemRow(idx)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            onClick={handleAddItemRow}
            className="mt-3 px-3.5 py-1.5 rounded-xl border border-dashed border-blue-400 text-blue-600 hover:bg-blue-50 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <FiPlus className="w-4 h-4" /> सामान की पंक्ति जोड़ें (+ Row)
          </button>
        </div>

        {/* Grand Total Bar */}
        <div className="p-4 bg-slate-900 text-white rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              कुल बिल राशि (Grand Total)
            </span>
            <span className="text-xs text-slate-300 font-semibold">
              {items.filter((i) => i.name.trim()).length} सामान का योग
            </span>
          </div>
          <div className="text-3xl font-black text-emerald-400">
            ₹{grandTotal.toFixed(2)}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSaveBill(false)}
            className="w-full py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-sm flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
          >
            <FiCheck className="w-4 h-4 text-emerald-600" />
            {saving ? 'सहेजा जा रहा है...' : 'सिर्फ बिल सहेजें (Save Only)'}
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={() => handleSaveBill(true)}
            className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
          >
            <FiPrinter className="w-4 h-4" />
            {saving ? 'सहेजा जा रहा है...' : 'सहेजें और प्रिंट/PDF करें (Save & Print)'}
          </button>
        </div>
      </div>

      {/* Bill Print Modal */}
      {createdBill && currentCustomer && (
        <BillPrintModal
          isOpen={isPrintModalOpen}
          onClose={() => {
            setIsPrintModalOpen(false);
            navigate(`/customer/${selectedCustomerId}`);
          }}
          customer={currentCustomer}
          bill={createdBill}
        />
      )}
    </div>
  );
};
