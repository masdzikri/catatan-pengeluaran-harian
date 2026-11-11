import React from 'react';
import { User } from 'firebase/auth';
import { formatRupiah } from '../utils/formatters';
import {
  Wallet,
  LayoutDashboard,
  PlusCircle,
  Receipt,
  FileSpreadsheet,
  Database,
  LogIn,
  LogOut,
  User as UserIcon,
} from 'lucide-react';

interface NavbarProps {
  currentTab: 'dashboard' | 'input' | 'riwayat' | 'laporan' | 'backup';
  onSelectTab: (tab: 'dashboard' | 'input' | 'riwayat' | 'laporan' | 'backup') => void;
  currentUser: User | null;
  onSignIn: () => void;
  onSignOut: () => void;
  isAuthenticating: boolean;
  totalBalance: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  currentUser,
  onSignIn,
  onSignOut,
  isAuthenticating,
  totalBalance,
}) => {
  const navItems = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'input', label: 'Input Transaksi', icon: PlusCircle },
    { key: 'riwayat', label: 'Riwayat Transaksi', icon: Receipt },
    { key: 'laporan', label: 'Rekap & Saldo', icon: FileSpreadsheet },
    { key: 'backup', label: 'Cadangan & Panduan', icon: Database },
  ] as const;

  const isSurplus = totalBalance >= 0;

  return (
    <header className="sticky top-0 z-40 bg-emerald-950 text-white shadow-md border-b border-emerald-900/60">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div
            onClick={() => onSelectTab('dashboard')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-extrabold tracking-tight text-white block leading-tight">
                Catatan Pengeluaran & Saldo
              </span>
              <span className="text-[10px] text-emerald-300 font-medium block">
                Pencatatan Keuangan Digital Real-Time
              </span>
            </div>
          </div>

          {/* User Profile & Saldo Badge */}
          <div className="flex items-center gap-3">
            {/* Net Balance Quick Badge (Desktop) */}
            <div
              onClick={() => onSelectTab('dashboard')}
              className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs cursor-pointer transition-all ${
                isSurplus
                  ? 'bg-emerald-900/80 border-emerald-700/80 hover:bg-emerald-800'
                  : 'bg-red-950/80 border-red-800 hover:bg-red-900'
              }`}
              title="Total Saldo Saat Ini"
            >
              <span className="text-emerald-300 text-[11px] font-medium">Saldo:</span>
              <span
                className={`font-black ${
                  isSurplus ? 'text-emerald-300' : 'text-red-300'
                }`}
              >
                {formatRupiah(totalBalance)}
              </span>
            </div>

            {currentUser ? (
              <div className="flex items-center gap-2.5 bg-emerald-900/60 pl-2 pr-3 py-1 rounded-full border border-emerald-800/80">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'Pengguna'}
                    className="w-7 h-7 rounded-full border border-emerald-400 object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-emerald-700 flex items-center justify-center text-white text-xs">
                    <UserIcon className="w-3.5 h-3.5" />
                  </div>
                )}
                <div className="hidden sm:block text-left">
                  <p className="text-[11px] font-bold text-white leading-tight truncate max-w-[120px]">
                    {currentUser.displayName || 'Pengguna'}
                  </p>
                  <p className="text-[9px] text-emerald-300 leading-tight">Terhubung</p>
                </div>
                <button
                  type="button"
                  onClick={onSignOut}
                  className="p-1.5 text-emerald-300 hover:text-white hover:bg-emerald-800 rounded-full transition-colors"
                  title="Keluar akun"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onSignIn}
                disabled={isAuthenticating}
                className="px-3.5 py-1.5 rounded-xl bg-white text-emerald-950 hover:bg-emerald-50 text-xs font-bold transition-all flex items-center gap-2 shadow-xs active:scale-95 disabled:opacity-50"
              >
                <LogIn className="w-3.5 h-3.5 text-emerald-700" />
                {isAuthenticating ? 'Menghubungkan...' : 'Masuk Google'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Navigation Tabs */}
      <div className="hidden md:block bg-emerald-900/90 border-t border-emerald-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 py-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => onSelectTab(item.key)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                    isActive
                      ? 'bg-white text-emerald-950 font-bold shadow-xs'
                      : 'text-emerald-200 hover:text-white hover:bg-emerald-800/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-700' : ''}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Mobile Bottom Fixed Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-emerald-950/95 backdrop-blur-md border-t border-emerald-900 px-2 py-2 flex justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onSelectTab(item.key)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[10px] font-medium transition-all ${
                isActive ? 'text-white font-bold bg-emerald-800/80' : 'text-emerald-300 hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 mb-0.5 ${isActive ? 'text-emerald-300' : ''}`} />
              <span className="truncate max-w-[65px]">{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
