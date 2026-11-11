import React, { useMemo } from 'react';
import { TransactionItem, getCategoryInfo, FinancialSummary } from '../types';
import {
  formatRupiah,
  formatIndonesianDate,
  getTodayDateString,
  getMonthYearLabel,
} from '../utils/formatters';
import { MonthlyChart } from './MonthlyChart';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  CalendarDays,
  PlusCircle,
  FileSpreadsheet,
  ArrowRight,
  ArrowUpRight,
  ArrowDownLeft,
  Sparkles,
  ShieldCheck,
  CreditCard,
  Hash,
} from 'lucide-react';

interface DashboardProps {
  transactions: TransactionItem[];
  onNavigateTab: (tab: 'dashboard' | 'input' | 'riwayat' | 'laporan' | 'backup') => void;
  onOpenInputWithType: (type: 'expense' | 'income') => void;
  onEditTransaction: (item: TransactionItem) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  transactions,
  onNavigateTab,
  onOpenInputWithType,
  onEditTransaction,
}) => {
  const todayStr = getTodayDateString();
  const currentMonthStr = todayStr.slice(0, 7); // YYYY-MM

  // Compute comprehensive financial summary
  const summary: FinancialSummary = useMemo(() => {
    let totalInc = 0;
    let monthInc = 0;
    let todayInc = 0;
    let incCount = 0;

    let totalExp = 0;
    let monthExp = 0;
    let todayExp = 0;
    let expCount = 0;

    transactions.forEach((item) => {
      const isToday = item.date === todayStr;
      const isThisMonth = item.date.startsWith(currentMonthStr);

      if (item.type === 'income') {
        totalInc += item.amount;
        incCount++;
        if (isToday) todayInc += item.amount;
        if (isThisMonth) monthInc += item.amount;
      } else {
        totalExp += item.amount;
        expCount++;
        if (isToday) todayExp += item.amount;
        if (isThisMonth) monthExp += item.amount;
      }
    });

    return {
      totalBalance: totalInc - totalExp,
      todayBalance: todayInc - todayExp,
      monthBalance: monthInc - monthExp,
      totalIncome: totalInc,
      monthIncome: monthInc,
      todayIncome: todayInc,
      incomeCount: incCount,
      totalExpense: totalExp,
      monthExpense: monthExp,
      todayExpense: todayExp,
      expenseCount: expCount,
      totalTransactions: transactions.length,
    };
  }, [transactions, todayStr, currentMonthStr]);

  const recentTransactions = useMemo(() => {
    return transactions.slice(0, 6);
  }, [transactions]);

  const isSurplus = summary.totalBalance >= 0;

  return (
    <div className="space-y-6">
      {/* Hero Financial Banner - Focusing on Total Saldo */}
      <div className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-800 text-white rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-700/60 text-emerald-200 border border-emerald-600/40">
              <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
              Sistem Manajemen Keuangan Terpadu
            </span>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                isSurplus
                  ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-400/30'
                  : 'bg-red-500/30 text-red-200 border border-red-400/40'
              }`}
            >
              {isSurplus ? '● Status Saldo Surplus' : '● Status Saldo Defisit'}
            </span>
          </div>

          {/* Sisa Saldo Display */}
          <div className="mt-2">
            <p className="text-xs uppercase tracking-wider text-emerald-200 font-bold">
              Total Saldo Keuangan Saat Ini
            </p>
            <div className="flex items-baseline gap-3 mt-1 flex-wrap">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white">
                {formatRupiah(summary.totalBalance)}
              </h1>
            </div>
            <p className="text-emerald-100/90 text-xs sm:text-sm mt-2 leading-relaxed">
              Arus kas bersih dari akumulasi{' '}
              <strong className="text-emerald-300">+{formatRupiah(summary.totalIncome)}</strong>{' '}
              pemasukan dan{' '}
              <strong className="text-red-300">-{formatRupiah(summary.totalExpense)}</strong>{' '}
              pengeluaran.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 mt-6">
            <button
              type="button"
              onClick={() => onOpenInputWithType('income')}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-emerald-950 font-bold text-xs transition-all flex items-center gap-2 shadow-sm"
            >
              <ArrowDownLeft className="w-4 h-4 text-emerald-950" />
              + Catat Pemasukan
            </button>

            <button
              type="button"
              onClick={() => onOpenInputWithType('expense')}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-emerald-50 active:scale-95 text-slate-900 font-bold text-xs transition-all flex items-center gap-2 shadow-sm"
            >
              <ArrowUpRight className="w-4 h-4 text-red-600" />
              - Catat Pengeluaran
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('laporan')}
              className="px-4 py-2.5 rounded-xl bg-emerald-800/80 hover:bg-emerald-700/80 text-white border border-emerald-600/40 text-xs font-semibold transition-all flex items-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
              Laporan & Rekap Saldo
            </button>
          </div>
        </div>

        {/* Ambient Decorative Shapes */}
        <div className="absolute right-[-40px] top-[-40px] w-64 h-64 rounded-full bg-emerald-500/15 blur-2xl pointer-events-none" />
        <div className="absolute right-20 bottom-[-20px] w-48 h-48 rounded-full bg-emerald-400/10 blur-xl pointer-events-none" />
      </div>

      {/* 4 Financial Indicator Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Pemasukan Bulan Ini */}
        <div className="bg-white rounded-2xl p-5 border border-emerald-100/90 shadow-xs hover:border-emerald-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Pemasukan Bulan Ini
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <ArrowDownLeft className="w-5 h-5 text-emerald-700" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xl sm:text-2xl font-black text-emerald-800">
              +{formatRupiah(summary.monthIncome)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Hari ini: +{formatRupiah(summary.todayIncome)}
            </p>
          </div>
        </div>

        {/* Card 2: Pengeluaran Bulan Ini */}
        <div className="bg-white rounded-2xl p-5 border border-emerald-100/90 shadow-xs hover:border-red-200 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Pengeluaran Bulan Ini
            </span>
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xl sm:text-2xl font-black text-red-600">
              -{formatRupiah(summary.monthExpense)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Hari ini: -{formatRupiah(summary.todayExpense)}
            </p>
          </div>
        </div>

        {/* Card 3: Saldo Bersih Bulan Ini */}
        <div className="bg-white rounded-2xl p-5 border border-emerald-100/90 shadow-xs hover:border-emerald-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Saldo Bersih Bulan Ini
            </span>
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                summary.monthBalance >= 0
                  ? 'bg-emerald-900 text-white'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <p
              className={`text-xl sm:text-2xl font-black ${
                summary.monthBalance >= 0 ? 'text-emerald-950' : 'text-amber-600'
              }`}
            >
              {formatRupiah(summary.monthBalance)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Periode {getMonthYearLabel(currentMonthStr)}
            </p>
          </div>
        </div>

        {/* Card 4: Total Seluruh Transaksi */}
        <div className="bg-white rounded-2xl p-5 border border-emerald-100/90 shadow-xs hover:border-emerald-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Aktivitas Transaksi
            </span>
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Hash className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xl sm:text-2xl font-black text-slate-900">
              {summary.totalTransactions}{' '}
              <span className="text-xs font-normal text-slate-500">transaksi</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              {summary.incomeCount} Pemasukan • {summary.expenseCount} Pengeluaran
            </p>
          </div>
        </div>
      </div>

      {/* Cashflow & Saldo Monthly Chart */}
      <MonthlyChart transactions={transactions} />

      {/* Recent Transactions & Side Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions List (2 columns on lg) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-emerald-100 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Transaksi Keuangan Terkini</h3>
              <p className="text-xs text-slate-500">Pemasukan dan pengeluaran terbaru yang tercatat</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('riwayat')}
              className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 transition-colors"
            >
              Lihat Semua
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentTransactions.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <Wallet className="w-8 h-8 mx-auto mb-2 opacity-40 text-emerald-800" />
              Belum ada transaksi yang tercatat. Mulai dengan mencatat pemasukan atau pengeluaran pertama Anda.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentTransactions.map((item) => {
                const isInc = item.type === 'income';
                const cat = getCategoryInfo(item.type, item.category);

                return (
                  <div
                    key={item.id}
                    className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/70 px-2 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          isInc ? 'bg-emerald-100 text-emerald-700' : 'bg-red-50 text-red-600'
                        }`}
                      >
                        {isInc ? (
                          <ArrowDownLeft className="w-5 h-5" />
                        ) : (
                          <ArrowUpRight className="w-5 h-5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {item.description}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-slate-500">
                            {formatIndonesianDate(item.date)}
                          </span>
                          <span className="text-[10px] text-slate-300">•</span>
                          <span
                            className="text-[11px] font-semibold"
                            style={{ color: cat.color }}
                          >
                            {cat.label}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p
                        className={`text-xs sm:text-sm font-black ${
                          isInc ? 'text-emerald-700' : 'text-red-600'
                        }`}
                      >
                        {isInc ? '+' : '-'}
                        {formatRupiah(item.amount)}
                      </p>
                      <button
                        type="button"
                        onClick={() => onEditTransaction(item)}
                        className="text-[11px] text-slate-400 hover:text-emerald-700 font-medium transition-colors"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Side Summary & Cashflow Health Widget */}
        <div className="space-y-4">
          <div className="bg-emerald-950 text-white rounded-2xl p-5 shadow-xs">
            <h4 className="text-sm font-bold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Kesehatan Arus Keuangan
            </h4>
            <div className="mt-3 space-y-2.5 text-xs text-emerald-100">
              <div className="flex justify-between items-center py-1.5 border-b border-emerald-900">
                <span className="text-emerald-300">Total Pemasukan:</span>
                <span className="font-bold text-white">+{formatRupiah(summary.totalIncome)}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-emerald-900">
                <span className="text-emerald-300">Total Pengeluaran:</span>
                <span className="font-bold text-white">-{formatRupiah(summary.totalExpense)}</span>
              </div>
              <div className="flex justify-between items-center pt-1.5 text-sm font-extrabold">
                <span>Sisa Saldo Bersih:</span>
                <span className={summary.totalBalance >= 0 ? 'text-emerald-400' : 'text-amber-400'}>
                  {formatRupiah(summary.totalBalance)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-emerald-100 p-5 shadow-xs text-xs space-y-2.5">
            <h4 className="font-bold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-700" />
              Kelola Saldo Anda
            </h4>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Setiap kali Anda menerima gaji, honor, atau keuntungan usaha, langsung catat sebagai <strong>Pemasukan</strong> agar saldo terhitung secara akurat dan transparan.
            </p>
            <div className="pt-2 border-t border-slate-100 flex gap-2">
              <button
                type="button"
                onClick={() => onOpenInputWithType('income')}
                className="flex-1 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl text-center transition-colors text-[11px]"
              >
                + Tambah Saldo
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab('backup')}
                className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl text-center transition-colors text-[11px]"
              >
                Cadangkan
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
