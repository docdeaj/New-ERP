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
  lineItems?: LineItem[];
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
  tags?: string[];
  stats?: {
    open_invoices?: number;
    balance_lkr?: number;
    total_sales_lkr?: number;
    open_pos?: number;
    total_purchases_lkr?: number;
  };
}

export interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
  price: number;
  cost: number;
  imageUrl: string;
  description?: string;
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
  description?: string;
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

export interface CashflowSnapshot {
  invoices: { issued: Kpi; paid: Kpi; outstanding: Kpi };
  expenses: Kpi;
  net: Kpi;
  series: {
    invoices: number[];
    expenses: number[];
    net: number[];
  };
}

export interface MediaItem {
  id: string;
  name: string;
  url: string;
  size: number; // in bytes
  type: 'image' | 'video' | 'document';
  mimeType: string; // e.g., 'image/jpeg'
  createdAt: string;
  width?: number;
  height?: number;
  alt?: string;
  tags?: string[];
}

export interface DailyReport {
  totalSales: number;
  totalExpenses: number;
  net: number;
  cashSales: number;
  nonCashSales: number;
  chequesPending: number;
}

// --- Notifications ---
export type NotificationType = 'invoice' | 'stock' | 'system' | 'purchase_order' | 'mention' | 'cheque' | 'quotation';
export type NotificationPriority = 'high' | 'medium' | 'low';

export interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  body: string;
  createdAt: string; // ISO string
  read: boolean;
  link?: string;
  priority: NotificationPriority;
}

// --- Calendar Widget Types ---
export type CalendarEventType = 'receivable' | 'recurring_expense' | 'cheque' | 'po_eta' | 'holiday' | 'reminder';
export type CalendarEventColor = 'emerald' | 'orange' | 'violet' | 'blue' | 'slate' | 'cyan';

export interface CalendarEvent {
  id: string; // e.g., 'invoice-2', 'recurring-1'
  type: CalendarEventType;
  date: string; // ISO string for the date part YYYY-MM-DD
  title: string;
  secondary?: string; // customer/supplier/category etc.
  amount_lkr?: number;
  color_hint: CalendarEventColor;
  meta?: {
    invoice_id?: number;
    po_id?: number;
    // ... other metadata
  };
}

// --- Reports Page Types ---
export interface ReportSummary {
  grossSales: Kpi;
  netSales: Kpi;
  cogs: Kpi;
  grossMargin: Kpi & { percentage: number };
  netProfit: Kpi;
  expenses: Kpi;
  paymentMix: { label: string; value: number; }[];
  arToday: { count: number; amount: number; overdueCount: number; };
}

export interface SalesTrend {
  labels: string[];
  datasets: { label: string, data: number[] }[];
}

export interface TopProductReport {
  id: number;
  name: string;
  sku: string;
  imageUrl: string;
  quantity: number;
  revenue: number;
  price: number;
}

export interface ArAgingRow {
  id: number;
  customerName: string;
  customerAvatarUrl: string;
  bucket_0_30: number;
  bucket_31_60: number;
  bucket_61_90: number;
  bucket_90_plus: number;
  total: number;
}

export interface ApAgingRow {
  id: number;
  supplierName: string;
  supplierAvatarUrl: string;
  bucket_0_30: number;
  bucket_31_60: number;
  bucket_61_90: number;
  bucket_90_plus: number;
  total: number;
}

export interface SlowMover {
  id: number;
  productName: string;
  sku: string;
  imageUrl: string;
  daysSinceLastSale: number;
  onHand: number;
}

export interface InventorySnapshot {
  valuationLkr: Kpi;
  turnProxy: Kpi;
  slowMovers: SlowMover[];
}

export interface RecurringForecastRow {
  id: number;
  name: string;
  cadence: 'Daily' | 'Weekly' | 'Monthly' | 'Yearly';
  nextDueDate: string;
  amount: number;
}

export interface TaxSummaryRow {
  id: number;
  rate: string;
  taxableSales: number;
  taxCollected: number;
}

// --- NEW DYNAMIC REPORTING TYPES ---

export interface SchemaField {
  key: string;
  label: string;
  group: string;
  type: 'string' | 'currency' | 'date' | 'number';
}

export interface ReportSchema {
  dimensions: SchemaField[];
  metrics: SchemaField[];
}

export interface SortDefinition {
  field: string;
  direction: 'asc' | 'desc';
}

// Represents a user-defined query
export interface ReportQuery {
  dimensions: string[]; // e.g., ['customer.name', 'date.month']
  metrics: string[];    // e.g., ['net_sales', 'cogs']
  filters: { field: string; operator: string; value: any; }[];
  sortBy: SortDefinition[];
}

// Represents a saved report configuration
export interface ReportView {
  id: string;
  name: string;
  description: string;
  query: ReportQuery;
  visualizationType: 'table' | 'bar' | 'pivot' | 'donut' | 'line';
  owner: {
    name: string;
    avatarUrl: string;
  };
  lastRun: string; // ISO string
  isFavorite: boolean;
}

// Represents the API response for a report run
export interface ReportResult {
  meta: { columns: { key: string; label: string; type: 'string' | 'currency' | 'date' | 'number' }[] };
  data: Record<string, any>[];
  queryExecutionTime: number;
}

// --- LOGS ---
export type LogSeverity = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';

export interface LogEntry {
  id: string;
  timestamp: string; // ISO string
  severity: LogSeverity;
  message: string;
  source: string; // e.g., 'api-gateway', 'database', 'frontend'
  service: string; // e.g., 'auth-service', 'payment-processor'
  attributes: Record<string, any>;
  traceId?: string;
  spanId?: string;
}