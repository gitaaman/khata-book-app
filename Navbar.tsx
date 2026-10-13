import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useKhata } from './KhataContext';
import { FiBook, FiSettings, FiFolder, FiPlusCircle } from 'react-icons/fi';

export const Navbar: React.FC<{ onOpenAddCustomer?: () => void }> = ({ onOpenAddCustomer }) => {
  const { shop, customers } = useKhata();
  const location = useLocation();

  if (!shop) return null;

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Left: Brand & Shop Info */}
        <Link to="/" className="flex items-center gap-2.5 text-slate-900 group">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <FiBook className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-base text-slate-900 leading-tight">
                {shop.shopName}
              </span>
              <span className="text-[10px] font-extrabold bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200 flex items-center gap-0.5">
                <FiFolder className="w-2.5 h-2.5" /> {shop.folderName || 'Khata'}
              </span>
            </div>
            <p className="text-[11px] font-semibold text-slate-500">
              दुकानदार: {shop.ownerName} • {customers.length} ग्राहक
            </p>
          </div>
        </Link>

        {/* Right: Quick Actions */}
        <div className="flex items-center gap-2">
          {onOpenAddCustomer && (
            <button
              onClick={onOpenAddCustomer}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
            >
              <FiPlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">ग्राहक जोड़ें</span>
            </button>
          )}

          <Link
            to="/settings"
            className={`p-2 rounded-xl transition-all ${
              location.pathname === '/settings'
                ? 'bg-blue-50 text-blue-600'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
            }`}
            title="सेटिंग्स (Settings)"
          >
            <FiSettings className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </header>
  );
};
