
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useKhata } from './KhataContext';
import {
  FiBook,
  FiSettings,
  FiFolder,
  FiPlusCircle,
} from 'react-icons/fi';

export const Navbar: React.FC<{
  onOpenAddCustomer?: () => void;
}> = ({ onOpenAddCustomer }) => {
  const { shop, customers } = useKhata();
  const location = useLocation();

  if (!shop) return null;

  const isSettings = location.pathname === '/settings';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-emerald-100 bg-white/95 shadow-sm backdrop-blur-md">
      <div className="mx-auto flex min-h-[76px] w-full max-w-5xl items-center justify-between gap-3 px-3 py-3 sm:px-5">
        {/* Shop brand */}
        <Link
          to="/"
          aria-label={`${shop.shopName}, होम पेज`}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-800 text-white shadow-sm">
            <FiBook className="h-6 w-6" />
          </span>

          <span className="min-w-0 flex-1">
            <span className="block truncate text-base font-extrabold leading-6 text-emerald-950 sm:text-lg">
              {shop.shopName || 'खाता बुक'}
            </span>

            <span className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-slate-500">
              {shop.ownerName && (
                <span className="max-w-full truncate">
                  दुकानदार: {shop.ownerName}
                </span>
              )}

              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 font-bold text-emerald-800">
                <FiUsersIcon />
                {customers.length} ग्राहक
              </span>
            </span>
          </span>
        </Link>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-2">
          {onOpenAddCustomer && (
            <button
              type="button"
              onClick={onOpenAddCustomer}
              aria-label="नया ग्राहक जोड़ें"
              className="flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-xl bg-emerald-800 px-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-900 active:scale-95"
            >
              <FiPlusCircle className="h-5 w-5" />
              <span className="hidden sm:inline">ग्राहक जोड़ें</span>
            </button>
          )}

          <Link
            to="/settings"
            aria-label="सेटिंग्स खोलें"
            aria-current={isSettings ? 'page' : undefined}
            className={`flex h-11 w-11 items-center justify-center rounded-xl transition active:scale-95 ${
              isSettings
                ? 'bg-emerald-100 text-emerald-900'
                : 'text-emerald-800 hover:bg-emerald-50'
            }`}
          >
            <FiSettings className="h-6 w-6" />
          </Link>
        </div>
      </div>
    </header>
  );
};

const FiUsersIcon = () => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-3.5 w-3.5"
  >
    <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="10" cy="7" r="4" />
    <path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
