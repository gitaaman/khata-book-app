import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { ShopProfile, Customer, Bill, PaymentEntry } from './database.types';
import * as db from './offlineDb';
import { downloadBackupFile } from './utils/backupFile';
interface KhataContextType {
  shop: ShopProfile | null;
  customers: Customer[];
  bills: Bill[];
  payments: PaymentEntry[];
  loading: boolean;
  isOnboarded: boolean;
  createShop: (shopData: Omit<ShopProfile, 'createdAt'>) => Promise<void>;
  updateShop: (shopData: Partial<ShopProfile>) => Promise<void>;
  addCustomer: (data: Omit<Customer, 'id' | 'runningBalance' | 'createdAt'>) => Promise<Customer>;
  updateCustomer: (customer: Customer) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  addBill: (billData: Omit<Bill, 'id' | 'createdAt'>) => Promise<Bill>;
  deleteBill: (id: string) => Promise<void>;
  addPayment: (paymentData: Omit<PaymentEntry, 'id' | 'createdAt'>) => Promise<PaymentEntry>;
  deletePayment: (id: string) => Promise<void>;
  exportBackup: () => Promise<string>;
  importBackup: (jsonString: string) => Promise<boolean>;
  refreshData: () => Promise<void>;
}

const KhataContext = createContext<KhataContextType | undefined>(undefined);

