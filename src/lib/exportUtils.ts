import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface ExportData {
  headers: string[];
  rows: (string | number)[][];
  title: string;
  filename: string;
}

export const exportToPDF = (data: ExportData) => {
  try {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text(data.title, 20, 20);
    
    // Add date
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 35);
    
    // Add table using autoTable
    doc.autoTable({
      head: [data.headers],
      body: data.rows,
      startY: 50,
      styles: {
        fontSize: 10,
        cellPadding: 3,
        textColor: [40, 40, 40],
      },
      headStyles: {
        fillColor: [37, 99, 235], // Primary blue
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252], // Light gray
      },
      margin: { top: 50, left: 20, right: 20 },
      theme: 'striped',
    });
    
    // Save the PDF
    doc.save(`${data.filename}_${new Date().toISOString().split('T')[0]}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Failed to generate PDF. Please try again.');
  }
};

export const exportToCSV = (data: ExportData) => {
  try {
    // Create CSV content with proper escaping
    const csvContent = [
      data.headers.join(','),
      ...data.rows.map(row => 
        row.map(cell => {
          // Convert to string and escape quotes
          const cellStr = String(cell || '');
          // If cell contains comma, quote, or newline, wrap in quotes and escape quotes
          if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
            return `"${cellStr.replace(/"/g, '""')}"`;
          }
          return cellStr;
        }).join(',')
      )
    ].join('\n');
    
    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${data.filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL object
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error generating CSV:', error);
    alert('Failed to generate CSV. Please try again.');
  }
};

export const formatCurrency = (amount: number) => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  } catch (error) {
    return `$${amount.toFixed(2)}`;
  }
};

export const formatDate = (date: string) => {
  try {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return new Date(date).toLocaleDateString();
  }
};

// Specialized export functions for different admin sections
export const exportProductsData = (products: any[]) => {
  const data: ExportData = {
    headers: ['Name', 'Category', 'Price', 'Stock', 'Featured', 'Created Date'],
    rows: products.map(product => [
      product.name || '',
      product.categories?.name || 'Uncategorized',
      formatCurrency(product.price || 0),
      product.stock_quantity?.toString() || '0',
      product.featured ? 'Yes' : 'No',
      formatDate(product.created_at)
    ]),
    title: 'Products Report',
    filename: 'products_report'
  };
  return data;
};

export const exportCategoriesData = (categories: any[]) => {
  const data: ExportData = {
    headers: ['Name', 'Description', 'Product Count', 'Created Date'],
    rows: categories.map(category => [
      category.name || '',
      category.description || '',
      category.product_count?.toString() || '0',
      formatDate(category.created_at)
    ]),
    title: 'Categories Report',
    filename: 'categories_report'
  };
  return data;
};

export const exportReviewsData = (reviews: any[]) => {
  const data: ExportData = {
    headers: ['Product', 'Author', 'Rating', 'Status', 'Comment', 'Date'],
    rows: reviews.map(review => [
      review.products?.name || 'Unknown Product',
      review.author_name || '',
      review.rating?.toString() || '0',
      review.verified ? 'Verified' : 'Pending',
      review.comment || '',
      formatDate(review.created_at)
    ]),
    title: 'Reviews Report',
    filename: 'reviews_report'
  };
  return data;
};

export const exportContactsData = (contacts: any[]) => {
  const data: ExportData = {
    headers: ['Name', 'Email', 'Subject', 'Status', 'Date'],
    rows: contacts.map(contact => [
      contact.name || '',
      contact.email || '',
      contact.subject || '',
      contact.read ? 'Read' : 'Unread',
      formatDate(contact.created_at)
    ]),
    title: 'Contact Messages Report',
    filename: 'contacts_report'
  };
  return data;
};

export const exportSubscribersData = (subscribers: any[]) => {
  const data: ExportData = {
    headers: ['Email', 'Status', 'Subscribed Date'],
    rows: subscribers.map(subscriber => [
      subscriber.email || '',
      subscriber.active ? 'Active' : 'Inactive',
      formatDate(subscriber.created_at)
    ]),
    title: 'Newsletter Subscribers Report',
    filename: 'subscribers_report'
  };
  return data;
};

export const exportInventoryData = (products: any[]) => {
  const data: ExportData = {
    headers: ['Product Name', 'SKU', 'Stock Quantity', 'Threshold', 'Status', 'Value'],
    rows: products.map(product => {
      const isLowStock = product.stock_quantity <= product.low_stock_threshold && product.stock_quantity > 0;
      const isOutOfStock = product.stock_quantity === 0;
      const status = isOutOfStock ? 'Out of Stock' : isLowStock ? 'Low Stock' : 'In Stock';
      
      return [
        product.name || '',
        product.sku || 'N/A',
        product.stock_quantity?.toString() || '0',
        product.low_stock_threshold?.toString() || '0',
        status,
        formatCurrency((product.stock_quantity || 0) * (product.price || 0))
      ];
    }),
    title: 'Inventory Report',
    filename: 'inventory_report'
  };
  return data;
};