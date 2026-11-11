import React, { useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import {
  auth,
  testConnection,
  signInWithGoogle,
  logOut,
  addExpenseToFirestore,
  updateExpenseInFirestore,
  deleteExpenseFromFirestore,
  addIncomeToFirestore,
  updateIncomeInFirestore,
  deleteIncomeFromFirestore,
  subscribeToTransactions,
} from './firebase';
import { TransactionItem, TransactionType } from './types';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { ExpenseForm } from './components/ExpenseForm';
import { ExpenseList } from './components/ExpenseList';
import { Reports } from './components/Reports';
import { BackupRestore } from './components/BackupRestore';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import {
  Wallet,
  LogIn,
  ShieldCheck,
  Sparkles,
  Database,
  CheckCircle2,
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [currentTab, setCurrentTab] = useState<
    'dashboard' | 'input' | 'riwayat' | 'laporan' | 'backup'
  >('dashboard');

  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [inputDefaultType, setInputDefaultType] = useState<TransactionType>('expense');
  const [editingTransaction, setEditingTransaction] = useState<TransactionItem | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<TransactionItem | null>(null);
  const [isSubmittingForm, setIsSubmittingForm] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [appAlert, setAppAlert] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // 1. Initial Firestore connection test on boot
  useEffect(() => {
    testConnection();
  }, []);

  // 2. Track Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 3. Attach real-time Firestore listeners for both Incomes and Expenses
  useEffect(() => {
    if (!currentUser) {
      setTransactions([]);
      return;
    }

    const unsubscribe = subscribeToTransactions(
      currentUser.uid,
      (expenses, incomes) => {
        // Merge and sort by date descending, then createdAt descending
        const merged = [...expenses, ...incomes].sort((a, b) => {
          const dateDiff = b.date.localeCompare(a.date);
          if (dateDiff !== 0) return dateDiff;
          return 0;
        });
        setTransactions(merged);
      },
      (error) => {
        console.error('Subscription error:', error);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Alert dismiss timer
  const showAlert = (type: 'success' | 'error', message: string) => {
    setAppAlert({ type, message });
    setTimeout(() => {
      setAppAlert(null);
    }, 4000);
  };

  // Auth Handlers
  const handleSignIn = async () => {
    setIsAuthenticating(true);
    try {
      await signInWithGoogle();
      showAlert('success', 'Berhasil masuk dengan akun Google!');
    } catch (err: any) {
      console.error(err);
      showAlert('error', err.message || 'Gagal masuk akun. Silakan coba kembali.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logOut();
      showAlert('success', 'Anda telah keluar dari akun.');
      setCurrentTab('dashboard');
    } catch (err: any) {
      showAlert('error', 'Gagal keluar akun: ' + err.message);
    }
  };

  // Navigation with pre-selected type
  const handleOpenInputWithType = (type: TransactionType) => {
    setEditingTransaction(null);
    setInputDefaultType(type);
    setCurrentTab('input');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // CRUD Form Handlers
  const handleFormSubmit = async (data: {
    type: TransactionType;
    date: string;
    amount: number;
    description: string;
    category: string;
  }) => {
    if (!currentUser) {
      showAlert('error', 'Silakan masuk akun terlebih dahulu untuk menyimpan.');
      return;
    }

    setIsSubmittingForm(true);
    const isInc = data.type === 'income';

    try {
      if (editingTransaction) {
        if (editingTransaction.type === 'income') {
          await updateIncomeInFirestore(editingTransaction.id, currentUser.uid, {
            date: data.date,
            amount: data.amount,
            description: data.description,
            category: data.category,
          });
        } else {
          await updateExpenseInFirestore(editingTransaction.id, currentUser.uid, {
            date: data.date,
            amount: data.amount,
            description: data.description,
            category: data.category,
          });
        }
        setEditingTransaction(null);
        showAlert(
          'success',
          `Catatan ${isInc ? 'pemasukan' : 'pengeluaran'} berhasil diperbarui!`
        );
        setCurrentTab('riwayat');
      } else {
        if (isInc) {
          await addIncomeToFirestore(currentUser.uid, {
            date: data.date,
            amount: data.amount,
            description: data.description,
            category: data.category,
          });
          showAlert('success', 'Catatan pemasukan baru berhasil ditambahkan! Saldo bertambah.');
        } else {
          await addExpenseToFirestore(currentUser.uid, {
            date: data.date,
            amount: data.amount,
            description: data.description,
            category: data.category,
          });
          showAlert('success', 'Catatan pengeluaran baru berhasil ditambahkan! Saldo terpotong.');
        }
      }
    } catch (err: any) {
      console.error('Submit error:', err);
      showAlert('error', 'Gagal menyimpan transaksi: ' + (err.message || ''));
      throw err;
    } finally {
      setIsSubmittingForm(false);
    }
  };

  // Edit Trigger
  const handleStartEdit = (item: TransactionItem) => {
    setEditingTransaction(item);
    setInputDefaultType(item.type);
    setCurrentTab('input');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingTransaction(null);
  };

  // Delete Handlers
  const handleConfirmDelete = async () => {
    if (!deletingTransaction) return;
    setIsDeleting(true);
    const isInc = deletingTransaction.type === 'income';

    try {
      if (isInc) {
        await deleteIncomeFromFirestore(deletingTransaction.id);
      } else {
        await deleteExpenseFromFirestore(deletingTransaction.id);
      }
      showAlert(
        'success',
        `Catatan ${isInc ? 'pemasukan' : 'pengeluaran'} berhasil dihapus.`
      );
      setDeletingTransaction(null);
    } catch (err: any) {
      showAlert('error', 'Gagal menghapus transaksi: ' + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  // Net Balance calculation
  let totalIncome = 0;
  let totalExpense = 0;
  transactions.forEach((t) => {
    if (t.type === 'income') totalIncome += t.amount;
    else totalExpense += t.amount;
  });
  const totalBalance = totalIncome - totalExpense;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 antialiased pb-20 md:pb-8">
      {/* Top Navigation */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          if (tab !== 'input' && editingTransaction) {
            setEditingTransaction(null);
          }
          setCurrentTab(tab);
        }}
        currentUser={currentUser}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        isAuthenticating={isAuthenticating}
        totalBalance={totalBalance}
      />

      {/* Floating System Notification Toast */}
      {appAlert && (
        <div className="fixed top-20 right-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200 max-w-sm">
          <div
            className={`p-3.5 rounded-2xl shadow-xl flex items-start gap-2.5 text-xs font-semibold border ${
              appAlert.type === 'success'
                ? 'bg-emerald-900 text-white border-emerald-700'
                : 'bg-red-900 text-white border-red-700'
            }`}
          >
            {appAlert.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-300 shrink-0 mt-0.5" />
            )}
            <p className="flex-1 leading-snug">{appAlert.message}</p>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Loading state for auth */}
        {isAuthLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <div className="w-8 h-8 border-3 border-emerald-800 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs font-medium text-slate-600">
              Memuat sesi akun & basis data...
            </p>
          </div>
        ) : !currentUser ? (
          /* Unauthenticated Landing / Google Login Callout */
          <div className="max-w-2xl mx-auto my-8">
            <div className="bg-white rounded-3xl border border-emerald-100 p-8 sm:p-10 shadow-sm text-center">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-800 to-emerald-600 text-white flex items-center justify-center mx-auto mb-5 shadow-lg shadow-emerald-900/10">
                <Wallet className="w-8 h-8" />
              </div>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 mb-3">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Catatan Pengeluaran & Saldo Harian
              </span>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Pencatatan Keuangan Digital Lengkap
              </h2>
              <p className="text-slate-600 text-xs sm:text-sm mt-3 leading-relaxed max-w-lg mx-auto">
                Kelola <strong>Pemasukan</strong> dan <strong>Pengeluaran</strong> Anda secara terintegrasi dengan perhitungan <strong>Saldo Otomatis</strong>, grafik arus kas, dan ekspor laporan ke Excel & PDF.
              </p>

              {/* Login Button */}
              <div className="mt-8">
                <button
                  type="button"
                  onClick={handleSignIn}
                  disabled={isAuthenticating}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-emerald-800 hover:bg-emerald-900 active:scale-95 text-white font-bold text-sm transition-all shadow-md flex items-center justify-center gap-3 mx-auto disabled:opacity-50"
                >
                  <LogIn className="w-5 h-5" />
                  {isAuthenticating
                    ? 'Menghubungkan Akun Google...'
                    : 'Masuk dengan Akun Google untuk Memulai'}
                </button>
              </div>

              {/* Feature Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10 pt-8 border-t border-slate-100 text-left">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-2 font-bold text-xs">
                    <ArrowDownLeft className="w-4 h-4 text-emerald-700" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">Pemasukan & Saldo</h4>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Catat penerimaan uang dan pantau saldo bersih keuangan harian Anda secara real-time.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-8 h-8 rounded-xl bg-red-100 text-red-600 flex items-center justify-center mb-2 font-bold text-xs">
                    <ArrowUpRight className="w-4 h-4 text-red-600" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">Kontrol Pengeluaran</h4>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Kategorikan belanjaan harian, amati grafik bulanan, dan cegah defisit keuangan.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center mb-2 font-bold text-xs">
                    <Database className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">Database Cloud Aman</h4>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Data Anda tersimpan permanen di Firestore, tidak akan hilang meskipun aplikasi ditutup.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Authenticated Application Views */
          <div>
            {currentTab === 'dashboard' && (
              <Dashboard
                transactions={transactions}
                onNavigateTab={(tab) => {
                  if (tab !== 'input' && editingTransaction) {
                    setEditingTransaction(null);
                  }
                  setCurrentTab(tab);
                }}
                onOpenInputWithType={handleOpenInputWithType}
                onEditTransaction={handleStartEdit}
              />
            )}

            {currentTab === 'input' && (
              <div className="max-w-2xl mx-auto">
                <ExpenseForm
                  initialData={editingTransaction}
                  defaultType={inputDefaultType}
                  onSubmit={handleFormSubmit}
                  onCancel={editingTransaction ? handleCancelEdit : undefined}
                  isSubmitting={isSubmittingForm}
                />
              </div>
            )}

            {currentTab === 'riwayat' && (
              <ExpenseList
                transactions={transactions}
                onEdit={handleStartEdit}
                onDeleteRequest={(item) => setDeletingTransaction(item)}
                onAddNewClick={(type) => handleOpenInputWithType(type || 'expense')}
              />
            )}

            {currentTab === 'laporan' && <Reports transactions={transactions} />}

            {currentTab === 'backup' && (
              <BackupRestore
                transactions={transactions}
                onDataRestored={() => {
                  showAlert('success', 'Data transaksi berhasil dipulihkan!');
                }}
              />
            )}
          </div>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deletingTransaction}
        item={deletingTransaction}
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingTransaction(null)}
      />
    </div>
  );
}
