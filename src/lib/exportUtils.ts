import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface ExportData {
  headers: string[];
  rows: (string | number)[][];
  title: string;
  filename: string;
}

export const exportToPDF = (data: ExportData) => {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(20);
  doc.text(data.title, 20, 20);
  
  // Add date
  doc.setFontSize(12);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 35);
  
  // Add table
  (doc as any).autoTable({
    head: [data.headers],
    body: data.rows,
    startY: 50,
    styles: {
      fontSize: 10,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [37, 99, 235], // Primary blue
      textColor: 255,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // Light gray
    },
  });
  
  doc.save(`${data.filename}_${new Date().toISOString().split('T')[0]}.pdf`);
};

export const exportToCSV = (data: ExportData) => {
  const csvContent = [
    data.headers.join(','),
    ...data.rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${data.filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

export const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};