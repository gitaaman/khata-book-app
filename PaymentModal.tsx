import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiCheck, FiDollarSign } from 'react-icons/fi';
import type { Customer } from './database.types';
import { useKhata } from './KhataContext';
import { useToast } from './ToastContext';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
  defaultType?: 'payment_received' | 'credit_given';
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  customer,
  defaultType = 'payment_received',
}) => {
  const { addPayment } = useKhata();
  const { showToast } = useToast();

  const [type, setType] = useState<'payment_received' | 'credit_given'>(defaultType);
  const [amount, setAmount] = useState<string>('');
  const [paymentMode, setPaymentMode] = useState<'cash' | 'upi' | 'bank'>('cash');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAmount = parseFloat(amount);
    if (isNaN(cleanAmount) || cleanAmount <= 0) {
      showToast('कृपया सही राशि दर्ज करें', 'error');
      return;
    }

    setLoading(true);
    try {
      await addPayment({
        customerId: customer.id,
        amount: cleanAmount,
        type,
        paymentMode,
        date: new Date().toISOString().split('T')[0],
        notes: notes.trim() || undefined,
      });

      const label = type === 'payment_received' ? 'जमा भुगतान' : 'उधार';
      showToast(`₹${cleanAmount} का ${label} दर्ज हो गया!`, 'success');
      setAmount('');
      setNotes('');
      onClose();
    } catch (err: any) {
      showToast('प्रविष्टि दर्ज करने में त्रुटि: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative max-w-md w-full bg-white rounded-3xl shadow-2xl p-6 z-10 border border-slate-200"
        >
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div>
              <h3 className="font-black text-slate-900 text-base">लेन-देन दर्ज करें</h3>
              <p className="text-xs text-slate-500 font-semibold">
                ग्राहक: <strong className="text-slate-800">{customer.name}</strong> (वर्तमान बकाया: ₹{customer.runningBalance.toFixed(2)})
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Type Toggle: Jama Received vs Udhar Given */}
            <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-2xl">
              <button
                type="button"
                onClick={() => setType('payment_received')}
                className={`py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                  type === 'payment_received'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                💰 पैसे मिले (जमा)
              </button>
              <button
                type="button"
                onClick={() => setType('credit_given')}
                className={`py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                  type === 'credit_given'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📉 उधार दिया (बाकी)
              </button>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                राशि (रुपये में) *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-3 text-lg font-black text-slate-500">₹</span>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-9 pr-4 py-3 rounded-2xl border border-slate-200 text-xl font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Payment Mode */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                माध्यम (Payment Mode)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['cash', 'upi', 'bank'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setPaymentMode(mode)}
                    className={`py-2 rounded-xl text-xs font-bold capitalize transition-all border ${
                      paymentMode === mode
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {mode === 'cash' ? '💵 नकद (Cash)' : mode === 'upi' ? '⚡ UPI / QR' : '🏦 बैंक'}
                  </button>
                ))}
              </div>
            </div>

            {/* Description / Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                विवरण / टिप्पणी (वैकल्पिक)
              </label>
              <input
                type="text"
                placeholder="उदा. गूगल पे से भुगतान, नकद हिसाब"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3.5 rounded-xl text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50 ${
                  type === 'payment_received' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                <FiCheck className="w-4 h-4" />
                {loading ? 'सहेजा जा रहा है...' : type === 'payment_received' ? 'जमा राशि सहेजें' : 'उधार राशि सहेजें'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
