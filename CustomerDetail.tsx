import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FiArrowLeft,
  FiFileText,
  FiPlus,
  FiDollarSign,
  FiPrinter,
  FiPhone,
  FiMapPin,
  FiTrash2,
  FiCalendar,
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { useKhata } from './KhataContext';
import { useToast } from './ToastContext';
import { PaymentModal } from './PaymentModal';
import { BillPrintModal } from './BillPrintModal';
import { UPIQRCodeModal } from './UPIQRCodeModal';
import { formatWhatsAppBillMessage, openWhatsApp } from './whatsappUtils';
import type { Bill } from './database.types';

export const CustomerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { shop, customers, bills, payments, deleteBill, deletePayment, deleteCustomer } = useKhata();
  const { showToast } = useToast();

  const customer = customers.find((c) => c.id === id);

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentDefaultType, setPaymentDefaultType] = useState<'payment_received' | 'credit_given'>('payment_received');
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [selectedBillForPrint, setSelectedBillForPrint] = useState<Bill | null>(null);
  const [isConsolidatedPrint, setIsConsolidatedPrint] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'bills' | 'payments'>('all');

  // Customer bills and payments
  const customerBills = useMemo(() => bills.filter((b) => b.customerId === id), [bills, id]);
  const customerPayments = useMemo(() => payments.filter((p) => p.customerId === id), [payments, id]);

  // Combined timeline
  const combinedHistory = useMemo(() => {
    const list: any[] = [];
    customerBills.forEach((b) => list.push({ ...b, itemType: 'bill', sortDate: b.createdAt || b.billDate }));
    customerPayments.forEach((p) => list.push({ ...p, itemType: 'payment', sortDate: p.createdAt || p.date }));
    return list.sort((a, b) => new Date(b.sortDate).getTime() - new Date(a.sortDate).getTime());
  }, [customerBills, customerPayments]);

  if (!customer || !shop) {
    return (
      <div className="max-w-md mx-auto p-8 text-center">
        <h3 className="font-bold text-slate-800">ग्राहक नहीं मिला</h3>
        <button
          onClick={() => navigate('/')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
        >
          डैशबोर्ड पर वापस जाएं
        </button>
      </div>
    );
  }

  const hasUdhar = customer.runningBalance > 0;
  const hasAdvance = customer.runningBalance < 0;

  // WhatsApp reminder
  const handleSendWhatsAppReminder = () => {
    const message = formatWhatsAppBillMessage(shop, customer, null, customerBills);
    openWhatsApp(customer.phone, message);
  };

  // Delete Customer Confirmation
  const handleDeleteCustomer = async () => {
    if (window.confirm(`क्या आप वाकई ग्राहक "${customer.name}" और उनका सारा खाता इतिहास हटाना चाहते हैं?`)) {
      await deleteCustomer(customer.id);
      showToast('ग्राहक खाता हटा दिया गया', 'info');
      navigate('/');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 pb-28">
      {/* Top Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigate('/')}
          className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer"
        >
          <FiArrowLeft className="w-4 h-4" /> डैशबोर्ड
        </button>

        <button
          onClick={handleDeleteCustomer}
          className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
          title="ग्राहक हटाएं"
        >
          <FiTrash2 className="w-4 h-4" /> <span className="hidden sm:inline">खाता हटाएं</span>
        </button>
      </div>

      {/* Customer Profile Card */}
      <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className={`w-14 h-14 rounded-2xl font-black text-xl flex items-center justify-center shrink-0 ${
                hasUdhar
                  ? 'bg-rose-100 text-rose-700'
                  : hasAdvance
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {customer.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 leading-tight">{customer.name}</h1>
              <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500 mt-1">
                <span className="flex items-center gap-1 text-slate-700">
                  <FiPhone className="w-3.5 h-3.5 text-blue-600" /> {customer.phone}
                </span>
                {customer.address && (
                  <span className="flex items-center gap-1">
                    <FiMapPin className="w-3.5 h-3.5" /> {customer.address}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Running Balance Big Display */}
          <div className="text-left sm:text-right p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">
              {hasUdhar ? 'कुल बाकी राशि (उधार)' : hasAdvance ? 'कुल जमा (एडवांस)' : 'वर्तमान खाता शेष'}
            </span>
            <div
              className={`text-2xl font-black mt-0.5 ${
                hasUdhar ? 'text-rose-600' : hasAdvance ? 'text-emerald-600' : 'text-slate-700'
              }`}
            >
              ₹{Math.abs(customer.runningBalance).toFixed(2)}
            </div>
          </div>
        </div>

        {/* Quick Action Buttons Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-6 pt-5 border-t border-slate-100">
          {/* 1. Add Bill */}
          <Link
            to={`/bill/new?customerId=${customer.id}`}
            className="p-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 text-center"
          >
            <FiFileText className="w-4 h-4" /> नया बिल बनाएं
          </Link>

          {/* 2. Received Money (Jama) */}
          <button
            onClick={() => {
              setPaymentDefaultType('payment_received');
              setPaymentModalOpen(true);
            }}
            className="p-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer text-center"
          >
            <FiPlus className="w-4 h-4" /> पैसे मिले (जमा)
          </button>

          {/* 3. Send WhatsApp */}
          <button
            onClick={handleSendWhatsAppReminder}
            className="p-3 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer text-center"
          >
            <FaWhatsapp className="w-4 h-4 text-emerald-300" /> WhatsApp हिसाब
          </button>

          {/* 4. Full Statement Print / PDF */}
          <button
            onClick={() => {
              setSelectedBillForPrint(null);
              setIsConsolidatedPrint(true);
              setPrintModalOpen(true);
            }}
            className="p-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer text-center"
          >
            <FiPrinter className="w-4 h-4" /> खाता PDF / प्रिंट
          </button>
        </div>
      </div>

      {/* Ledger History Section */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        {/* Tab Selector */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-black text-sm text-slate-900">खाता बही इतिहास (Ledger History)</h3>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1 rounded-lg transition-all ${
                activeTab === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              सभी ({combinedHistory.length})
            </button>
            <button
              onClick={() => setActiveTab('bills')}
              className={`px-3 py-1 rounded-lg transition-all ${
                activeTab === 'bills' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              बिल ({customerBills.length})
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`px-3 py-1 rounded-lg transition-all ${
                activeTab === 'payments' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              लेन-देन ({customerPayments.length})
            </button>
          </div>
        </div>

        {/* History Feed */}
        <div className="divide-y divide-slate-100">
          {combinedHistory.length === 0 ? (
            <div className="p-10 text-center text-xs font-bold text-slate-400">
              अभी इस ग्राहक का कोई बिल या लेन-देन दर्ज नहीं है।
            </div>
          ) : (
            combinedHistory.map((entry) => {
              const isBill = entry.itemType === 'bill';

              if (activeTab === 'bills' && !isBill) return null;
              if (activeTab === 'payments' && isBill) return null;

              if (isBill) {
                const b: Bill = entry;
                return (
                  <div key={b.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                        <FiFileText className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-sm font-black text-slate-900">{b.billNumber}</strong>
                          <span
                            className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                              b.paymentStatus === 'pending'
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {b.paymentStatus === 'pending' ? 'उधार' : 'चुकता'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-semibold mt-0.5">
                          {b.billDate} • {b.items.length} सामान ({b.items.map((i) => i.name).slice(0, 3).join(', ')}
                          {b.items.length > 3 ? '...' : ''})
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-sm font-black text-slate-900">₹{b.totalAmount.toFixed(2)}</div>
                        <span className="text-[10px] font-bold text-slate-400">बिल कुल</span>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedBillForPrint(b);
                          setIsConsolidatedPrint(false);
                          setPrintModalOpen(true);
                        }}
                        className="p-2 rounded-xl text-blue-600 hover:bg-blue-50"
                        title="बिल प्रिंट करें"
                      >
                        <FiPrinter className="w-4 h-4" />
                      </button>
                      <button
                        onClick={async () => {
                          if (window.confirm(`बिल ${b.billNumber} हटाना चाहते हैं?`)) {
                            await deleteBill(b.id);
                            showToast('बिल हटा दिया गया', 'info');
                          }
                        }}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600"
                        title="हटाएं"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              } else {
                const p = entry;
                const isReceived = p.type === 'payment_received';
                return (
                  <div key={p.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                          isReceived ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                        }`}
                      >
                        <FiDollarSign className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-sm font-black text-slate-900">
                            {isReceived ? 'जमा भुगतान (Payment In)' : 'उधार दिया (Credit Out)'}
                          </strong>
                          <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                            {p.paymentMode}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-semibold mt-0.5">
                          {p.date} {p.notes ? `• ${p.notes}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className={`text-sm font-black ${isReceived ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {isReceived ? '-' : '+'}₹{p.amount.toFixed(2)}
                        </div>
                        <span className="text-[10px] font-bold text-slate-400">
                          {isReceived ? 'हिसाब घटा' : 'बाकी बढ़ा'}
                        </span>
                      </div>
                      <button
                        onClick={async () => {
                          if (window.confirm('यह लेन-देन प्रविष्टि हटाना चाहते हैं?')) {
                            await deletePayment(p.id);
                            showToast('प्रविष्टि हटा दी गई', 'info');
                          }
                        }}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600"
                        title="हटाएं"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              }
            })
          )}
        </div>
      </div>

      {/* Modals */}
      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        customer={customer}
        defaultType={paymentDefaultType}
      />

      <BillPrintModal
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        customer={customer}
        bill={selectedBillForPrint}
        billsList={isConsolidatedPrint ? customerBills : undefined}
      />

      <UPIQRCodeModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        defaultAmount={customer.runningBalance > 0 ? customer.runningBalance : undefined}
        customerName={customer.name}
      />
    </div>
  );
};
