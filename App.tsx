import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { KhataProvider, useKhata } from './KhataContext';
import { ToastProvider } from './ToastContext';
import { Navbar } from './Navbar';
import { Onboarding } from './Onboarding';
import { Dashboard } from './Dashboard';
import { CustomerDetail } from './CustomerDetail';
import { BillCreate } from './BillCreate';
import { Settings } from './Settings';

const AppRoutes: React.FC = () => {
  const { isOnboarded, loading } = useKhata();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold text-slate-500">खाता लोड हो रहा है...</p>
        </div>
      </div>
    );
  }

  if (!isOnboarded) {
    return (
      <Routes>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <main className="grow">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/customer/:id" element={<CustomerDetail />} />
          <Route path="/bill/new" element={<BillCreate />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <KhataProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </KhataProvider>
    </ToastProvider>
  );
};

export default App;
