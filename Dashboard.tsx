import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiSearch,
  FiUserPlus,
  FiTrendingUp,
  FiTrendingDown,
  FiUsers,
  FiFileText,
  FiChevronRight,
  FiPlus,
} from 'react-icons/fi';
import { FaQrcode } from 'react-icons/fa';
import { useKhata } from './KhataContext';
import { AddCustomerModal } from './AddCustomerModal';
import { PaymentModal } from './PaymentModal';
import { UPIQRCodeModal } from './UPIQRCodeModal';
import type { Customer } from './database.types';

export const Dashboard: React.FC = () => {
  const { shop, customers } = useKhata();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'pending' | 'settled'>('all');
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [selectedCustomerForPayment, setSelectedCustomerForPayment] = useState<Customer | null>(null);
  const [isCounterQrOpen, setIsCounterQrOpen] = useState(false);

  // Totals
  const { totalUdhar, totalAdvance } = useMemo(() => {
    let udhar = 0;
    let advance = 0;
    customers.forEach((c) => {
      if (c.runningBalance > 0) udhar += c.runningBalance;
      else if (c.runningBalance < 0) advance += Math.abs(c.runningBalance);
    });
    return { totalUdhar: udhar, totalAdvance: advance };
  }, [customers]);

  // Filtered customers
  const filteredCustomers = useMemo(() => {
    return customers
      .filter((c) => {
        const matchSearch =
          c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.phone.includes(searchTerm);
        if (!matchSearch) return false;

        if (filterType === 'pending') return c.runningBalance > 0;
        if (filterType === 'settled') return c.runningBalance <= 0;
        return true;
      })
      .sort((a, b) => b.runningBalance - a.runningBalance);
  }, [customers, searchTerm, filterType]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 pb-28">
      {/* Top Welcome & Counter QR */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {shop?.shopName || 'खाता बुक'}
          </h1>
          <p className="text-xs font-semibold text-slate-500">
            दुकानदार: <strong className="text-slate-800">{shop?.ownerName}</strong> • ऑफ़लाइन सुरक्षित
          </p>
        </div>

        {shop?.upiId && (
          <button
            onClick={() => setIsCounterQrOpen(true)}
            className="px-3 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer"
          >
            <FaQrcode className="w-4 h-4" /> काउंटर QR
          </button>
        )}
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        {/* Total Udhar to Collect */}
        <div className="p-4 rounded-3xl bg-rose-50 border border-rose-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black text-rose-700 uppercase tracking-wider">
              लेना बाकी (उधार)
            </span>
            <div className="w-7 h-7 rounded-xl bg-rose-200 text-rose-700 flex items-center justify-center">
              <FiTrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-700">
            ₹{totalUdhar.toFixed(2)}
          </div>
          <p className="text-[10px] text-rose-600 font-bold mt-1">मार्केट में कुल बकाया</p>
        </div>

        {/* Total Advance / Jama */}
        <div className="p-4 rounded-3xl bg-emerald-50 border border-emerald-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black text-emerald-700 uppercase tracking-wider">
              जमा / एडवांस
            </span>
            <div className="w-7 h-7 rounded-xl bg-emerald-200 text-emerald-700 flex items-center justify-center">
              <FiTrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700">
            ₹{totalAdvance.toFixed(2)}
          </div>
          <p className="text-[10px] text-emerald-600 font-bold mt-1">ग्राहकों का एडवांस</p>
        </div>

        {/* Total Customers */}
        <div className="p-4 rounded-3xl bg-blue-50 border border-blue-200 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black text-blue-700 uppercase tracking-wider">
              कुल ग्राहक
            </span>
            <div className="w-7 h-7 rounded-xl bg-blue-200 text-blue-700 flex items-center justify-center">
              <FiUsers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-900">
            {customers.length}
          </div>
          <p className="text-[10px] text-blue-600 font-bold mt-1">खाता बही में दर्ज खाते</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between mb-4">
        <div className="relative w-full sm:w-80">
          <FiSearch className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="ग्राहक का नाम या फोन नंबर खोजें..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {[
            { key: 'all', label: 'सभी ग्राहक' },
            { key: 'pending', label: '🔴 सिर्फ उधारी' },
            { key: 'settled', label: '🟢 चुकता / जमा' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilterType(tab.key as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                filterType === tab.key
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Customer List */}
      <div className="space-y-2.5">
        {filteredCustomers.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-300">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
              <FiUsers className="w-8 h-8" />
            </div>
            <h3 className="text-base font-black text-slate-900">कोई ग्राहक नहीं मिला</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              {searchTerm
                ? 'आपके खोजे गए नाम या नंबर से कोई खाता नहीं मिला।'
                : 'अभी आपकी खाता बही में कोई ग्राहक नहीं है। पहला ग्राहक जोड़ें!'}
            </p>
            <button
              onClick={() => setIsAddCustomerOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 inline-flex items-center gap-2 cursor-pointer"
            >
              <FiUserPlus className="w-4 h-4" /> ग्राहक जोड़ें
            </button>
          </div>
        ) : (
          filteredCustomers.map((customer) => {
            const hasUdhar = customer.runningBalance > 0;
            const hasAdvance = customer.runningBalance < 0;

            return (
              <motion.div
                key={customer.id}
                whileHover={{ y: -1 }}
                className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-3 hover:border-slate-300 transition-all"
              >
                {/* Customer Info (Click to view Detail) */}
                <Link
                  to={`/customer/${customer.id}`}
                  className="flex items-center gap-3.5 grow min-w-0"
                >
                  <div
                    className={`w-11 h-11 rounded-2xl font-black text-sm flex items-center justify-center shrink-0 ${
                      hasUdhar
                        ? 'bg-rose-100 text-rose-700'
                        : hasAdvance
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {customer.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-black text-sm text-slate-900 truncate">
                      {customer.name}
                    </h4>
                    <p className="text-xs font-semibold text-slate-500 mt-0.5">
                      {customer.phone} {customer.address ? `• ${customer.address}` : ''}
                    </p>
                  </div>
                </Link>

                {/* Balance & Actions */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div
                      className={`text-base font-black ${
                        hasUdhar
                          ? 'text-rose-600'
                          : hasAdvance
                          ? 'text-emerald-600'
                          : 'text-slate-500'
                      }`}
                    >
                      ₹{Math.abs(customer.runningBalance).toFixed(2)}
                    </div>
                    <span
                      className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                        hasUdhar
                          ? 'bg-rose-100 text-rose-700'
                          : hasAdvance
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {hasUdhar ? 'बाकी (देना है)' : hasAdvance ? 'जमा (एडवांस)' : 'हिसाब चुकता'}
                    </span>
                  </div>

                  {/* Quick Add Bill */}
                  <button
                    onClick={() => navigate(`/bill/new?customerId=${customer.id}`)}
                    className="p-2.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors cursor-pointer"
                    title="बिल बनाएं"
                  >
                    <FiFileText className="w-4 h-4" />
                  </button>

                  {/* Quick Payment Entry */}
                  <button
                    onClick={() => setSelectedCustomerForPayment(customer)}
                    className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors cursor-pointer"
                    title="पैसे जमा / उधार करें"
                  >
                    <FiPlus className="w-4 h-4" />
                  </button>

                  <Link
                    to={`/customer/${customer.id}`}
                    className="p-1 text-slate-400 hover:text-slate-700"
                  >
                    <FiChevronRight className="w-5 h-5" />
                  </Link>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Floating Add Customer Action */}
      <div className="fixed bottom-6 right-6 z-30">
        <button
          onClick={() => setIsAddCustomerOpen(true)}
          className="px-5 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-xl shadow-blue-500/30 flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
        >
          <FiUserPlus className="w-5 h-5" /> ➕ नया ग्राहक
        </button>
      </div>

      {/* Modals */}
      <AddCustomerModal
        isOpen={isAddCustomerOpen}
        onClose={() => setIsAddCustomerOpen(false)}
      />

      {selectedCustomerForPayment && (
        <PaymentModal
          isOpen={!!selectedCustomerForPayment}
          onClose={() => setSelectedCustomerForPayment(null)}
          customer={selectedCustomerForPayment}
        />
      )}

      <UPIQRCodeModal
        isOpen={isCounterQrOpen}
        onClose={() => setIsCounterQrOpen(false)}
      />
    </div>
  );
};
