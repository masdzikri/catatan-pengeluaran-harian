import React, { useState, useEffect } from 'react';
import {
  TransactionItem,
  TransactionType,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  ExpenseCategoryKey,
  IncomeCategoryKey,
} from '../types';
import {
  formatRupiah,
  formatNumberWithDots,
  parseRupiahInput,
  getTodayDateString,
} from '../utils/formatters';
import {
  Calendar,
  DollarSign,
  FileText,
  Tag,
  Save,
  X,
  CheckCircle2,
  AlertCircle,
  Utensils,
  Car,
  ShoppingBag,
  GraduationCap,
  Zap,
  MoreHorizontal,
  Briefcase,
  TrendingUp,
  PieChart,
  Laptop,
  Gift,
  PlusCircle,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';

interface ExpenseFormProps {
  initialData?: TransactionItem | null;
  defaultType?: TransactionType;
  onSubmit: (data: {
    type: TransactionType;
    date: string;
    amount: number;
    description: string;
    category: string;
  }) => Promise<void>;
  onCancel?: () => void;
  isSubmitting: boolean;
}

const EXPENSE_ICONS: Record<ExpenseCategoryKey, React.ComponentType<{ className?: string }>> = {
  makanan: Utensils,
  transportasi: Car,
  kebutuhan: ShoppingBag,
  pendidikan: GraduationCap,
  operasional: Zap,
  lainnya: MoreHorizontal,
};

const INCOME_ICONS: Record<IncomeCategoryKey, React.ComponentType<{ className?: string }>> = {
  gaji: Briefcase,
  bisnis: TrendingUp,
  investasi: PieChart,
  freelance: Laptop,
  hadiah: Gift,
  lainnya: PlusCircle,
};

export const ExpenseForm: React.FC<ExpenseFormProps> = ({
  initialData,
  defaultType = 'expense',
  onSubmit,
  onCancel,
  isSubmitting,
}) => {
  const [transactionType, setTransactionType] = useState<TransactionType>(
    initialData?.type || defaultType
  );
  const [date, setDate] = useState<string>(getTodayDateString());
  const [rawAmountString, setRawAmountString] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<string>('makanan');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setTransactionType(initialData.type || 'expense');
      setDate(initialData.date || getTodayDateString());
      setRawAmountString(formatNumberWithDots(initialData.amount));
      setDescription(initialData.description || '');
      setCategory(initialData.category || (initialData.type === 'income' ? 'gaji' : 'makanan'));
    } else {
      setTransactionType(defaultType);
      setDate(getTodayDateString());
      setRawAmountString('');
      setDescription('');
      setCategory(defaultType === 'income' ? 'gaji' : 'makanan');
    }
    setErrorMessage(null);
  }, [initialData, defaultType]);

  const handleTypeChange = (newType: TransactionType) => {
    setTransactionType(newType);
    setCategory(newType === 'income' ? 'gaji' : 'makanan');
    if (errorMessage) setErrorMessage(null);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, '');
    if (!rawVal) {
      setRawAmountString('');
      return;
    }
    setRawAmountString(formatNumberWithDots(rawVal));
    if (errorMessage) setErrorMessage(null);
  };

  const handlePresetAmount = (preset: number) => {
    setRawAmountString(formatNumberWithDots(preset));
    if (errorMessage) setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const numericAmount = parseRupiahInput(rawAmountString);

    if (!date) {
      setErrorMessage('Tanggal transaksi wajib diisi.');
      return;
    }

    if (!numericAmount || numericAmount <= 0) {
      setErrorMessage('Nominal transaksi harus lebih besar dari Rp 0.');
      return;
    }

    if (!description.trim()) {
      setErrorMessage('Keterangan transaksi tidak boleh kosong.');
      return;
    }

    if (description.trim().length > 200) {
      setErrorMessage('Keterangan transaksi maksimal 200 karakter.');
      return;
    }

    try {
      await onSubmit({
        type: transactionType,
        date,
        amount: numericAmount,
        description: description.trim(),
        category,
      });

      const labelType = transactionType === 'income' ? 'Pemasukan' : 'Pengeluaran';
      setSuccessMessage(
        initialData
          ? `Perubahan catatan ${labelType.toLowerCase()} berhasil disimpan!`
          : `Catatan ${labelType.toLowerCase()} baru berhasil ditambahkan!`
      );

      if (!initialData) {
        setRawAmountString('');
        setDescription('');
      }

      setTimeout(() => {
        setSuccessMessage(null);
      }, 3500);
    } catch (err: any) {
      setErrorMessage(
        err?.message || 'Gagal menyimpan transaksi. Pastikan koneksi internet aktif.'
      );
    }
  };

  const currentNumericAmount = parseRupiahInput(rawAmountString);
  const isIncome = transactionType === 'income';

  return (
    <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-6 sm:p-7">
      {/* Top Header & Close Button */}
      <div className="flex items-center justify-between pb-5 border-b border-slate-100 mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span
              className={`w-8 h-8 rounded-xl text-white flex items-center justify-center font-bold text-sm shadow-xs ${
                isIncome ? 'bg-emerald-600' : 'bg-emerald-900'
              }`}
            >
              {isIncome ? '+' : '-'}
            </span>
            {initialData
              ? `Edit Catatan ${isIncome ? 'Pemasukan' : 'Pengeluaran'}`
              : `Input ${isIncome ? 'Pemasukan' : 'Pengeluaran'} Baru`}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isIncome
              ? 'Catat sumber penerimaan uang atau pendapatan untuk menambah saldo keuangan Anda'
              : 'Catat pemakaian uang atau belanja harian untuk memantau pengeluaran Anda'}
          </p>
        </div>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
            title="Tutup formulir"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Transaction Type Tabs: Pengeluaran vs Pemasukan */}
      {!initialData && (
        <div className="grid grid-cols-2 gap-3 mb-6 p-1.5 bg-slate-100 rounded-2xl">
          <button
            type="button"
            onClick={() => handleTypeChange('expense')}
            className={`py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              !isIncome
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80 ring-2 ring-emerald-700/20'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <div className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
            <span>Catat Pengeluaran (-)</span>
          </button>

          <button
            type="button"
            onClick={() => handleTypeChange('income')}
            className={`py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              isIncome
                ? 'bg-white text-emerald-950 shadow-sm border border-emerald-200 ring-2 ring-emerald-600/30'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <ArrowDownLeft className="w-3.5 h-3.5" />
            </div>
            <span>Catat Pemasukan (+)</span>
          </button>
        </div>
      )}

      {/* Notifications */}
      {errorMessage && (
        <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-xs text-red-800 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Validasi Gagal</p>
            <p>{errorMessage}</p>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3 text-xs text-emerald-800 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Berhasil Disimpan</p>
            <p>{successMessage}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Row 1: Tanggal & Nominal */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Tanggal */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-700" />
              Tanggal {isIncome ? 'Pemasukan' : 'Pengeluaran'} <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Default adalah tanggal hari ini
            </span>
          </div>

          {/* Nominal */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-700" />
              Nominal {isIncome ? 'Pemasukan' : 'Pengeluaran'} (Rp) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <span className={`text-xs font-bold ${isIncome ? 'text-emerald-700' : 'text-slate-800'}`}>
                  Rp
                </span>
              </div>
              <input
                type="text"
                inputMode="numeric"
                value={rawAmountString}
                onChange={handleAmountChange}
                placeholder={isIncome ? 'Contoh: 5.000.000' : 'Contoh: 50.000'}
                required
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
              />
            </div>

            {/* Live Rupiah Preview & Presets */}
            <div className="flex items-center justify-between mt-1.5">
              <span
                className={`text-[11px] font-bold ${
                  isIncome ? 'text-emerald-700' : 'text-slate-700'
                }`}
              >
                {currentNumericAmount > 0
                  ? `${isIncome ? '+ ' : '- '}${formatRupiah(currentNumericAmount)}`
                  : 'Rp 0'}
              </span>
              <div className="flex gap-1">
                {(isIncome ? [500000, 1000000, 5000000] : [20000, 50000, 100000]).map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handlePresetAmount(preset)}
                    className="text-[10px] px-2 py-0.5 bg-slate-100 hover:bg-emerald-100 hover:text-emerald-800 text-slate-600 rounded font-medium transition-colors"
                  >
                    +{preset >= 1000000 ? `${preset / 1000000}jt` : `${preset / 1000}rb`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Kategori */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-emerald-700" />
            Kategori {isIncome ? 'Pemasukan' : 'Pengeluaran'} <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
            {isIncome
              ? (Object.keys(INCOME_CATEGORIES) as IncomeCategoryKey[]).map((catKey) => {
                  const cat = INCOME_CATEGORIES[catKey];
                  const Icon = INCOME_ICONS[catKey] || PlusCircle;
                  const isSelected = category === catKey;

                  return (
                    <button
                      key={catKey}
                      type="button"
                      onClick={() => setCategory(catKey)}
                      className={`p-2.5 rounded-xl border text-left transition-all flex flex-col items-center justify-center text-center gap-1.5 ${
                        isSelected
                          ? 'border-emerald-700 bg-emerald-700 text-white shadow-sm ring-2 ring-emerald-500/30'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-emerald-700'}`}
                      />
                      <span className="text-[11px] font-semibold leading-tight line-clamp-1">
                        {cat.label}
                      </span>
                    </button>
                  );
                })
              : (Object.keys(EXPENSE_CATEGORIES) as ExpenseCategoryKey[]).map((catKey) => {
                  const cat = EXPENSE_CATEGORIES[catKey];
                  const Icon = EXPENSE_ICONS[catKey] || MoreHorizontal;
                  const isSelected = category === catKey;

                  return (
                    <button
                      key={catKey}
                      type="button"
                      onClick={() => setCategory(catKey)}
                      className={`p-2.5 rounded-xl border text-left transition-all flex flex-col items-center justify-center text-center gap-1.5 ${
                        isSelected
                          ? 'border-emerald-800 bg-emerald-900 text-white shadow-sm ring-2 ring-emerald-700/30'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-emerald-700'}`}
                      />
                      <span className="text-[11px] font-semibold leading-tight line-clamp-1">
                        {cat.label}
                      </span>
                    </button>
                  );
                })}
          </div>
        </div>

        {/* Row 3: Keterangan */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-emerald-700" />
              Keterangan {isIncome ? 'Pemasukan' : 'Pengeluaran'} <span className="text-red-500">*</span>
            </label>
            <span
              className={`text-[11px] ${
                description.length > 200 ? 'text-red-500 font-bold' : 'text-slate-400'
              }`}
            >
              {description.length}/200 karakter
            </span>
          </div>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={
              isIncome
                ? 'Contoh: Gaji bulanan kantor, dividen saham, atau honor freelance'
                : 'Contoh: Belanja mingguan pasar, token listrik, atau makan siang'
            }
            maxLength={200}
            required
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
          />
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-6 py-2.5 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 active:scale-[0.99] disabled:opacity-50 ${
              isIncome
                ? 'bg-emerald-700 hover:bg-emerald-800'
                : 'bg-emerald-900 hover:bg-emerald-950'
            }`}
          >
            <Save className="w-4 h-4" />
            {isSubmitting
              ? 'Menyimpan...'
              : initialData
              ? 'Simpan Perubahan'
              : `Simpan ${isIncome ? 'Pemasukan' : 'Pengeluaran'}`}
          </button>
        </div>
      </form>
    </div>
  );
};
