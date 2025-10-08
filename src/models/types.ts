// --- CORE ENTITIES ---

export type ContactType = 'customer' | 'supplier';
export interface Contact {
  id: string;
  tenant_id: string;
  type: ContactType;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
  stats?: {
    open_invoices?: number;
    balance_lkr?: number; // In cents
  };
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export type LocationKey = 'mainWarehouse' | 'downtownStore' | 'online';

export interface Product {
  id: string;
  tenant_id: string;
  sku: string;
  name: string;
  price_lkr: number; // In cents
  cost_lkr: number; // In cents
  image_url?: string;
  width_mm?: number;
  height_mm?: number;
  depth_mm?: number;
  onHand: { [key in LocationKey]: number };
  committed: { [key in LocationKey]: number };
  created_at: string;
  updated_at: string;
}

export interface LineItem {
  product_id: string;
  name: string;
  sku: string;
  qty: number;
  unit_price_lkr: number; // In cents
  line_discount_lkr?: number; // In cents
}

export interface DocBase {
  id: string;
  tenant_id: string;
  number: string;
  party_id: string;
  issue_date: string; // ISO string
  status: string;
  currency: 'LKR';
  tax_rate: number; // e.g., 10 for 10%
  discount_lkr?: number; // In cents
  items: LineItem[];
  subtotal_lkr: number; // In cents
  tax_lkr: number; // In cents
  total_lkr: number; // In cents
  notes?: string;
  created_by: string; // User ID
  created_at: string; // ISO string
  updated_at: string; // ISO string

  // Denormalized fields for UI convenience
  partyName?: string;
  partyAvatarUrl?: string;
}

export type InvoiceStatus = 'Paid' | 'Pending' | 'Overdue' | 'Draft';
export interface Invoice extends DocBase {
  due_date: string; // ISO string
  paid_lkr: number; // In cents
  balance_lkr: number; // In cents
  status: InvoiceStatus;
}

export type QuotationStatus = 'Sent' | 'Accepted' | 'Declined' | 'Draft';
export interface Quotation extends DocBase {
  due_date: string; // Expiry date
  status: QuotationStatus;
}

export type PurchaseOrderStatus = 'Ordered' | 'Shipped' | 'Received' | 'Cancelled' | 'Partial';
export interface PurchaseOrder extends DocBase {
  due_date: string; // Expected date
  status: PurchaseOrderStatus;
}

export type ReceiptPaymentMethod = 'cash' | 'card' | 'cheque';
export interface Receipt {
  id: string;
  tenant_id: string;
  invoice_id: string;
  amount_lkr: number; // In cents
  method: ReceiptPaymentMethod;
  created_at: string;
  created_by: string;

  // Denormalized fields
  invoice_number?: string;
  partyName?: string;
  number: string; // receipt number
  issue_date: string; // payment date
}

export interface Expense {
  id: string;
  tenant_id: string;
  date: string;
  category: string;
  amount_lkr: number; // In cents
  tax_lkr?: number; // In cents
  note?: string;
  vendor?: string;
  status?: string; // e.g. 'reimbursed'
  attachment_id?: string;
  created_at: string;
}

export type RecurringCadence = 'daily' | 'weekly' | 'monthly' | 'yearly';
export interface RecurringExpense {
  id: string;
  tenant_id: string;
  description: string;
  vendor?: string;
  category: string;
  amount: number;
  cadence: RecurringCadence;
  nextDueDate: string;
  enabled: boolean;
}

export interface Recurring {
  id: string;
  tenant_id: string;
  kind: 'invoice' | 'expense';
  cadence: RecurringCadence;
  next_due: string;
  template: any; // Invoice or Expense draft
  enabled: boolean;
}

export type NotificationPriority = 'high' | 'medium' | 'low';
export type NotificationType = 'invoice' | 'stock' | 'system' | 'purchase_order' | 'mention' | 'cheque' | 'quotation' | 'billing';

export interface Notification {
  id: string;
  tenant_id: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  created_at: string;
  link?: string;
  priority: NotificationPriority;
}

export type ChequeStatus = 'Pending' | 'Cleared' | 'Bounced' | 'Deposited';
export interface Cheque {
  id: string;
  chequeNumber: string;
  bank: string;
  payee: string; // From
  payer: string; // To
  amount_lkr: number;
  chequeDate: string;
  status: ChequeStatus;
}


// --- UI & TRANSIENT TYPES ---

export interface CartItem {
  id: string;
  name: string;
  sku: string;
  price_lkr: number; // In cents
  image_url?: string;
  quantity: number;
  cost_lkr: number; // In cents
  flags?: {
    price_below_cost?: boolean;
  };
}

export interface InventoryItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  imageUrl: string;
  onHand: { [key in LocationKey]: number };
  committed: { [key in LocationKey]: number };
}

