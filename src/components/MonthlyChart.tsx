import React, { useState } from 'react';
import { TransactionItem, getCategoryInfo, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../types';
import { formatRupiah, getMonthYearLabel } from '../utils/formatters';
import { BarChart3, PieChart, TrendingDown, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

interface MonthlyChartProps {
  transactions: TransactionItem[];
  expenses?: TransactionItem[]; // Backward compatibility
}

export const MonthlyChart: React.FC<MonthlyChartProps> = ({
  transactions = [],
  expenses = [],
}) => {
  const [viewMode, setViewMode] = useState<'months' | 'expense_cats' | 'income_cats'>('months');
  const [activeMonth, setActiveMonth] = useState<string | null>(null);

  // Combine if legacy expenses provided without transactions
  const allData: TransactionItem[] =
    transactions.length > 0
      ? transactions
      : expenses.map((e) => ({ ...e, type: 'expense' as const }));

  // Group by Month (YYYY-MM) with Income, Expense, and Saldo
  const monthlyDataMap: Record<
    string,
    { income: number; expense: number; saldo: number; count: number }
  > = {};

  allData.forEach((item) => {
    const ym = item.date.slice(0, 7);
    if (!monthlyDataMap[ym]) {
      monthlyDataMap[ym] = { income: 0, expense: 0, saldo: 0, count: 0 };
    }
    if (item.type === 'income') {
      monthlyDataMap[ym].income += item.amount;
    } else {
      monthlyDataMap[ym].expense += item.amount;
    }
    monthlyDataMap[ym].saldo = monthlyDataMap[ym].income - monthlyDataMap[ym].expense;
    monthlyDataMap[ym].count += 1;
  });

  const sortedMonths = Object.keys(monthlyDataMap).sort();
  const maxMonthValue = Math.max(
    ...sortedMonths.flatMap((ym) => [monthlyDataMap[ym].income, monthlyDataMap[ym].expense]),
    1
  );

  // Category breakdown for expenses
  const expenseCatMap: Record<string, { total: number; count: number }> = {};
  let totalExpense = 0;
  allData
    .filter((t) => t.type === 'expense')
    .forEach((item) => {
      expenseCatMap[item.category] = expenseCatMap[item.category] || { total: 0, count: 0 };
      expenseCatMap[item.category].total += item.amount;
      expenseCatMap[item.category].count += 1;
      totalExpense += item.amount;
    });

  const sortedExpenseCats = Object.keys(expenseCatMap)
    .map((catKey) => {
      const catInfo = getCategoryInfo('expense', catKey);
      return {
        ...catInfo,
        total: expenseCatMap[catKey].total,
        count: expenseCatMap[catKey].count,
        percentage: totalExpense > 0 ? (expenseCatMap[catKey].total / totalExpense) * 100 : 0,
      };
    })
    .sort((a, b) => b.total - a.total);

  // Category breakdown for incomes
  const incomeCatMap: Record<string, { total: number; count: number }> = {};
  let totalIncome = 0;
  allData
    .filter((t) => t.type === 'income')
    .forEach((item) => {
      incomeCatMap[item.category] = incomeCatMap[item.category] || { total: 0, count: 0 };
      incomeCatMap[item.category].total += item.amount;
      incomeCatMap[item.category].count += 1;
      totalIncome += item.amount;
    });

  const sortedIncomeCats = Object.keys(incomeCatMap)
    .map((catKey) => {
      const catInfo = getCategoryInfo('income', catKey);
      return {
        ...catInfo,
        total: incomeCatMap[catKey].total,
        count: incomeCatMap[catKey].count,
        percentage: totalIncome > 0 ? (incomeCatMap[catKey].total / totalIncome) * 100 : 0,
      };
    })
    .sort((a, b) => b.total - a.total);

  if (allData.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-emerald-100 p-8 text-center text-slate-500 shadow-xs">
        <TrendingDown className="w-10 h-10 text-emerald-300 mx-auto mb-3" />
        <p className="font-medium text-slate-700">Belum ada data transaksi keuangan untuk ditampilkan grafik</p>
        <p className="text-xs text-slate-400 mt-1">
          Tambahkan pemasukan atau pengeluaran baru untuk melihat visualisasi grafik arus kas dan saldo.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-emerald-100 p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-800" />
            {viewMode === 'months' && 'Grafik Arus Kas & Saldo Bulanan'}
            {viewMode === 'expense_cats' && 'Distribusi Kategori Pengeluaran'}
            {viewMode === 'income_cats' && 'Distribusi Sumber Pemasukan'}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {viewMode === 'months' && 'Perbandingan pemasukan, pengeluaran, dan saldo bersih per bulan'}
            {viewMode === 'expense_cats' && 'Proporsi alokasi pengeluaran keuangan berdasarkan kategori'}
            {viewMode === 'income_cats' && 'Proporsi penerimaan dana berdasarkan sumber pemasukan'}
          </p>
        </div>

        {/* View Toggle */}
        <div className="inline-flex rounded-xl bg-slate-100 p-1 self-start sm:self-auto flex-wrap gap-1">
          <button
            type="button"
            onClick={() => setViewMode('months')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              viewMode === 'months'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Tren Bulanan
          </button>
          <button
            type="button"
            onClick={() => setViewMode('expense_cats')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              viewMode === 'expense_cats'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PieChart className="w-3.5 h-3.5" />
            Kategori Pengeluaran
          </button>
          <button
            type="button"
            onClick={() => setViewMode('income_cats')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              viewMode === 'income_cats'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
            Sumber Pemasukan
          </button>
        </div>
      </div>

      {viewMode === 'months' ? (
        <div>
          {/* Legend */}
          <div className="flex items-center gap-4 text-xs mb-3 font-medium text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-emerald-600" />
              Pemasukan (+)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-red-600" />
              Pengeluaran (-)
            </span>
            <span className="text-slate-400 text-[11px] ml-auto">
              Arahkan kursor pada bar untuk melihat rincian saldo
            </span>
          </div>

          {/* Monthly Double Bar Chart */}
          <div className="h-60 flex items-end gap-4 sm:gap-8 pt-8 pb-2 border-b border-slate-200 overflow-x-auto">
            {sortedMonths.map((ym) => {
              const data = monthlyDataMap[ym];
              const incomeHeight = Math.max(Math.round((data.income / maxMonthValue) * 100), data.income > 0 ? 6 : 0);
              const expenseHeight = Math.max(Math.round((data.expense / maxMonthValue) * 100), data.expense > 0 ? 6 : 0);
              const isHovered = activeMonth === ym;

              return (
                <div
                  key={ym}
                  className="flex-1 min-w-[70px] max-w-[110px] flex flex-col items-center justify-end h-full group relative cursor-pointer"
                  onMouseEnter={() => setActiveMonth(ym)}
                  onMouseLeave={() => setActiveMonth(null)}
                  onClick={() => setActiveMonth(activeMonth === ym ? null : ym)}
                >
                  {/* Tooltip */}
                  <div
                    className={`absolute -top-20 z-20 pointer-events-none transition-all duration-200 ${
                      isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                    }`}
                  >
                    <div className="bg-slate-900 text-white text-[11px] p-2 rounded-xl shadow-xl whitespace-nowrap space-y-1">
                      <p className="font-bold text-slate-200 border-b border-slate-700 pb-1">
                        {getMonthYearLabel(ym)}
                      </p>
                      <p className="text-emerald-400 font-semibold">
                        Masuk: +{formatRupiah(data.income)}
                      </p>
                      <p className="text-red-400 font-semibold">
                        Keluar: -{formatRupiah(data.expense)}
                      </p>
                      <p
                        className={`font-bold pt-1 border-t border-slate-700 ${
                          data.saldo >= 0 ? 'text-emerald-300' : 'text-amber-300'
                        }`}
                      >
                        Saldo: {formatRupiah(data.saldo)}
                      </p>
                    </div>
                    <div className="w-2.5 h-2.5 bg-slate-900 rotate-45 mx-auto -mt-1" />
                  </div>

                  {/* Paired Bars */}
                  <div className="w-full flex justify-center items-end gap-1.5 h-full">
                    {/* Income Bar */}
                    <div className="flex-1 flex flex-col items-center justify-end h-full">
                      <div
                        style={{ height: `${incomeHeight}%` }}
                        className="w-full rounded-t-md bg-emerald-600 hover:bg-emerald-500 transition-all duration-300 shadow-xs"
                      />
                    </div>
                    {/* Expense Bar */}
                    <div className="flex-1 flex flex-col items-center justify-end h-full">
                      <div
                        style={{ height: `${expenseHeight}%` }}
                        className="w-full rounded-t-md bg-red-600/90 hover:bg-red-500 transition-all duration-300 shadow-xs"
                      />
                    </div>
                  </div>

                  {/* Month Label */}
                  <span className="text-[11px] font-semibold text-slate-600 mt-2 truncate w-full text-center">
                    {getMonthYearLabel(ym)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Insights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
            <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-100">
              <span className="text-[11px] text-emerald-800 font-semibold">Total Pemasukan Tercatat</span>
              <p className="text-base font-extrabold text-emerald-950 mt-0.5">
                +{formatRupiah(totalIncome)}
              </p>
            </div>
            <div className="p-3 bg-red-50/70 rounded-xl border border-red-100">
              <span className="text-[11px] text-red-800 font-semibold">Total Pengeluaran Tercatat</span>
              <p className="text-base font-extrabold text-red-950 mt-0.5">
                -{formatRupiah(totalExpense)}
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-600 font-semibold">Akumulasi Saldo Bersih</span>
              <p
                className={`text-base font-extrabold mt-0.5 ${
                  totalIncome - totalExpense >= 0 ? 'text-emerald-800' : 'text-red-600'
                }`}
              >
                {formatRupiah(totalIncome - totalExpense)}
              </p>
            </div>
          </div>
        </div>
      ) : viewMode === 'expense_cats' ? (
        /* Expense Categories */
        <div className="space-y-4">
          {sortedExpenseCats.length === 0 ? (
            <p className="text-center py-8 text-xs text-slate-400">Belum ada pengeluaran tersimpan.</p>
          ) : (
            <div className="space-y-3.5">
              {sortedExpenseCats.map((cat) => (
                <div key={cat.key} className="p-3 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-slate-800 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                      {cat.label}
                      <span className="text-slate-400 font-normal">({cat.count} transaksi)</span>
                    </span>
                    <div className="text-right">
                      <span className="font-bold text-red-600">-{formatRupiah(cat.total)}</span>
                      <span className="text-slate-400 ml-2 font-medium">({cat.percentage.toFixed(1)}%)</span>
                    </div>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="p-3 bg-red-50 rounded-xl border border-red-100 flex items-center justify-between text-xs">
            <span className="font-semibold text-red-900">Total Seluruh Pengeluaran</span>
            <span className="font-extrabold text-red-950 text-sm">-{formatRupiah(totalExpense)}</span>
          </div>
        </div>
      ) : (
        /* Income Categories */
        <div className="space-y-4">
          {sortedIncomeCats.length === 0 ? (
            <p className="text-center py-8 text-xs text-slate-400">Belum ada pemasukan tersimpan.</p>
          ) : (
            <div className="space-y-3.5">
              {sortedIncomeCats.map((cat) => (
                <div key={cat.key} className="p-3 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-slate-800 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                      {cat.label}
                      <span className="text-slate-400 font-normal">({cat.count} transaksi)</span>
                    </span>
                    <div className="text-right">
                      <span className="font-bold text-emerald-700">+{formatRupiah(cat.total)}</span>
                      <span className="text-slate-400 ml-2 font-medium">({cat.percentage.toFixed(1)}%)</span>
                    </div>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-between text-xs">
            <span className="font-semibold text-emerald-900">Total Seluruh Pemasukan</span>
            <span className="font-extrabold text-emerald-950 text-sm">+{formatRupiah(totalIncome)}</span>
          </div>
        </div>
      )}
    </div>
  );
};
