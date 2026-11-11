import React, { useState, useMemo } from 'react';
import {
  TransactionItem,
  TransactionType,
  getCategoryInfo,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
} from '../types';
import {
  formatRupiah,
  formatIndonesianDate,
  getMonthYearLabel,
} from '../utils/formatters';
import { exportTransactionsToExcel, exportTransactionsToPDF } from '../utils/exportUtils';
import { MonthlyChart } from './MonthlyChart';
import {
  FileSpreadsheet,
  FileText,
  Calendar,
  Filter,
  Download,
  RotateCcw,
  CheckCircle2,
  CalendarRange,
  Layers,
  ChevronRight,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
} from 'lucide-react';

interface ReportsProps {
  transactions: TransactionItem[];
  // Legacy compatibility
  expenses?: TransactionItem[];
}

export const Reports: React.FC<ReportsProps> = ({
  transactions = [],
  expenses = [],
}) => {
  const [typeFilter, setTypeFilter] = useState<'all' | 'expense' | 'income'>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeReportTab, setActiveReportTab] = useState<'daily' | 'monthly' | 'chart'>('daily');
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const allData: TransactionItem[] =
    transactions.length > 0
      ? transactions
      : expenses.map((e) => ({ ...e, type: 'expense' as const }));

  // Filtered transactions based on criteria
  const filteredData = useMemo(() => {
    return allData.filter((item) => {
      // Type match
      if (typeFilter !== 'all' && item.type !== typeFilter) return false;

      // Date match
      if (startDate && item.date < startDate) return false;
      if (endDate && item.date > endDate) return false;

      // Category match
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;

      return true;
    });
  }, [allData, typeFilter, startDate, endDate, selectedCategory]);

  // Aggregated totals
  const periodStats = useMemo(() => {
    let inc = 0;
    let exp = 0;
    filteredData.forEach((t) => {
      if (t.type === 'income') inc += t.amount;
      else exp += t.amount;
    });
    return {
      income: inc,
      expense: exp,
      saldo: inc - exp,
    };
  }, [filteredData]);

  // Daily breakdown with income, expense, and daily saldo
  const dailyBreakdown = useMemo(() => {
    const map: Record<
      string,
      { date: string; income: number; expense: number; saldo: number; count: number; items: TransactionItem[] }
    > = {};

    filteredData.forEach((item) => {
      if (!map[item.date]) {
        map[item.date] = { date: item.date, income: 0, expense: 0, saldo: 0, count: 0, items: [] };
      }
      if (item.type === 'income') {
        map[item.date].income += item.amount;
      } else {
        map[item.date].expense += item.amount;
      }
      map[item.date].saldo = map[item.date].income - map[item.date].expense;
      map[item.date].count += 1;
      map[item.date].items.push(item);
    });

    return Object.values(map).sort((a, b) => b.date.localeCompare(a.date));
  }, [filteredData]);

  // Monthly breakdown with income, expense, and monthly saldo
  const monthlyBreakdown = useMemo(() => {
    const map: Record<
      string,
      { month: string; income: number; expense: number; saldo: number; count: number }
    > = {};

    filteredData.forEach((item) => {
      const ym = item.date.slice(0, 7);
      if (!map[ym]) {
        map[ym] = { month: ym, income: 0, expense: 0, saldo: 0, count: 0 };
      }
      if (item.type === 'income') {
        map[ym].income += item.amount;
      } else {
        map[ym].expense += item.amount;
      }
      map[ym].saldo = map[ym].income - map[ym].expense;
      map[ym].count += 1;
    });

    return Object.values(map).sort((a, b) => b.month.localeCompare(a.month));
  }, [filteredData]);

  const handleResetFilter = () => {
    setTypeFilter('all');
    setStartDate('');
    setEndDate('');
    setSelectedCategory('all');
  };

  const periodLabel = useMemo(() => {
    if (startDate && endDate) {
      return `${formatIndonesianDate(startDate)} s.d. ${formatIndonesianDate(endDate)}`;
    }
    if (startDate) return `Sejak ${formatIndonesianDate(startDate)}`;
    if (endDate) return `Hingga ${formatIndonesianDate(endDate)}`;
    return 'Semua Waktu';
  }, [startDate, endDate]);

  const handleExcelExport = () => {
    if (filteredData.length === 0) {
      alert('Tidak ada data transaksi untuk diekspor pada filter yang dipilih.');
      return;
    }
    exportTransactionsToExcel(filteredData, 'Laporan_Keuangan_Catatan_Harian', periodLabel);
    setExportNotice('Laporan Excel (.xlsx) berhasil diunduh!');
    setTimeout(() => setExportNotice(null), 3000);
  };

  const handlePdfExport = () => {
    if (filteredData.length === 0) {
      alert('Tidak ada data transaksi untuk diekspor pada filter yang dipilih.');
      return;
    }
    exportTransactionsToPDF(filteredData, 'Laporan Arus Keuangan & Saldo', periodLabel);
    setExportNotice('Laporan PDF (.pdf) berhasil diunduh!');
    setTimeout(() => setExportNotice(null), 3000);
  };

  // Category options
  const categoryOptions = useMemo(() => {
    if (typeFilter === 'income') {
      return Object.entries(INCOME_CATEGORIES).map(([k, v]) => ({ key: k, label: v.label }));
    }
    if (typeFilter === 'expense') {
      return Object.entries(EXPENSE_CATEGORIES).map(([k, v]) => ({ key: k, label: v.label }));
    }
    return [
      ...Object.entries(INCOME_CATEGORIES).map(([k, v]) => ({
        key: k,
        label: `[Masuk] ${v.label}`,
      })),
      ...Object.entries(EXPENSE_CATEGORIES).map(([k, v]) => ({
        key: k,
        label: `[Keluar] ${v.label}`,
      })),
    ];
  }, [typeFilter]);

  return (
    <div className="space-y-6">
      {/* Header & Export Actions */}
      <div className="bg-white rounded-2xl border border-emerald-100 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-800" />
              Rekap Arus Kas & Laporan Saldo
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Pantau rekapitulasi harian & bulanan, filter periode, dan ekspor ke format Excel / PDF
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleExcelExport}
              disabled={filteredData.length === 0}
              className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-xs disabled:opacity-40"
            >
              <Download className="w-4 h-4" />
              Ekspor ke Excel (.xlsx)
            </button>
            <button
              type="button"
              onClick={handlePdfExport}
              disabled={filteredData.length === 0}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 active:scale-95 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-xs disabled:opacity-40"
            >
              <FileText className="w-4 h-4 text-emerald-300" />
              Ekspor ke PDF (.pdf)
            </button>
          </div>
        </div>

        {exportNotice && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 font-semibold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {exportNotice}
          </div>
        )}

        {/* Filter Section */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-emerald-700" />
              Filter & Periode Laporan
            </span>
            {(startDate || endDate || selectedCategory !== 'all' || typeFilter !== 'all') && (
              <button
                type="button"
                onClick={handleResetFilter}
                className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                Reset Filter
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {/* Tipe Transaksi */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Tipe Transaksi
              </label>
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value as any);
                  setSelectedCategory('all');
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                <option value="all">Semua (Pemasukan & Pengeluaran)</option>
                <option value="income">Hanya Pemasukan (+)</option>
                <option value="expense">Hanya Pengeluaran (-)</option>
              </select>
            </div>

            {/* Dari Tanggal */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Dari Tanggal
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            {/* Sampai Tanggal */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Sampai Tanggal
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            {/* Kategori Filter */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Kategori
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                <option value="all">Semua Kategori</option>
                {categoryOptions.map((opt) => (
                  <option key={opt.key} value={opt.key}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Financial Flow Period Summary Bar */}
        <div className="mt-5 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
            <span className="text-[11px] text-emerald-800 font-bold flex items-center gap-1">
              <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-700" />
              Total Pemasukan Periode Ini
            </span>
            <p className="text-lg font-black text-emerald-950 mt-1">
              +{formatRupiah(periodStats.income)}
            </p>
          </div>

          <div className="p-3 bg-red-50 rounded-xl border border-red-100">
            <span className="text-[11px] text-red-800 font-bold flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5 text-red-600" />
              Total Pengeluaran Periode Ini
            </span>
            <p className="text-lg font-black text-red-950 mt-1">
              -{formatRupiah(periodStats.expense)}
            </p>
          </div>

          <div className="p-3 bg-emerald-900 text-white rounded-xl shadow-xs">
            <span className="text-[11px] text-emerald-200 font-bold flex items-center gap-1">
              <Wallet className="w-3.5 h-3.5 text-emerald-300" />
              Sisa Saldo Bersih Periode Ini
            </span>
            <p
              className={`text-lg font-black mt-1 ${
                periodStats.saldo >= 0 ? 'text-white' : 'text-amber-300'
              }`}
            >
              {formatRupiah(periodStats.saldo)}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs: Daily vs Monthly vs Chart */}
      <div className="bg-white rounded-2xl border border-emerald-100 p-6 shadow-xs">
        <div className="flex border-b border-slate-100 pb-3 mb-6 gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveReportTab('daily')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeReportTab === 'daily'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Rekap Harian & Saldo
          </button>
          <button
            type="button"
            onClick={() => setActiveReportTab('monthly')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeReportTab === 'monthly'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <CalendarRange className="w-3.5 h-3.5" />
            Rekap Bulanan & Saldo
          </button>
          <button
            type="button"
            onClick={() => setActiveReportTab('chart')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeReportTab === 'chart'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Grafik Periode Terpilih
          </button>
        </div>

        {/* Tab 1: Daily Breakdown */}
        {activeReportTab === 'daily' && (
          <div>
            {dailyBreakdown.length === 0 ? (
              <p className="text-center py-10 text-xs text-slate-400">
                Tidak ada data transaksi untuk periode harian yang dipilih.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {dailyBreakdown.map((group) => (
                  <div key={group.date} className="py-4 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          {formatIndonesianDate(group.date, true)}
                        </span>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                          {group.count} transaksi
                        </span>
                      </div>

                      {/* Daily flow */}
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-emerald-700 font-bold">
                          +{formatRupiah(group.income)}
                        </span>
                        <span className="text-red-600 font-bold">
                          -{formatRupiah(group.expense)}
                        </span>
                        <span
                          className={`font-black pl-2 border-l border-slate-200 ${
                            group.saldo >= 0 ? 'text-emerald-900' : 'text-amber-700'
                          }`}
                        >
                          Saldo: {formatRupiah(group.saldo)}
                        </span>
                      </div>
                    </div>

                    {/* Breakdown items */}
                    <div className="bg-slate-50/70 rounded-xl p-3 space-y-1.5 border border-slate-100">
                      {group.items.map((item) => {
                        const isInc = item.type === 'income';
                        const cat = getCategoryInfo(item.type, item.category);

                        return (
                          <div
                            key={item.id}
                            className="flex items-center justify-between text-xs text-slate-700"
                          >
                            <div className="flex items-center gap-2 truncate mr-3">
                              <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: cat.color }}
                              />
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                  isInc ? 'bg-emerald-100 text-emerald-800' : 'bg-red-50 text-red-700'
                                }`}
                              >
                                {isInc ? 'Masuk' : 'Keluar'}
                              </span>
                              <span className="truncate">{item.description}</span>
                              <span className="text-[10px] text-slate-400">({cat.label})</span>
                            </div>
                            <span
                              className={`font-bold shrink-0 ${
                                isInc ? 'text-emerald-700' : 'text-red-600'
                              }`}
                            >
                              {isInc ? '+' : '-'}
                              {formatRupiah(item.amount)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Monthly Breakdown */}
        {activeReportTab === 'monthly' && (
          <div>
            {monthlyBreakdown.length === 0 ? (
              <p className="text-center py-10 text-xs text-slate-400">
                Tidak ada data transaksi untuk periode bulanan yang dipilih.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {monthlyBreakdown.map((m) => (
                  <div
                    key={m.month}
                    className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:border-emerald-300 transition-all space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        {getMonthYearLabel(m.month)}
                      </span>
                      <span className="text-[11px] text-slate-400">{m.count} transaksi</span>
                    </div>

                    <div className="space-y-1 text-xs pt-1 border-t border-slate-200/80">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Pemasukan:</span>
                        <span className="font-bold text-emerald-700">+{formatRupiah(m.income)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Pengeluaran:</span>
                        <span className="font-bold text-red-600">-{formatRupiah(m.expense)}</span>
                      </div>
                      <div className="flex justify-between font-black pt-1 border-t border-slate-200 text-sm">
                        <span className="text-slate-700">Saldo Bersih:</span>
                        <span className={m.saldo >= 0 ? 'text-emerald-900' : 'text-amber-700'}>
                          {formatRupiah(m.saldo)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Chart on Filtered Data */}
        {activeReportTab === 'chart' && (
          <div>
            <MonthlyChart transactions={filteredData} />
          </div>
        )}
      </div>
    </div>
  );
};
