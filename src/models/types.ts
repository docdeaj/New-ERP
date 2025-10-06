export type InvoiceStatus = 'Paid' | 'Pending' | 'Overdue' | 'Draft';
export type QuotationStatus = 'Sent' | 'Accepted' | 'Declined' | 'Draft';
export type PurchaseOrderStatus = 'Ordered' | 'Shipped' | 'Received' | 'Cancelled' | 'Partial';
export type ChequeStatus = 'Pending' | 'Cleared' | 'Bounced' | 'Deposited';
export type ReceiptPaymentMethod = 'Cash' | 'Card' | 'Cheque';
export type ExpenseStatus = 'Paid' | 'Unpaid';
export type LocationKey = 'mainWarehouse' | 'downtownStore' | 'online';

export interface LineItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: number;
  invoiceNumber: string;
  customerName: string;
  amount: number; // This will be the grand total
  issueDate: string; // ISO string format
  dueDate: string;   // ISO string format
  status: InvoiceStatus;
  customerAvatarUrl?: string;
  lineItems?: LineItem[];
  subtotal?: number;
  tax?: number;
  totalPaid: number;
  balance: number;
}

export interface Expense {
  id: number;
  category: string;
  amount: number;
  date: string;
  vendor: string;
  status: ExpenseStatus;
  notes?: string;
}

export interface RecurringExpense {
  id: number;
  description: string;
  category: string;
  amount: number;
  cadence: 'Daily' | 'Weekly' | 'Monthly' | 'Yearly';
  nextDueDate: string;
  vendor: string;
}

export interface Quotation {
  id: number;
  quotationNumber: string;
  customerName: string;
  amount: number; // This will be the grand total
  issueDate: string;
  expiryDate: string;
  status: QuotationStatus;
  customerAvatarUrl?: string;
  items?: LineItem[];
  subtotal?: number;
  tax?: number;
}

export interface Receipt {
  id: number;
  receiptNumber: string;
  invoiceId: number;
  invoiceNumber: string;
  customerName: string;
  amount: number;
  paymentDate: string;
  method: ReceiptPaymentMethod;
}

export interface Cheque {
  id: number;
  chequeNumber: string;
  bank: string;
  payee: string; // From
  payer: string; // To
  amount: number;
  chequeDate: string;
  status: ChequeStatus;
}

export interface PurchaseOrder {
  id: number;
  poNumber: string;
  supplierName: string;
  amount: number; // This will be the grand total
  orderDate: string;
  expectedDate: string;
  status: PurchaseOrderStatus;
  lineItems?: LineItem[];
  subtotal?: number;
  tax?: number;
}

export type ContactType = 'Customer' | 'Supplier';
export interface Contact {
  id: number;
  name: string;
  type: ContactType;
  email: string;
  phone: string;
  avatarUrl: string;
}

export interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
  price: number;
  cost: number;
  imageUrl: string;
  stock: {
    [key in LocationKey]: number;
  };
  committed: {
    [key in LocationKey]: number;
  };
  flags?: {
    price_below_cost?: boolean;
  };
}

export interface CartItem {
  id: number;
  name: string;
  sku: string;
  price: number;
  imageUrl: string;
  quantity: number;
  flags?: {
    price_below_cost?: boolean;
  };
}

export interface InventoryItem {
  id: number;
  productId: number;
  productName: string;
  sku: string;
  imageUrl: string;
  onHand: {
    [key in LocationKey]: number;
  };
  committed: {
    [key in LocationKey]: number;
  };
}

export interface Kpi {
  value: number;
  delta: number; // percentage change
}

export interface MediaItem {
  id: string;
  name: string;
  url: string;
  size: number; // in bytes
  type: string; // e.g., 'image/jpeg'
  createdAt: string;
}

export interface DailyReport {
  totalSales: number;
  totalExpenses: number;
  net: number;
  cashSales: number;
  nonCashSales: number;
  chequesPending: number;
}