import React from 'react';
import { TransactionItem, getCategoryInfo } from '../types';
import { formatRupiah, formatIndonesianDate } from '../utils/formatters';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  item: TransactionItem | null;
  expense?: TransactionItem | null; // Compatibility
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  item,
  expense,
  isDeleting,
  onConfirm,
  onCancel,
}) => {
  const activeItem = item || expense;
  if (!isOpen || !activeItem) return null;

  const isInc = activeItem.type === 'income';
  const typeLabel = isInc ? 'Pemasukan' : 'Pengeluaran';
  const cat = getCategoryInfo(activeItem.type, activeItem.category);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <h3 className="text-lg font-bold text-slate-900">
          Hapus Catatan {typeLabel}?
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Tindakan ini tidak dapat dibatalkan. Data {typeLabel.toLowerCase()} akan dihapus secara permanen dari database Firestore dan saldo Anda akan disesuaikan otomatis.
        </p>

        {/* Transaction Detail Box */}
        <div className="my-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs space-y-1.5">
          <div className="flex justify-between text-slate-500">
            <span>Jenis:</span>
            <span
              className={`font-bold ${isInc ? 'text-emerald-700' : 'text-red-600'}`}
            >
              {isInc ? 'Pemasukan (+)' : 'Pengeluaran (-)'}
            </span>
          </div>
          <div className="flex justify-between text-slate-500">
            <span>Tanggal:</span>
            <span className="font-medium text-slate-700">{formatIndonesianDate(activeItem.date)}</span>
          </div>
          <div className="flex justify-between text-slate-500">
            <span>Kategori:</span>
            <span className="font-semibold text-slate-800">{cat.label}</span>
          </div>
          <div className="flex justify-between text-slate-500">
            <span>Keterangan:</span>
            <span className="font-medium text-slate-700 text-right max-w-[200px] truncate">
              {activeItem.description}
            </span>
          </div>
          <div className="flex justify-between text-slate-900 pt-1.5 border-t border-slate-200 font-bold">
            <span>Nominal:</span>
            <span className={isInc ? 'text-emerald-700' : 'text-red-600'}>
              {isInc ? '+' : '-'}
              {formatRupiah(activeItem.amount)}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            {isDeleting ? 'Menghapus...' : 'Ya, Hapus Sekarang'}
          </button>
        </div>
      </div>
    </div>
  );
};
