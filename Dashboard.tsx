
import React, { useMemo, useState } from 'react';
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
  const [filterType, setFilterType] = useState<
    'all' | 'pending' | 'settled'
  >('all');
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [selectedCustomerForPayment, setSelectedCustomerForPayment] =
    useState<Customer | null>(null);
  const [isCounterQrOpen, setIsCounterQrOpen] = useState(false);

  const { totalUdhar, totalAdvance } = useMemo(() => {
    let udhar = 0;
    let advance = 0;

    customers.forEach((customer) => {
      if (customer.runningBalance > 0) {
        udhar += customer.runningBalance;
      } else if (customer.runningBalance < 0) {
        advance += Math.abs(customer.runningBalance);
      }
    });

    return { totalUdhar: udhar, totalAdvance: advance };
  }, [customers]);

  const formatMoney = (amount: number) =>
    `₹${amount.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const filteredCustomers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return customers
      .filter((customer) => {
        const matchesSearch =
          customer.name.toLowerCase().includes(query) ||
          (customer.phone || '').includes(query);

        if (!matchesSearch) return false;
        if (filterType === 'pending') {
          return customer.runningBalance > 0;
        }
        if (filterType === 'settled') {
          return customer.runningBalance <= 0;
        }

        return true;
      })
      .sort((a, b) => b.runningBalance - a.runningBalance);
  }, [customers, searchTerm, filterType]);

  const filters = [
    { key: 'all', label: 'सभी', count: customers.length },
    {
      key: 'pending',
      label: 'उधार बाकी',
      count: customers.filter((c) => c.runningBalance > 0).length,
    },
    {
      key: 'settled',
      label: 'चुकता / जमा',
      count: customers.filter((c) => c.runningBalance <= 0).length,
    },
  ] as const;

  return (
    <div className="mx-auto min-h-screen w-full max-w-5xl px-4 pb-32 pt-5 sm:px-6 sm:pt-7">
      {/* Shop header */}
      <header className="mb-6 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="mb-1 text-xs font-bold text-blue-700">
            नमस्ते दुकानदार 👋
          </p>
          <h1 className="truncate text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            {shop?.shopName || 'खाता बुक'}
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            {shop?.ownerName ? `दुकानदार: ${shop.ownerName} · ` : ''}
            <span className="font-semibold text-emerald-700">
              ऑफ़लाइन सुरक्षित
            </span>
          </p>
        </div>

        {shop?.upiId && (
          <button
            type="button"
            onClick={() => setIsCounterQrOpen(true)}
            className="touch-target flex shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 text-emerald-800 transition active:scale-95"
            aria-label="काउंटर UPI QR खोलें"
          >
            <FaQrcode className="h-6 w-6" />
            <span className="text-[11px] font-extrabold">काउंटर QR</span>
          </button>
        )}
      </header>

      {/* Summary */}
      <section className="mb-7" aria-label="खाते का सारांश">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-extrabold text-slate-900">
            आपके खाते का हिसाब
          </h2>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">
            {customers.length} ग्राहक
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3.5 sm:rounded-3xl sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-1">
              <span className="text-xs font-bold text-rose-800 sm:text-sm">
                लेना बाकी
              </span>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-rose-700">
                <FiTrendingUp className="h-4 w-4" />
              </span>
            </div>
            <p className="break-words text-lg font-black tracking-tight text-rose-800 sm:text-2xl">
              {formatMoney(totalUdhar)}
            </p>
            <p className="mt-1.5 text-[10px] font-medium text-rose-700 sm:text-xs">
              ग्राहकों से लेना है
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5 sm:rounded-3xl sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-1">
              <span className="text-xs font-bold text-emerald-800 sm:text-sm">
                जमा / एडवांस
              </span>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700">
                <FiTrendingDown className="h-4 w-4" />
              </span>
            </div>
            <p className="break-words text-lg font-black tracking-tight text-emerald-800 sm:text-2xl">
              {formatMoney(totalAdvance)}
            </p>
            <p className="mt-1.5 text-[10px] font-medium text-emerald-700 sm:text-xs">
              ग्राहकों का एडवांस
            </p>
          </div>

          <div className="col-span-2 flex items-center justify-between rounded-2xl border border-blue-200 bg-blue-50 p-3.5 sm:col-span-1 sm:rounded-3xl sm:p-5">
            <div>
              <p className="text-xs font-bold text-blue-800 sm:text-sm">
                कुल ग्राहक
              </p>
              <p className="mt-2 text-2xl font-black text-blue-900 sm:text-3xl">
                {customers.length}
              </p>
              <p className="mt-1 text-[10px] font-medium text-blue-700 sm:text-xs">
                आपकी खाता बही में
              </p>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-blue-700">
              <FiUsers className="h-5 w-5" />
            </span>
          </div>
        </div>
      </section>

      {/* Add customer shortcut */}
      <button
        type="button"
        onClick={() => setIsAddCustomerOpen(true)}
        className="mb-6 flex min-h-14 w-full items-center justify-between gap-3 rounded-2xl bg-blue-700 px-4 py-3 text-left text-white shadow-lg shadow-blue-900/10 transition hover:bg-blue-800 active:scale-[0.99]"
      >
        <span className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
            <FiUserPlus className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-sm font-extrabold">
              नया ग्राहक जोड़ें
            </span>
            <span className="mt-0.5 block text-xs text-blue-100">
              नया खाता शुरू करें
            </span>
          </span>
        </span>
        <FiChevronRight className="h-5 w-5 shrink-0" />
      </button>

      {/* Customer search */}
      <section aria-label="ग्राहक खोजें">
        <h2 className="mb-3 text-base font-extrabold text-slate-900">
          ग्राहक और खाते
        </h2>

        <div className="relative mb-3">
          <FiSearch className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="नाम या मोबाइल नंबर खोजें"
            aria-label="ग्राहक का नाम या मोबाइल नंबर खोजें"
            className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-medium text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
          />
        </div>

        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          {filters.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => setFilterType(filter.key)}
              aria-pressed={filterType === filter.key}
              className={`min-h-10 shrink-0 rounded-xl px-3 py-2 text-xs font-bold transition ${
                filterType === filter.key
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {filter.label}
              <span className="ml-1 opacity-75">({filter.count})</span>
            </button>
          ))}
        </div>
      </section>

      {/* Customer list */}
      <section className="space-y-3" aria-label="ग्राहकों की सूची">
        {filteredCustomers.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center">
            <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <FiUsers className="h-7 w-7" />
            </span>
            <h3 className="text-base font-extrabold text-slate-900">
              {searchTerm
                ? 'कोई ग्राहक नहीं मिला'
                : filterType === 'pending'
                  ? 'कोई उधार बाकी नहीं'
                  : filterType === 'settled'
                    ? 'इस सूची में कोई ग्राहक नहीं'
                    : 'अभी कोई ग्राहक नहीं है'}
            </h3>
            <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-slate-500">
              {searchTerm
                ? 'नाम या मोबाइल नंबर जाँचकर फिर कोशिश करें।'
                : 'अपनी खाता बही शुरू करने के लिए पहला ग्राहक जोड़ें।'}
            </p>
            {!searchTerm && filterType === 'all' && (
              <button
                type="button"
                onClick={() => setIsAddCustomerOpen(true)}
                className="mt-4 min-h-11 rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-bold text-white active:scale-95"
              >
                + ग्राहक जोड़ें
              </button>
            )}
          </div>
        ) : (
          filteredCustomers.map((customer) => {
            const hasUdhar = customer.runningBalance > 0;
            const hasAdvance = customer.runningBalance < 0;

            const balanceColor = hasUdhar
              ? 'text-rose-700'
              : hasAdvance
                ? 'text-emerald-700'
                : 'text-slate-600';

            const balanceLabel = hasUdhar
              ? 'आपको लेने हैं'
              : hasAdvance
                ? 'एडवांस जमा'
                : 'हिसाब चुकता';

            const avatarColor = hasUdhar
              ? 'bg-rose-100 text-rose-800'
              : hasAdvance
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-slate-100 text-slate-700';

            return (
              <motion.article
                key={customer.id}
                whileTap={{ scale: 0.995 }}
                className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm transition hover:border-blue-200 sm:rounded-3xl sm:p-4"
              >
                <div className="flex items-start gap-3">
                  <Link
                    to={`/customer/${customer.id}`}
                    aria-label={`${customer.name} का खाता खोलें`}
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-base font-black ${avatarColor}`}
                  >
                    {(customer.name || '?').charAt(0).toUpperCase()}
                  </Link>

                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/customer/${customer.id}`}
                      className="block truncate text-sm font-extrabold text-slate-900 hover:text-blue-700"
                    >
                      {customer.name}
                    </Link>
                    <p className="mt-1 break-words text-xs leading-5 text-slate-500">
                      {customer.phone || 'मोबाइल नंबर नहीं दिया'}
                    </p>
                    {customer.address && (
                      <p className="mt-0.5 break-words text-xs text-slate-400">
                        {customer.address}
                      </p>
                    )}
                  </div>

                  <Link
                    to={`/customer/${customer.id}`}
                    className="flex min-h-10 shrink-0 flex-col items-end justify-center rounded-xl px-1 text-right"
                  >
                    <span className={`text-base font-black ${balanceColor}`}>
                      {formatMoney(Math.abs(customer.runningBalance))}
                    </span>
                    <span
                      className={`mt-1 rounded-md px-1.5 py-1 text-[10px] font-bold ${
                        hasUdhar
                          ? 'bg-rose-50 text-rose-700'
                          : hasAdvance
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {balanceLabel}
                    </span>
                  </Link>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={() =>
                      navigate(`/bill/new?customerId=${customer.id}`)
                    }
                    className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-50 px-2 py-2.5 text-xs font-bold text-blue-800 transition hover:bg-blue-100 active:scale-[0.98]"
                    aria-label={`${customer.name} का बिल बनाएं`}
                  >
                    <FiFileText className="h-4 w-4 shrink-0" />
                    बिल बनाएं
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedCustomerForPayment(customer)}
                    className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-50 px-2 py-2.5 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100 active:scale-[0.98]"
                    aria-label={`${customer.name} का भुगतान दर्ज करें`}
                  >
                    <FiPlus className="h-4 w-4 shrink-0" />
                    पेमेंट दर्ज करें
                  </button>
                </div>
              </motion.article>
            );
          })
        )}
      </section>

      {/* Floating shortcut for longer lists */}
      <button
        type="button"
        onClick={() => setIsAddCustomerOpen(true)}
        className="fixed bottom-20 right-4 z-30 flex min-h-12 items-center gap-2 rounded-2xl bg-blue-700 px-4 py-3 text-sm font-extrabold text-white shadow-xl shadow-blue-900/25 transition hover:bg-blue-800 active:scale-95 sm:bottom-6 sm:right-6"
      >
        <FiUserPlus className="h-5 w-5" />
        नया ग्राहक
      </button>

      {/* Existing modals and business logic */}
      <AddCustomerModal
        isOpen={isAddCustomerOpen}
        onClose={() => setIsAddCustomerOpen(false)}
      />

      {selectedCustomerForPayment && (
        <PaymentModal
          isOpen={true}
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
