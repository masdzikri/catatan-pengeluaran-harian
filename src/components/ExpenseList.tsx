import React, { useState, useMemo } from 'react';
import {
  TransactionItem,
  TransactionType,
  getCategoryInfo,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  ExpenseCategoryKey,
  IncomeCategoryKey,
} from '../types';
import { formatRupiah, formatIndonesianDate } from '../utils/formatters';
import {
  Search,
  Filter,
  Edit2,
  Trash2,
  Receipt,
  Calendar,
  ChevronDown,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  Wallet,
} from 'lucide-react';

interface ExpenseListProps {
  transactions: TransactionItem[];
  onEdit: (item: TransactionItem) => void;
  onDeleteRequest: (item: TransactionItem) => void;
  onAddNewClick?: (type?: TransactionType) => void;
  // Legacy compatibility
  expenses?: TransactionItem[];
}

export const ExpenseList: React.FC<ExpenseListProps> = ({
  transactions = [],
  expenses = [],
  onEdit,
  onDeleteRequest,
  onAddNewClick,
}) => {
  const [typeFilter, setTypeFilter] = useState<'all' | 'expense' | 'income'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Combine items
  const allData: TransactionItem[] =
    transactions.length > 0
      ? transactions
      : expenses.map((e) => ({ ...e, type: 'expense' as const }));

  // Filter & Search
  const filteredTransactions = useMemo(() => {
    return allData.filter((item) => {
      // Type match
      if (typeFilter !== 'all' && item.type !== typeFilter) return false;

      // Category match
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;

      // Search match
      const queryLower = searchQuery.toLowerCase();
      const matchesSearch =
        item.description.toLowerCase().includes(queryLower) ||
        item.amount.toString().includes(queryLower) ||
        item.date.includes(queryLower);

      return matchesSearch;
    });
  }, [allData, typeFilter, selectedCategory, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage) || 1;
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(start, start + itemsPerPage);
  }, [filteredTransactions, currentPage]);

  // Aggregate stats for filtered items
  const stats = useMemo(() => {
    let inc = 0;
    let exp = 0;
    filteredTransactions.forEach((t) => {
      if (t.type === 'income') inc += t.amount;
      else exp += t.amount;
    });
    return {
      income: inc,
      expense: exp,
      saldo: inc - exp,
    };
  }, [filteredTransactions]);

  // Category options based on typeFilter
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
    <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden">
      {/* Header & Type Filter Tabs */}
      <div className="p-5 sm:p-6 border-b border-slate-100 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-emerald-800" />
              Riwayat Transaksi Keuangan
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Daftar seluruh catatan pemasukan dan pengeluaran yang tersimpan permanen di database
            </p>
          </div>

          {/* Type Filter Buttons */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => {
                setTypeFilter('all');
                setSelectedCategory('all');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                typeFilter === 'all'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua ({allData.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setTypeFilter('income');
                setSelectedCategory('all');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                typeFilter === 'income'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              Pemasukan
            </button>
            <button
              type="button"
              onClick={() => {
                setTypeFilter('expense');
                setSelectedCategory('all');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                typeFilter === 'expense'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              Pengeluaran
            </button>
          </div>
        </div>

        {/* Financial Flow Mini Summary Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
          <div className="flex items-center justify-between sm:justify-start gap-2">
            <span className="text-slate-500 text-[11px]">Pemasukan Terpilih:</span>
            <span className="font-bold text-emerald-700">+{formatRupiah(stats.income)}</span>
          </div>
          <div className="flex items-center justify-between sm:justify-start gap-2">
            <span className="text-slate-500 text-[11px]">Pengeluaran Terpilih:</span>
            <span className="font-bold text-red-600">-{formatRupiah(stats.expense)}</span>
          </div>
          <div className="flex items-center justify-between sm:justify-start gap-2">
            <span className="text-slate-500 text-[11px]">Sisa Saldo Terpilih:</span>
            <span
              className={`font-black ${
                stats.saldo >= 0 ? 'text-emerald-900' : 'text-amber-700'
              }`}
            >
              {formatRupiah(stats.saldo)}
            </span>
          </div>
        </div>

        {/* Search & Category Filter */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
          {/* Search Box */}
          <div className="sm:col-span-7 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari transaksi berdasarkan keterangan, tanggal, atau nominal..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
            />
          </div>

          {/* Category Dropdown */}
          <div className="sm:col-span-5 relative">
            <Filter className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full appearance-none pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all cursor-pointer"
            >
              <option value="all">Semua Kategori</option>
              {categoryOptions.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Main Content: Table for Desktop, Cards for Mobile */}
      {filteredTransactions.length === 0 ? (
        <div className="p-12 text-center text-slate-500">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto mb-3">
            <Receipt className="w-6 h-6" />
          </div>
          <p className="font-semibold text-slate-800">Tidak ada transaksi ditemukan</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {searchQuery || selectedCategory !== 'all' || typeFilter !== 'all'
              ? 'Coba sesuaikan kata kunci pencarian atau filter yang Anda gunakan.'
              : 'Belum ada transaksi tersimpan. Mulai catat pemasukan dan pengeluaran Anda sekarang!'}
          </p>
          {onAddNewClick && (
            <div className="mt-4 flex justify-center gap-2">
              <button
                type="button"
                onClick={() => onAddNewClick('income')}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs"
              >
                + Pemasukan
              </button>
              <button
                type="button"
                onClick={() => onAddNewClick('expense')}
                className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-semibold shadow-xs"
              >
                + Pengeluaran
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-[11px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4 w-12 text-center">No</th>
                  <th className="py-3 px-4 w-28">Jenis</th>
                  <th className="py-3 px-4 w-36">Tanggal</th>
                  <th className="py-3 px-4 w-44">Kategori</th>
                  <th className="py-3 px-4">Keterangan</th>
                  <th className="py-3 px-4 w-40 text-right">Nominal</th>
                  <th className="py-3 px-4 w-24 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {paginatedTransactions.map((item, idx) => {
                  const globalIdx = (currentPage - 1) * itemsPerPage + idx + 1;
                  const isInc = item.type === 'income';
                  const catInfo = getCategoryInfo(item.type, item.category);

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      <td className="py-3 px-4 text-center text-slate-400 font-medium">
                        {globalIdx}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                            isInc
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          {isInc ? (
                            <ArrowDownLeft className="w-3 h-3 text-emerald-700" />
                          ) : (
                            <ArrowUpRight className="w-3 h-3 text-red-600" />
                          )}
                          {isInc ? 'Masuk' : 'Keluar'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700 whitespace-nowrap">
                        {formatIndonesianDate(item.date)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${catInfo.borderColor} ${catInfo.bgLight}`}
                        >
                          {catInfo.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800 max-w-md truncate">
                        {item.description}
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-black whitespace-nowrap text-sm ${
                          isInc ? 'text-emerald-700' : 'text-red-600'
                        }`}
                      >
                        {isInc ? '+' : '-'}
                        {formatRupiah(item.amount)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onEdit(item)}
                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Edit transaksi"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteRequest(item)}
                            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Hapus transaksi"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-slate-100">
            {paginatedTransactions.map((item, idx) => {
              const globalIdx = (currentPage - 1) * itemsPerPage + idx + 1;
              const isInc = item.type === 'income';
              const catInfo = getCategoryInfo(item.type, item.category);

              return (
                <div key={item.id} className="p-4 hover:bg-slate-50/80 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        #{globalIdx}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          isInc
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {isInc ? 'Masuk' : 'Keluar'}
                      </span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border ${catInfo.borderColor} ${catInfo.bgLight}`}
                      >
                        {catInfo.label}
                      </span>
                    </div>

                    <span
                      className={`text-sm font-black ${
                        isInc ? 'text-emerald-700' : 'text-red-600'
                      }`}
                    >
                      {isInc ? '+' : '-'}
                      {formatRupiah(item.amount)}
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-slate-900 mt-2">
                    {item.description}
                  </p>

                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {formatIndonesianDate(item.date)}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(item)}
                        className="px-2 py-1 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-md font-semibold flex items-center gap-1"
                      >
                        <Edit2 className="w-3 h-3" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteRequest(item)}
                        className="px-2 py-1 text-red-600 bg-red-50 hover:bg-red-100 rounded-md font-semibold flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        Hapus
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-4 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span>
                Halaman <span className="font-bold text-slate-900">{currentPage}</span> dari{' '}
                <span className="font-bold text-slate-900">{totalPages}</span>
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Sebelumnya
                </button>
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