export interface Kpi {
  value: number;
  delta: number; // percentage change
  previousValue?: number;
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

// --- Notifications ---
export interface AppNotification {
  id: string;
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
  id: string;
  type: CalendarEventType;
  date: string; // YYYY-MM-DD
  title: string;
  secondary?: string;
  amount_lkr?: number;
  color_hint: CalendarEventColor;
  meta?: { [key: string]: any };
}

// --- Reports Page Types ---

export interface ReportSummary {
  totalSales: number;
  totalExpenses: number;
  netIncome: number;
  topCustomer: { name: string; value: number };
}

export interface SalesTrend {
  labels: string[];
  datasets: { label: string; data: number[] }[];
}

export interface TopProductReport {
  id: string;
  name: string;
  sku: string;
  imageUrl: string;
  quantity: number;
  revenue_lkr: number;
  price_lkr: number;
}

export interface ArAgingRow {
  id: string;
  customerName: string;
  customerAvatarUrl: string;
  bucket_0_30: number;
  bucket_31_60: number;
  bucket_61_90: number;
  bucket_90_plus: number;
  total: number;
}

export interface SalesByCustomerRow {
  id: string;
  customerName: string;
  customerAvatarUrl: string;
  totalSales: number;
  invoiceCount: number;
  lastSaleDate: string;
}

export interface ApAgingRow {
  id: string;
  supplierName: string;
  supplierAvatarUrl: string;
  bucket_0_30: number;
  bucket_31_60: number;
  bucket_61_90: number;
  bucket_90_plus: number;
  total: number;
}

export interface PnlRow {
  category: string; // e.g., 'Total Revenue', 'Cost of Goods Sold'
  isHeader: boolean;
  isTotal: boolean;
  items: {
    label: string;
    amount: number;
    isSubtotal?: boolean;
  }[];
}

export interface BalanceSheetRow {
    category: 'Assets' | 'Liabilities' | 'Equity';
    isHeader: boolean;
    isTotal: boolean;
    items: {
        label: string;
        amount: number;
        isSubtotal?: boolean;
    }[];
}

export interface PurchasesBySupplierRow {
    id: string;
    supplierName: string;
    supplierAvatarUrl: string;
    poCount: number;
    totalPurchases: number;
}


export interface InventoryValuationRow {
  id: string;
  productName: string;
  sku: string;
  onHand: number;
  costPerUnit: number;
  totalValue: number;
}

export interface StockOnHandRow {
  id: string;
  productName: string;
  sku: string;
  mainWarehouse: number;
  downtownStore: number;
  online: number;
  totalOnHand: number;
}

export interface SalesByProductRow {
  id: string;
  productName: string;
  sku: string;
  quantitySold: number;
  totalRevenue: number;
  avgPrice: number;
}

export interface InventorySnapshot {
  totalValue: number;
  totalItems: number;
  slowMovers: SlowMover[];
}

export interface SlowMover {
  id: string;
  name: string;
  sku: string;
  daysSinceLastSale: number;
}

export interface RecurringForecastRow {
  month: string;
  expense_total: number;
  invoice_total: number;
  net: number;
}

export interface TaxSummaryRow {
  period: string;
  taxable_sales: number;
  tax_collected: number;
  taxable_purchases: number;
  tax_paid: number;
  net_tax_due: number;
}

export interface CashFlowStatementRow {
    category: 'Operating' | 'Investing' | 'Financing' | 'Summary';
    isHeader: boolean;
    isTotal: boolean;
    items: {
        label: string;
        amount: number;
        isSubtotal?: boolean;
    }[];
}

export interface TrialBalanceRow {
    account: string;
    debit: number;
    credit: number;
}

export interface GeneralLedgerEntry {
    date: string;
    account: string;
    description: string;
    debit: number;
    credit: number;
    balance: number;
}


export interface ReportView {
  id: string;
  name: string;
  description: string;
  owner: { name: string; avatarUrl: string };
  lastRun: string;
  isFavorite: boolean;
  query: ReportQuery;
  visualizationType: 'table' | 'bar' | 'pivot' | 'donut' | 'line';
}

export interface ReportQuery {
  dimensions: string[];
  metrics: string[];
  filters: any[];
  sortBy: SortDefinition[];
}

export interface SortDefinition {
  field: string;
  direction: 'asc' | 'desc';
}

export interface ReportResult {
  query: ReportQuery;
  meta: {
    columns: { key: string; label: string; type: 'string' | 'currency' | 'date' | 'number' }[];
  };
  data: Record<string, any>[];
}

export interface ReportSchema {
  dimensions: SchemaField[];
  metrics: SchemaField[];
}

export interface SchemaField {
  key: string;
  label: string;
  group: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  description: string;
}

// --- LOGS ---
export type LogSeverity = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';

export interface LogEntry {
  id: string;
  timestamp: string;
  severity: LogSeverity;
  message: string;
  source: string;
  service: string;
  attributes: Record<string, any>;
  traceId?: string;
  spanId?: string;
}

export type PrintableDocument = Invoice | Quotation | PurchaseOrder | Receipt;
