
import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  FiArrowLeft,
  FiPlus,
  FiTrash2,
  FiPrinter,
  FiCheck,
  FiUser,
} from 'react-icons/fi';
import { useKhata } from './KhataContext';
import { useToast } from './ToastContext';
import { BillPrintModal } from './BillPrintModal';
import type { BillItem, Bill } from './database.types';

const createEmptyItem = (): BillItem => ({
  name: '',
  rate: 0,
  quantity: 1,
  unit: 'kg',
  total: 0,
});

export const BillCreate: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedCustomerId = searchParams.get('customerId') || '';

  const { customers, bills, addBill } = useKhata();
  const { showToast } = useToast();

  const [selectedCustomerId, setSelectedCustomerId] =
    useState(preselectedCustomerId);
  const [billDate, setBillDate] = useState(
    new Date().toLocaleDateString('en-CA')
  );
  const [paymentStatus, setPaymentStatus] =
    useState<'pending' | 'paid'>('pending');
  const [items, setItems] = useState<BillItem[]>([createEmptyItem()]);
  const [createdBill, setCreatedBill] = useState<Bill | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const nextBillNumber = useMemo(
    () => `KB-${bills.length + 1001}`,
    [bills.length]
  );

  const currentCustomer = customers.find(
    (customer) => customer.id === selectedCustomerId
  );

  // Only named items count toward the bill total.
  const validItems = useMemo(
    () =>
      items
        .filter((item) => item.name.trim().length > 0)
        .map((item) => {
          const rate = Number(item.rate) || 0;
          const quantity = Number(item.quantity) || 0;

          return {
            ...item,
            name: item.name.trim(),
            rate,
            quantity,
            total: Math.round(rate * quantity * 100) / 100,
          };
        }),
    [items]
  );

  const grandTotal = useMemo(
    () =>
      validItems.reduce(
        (sum, item) => sum + item.total,
        0
      ),
    [validItems]
  );

  const handleItemChange = (
    index: number,
    field: keyof BillItem,
    value: string
  ) => {
    setItems((previous) =>
      previous.map((item, itemIndex) => {
        if (itemIndex !== index) return item;

        const updated = { ...item };

        if (field === 'name' || field === 'unit') {
          updated[field] = value;
        } else if (field === 'rate' || field === 'quantity') {
          const numberValue = value === '' ? 0 : Number(value);
          if (!Number.isFinite(numberValue) || numberValue < 0) {
            return item;
          }

          updated[field] = numberValue;
        }

        updated.total =
          (Number(updated.rate) || 0) *
          (Number(updated.quantity) || 0);

        return updated;
      })
    );
  };

  const handleAddItemRow = () => {
    setItems((previous) => [...previous, createEmptyItem()]);

    showToast('नई सामान पंक्ति जोड़ दी गई', 'success');
  };

  const handleRemoveItemRow = (index: number) => {
    setItems((previous) => {
      if (previous.length === 1) return [createEmptyItem()];
      return previous.filter((_, itemIndex) => itemIndex !== index);
    });
  };

  const handleSaveBill = async (andPrint = false) => {
    if (saving) return;

    if (!selectedCustomerId) {
      showToast('कृपया ग्राहक का चयन करें', 'error');
      return;
    }

    if (!billDate) {
      showToast('कृपया बिल की तारीख चुनें', 'error');
      return;
    }

    if (validItems.length === 0) {
      showToast('कम से कम एक सामान का नाम दर्ज करें', 'error');
      return;
    }

    const invalidItem = validItems.find(
      (item) =>
        !Number.isFinite(item.rate) ||
        !Number.isFinite(item.quantity) ||
        item.rate < 0 ||
        item.quantity <= 0
    );

    if (invalidItem) {
      showToast(
        'हर सामान की दर और मात्रा सही दर्ज करें। मात्रा शून्य से अधिक होनी चाहिए।',
        'error'
      );
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

      showToast(
        `बिल ${newBill.billNumber} सफलतापूर्वक सहेजा गया!`,
        'success'
      );

      if (andPrint) {
        setCreatedBill(newBill);
        setIsPrintModalOpen(true);
      } else {
        navigate(`/customer/${selectedCustomerId}`);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'अज्ञात त्रुटि';

      showToast('बिल सहेजने में त्रुटि: ' + message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-5 pb-28">
      <div className="flex items-center justify-between gap-2 mb-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="min-h-11 px-2 text-sm font-bold text-slate-600 flex items-center gap-2"
        >
          <FiArrowLeft /> वापस
        </button>

        <span className="text-xs font-bold text-slate-500">
          बिल नं: <strong className="text-emerald-700">{nextBillNumber}</strong>
        </span>
      </div>

      <div className="p-3 sm:p-6 bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-bold text-slate-700 mb-2">
              ग्राहक चुनें *
            </label>

            <div className="relative">
              <FiUser className="absolute left-3 top-3.5 text-slate-400" />
              <select
                value={selectedCustomerId}
                onChange={(event) =>
                  setSelectedCustomerId(event.target.value)
                }
                className="w-full min-h-12 pl-10 pr-3 rounded-xl border border-slate-200 text-sm font-semibold"
              >
                <option value="">-- ग्राहक चुनें --</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} ({customer.phone}) — बकाया ₹
                    {Number(customer.runningBalance || 0).toFixed(2)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              बिल की तारीख *
            </label>
            <input
              type="date"
              value={billDate}
              onChange={(event) => setBillDate(event.target.value)}
              className="w-full min-h-12 px-3 rounded-xl border border-slate-200 text-sm"
            />
          </div>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
          <p className="text-sm font-bold text-slate-700 mb-3">
            भुगतान की स्थिति
          </p>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPaymentStatus('pending')}
              className={`min-h-12 rounded-xl px-2 text-sm font-bold ${
                paymentStatus === 'pending'
                  ? 'bg-rose-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-700'
              }`}
            >
              🔴 उधार
            </button>

            <button
              type="button"
              onClick={() => setPaymentStatus('paid')}
              className={`min-h-12 rounded-xl px-2 text-sm font-bold ${
                paymentStatus === 'paid'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-700'
              }`}
            >
              🟢 चुकता
            </button>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between gap-2 mb-3">
            <h3 className="text-sm font-black text-slate-800">
              सामान की सूची
            </h3>
            <span className="text-xs text-slate-500">
              {validItems.length} सामान
            </span>
          </div>

          <div className="space-y-3">
            {items.map((item, index) => (
              <div
                key={index}
                className="p-3 rounded-2xl border border-slate-200 bg-white space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-emerald-700">
                    सामान {index + 1}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleRemoveItemRow(index)}
                    aria-label={`सामान ${index + 1} हटाएँ`}
                    className="min-h-10 min-w-10 flex items-center justify-center rounded-lg text-rose-600 bg-rose-50"
                  >
                    <FiTrash2 />
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    सामान का नाम
                  </label>
                  <input
                    type="text"
                    placeholder="जैसे चीनी, तेल, साबुन"
                    value={item.name}
                    onChange={(event) =>
                      handleItemChange(index, 'name', event.target.value)
                    }
                    className="w-full min-h-11 px-3 rounded-xl border border-slate-200 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      दर (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="0"
                      value={item.rate || ''}
                      onChange={(event) =>
                        handleItemChange(index, 'rate', event.target.value)
                      }
                      className="w-full min-h-11 px-2 rounded-xl border border-slate-200 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      मात्रा
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={item.quantity || ''}
                      onChange={(event) =>
                        handleItemChange(
                          index,
                          'quantity',
                          event.target.value
                        )
                      }
                      className="w-full min-h-11 px-2 rounded-xl border border-slate-200 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      इकाई
                    </label>
                    <select
                      value={item.unit || 'kg'}
                      onChange={(event) =>
                        handleItemChange(index, 'unit', event.target.value)
                      }
                      className="w-full min-h-11 px-2 rounded-xl border border-slate-200 text-sm"
                    >
                      <option value="kg">किलो</option>
                      <option value="gm">ग्राम</option>
                      <option value="pkt">पैकेट</option>
                      <option value="pc">नग</option>
                      <option value="ltr">लीटर</option>
                      <option value="mtr">मीटर</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      कुल (₹)
                    </label>
                    <div className="min-h-11 flex items-center px-2 rounded-xl bg-emerald-50 text-emerald-800 font-black text-sm">
                      ₹{(
                        (Number(item.rate) || 0) *
                        (Number(item.quantity) || 0)
                      ).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleAddItemRow}
            className="mt-3 w-full min-h-12 px-4 rounded-xl border-2 border-dashed border-emerald-500 bg-emerald-50 text-emerald-800 text-sm font-black flex items-center justify-center gap-2"
          >
            <FiPlus /> + सामान जोड़ें
          </button>
        </div>

        <div className="p-4 bg-slate-900 text-white rounded-2xl flex items-center justify-between gap-3">
          <div>
            <span className="block text-xs text-slate-300 font-bold">
              कुल बिल राशि
            </span>
            <span className="text-xs text-slate-400">
              {validItems.length} सामान
            </span>
          </div>
          <span className="text-2xl sm:text-3xl font-black text-emerald-400">
            ₹{grandTotal.toFixed(2)}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSaveBill(false)}
            className="w-full min-h-12 rounded-xl bg-slate-100 text-slate-800 font-black text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <FiCheck className="text-emerald-600" />
            {saving ? 'सहेजा जा रहा है...' : 'बिल सेव करें'}
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={() => handleSaveBill(true)}
            className="w-full min-h-12 rounded-xl bg-emerald-600 text-white font-black text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <FiPrinter />
            {saving ? 'सहेजा जा रहा है...' : 'सेव करें और PDF बनाएँ'}
          </button>
        </div>
      </div>

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