export const KhataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [shop, setShop] = useState<ShopProfile | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [payments, setPayments] = useState<PaymentEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshData = async () => {
    try {
      const [shopData, custList, billList, payList] = await Promise.all([
        db.getShopProfile(),
        db.getCustomers(),
        db.getBills(),
        db.getPayments(),
      ]);

      setShop(shopData);
      setCustomers(custList);
      setBills(billList);
      setPayments(payList);

      if (shopData?.theme) {
        document.documentElement.setAttribute('data-theme', shopData.theme);
      }
    } catch (err) {
      console.error('Failed to load offline Khata data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const createShop = async (shopData: Omit<ShopProfile, 'createdAt'>) => {
    const fullProfile: ShopProfile = {
      ...shopData,
      theme: shopData.theme || 'royal-blue',
      folderName: shopData.folderName || shopData.shopName.replace(/\s+/g, '_'),
      createdAt: new Date().toISOString(),
    };
    await db.saveShopProfile(fullProfile);
    setShop(fullProfile);
    document.documentElement.setAttribute('data-theme', fullProfile.theme || 'royal-blue');
  };

  const updateShop = async (shopData: Partial<ShopProfile>) => {
    if (!shop) return;
    const updated: ShopProfile = {
      ...shop,
      ...shopData,
      updatedAt: new Date().toISOString(),
    };
    await db.saveShopProfile(updated);
    setShop(updated);
    if (updated.theme) {
      document.documentElement.setAttribute('data-theme', updated.theme);
    }
  };

  const addCustomer = async (data: Omit<Customer, 'id' | 'runningBalance' | 'createdAt'>): Promise<Customer> => {
    const newCust: Customer = {
      ...data,
      id: 'cust_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      runningBalance: 0,
      createdAt: new Date().toISOString(),
    };
    await db.saveCustomer(newCust);
    setCustomers((prev) => [...prev, newCust]);
    return newCust;
  };

  const updateCustomer = async (customer: Customer) => {
    const updated = { ...customer, updatedAt: new Date().toISOString() };
    await db.saveCustomer(updated);
    setCustomers((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  const deleteCustomer = async (id: string) => {
    await db.deleteCustomer(id);
    setCustomers((prev) => prev.filter((c) => c.id !== id));
  };

  const addBill = async (billData: Omit<Bill, 'id' | 'createdAt'>): Promise<Bill> => {
    const newBill: Bill = {
      ...billData,
      id: 'bill_' + Date.now(),
      createdAt: new Date().toISOString(),
    };

    await db.saveBill(newBill);
    setBills((prev) => [...prev, newBill]);

    // Recalculate customer running balance
    // If pending, customer balance increases (+ udhar)
    if (newBill.paymentStatus === 'pending') {
      const cust = customers.find((c) => c.id === newBill.customerId);
      if (cust) {
        const updatedCust: Customer = {
          ...cust,
          runningBalance: cust.runningBalance + newBill.totalAmount,
          updatedAt: new Date().toISOString(),
        };
        await db.saveCustomer(updatedCust);
        setCustomers((prev) => prev.map((c) => (c.id === updatedCust.id ? updatedCust : c)));
      }
    }

    return newBill;
  };

  const deleteBill = async (id: string) => {
    const target = bills.find((b) => b.id === id);
    await db.deleteBill(id);
    setBills((prev) => prev.filter((b) => b.id !== id));

    // Reverse customer balance impact if was pending
    if (target && target.paymentStatus === 'pending') {
      const cust = customers.find((c) => c.id === target.customerId);
      if (cust) {
        const updatedCust: Customer = {
          ...cust,
          runningBalance: Math.max(0, cust.runningBalance - target.totalAmount),
          updatedAt: new Date().toISOString(),
        };
        await db.saveCustomer(updatedCust);
        setCustomers((prev) => prev.map((c) => (c.id === updatedCust.id ? updatedCust : c)));
      }
    }
  };

  const addPayment = async (paymentData: Omit<PaymentEntry, 'id' | 'createdAt'>): Promise<PaymentEntry> => {
    const newPayment: PaymentEntry = {
      ...paymentData,
      id: 'pay_' + Date.now(),
      createdAt: new Date().toISOString(),
    };

    await db.savePayment(newPayment);
    setPayments((prev) => [...prev, newPayment]);

    // Adjust customer balance
    // payment_received reduces customer balance (- udhar)
    // credit_given increases customer balance (+ udhar)
    const cust = customers.find((c) => c.id === newPayment.customerId);
    if (cust) {
      const delta = newPayment.type === 'payment_received' ? -newPayment.amount : newPayment.amount;
      const updatedCust: Customer = {
        ...cust,
        runningBalance: cust.runningBalance + delta,
        updatedAt: new Date().toISOString(),
      };
      await db.saveCustomer(updatedCust);
      setCustomers((prev) => prev.map((c) => (c.id === updatedCust.id ? updatedCust : c)));
    }

    return newPayment;
  };

  const deletePayment = async (id: string) => {
    const target = payments.find((p) => p.id === id);
    await db.deletePayment(id);
    setPayments((prev) => prev.filter((p) => p.id !== id));

    // Reverse balance adjustment
    if (target) {
      const cust = customers.find((c) => c.id === target.customerId);
      if (cust) {
        const delta = target.type === 'payment_received' ? target.amount : -target.amount;
        const updatedCust: Customer = {
          ...cust,
          runningBalance: cust.runningBalance + delta,
          updatedAt: new Date().toISOString(),
        };
        await db.saveCustomer(updatedCust);
        setCustomers((prev) => prev.map((c) => (c.id === updatedCust.id ? updatedCust : c)));
      }
    }
  };

  const exportBackup = async (): Promise<string> => {
    return await db.exportCompleteBackup();
  };

  const importBackup = async (jsonString: string): Promise<boolean> => {
    setLoading(true);
    try {
      const success = await db.importCompleteBackup(jsonString);
      await refreshData();
      return success;
    } finally {
      setLoading(false);
    }
  };

  return (
    <KhataContext.Provider
      value={{
        shop,
        customers,
        bills,
        payments,
        loading,
        isOnboarded: !!shop,
        createShop,
        updateShop,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        addBill,
        deleteBill,
        addPayment,
        deletePayment,
        exportBackup,
        importBackup,
        refreshData,
      }}
    >
      {children}
    </KhataContext.Provider>
  );
};

export const useKhata = () => {
  const context = useContext(KhataContext);
  if (!context) throw new Error('useKhata must be used within KhataProvider');
  return context;
};
