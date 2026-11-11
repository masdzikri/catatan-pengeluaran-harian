import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { TransactionItem, getCategoryInfo } from '../types';
import { formatRupiah, formatIndonesianDate } from './formatters';

export function exportTransactionsToExcel(
  transactions: TransactionItem[],
  reportTitle: string = 'Laporan Keuangan',
  periodLabel: string = 'Semua Periode'
) {
  let totalIncome = 0;
  let totalExpense = 0;

  transactions.forEach((t) => {
    if (t.type === 'income') {
      totalIncome += t.amount;
    } else {
      totalExpense += t.amount;
    }
  });

  const saldo = totalIncome - totalExpense;

  // Prepare data rows
  const rows = transactions.map((item, index) => {
    const cat = getCategoryInfo(item.type, item.category);
    return {
      No: index + 1,
      Jenis: item.type === 'income' ? 'Pemasukan (+)' : 'Pengeluaran (-)',
      Tanggal: item.date,
      'Tanggal (Format Indonesia)': formatIndonesianDate(item.date),
      Kategori: cat.label,
      'Nominal (Rp)': item.amount,
      Keterangan: item.description,
    };
  });

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(rows, {
    header: [
      'No',
      'Jenis',
      'Tanggal',
      'Tanggal (Format Indonesia)',
      'Kategori',
      'Nominal (Rp)',
      'Keterangan',
    ],
  });

  // Append summary rows
  XLSX.utils.sheet_add_aoa(
    worksheet,
    [
      [],
      ['', '', '', '', 'TOTAL PEMASUKAN (+)', totalIncome, ''],
      ['', '', '', '', 'TOTAL PENGELUARAN (-)', totalExpense, ''],
      ['', '', '', '', 'SALDO AKHIR BERSIH', saldo, ''],
      ['', '', '', '', 'JUMLAH TRANSAKSI', transactions.length, ''],
    ],
    { origin: -1 }
  );

  // Set column widths
  worksheet['!cols'] = [
    { wch: 6 },  // No
    { wch: 18 }, // Jenis
    { wch: 14 }, // Tanggal
    { wch: 24 }, // Tanggal Format Indo
    { wch: 22 }, // Kategori
    { wch: 18 }, // Nominal
    { wch: 35 }, // Keterangan
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Catatan_Keuangan');

  const safeFilename = `${reportTitle.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, safeFilename);
}

// Backward compatible export function alias
export const exportExpensesToExcel = exportTransactionsToExcel;

export function exportTransactionsToPDF(
  transactions: TransactionItem[],
  reportTitle: string = 'Laporan Arus Keuangan & Saldo',
  periodLabel: string = 'Semua Periode'
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  let totalIncome = 0;
  let totalExpense = 0;

  transactions.forEach((t) => {
    if (t.type === 'income') {
      totalIncome += t.amount;
    } else {
      totalExpense += t.amount;
    }
  });

  const saldo = totalIncome - totalExpense;

  // Header Banner Background (Deep Forest Green)
  doc.setFillColor(6, 78, 59); // #064E3B
  doc.rect(0, 0, 210, 36, 'F');

  // Title Text
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('CATATAN KEUANGAN & SALDO HARIAN', 14, 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(209, 250, 229);
  doc.text(`${reportTitle} - Periode: ${periodLabel}`, 14, 21);

  const printDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  doc.setFontSize(8);
  doc.setTextColor(167, 243, 208);
  doc.text(`Waktu cetak: ${printDate} WIB`, 14, 29);

  // Summary Metrics Box
  doc.setFillColor(248, 250, 252); // slate-50
  doc.roundedRect(14, 42, 182, 22, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 42, 182, 22, 2, 2, 'S');

  // Pemasukan
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Total Pemasukan:', 18, 49);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(5, 150, 105);
  doc.text(`+${formatRupiah(totalIncome)}`, 18, 56);

  // Pengeluaran
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Total Pengeluaran:', 76, 49);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(220, 38, 38);
  doc.text(`-${formatRupiah(totalExpense)}`, 76, 56);

  // Sisa Saldo
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Sisa Saldo Bersih:', 134, 49);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(saldo >= 0 ? 6 : 185, saldo >= 0 ? 78 : 28, saldo >= 0 ? 59 : 28);
  doc.text(formatRupiah(saldo), 134, 56);

  // Generate Table
  const tableData = transactions.map((item, index) => {
    const isInc = item.type === 'income';
    const cat = getCategoryInfo(item.type, item.category);
    return [
      index + 1,
      formatIndonesianDate(item.date),
      isInc ? 'Pemasukan' : 'Pengeluaran',
      cat.label,
      `${isInc ? '+' : '-'}${formatRupiah(item.amount)}`,
      item.description,
    ];
  });

  autoTable(doc, {
    startY: 69,
    head: [['No', 'Tanggal', 'Jenis', 'Kategori', 'Nominal', 'Keterangan']],
    body: tableData,
    foot: [
      [
        '',
        '',
        'RINGKASAN',
        `Masuk: ${formatRupiah(totalIncome)} | Keluar: ${formatRupiah(totalExpense)}`,
        `Saldo: ${formatRupiah(saldo)}`,
        `${transactions.length} transaksi`,
      ],
    ],
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2.8,
      textColor: [30, 41, 59],
    },
    headStyles: {
      fillColor: [6, 78, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    footStyles: {
      fillColor: [240, 253, 244],
      textColor: [6, 78, 59],
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 9, halign: 'center' },
      1: { cellWidth: 26 },
      2: { cellWidth: 22 },
      3: { cellWidth: 32 },
      4: { cellWidth: 30, halign: 'right' },
      5: { cellWidth: 'auto' },
    },
  });

  const safeFilename = `${reportTitle.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(safeFilename);
}

// Backward compatible export function alias
export const exportExpensesToPDF = exportTransactionsToPDF;
