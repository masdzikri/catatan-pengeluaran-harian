import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { TransactionItem, TransactionType } from './types';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore with custom database ID
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Periksa koneksi atau konfigurasi Firebase.');
    }
    return true;
  }
}

export async function signInWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Google Sign In Error:', error);
    throw error;
  }
}

export async function logOut(): Promise<void> {
  await firebaseSignOut(auth);
}

// Generate valid alphanumeric ID matching '^[a-zA-Z0-9_\-]+$'
export function generateTransactionId(prefix: 'exp_' | 'inc_' = 'exp_'): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = prefix;
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Add Expense
export async function addExpenseToFirestore(
  userId: string,
  data: { date: string; amount: number; description: string; category: string }
): Promise<string> {
  const expenseId = generateTransactionId('exp_');
  const path = `expenses/${expenseId}`;
  try {
    const expenseDocRef = doc(db, 'expenses', expenseId);
    await setDoc(expenseDocRef, {
      userId,
      date: data.date,
      amount: Number(data.amount),
      description: data.description.trim(),
      category: data.category,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return expenseId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// Update Expense
export async function updateExpenseInFirestore(
  expenseId: string,
  userId: string,
  data: { date: string; amount: number; description: string; category: string }
): Promise<void> {
  const path = `expenses/${expenseId}`;
  try {
    const expenseDocRef = doc(db, 'expenses', expenseId);
    await updateDoc(expenseDocRef, {
      date: data.date,
      amount: Number(data.amount),
      description: data.description.trim(),
      category: data.category,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// Delete Expense
export async function deleteExpenseFromFirestore(expenseId: string): Promise<void> {
  const path = `expenses/${expenseId}`;
  try {
    const expenseDocRef = doc(db, 'expenses', expenseId);
    await deleteDoc(expenseDocRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Add Income
export async function addIncomeToFirestore(
  userId: string,
  data: { date: string; amount: number; description: string; category: string }
): Promise<string> {
  const incomeId = generateTransactionId('inc_');
  const path = `incomes/${incomeId}`;
  try {
    const incomeDocRef = doc(db, 'incomes', incomeId);
    await setDoc(incomeDocRef, {
      userId,
      date: data.date,
      amount: Number(data.amount),
      description: data.description.trim(),
      category: data.category,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return incomeId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// Update Income
export async function updateIncomeInFirestore(
  incomeId: string,
  userId: string,
  data: { date: string; amount: number; description: string; category: string }
): Promise<void> {
  const path = `incomes/${incomeId}`;
  try {
    const incomeDocRef = doc(db, 'incomes', incomeId);
    await updateDoc(incomeDocRef, {
      date: data.date,
      amount: Number(data.amount),
      description: data.description.trim(),
      category: data.category,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// Delete Income
export async function deleteIncomeFromFirestore(incomeId: string): Promise<void> {
  const path = `incomes/${incomeId}`;
  try {
    const incomeDocRef = doc(db, 'incomes', incomeId);
    await deleteDoc(incomeDocRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Unified Delete
export async function deleteTransaction(type: TransactionType, id: string): Promise<void> {
  if (type === 'income') {
    await deleteIncomeFromFirestore(id);
  } else {
    await deleteExpenseFromFirestore(id);
  }
}

// Subscribe to both Expenses and Incomes in real-time
export function subscribeToTransactions(
  userId: string,
  onUpdate: (expenses: TransactionItem[], incomes: TransactionItem[]) => void,
  onError: (error: any) => void
) {
  let latestExpenses: TransactionItem[] = [];
  let latestIncomes: TransactionItem[] = [];

  const expensesQuery = query(
    collection(db, 'expenses'),
    where('userId', '==', userId),
    orderBy('date', 'desc')
  );

  const incomesQuery = query(
    collection(db, 'incomes'),
    where('userId', '==', userId),
    orderBy('date', 'desc')
  );

  const unsubExpenses = onSnapshot(
    expensesQuery,
    (snapshot) => {
      const items: TransactionItem[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        items.push({
          id: docSnap.id,
          userId: d.userId,
          type: 'expense',
          date: d.date,
          amount: Number(d.amount) || 0,
          description: d.description || '',
          category: d.category || 'lainnya',
          createdAt: d.createdAt,
          updatedAt: d.updatedAt,
        });
      });
      latestExpenses = items;
      onUpdate(latestExpenses, latestIncomes);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'expenses');
      onError(err);
    }
  );

  const unsubIncomes = onSnapshot(
    incomesQuery,
    (snapshot) => {
      const items: TransactionItem[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        items.push({
          id: docSnap.id,
          userId: d.userId,
          type: 'income',
          date: d.date,
          amount: Number(d.amount) || 0,
          description: d.description || '',
          category: d.category || 'lainnya',
          createdAt: d.createdAt,
          updatedAt: d.updatedAt,
        });
      });
      latestIncomes = items;
      onUpdate(latestExpenses, latestIncomes);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'incomes');
      onError(err);
    }
  );

  return () => {
    unsubExpenses();
    unsubIncomes();
  };
}
