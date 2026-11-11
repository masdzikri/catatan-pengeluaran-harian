import React, { useState, useRef } from 'react';
import {
  TransactionItem,
  TransactionType,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
} from '../types';
import {
  addExpenseToFirestore,
  addIncomeToFirestore,
  auth,
} from '../firebase';
import { formatRupiah } from '../utils/formatters';
import {
  Database,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Globe,
  ShieldCheck,
  Server,
  Cloud,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
} from 'lucide-react';

interface BackupRestoreProps {
  transactions: TransactionItem[];
  onDataRestored?: () => void;
  // Legacy compatibility
  expenses?: TransactionItem[];
}

export const BackupRestore: React.FC<BackupRestoreProps> = ({
  transactions = [],
  expenses = [],
  onDataRestored,
}) => {
  const [backupNotice, setBackupNotice] = useState<string | null>(null);
  const [restoreStatus, setRestoreStatus] = useState<{
    type: 'success' | 'error' | 'loading' | null;
    message: string;
    details?: string;
  }>({ type: null, message: '' });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const allData: TransactionItem[] =
    transactions.length > 0
      ? transactions
      : expenses.map((e) => ({ ...e, type: 'expense' as const }));

  // Financial totals
  let totalIncome = 0;
  let totalExpense = 0;
  allData.forEach((item) => {
    if (item.type === 'income') totalIncome += item.amount;
    else totalExpense += item.amount;
  });
  const totalBalance = totalIncome - totalExpense;

  // Backup data to JSON file
  const handleBackup = () => {
    try {
      const backupPayload = {
        app: 'Catatan Pengeluaran & Saldo Harian',
        version: '2.0.0',
        exportedAt: new Date().toISOString(),
        totalTransactions: allData.length,
        totalIncome,
        totalExpense,
        totalBalance,
        data: allData,
      };

      const dataStr =
        'data:text/json;charset=utf-8,' +
        encodeURIComponent(JSON.stringify(backupPayload, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      const filename = `Backup_Keuangan_${new Date().toISOString().slice(0, 10)}.json`;
      downloadAnchor.setAttribute('download', filename);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      setBackupNotice(
        `Cadangan (${allData.length} transaksi pemasukan & pengeluaran) berhasil diunduh!`
      );
      setTimeout(() => setBackupNotice(null), 4000);
    } catch (err: any) {
      alert('Gagal membuat file cadangan: ' + err.message);
    }
  };

  // Restore data from JSON file
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const currentUserId = auth.currentUser?.uid;
    if (!currentUserId) {
      setRestoreStatus({
        type: 'error',
        message: 'Anda harus masuk akun terlebih dahulu sebelum memulihkan data.',
      });
      return;
    }

    setRestoreStatus({
      type: 'loading',
      message: 'Membaca dan memvalidasi file cadangan...',
    });

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        // Validate structure
        const itemsToRestore: any[] = Array.isArray(parsed)
          ? parsed
          : Array.isArray(parsed.data)
          ? parsed.data
          : null;

        if (!itemsToRestore || itemsToRestore.length === 0) {
          throw new Error('Format file tidak valid atau data transaksi kosong.');
        }

        let incomeRestored = 0;
        let expenseRestored = 0;

        for (const item of itemsToRestore) {
          const numericAmount = Number(item.amount);
          if (!item.date || !item.description || isNaN(numericAmount) || numericAmount <= 0) {
            continue;
          }

          const itemType: TransactionType = item.type === 'income' ? 'income' : 'expense';

          if (itemType === 'income') {
            const validIncomeCats = Object.keys(INCOME_CATEGORIES);
            const category = validIncomeCats.includes(item.category) ? item.category : 'lainnya';

            await addIncomeToFirestore(currentUserId, {
              date: item.date,
              amount: numericAmount,
              description: String(item.description).slice(0, 200),
              category,
            });
            incomeRestored++;
          } else {
            const validExpenseCats = Object.keys(EXPENSE_CATEGORIES);
            const category = validExpenseCats.includes(item.category) ? item.category : 'lainnya';

            await addExpenseToFirestore(currentUserId, {
              date: item.date,
              amount: numericAmount,
              description: String(item.description).slice(0, 200),
              category,
            });
            expenseRestored++;
          }
        }

        setRestoreStatus({
          type: 'success',
          message: `Pemulihan data berhasil!`,
          details: `${incomeRestored} pemasukan dan ${expenseRestored} pengeluaran berhasil dimasukkan ke Firestore database.`,
        });

        if (onDataRestored) onDataRestored();

        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (err: any) {
        setRestoreStatus({
          type: 'error',
          message: 'Gagal memulihkan data dari file JSON.',
          details: err.message || 'Pastikan file cadangan berformat JSON yang sah.',
        });
      }
    };

    reader.onerror = () => {
      setRestoreStatus({
        type: 'error',
        message: 'Gagal membaca file dari penyimpanan lokal.',
      });
    };

    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Backup and Restore Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Backup Card */}
        <div className="bg-white rounded-2xl border border-emerald-100 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-800 text-white flex items-center justify-center mb-4 shadow-xs">
              <Download className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Cadangkan Data (Backup)</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Unduh salinan seluruh data catatan pemasukan, pengeluaran, dan saldo ke dalam berkas standar JSON. Berkas ini dapat disimpan sebagai arsip atau dipindahkan ke perangkat lain.
            </p>

            <div className="my-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between text-slate-600">
                <span>Total Data Tersedia:</span>
                <span className="font-bold text-slate-900">{allData.length} transaksi</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Total Pemasukan:</span>
                <span className="font-bold text-emerald-700">+{formatRupiah(totalIncome)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Total Pengeluaran:</span>
                <span className="font-bold text-red-600">-{formatRupiah(totalExpense)}</span>
              </div>
              <div className="flex justify-between text-slate-900 pt-1 border-t border-slate-200 font-bold">
                <span>Sisa Saldo Bersih:</span>
                <span className={totalBalance >= 0 ? 'text-emerald-900' : 'text-amber-700'}>
                  {formatRupiah(totalBalance)}
                </span>
              </div>
            </div>
          </div>

          <div>
            {backupNotice && (
              <div className="mb-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                {backupNotice}
              </div>
            )}

            <button
              type="button"
              onClick={handleBackup}
              disabled={allData.length === 0}
              className="w-full py-2.5 px-4 bg-emerald-800 hover:bg-emerald-900 active:scale-95 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs disabled:opacity-40"
            >
              <Download className="w-4 h-4" />
              Unduh Berkas Cadangan (.json)
            </button>
          </div>
        </div>

        {/* Restore Card */}
        <div className="bg-white rounded-2xl border border-emerald-100 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-sky-700 text-white flex items-center justify-center mb-4 shadow-xs">
              <Upload className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Pulihkan Data (Restore)</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Unggah berkas JSON cadangan yang pernah Anda unduh. Sistem akan memverifikasi integritas data transaksi dan menyimpannya secara otomatis ke database Firestore.
            </p>

            <div className="my-4 p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-900 space-y-1">
              <p className="font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                Catatan Penting
              </p>
              <p className="text-[11px] text-amber-800 leading-normal">
                Pemasukan dan pengeluaran dari berkas cadangan akan digabungkan ke akun Anda tanpa menghapus catatan yang sudah ada.
              </p>
            </div>
          </div>

          <div>
            {restoreStatus.type && (
              <div
                className={`mb-3 p-2.5 rounded-xl text-xs flex items-start gap-2 ${
                  restoreStatus.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : restoreStatus.type === 'error'
                    ? 'bg-red-50 border border-red-200 text-red-800'
                    : 'bg-slate-50 border border-slate-200 text-slate-700'
                }`}
              >
                {restoreStatus.type === 'success' && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                )}
                {restoreStatus.type === 'error' && (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-semibold">{restoreStatus.message}</p>
                  {restoreStatus.details && (
                    <p className="text-[11px] mt-0.5">{restoreStatus.details}</p>
                  )}
                </div>
              </div>
            )}

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={restoreStatus.type === 'loading'}
              className="w-full py-2.5 px-4 bg-sky-700 hover:bg-sky-800 active:scale-95 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              {restoreStatus.type === 'loading'
                ? 'Memproses Pemulihan...'
                : 'Pilih & Unggah Berkas JSON'}
            </button>
          </div>
        </div>
      </div>

      {/* Database Configuration & Deployment Guide */}
      <div className="bg-white rounded-2xl border border-emerald-100 p-6 sm:p-7 shadow-xs space-y-6">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Server className="w-5 h-5 text-emerald-800" />
            Petunjuk Konfigurasi Database & Cara Deployment
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Panduan teknis konfigurasi basis data Firestore, perhitungan saldo otomatis, dan cara mempublikasikan aplikasi
          </p>
        </div>

        {/* Section 1: Konfigurasi Database Firestore */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-700" />
            1. Struktur Koleksi Database & Perhitungan Saldo (Firestore)
          </h4>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-2 leading-relaxed">
            <p>
              Aplikasi ini memisahkan data transaksi ke dalam 2 koleksi utama yang terisolasi per akun pengguna:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-[11px] text-slate-600">
              <li>
                <strong>Koleksi <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">incomes</code>:</strong> Menyimpan sumber pemasukan keuangan (Gaji, Bisnis, Investasi, Freelance, dsb.).
              </li>
              <li>
                <strong>Koleksi <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">expenses</code>:</strong> Menyimpan pemakaian uang harian (Makanan, Transportasi, Kebutuhan, dsb.).
              </li>
              <li>
                <strong>Formula Saldo:</strong> <code className="bg-emerald-100 text-emerald-900 font-bold px-1.5 py-0.5 rounded">Saldo = Total Pemasukan - Total Pengeluaran</code>. Perhitungan diperbarui secara instan melalui listener real-time Firestore.
              </li>
              <li>
                <strong>Keamanan (Security Rules):</strong> Ditegakkan melalui <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">firestore.rules</code>: pengguna hanya dapat membaca dan menulis dokumen milik sendiri (<code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">resource.data.userId == request.auth.uid</code>).
              </li>
            </ul>
          </div>
        </div>

        {/* Section 2: Deployment Guide */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-700" />
            2. Cara Deployment & Publikasi Online
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-100 text-xs space-y-2">
              <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                <Cloud className="w-4 h-4 text-emerald-700" />
                A. Publikasi via Google AI Studio / Cloud Run
              </span>
              <p className="text-[11px] text-emerald-900 leading-relaxed">
                Aplikasi ini telah otomatis dikompilasi dan di-host langsung pada infrastruktur Cloud Run Google AI Studio. Tautan publik langsung tersedia melalui tombol <strong>Share / Publish</strong> di sudut atas antarmuka studio.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <FileCode className="w-4 h-4 text-slate-700" />
                B. Publikasi ke Hosting Mandiri (Vercel / Netlify / Firebase Hosting)
              </span>
              <ol className="list-decimal pl-4 space-y-1 text-[11px] text-slate-600">
                <li>Jalankan perintah build: <code className="bg-slate-200 px-1 rounded">npm run build</code>.</li>
                <li>Folder hasil kompilasi <code className="bg-slate-200 px-1 rounded">dist/</code> siap di-upload ke Vercel atau Netlify.</li>
                <li>Untuk Firebase Hosting: jalankan <code className="bg-slate-200 px-1 rounded">firebase deploy</code>.</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Section 3: Jaminan CRUD */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            3. Verifikasi Fungsionalitas Lengkap
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-900 font-semibold">
              ✓ Pemasukan & Pengeluaran
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-900 font-semibold">
              ✓ Saldo Otomatis Realtime
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-900 font-semibold">
              ✓ Edit & Hapus Lengkap
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-900 font-semibold">
              ✓ Ekspor Excel & PDF
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
