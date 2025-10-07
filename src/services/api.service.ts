import { Injectable, signal } from '@angular/core';
import { Invoice, Product, Contact, Kpi, InventoryItem, Quotation, Receipt, Cheque, PurchaseOrder, MediaItem, DailyReport, Expense, ReceiptPaymentMethod, LineItem, RecurringExpense, LocationKey, ReportSummary, SalesTrend, TopProductReport, ArAgingRow, ApAgingRow, InventorySnapshot, SlowMover, RecurringForecastRow, TaxSummaryRow, ReportView, ReportQuery, ReportResult, ReportSchema, LogEntry, LogSeverity, CashflowSnapshot, QuotationStatus } from '../models/types';

let MOCK_INVOICES: Invoice[] = [
  { id: 1, invoiceNumber: 'INV-2024-001', customerName: 'Tech Innovators Inc.', customerAvatarUrl: 'https://picsum.photos/seed/1/40/40', amount: 15000.00, issueDate: '2024-07-20', dueDate: '2024-08-19', status: 'Paid', totalPaid: 15000, balance: 0, lineItems: [{productId: 1, productName: 'Wireless Mouse', quantity: 5, unitPrice: 3000, total: 15000}] },
  { id: 2, invoiceNumber: 'INV-2024-002', customerName: 'Creative Solutions', customerAvatarUrl: 'https://picsum.photos/seed/2/40/40', amount: 8500.50, issueDate: '2024-07-18', dueDate: '2024-08-17', status: 'Overdue', totalPaid: 0, balance: 8500.50 },
  { id: 3, invoiceNumber: 'INV-2024-003', customerName: 'Global Exports', customerAvatarUrl: 'https://picsum.photos/seed/3/40/40', amount: 250000.00, issueDate: '2024-07-15', dueDate: '2024-07-30', status: 'Pending', totalPaid: 150000, balance: 100000 },
  { id: 4, invoiceNumber: 'INV-2024-004', customerName: 'Local Supplies Co.', customerAvatarUrl: 'https://picsum.photos/seed/4/40/40', amount: 5000.00, issueDate: '2024-07-22', dueDate: '2024-08-21', status: 'Pending', totalPaid: 0, balance: 5000.00 },
  { id: 5, invoiceNumber: 'INV-2024-005', customerName: 'Colombo Traders', customerAvatarUrl: 'https://picsum.photos/seed/coltraders/40/40', amount: 45000.00, issueDate: '2024-07-25', dueDate: '2024-07-30', status: 'Pending', totalPaid: 0, balance: 45000.00 },
];

let MOCK_PRODUCTS: Product[] = [
    { id: 1, name: 'Wireless Mouse', sku: 'WM-101', category: 'Electronics', price: 2000, cost: 800, description: 'Sleek, ergonomic wireless mouse with long-lasting battery life for ultimate productivity.', stock: { mainWarehouse: 50, downtownStore: 15, online: 30 }, committed: { mainWarehouse: 10, downtownStore: 5, online: 15}, imageUrl: 'https://picsum.photos/seed/p1/200/200', flags: { price_below_cost: false } },
    { id: 2, name: 'Mechanical Keyboard', sku: 'MK-202', category: 'Electronics', price: 10000, cost: 4500, description: 'Experience tactile typing with this durable mechanical keyboard featuring customizable RGB backlighting.', stock: { mainWarehouse: 30, downtownStore: 10, online: 15 }, committed: { mainWarehouse: 5, downtownStore: 2, online: 8}, imageUrl: 'https://picsum.photos/seed/p2/200/200', flags: { price_below_cost: false } },
    { id: 3, name: 'USB-C Hub', sku: 'UH-303', category: 'Accessories', price: 4000, cost: 1800, description: 'Expand your connectivity with this compact 7-in-1 USB-C hub, perfect for modern laptops.', stock: { mainWarehouse: 80, downtownStore: 25, online: 40 }, committed: { mainWarehouse: 20, downtownStore: 10, online: 20}, imageUrl: 'https://picsum.photos/seed/p3/200/200', flags: { price_below_cost: false } },
    { id: 4, name: '4K Webcam', sku: 'WC-401', category: 'Electronics', price: 8500, cost: 9000, description: 'Crystal-clear 4K resolution for professional video calls and streaming.', stock: { mainWarehouse: 25, downtownStore: 5, online: 10 }, committed: { mainWarehouse: 25, downtownStore: 5, online: 10}, imageUrl: 'https://picsum.photos/seed/p4/200/200', flags: { price_below_cost: true } },
    { id: 5, name: 'Ergonomic Chair', sku: 'EC-505', category: 'Furniture', price: 25000, cost: 11000, description: 'Support your back and improve posture with this fully adjustable ergonomic office chair.', stock: { mainWarehouse: 15, downtownStore: 5, online: 0 }, committed: { mainWarehouse: 2, downtownStore: 1, online: 0}, imageUrl: 'https://picsum.photos/seed/p5/200/200', flags: { price_below_cost: false } },
];

let MOCK_EXPENSES: Expense[] = [
    { id: 1, category: 'Utilities', amount: 15000, date: '2024-07-20', vendor: 'Electricity Board', status: 'Paid', notes: 'Monthly electricity bill for the office premises.' },
    { id: 2, category: 'Rent', amount: 75000, date: '2024-07-01', vendor: 'City Properties', status: 'Paid', notes: 'Office rent for July.' },
    { id: 3, category: 'Office Supplies', amount: 8500, date: '2024-07-22', vendor: 'Stationery World', status: 'Paid', notes: 'Pens, paper, and other office supplies.' },
    { id: 4, category: 'Marketing', amount: 25000, date: '2024-07-25', vendor: 'Facebook Ads', status: 'Paid', notes: 'Social media campaign for July.' },
    { id: 5, category: 'Maintenance', amount: 3000, date: '2024-07-26', vendor: 'CleanCo', status: 'Unpaid', notes: 'Weekly cleaning service fee.' }
];

let MOCK_RECURRING_EXPENSES: RecurringExpense[] = [
  { id: 1, description: 'SaaS Subscription', category: 'Software', amount: 5000, cadence: 'Monthly', nextDueDate: '2024-08-15', vendor: 'CloudCorp' },
  { id: 2, description: 'Office Rent', category: 'Rent', amount: 75000, cadence: 'Monthly', nextDueDate: '2024-08-01', vendor: 'City Properties' },
  { id: 3, description: 'Weekly Cleaning Service', category: 'Maintenance', amount: 3000, cadence: 'Weekly', nextDueDate: '2024-07-26', vendor: 'CleanCo' },
  { id: 4, description: 'Domain Renewal', category: 'Web', amount: 1500, cadence: 'Yearly', nextDueDate: '2024-07-30', vendor: 'GoDaddy' }
];

let MOCK_INVENTORY: InventoryItem[] = MOCK_PRODUCTS.map((p) => ({
    id: p.id, productId: p.id, productName: p.name, sku: p.sku, imageUrl: p.imageUrl, onHand: p.stock, committed: p.committed, description: p.description
}));

let MOCK_QUOTATIONS: Quotation[] = [
  { id: 1, quotationNumber: 'QUO-2024-001', customerName: 'Pixel Perfect Designs', customerAvatarUrl: 'https://picsum.photos/seed/q1/40/40', amount: 44000, issueDate: '2024-07-28', expiryDate: '2024-08-12', status: 'Sent', lineItems: [{ productId: 3, productName: 'USB-C Hub', quantity: 10, unitPrice: 4000, total: 40000 }], subtotal: 40000, tax: 4000 },
];

let MOCK_RECEIPTS: Receipt[] = [
  { id: 1, receiptNumber: 'REC-2024-001', invoiceId: 1, invoiceNumber: 'INV-2024-001', customerName: 'Tech Innovators Inc.', amount: 15000, paymentDate: '2024-07-22', method: 'Card' },
  { id: 3, receiptNumber: 'REC-2024-003', invoiceId: 3, invoiceNumber: 'INV-2024-003', customerName: 'Global Exports', amount: 150000, paymentDate: '2024-07-28', method: 'Cash' },
];

let MOCK_CHEQUES: Cheque[] = [
  { id: 2, chequeNumber: '654321', bank: 'Commercial Bank', payee: 'Global Exports', payer: 'Aurora ERP', amount: 100000, chequeDate: '2024-08-05', status: 'Pending' },
  { id: 3, chequeNumber: '789012', bank: 'Sampath Bank', payee: 'Stationery World', payer: 'Aurora ERP', amount: 8500, chequeDate: '2024-07-30', status: 'Pending' },
];

let MOCK_PURCHASE_ORDERS: PurchaseOrder[] = [
  { id: 1, poNumber: 'PO-2024-001', supplierName: 'Global Tech Suppliers', amount: 130000, orderDate: '2024-07-15', expectedDate: '2024-08-15', status: 'Ordered', lineItems: [{ productId: 1, productName: 'Wireless Mouse', quantity: 50, unitPrice: 800, total: 40000 }, { productId: 2, productName: 'Mechanical Keyboard', quantity: 20, unitPrice: 4500, total: 90000 }] },
  { id: 2, poNumber: 'PO-2024-002', supplierName: 'Office Essentials Ltd.', amount: 45000, orderDate: '2024-07-20', expectedDate: '2024-07-28', status: 'Received', lineItems: [{ productId: 3, productName: 'USB-C Hub', quantity: 25, unitPrice: 1800, total: 45000 }] },
  { id: 3, poNumber: 'PO-2024-003', supplierName: 'Accessory Kings', amount: 90000, orderDate: '2024-07-25', expectedDate: '2024-07-30', status: 'Shipped', lineItems: [{ productId: 4, productName: '4K Webcam', quantity: 10, unitPrice: 9000, total: 90000 }] },
];

let MOCK_CONTACTS: Contact[] = [
  { id: 1, name: 'Tech Innovators Inc.', type: 'Customer', email: 'contact@techinnovators.com', phone: '+94 112 345 678', avatarUrl: 'https://picsum.photos/seed/1/40/40', stats: { open_invoices: 1, balance_lkr: 100000, total_sales_lkr: 750000 } },
  { id: 2, name: 'Creative Solutions', type: 'Customer', email: 'hello@creative.lk', phone: '0771234567', avatarUrl: 'https://picsum.photos/seed/2/40/40', stats: { open_invoices: 1, balance_lkr: 8500.50, total_sales_lkr: 125000 }, tags: ['VIP'] },
  { id: 3, name: 'Global Exports', type: 'Customer', email: 'sales@globalexports.com', phone: '0719876543', avatarUrl: 'https://picsum.photos/seed/3/40/40', stats: { open_invoices: 0, balance_lkr: 0, total_sales_lkr: 250000 } },
  { id: 4, name: 'Local Supplies Co.', type: 'Customer', email: 'info@localsupplies.lk', phone: '0752223344', avatarUrl: 'https://picsum.photos/seed/4/40/40', stats: { open_invoices: 1, balance_lkr: 5000, total_sales_lkr: 5000 } },
  { id: 5, name: 'Pixel Perfect Designs', type: 'Customer', email: 'designs@pixelperfect.io', phone: '+94 71 555 1212', avatarUrl: 'https://picsum.photos/seed/q1/40/40', stats: { open_invoices: 0, balance_lkr: 0, total_sales_lkr: 44000 } },
  { id: 6, name: 'Global Tech Suppliers', type: 'Supplier', email: 'sales@globaltech.com', phone: '+94 76 999 8888', avatarUrl: 'https://picsum.photos/seed/s1/40/40', stats: { open_pos: 1, total_purchases_lkr: 130000 } },
  { id: 7, name: 'Office Essentials Ltd.', type: 'Supplier', email: 'contact@office-essentials.com', phone: '+94 112 123 123', avatarUrl: 'https://picsum.photos/seed/s2/40/40', stats: { open_pos: 0, total_purchases_lkr: 45000 } },
  { id: 8, name: 'Island Wide Logistics', type: 'Customer', email: 'dispatch@islandlog.lk', phone: '+94 112 999 000', avatarUrl: 'https://picsum.photos/seed/c8/40/40', stats: { open_invoices: 3, balance_lkr: 25000, total_sales_lkr: 95000 }, tags: ['VIP'] },
  { id: 9, name: 'Ceylon Tea Exports', type: 'Customer', email: 'exports@ceylontea.com', phone: '+94 77 888 7777', avatarUrl: 'https://picsum.photos/seed/c9/40/40', stats: { open_invoices: 0, balance_lkr: 0, total_sales_lkr: 320000 } },
  { id: 10, name: 'Kandy Spice Emporium', type: 'Customer', email: 'spices@kandy.lk', phone: '+94 81 222 3333', avatarUrl: 'https://picsum.photos/seed/c10/40/40', stats: { open_invoices: 0, balance_lkr: 0, total_sales_lkr: 15000 } },
  { id: 11, name: 'Galle Gems & Jewellery', type: 'Customer', email: 'gems@galle.lk', phone: '+94 91 444 5555', avatarUrl: 'https://picsum.photos/seed/c11/40/40', stats: { open_invoices: 1, balance_lkr: 120000, total_sales_lkr: 120000 } },
  { id: 12, name: 'Colombo Construction Co.', type: 'Customer', email: 'info@construction.lk', phone: '+94 11 777 6666', avatarUrl: 'https://picsum.photos/seed/c12/40/40', stats: { open_invoices: 5, balance_lkr: 550000, total_sales_lkr: 1200000 }, tags: ['VIP'] },
  { id: 13, name: 'M Leather', type: 'Customer', email: 'orders@mleather.lk', phone: '0765558899', avatarUrl: 'https://picsum.photos/seed/mleather/40/40', stats: { open_invoices: 0, balance_lkr: 0, total_sales_lkr: 0 } },
  { id: 14, name: 'Colombo Traders', type: 'Customer', email: 'contact@coltraders.lk', phone: '0703332211', avatarUrl: 'https://picsum.photos/seed/coltraders/40/40', stats: { open_invoices: 2, balance_lkr: 45000, total_sales_lkr: 85000 } },
];

const MOCK_AR_AGING: ArAgingRow[] = [
    { id: 2, customerName: 'Creative Solutions', customerAvatarUrl: 'https://picsum.photos/seed/2/40/40', bucket_0_30: 0, bucket_31_60: 0, bucket_61_90: 8500.50, bucket_90_plus: 0, total: 8500.50 },
    { id: 3, customerName: 'Global Exports', customerAvatarUrl: 'https://picsum.photos/seed/3/40/40', bucket_0_30: 100000, bucket_31_60: 0, bucket_61_90: 0, bucket_90_plus: 0, total: 100000 },
    { id: 4, customerName: 'Local Supplies Co.', customerAvatarUrl: 'https://picsum.photos/seed/4/40/40', bucket_0_30: 5000, bucket_31_60: 0, bucket_61_90: 0, bucket_90_plus: 0, total: 5000 },
];

const MOCK_AP_AGING: ApAgingRow[] = [
    { id: 6, supplierName: 'Global Tech Suppliers', supplierAvatarUrl: 'https://picsum.photos/seed/s1/40/40', bucket_0_30: 50000, bucket_31_60: 15000, bucket_61_90: 0, bucket_90_plus: 0, total: 65000 },
    { id: 7, supplierName: 'Office Essentials Ltd.', supplierAvatarUrl: 'https://picsum.photos/seed/s2/40/40', bucket_0_30: 20000, bucket_31_60: 0, bucket_61_90: 0, bucket_90_plus: 0, total: 20000 },
];

const MOCK_RECURRING_FORECAST: RecurringForecastRow[] = [
    { id: 1, name: 'SaaS Subscription', cadence: 'Monthly', nextDueDate: '2024-08-15', amount: 5000 },
    { id: 2, name: 'Office Rent', cadence: 'Monthly', nextDueDate: '2024-08-01', amount: 75000 },
    { id: 3, name: 'Weekly Cleaning', cadence: 'Weekly', nextDueDate: '2024-08-02', amount: 2500 },
];

const MOCK_TAX_SUMMARY: TaxSummaryRow[] = [
    { id: 1, rate: 'VAT (10%)', taxableSales: 185600, taxCollected: 18560 },
    { id: 2, rate: 'NBT (2%)', taxableSales: 50000, taxCollected: 1000 },
];

let MOCK_REPORT_VIEWS: ReportView[] = [
  {
    id: 'report-1',
    name: 'Monthly Sales by Customer',
    description: 'Tracks net sales for each customer on a monthly basis, highlighting top performers and trends.',
    query: { dimensions: ['customer.name', 'date.month'], metrics: ['net_sales'], filters: [], sortBy: [{ field: 'net_sales', direction: 'desc' }] },
    visualizationType: 'table',
    owner: { name: 'Admin User', avatarUrl: 'https://picsum.photos/seed/aurora-user/40/40' },
    lastRun: '2024-07-28T10:30:00Z',
    isFavorite: true,
  },
  {
    id: 'report-2',
    name: 'Q3 Product Performance',
    description: 'A bar chart view of revenue and cost of goods sold for top-selling products this quarter.',
    query: { dimensions: ['product.name'], metrics: ['revenue', 'cogs'], filters: [{field: 'date.quarter', operator: 'eq', value: 'Q3'}], sortBy: [{ field: 'revenue', direction: 'desc' }] },
    visualizationType: 'bar',
    owner: { name: 'Admin User', avatarUrl: 'https://picsum.photos/seed/aurora-user/40/40' },
    lastRun: '2024-07-27T14:00:00Z',
    isFavorite: false,
  },
  {
    id: 'report-3',
    name: 'A/R Aging Summary (Shared)',
    description: 'Standard Accounts Receivable aging buckets for all customers. Shared by the finance team.',
    query: { dimensions: ['customer.name', 'aging_bucket'], metrics: ['balance'], filters: [], sortBy: [{ field: 'balance', direction: 'desc' }] },
    visualizationType: 'pivot',
    owner: { name: 'Jane Doe', avatarUrl: 'https://picsum.photos/seed/jane/40/40' },
    lastRun: '2024-07-29T09:00:00Z',
    isFavorite: false,
  },
  {
    id: 'report-4',
    name: 'Sales by Product Category',
    description: 'A donut chart showing the distribution of net sales across different product categories.',
    query: { dimensions: ['product.category'], metrics: ['net_sales'], filters: [], sortBy: [] },
    visualizationType: 'donut',
    owner: { name: 'Admin User', avatarUrl: 'https://picsum.photos/seed/aurora-user/40/40' },
    lastRun: '2024-07-29T11:00:00Z',
    isFavorite: true,
  },
  {
    id: 'report-5',
    name: 'Monthly Sales Trend',
    description: 'Line chart showing the trend of net sales over the last several months.',
    query: { dimensions: ['date.month'], metrics: ['net_sales'], filters: [], sortBy: [{ field: 'date.month', direction: 'asc' }] },
    visualizationType: 'line',
    owner: { name: 'Admin User', avatarUrl: 'https://picsum.photos/seed/aurora-user/40/40' },
    lastRun: '2024-07-30T09:00:00Z',
    isFavorite: true,
  }
];

let MOCK_MEDIA: MediaItem[] = [
  { id: 'media-1', name: 'leather_wallet_brown.jpg', url: 'https://picsum.photos/seed/m1/800/600', size: 345678, type: 'image', mimeType: 'image/jpeg', createdAt: '2024-07-29T10:00:00Z', width: 800, height: 600, alt: 'A brown leather wallet on a wooden table.', tags: ['products', 'leather', 'campaign 2024'] },
  { id: 'media-2', name: 'handbag_promo_video.mp4', url: 'https://picsum.photos/seed/m2/800/600', size: 12500000, type: 'video', mimeType: 'video/mp4', createdAt: '2024-07-28T14:30:00Z', width: 800, height: 600, tags: ['social media'] },
  { id: 'media-3', name: 'user_avatar_jane.png', url: 'https://picsum.photos/seed/jane/400/400', size: 89012, type: 'image', mimeType: 'image/png', createdAt: '2024-07-27T09:15:00Z', width: 400, height: 400, alt: 'Avatar for user Jane Doe.', tags: ['avatars'] },
  { id: 'media-4', name: 'returns_policy.pdf', url: 'https://picsum.photos/seed/m4/800/600', size: 123456, type: 'document', mimeType: 'application/pdf', createdAt: '2024-07-26T11:00:00Z', width: 800, height: 1100, tags: ['documents'] },
  { id: 'media-5', name: 'black_leather_belt.jpg', url: 'https://picsum.photos/seed/m5/800/600', size: 412345, type: 'image', mimeType: 'image/jpeg', createdAt: '2024-07-25T16:45:00Z', width: 800, height: 600, tags: ['products'] },
  { id: 'media-6', name: 'company_logo_final.svg', url: 'https://picsum.photos/seed/m6/400/400', size: 15234, type: 'image', mimeType: 'image/svg+xml', createdAt: '2024-07-24T18:00:00Z', width: 400, height: 400 },
];

let MOCK_LOGS: LogEntry[] = [
  { id: 'log-1', timestamp: new Date(Date.now() - 1000 * 5).toISOString(), severity: 'INFO', message: 'User admin logged in successfully.', source: 'frontend', service: 'auth-service', attributes: { ip: '192.168.1.1' }, traceId: 'trace-abc' },
  { id: 'log-2', timestamp: new Date(Date.now() - 1000 * 15).toISOString(), severity: 'DEBUG', message: 'Fetching invoices for dashboard.', source: 'frontend', service: 'api-gateway', attributes: { endpoint: '/api/invoices' } },
  { id: 'log-3', timestamp: new Date(Date.now() - 1000 * 30).toISOString(), severity: 'WARN', message: 'API response time is high for /products.', source: 'api-gateway', service: 'product-service', attributes: { duration_ms: 850 }, traceId: 'trace-def' },
  { id: 'log-4', timestamp: new Date(Date.now() - 1000 * 60).toISOString(), severity: 'ERROR', message: 'Failed to process payment for invoice INV-2024-002.', source: 'backend', service: 'payment-processor', attributes: { error: 'Insufficient funds', invoiceId: 2 }, traceId: 'trace-ghi' },
  { id: 'log-5', timestamp: new Date(Date.now() - 1000 * 120).toISOString(), severity: 'FATAL', message: 'Database connection lost.', source: 'database', service: 'main-db', attributes: { db_host: 'db.prod.internal' }, traceId: 'trace-jkl' },
];

interface ApiParams { tenant_id: string; user_id: string; }
const filterData = <T,>(data: T[], query: string): T[] => {
    const lowerQuery = query.toLowerCase();
    return data.filter(item => Object.values(item as any).some(val => String(val).toLowerCase().includes(lowerQuery)));
}

const normalize = (x: string | null | undefined): string => {
  if (!x) return '';
  return x.toLowerCase().normalize('NFKD').replace(/\s+/g, ' ').trim();
};

const filterContacts = (data: Contact[], query: string): Contact[] => {
    const search = normalize(query);
    if (!search) return data;
    return data.filter(contact => 
        normalize(contact.name).includes(search) ||
        normalize(contact.email).includes(search) ||
        normalize(contact.phone).includes(search)
    );
};

@Injectable({ providedIn: 'root' })
export class ApiService {
  private tenant_id = '1234';
  private user_id = 'user-abc';
  private getAuthParams = (): ApiParams => ({ tenant_id: this.tenant_id, user_id: this.user_id });

  // --- Reactive Data Signal ---
  dataChanged = signal(0);
  private notifyDataChange() { this.dataChanged.set(Date.now()); }
  private getNextId<T extends {id: number}>(collection: T[]): number {
    return collection.length > 0 ? Math.max(...collection.map(i => i.id)) + 1 : 1;
  }
  
  private deleteManyFrom<T extends {id: any}>(collection: T[], ids: (string|number)[]): T[] {
    const idSet = new Set(ids);
    const newCollection = collection.filter(item => !idSet.has(item.id));
    this.notifyDataChange();
    return newCollection;
  }

  private updateOneIn<T extends {id: any}>(collection: T[], id: any, data: Partial<T>): T {
    const index = collection.findIndex(i => i.id === id);
    if (index === -1) throw new Error('Item not found');
    const updatedItem = { ...collection[index], ...data };
    collection[index] = updatedItem;
    this.notifyDataChange();
    return updatedItem;
  }

  dashboard = {
    getKpis: async(): Promise<{ sales: Kpi, expenses: Kpi }> => {
      await new Promise(res => setTimeout(res, 300));
      return {
        sales: { value: 125400, delta: 12.5 },
        expenses: { value: 34100, delta: -5.2 }
      };
    },
    getKpiTrend: async(kpi: 'sales' | 'expenses'): Promise<number[]> => {
      await new Promise(res => setTimeout(res, 350));
      if (kpi === 'sales') {
        // Meaningful trend ending at today's KPI value.
        return [105.2, 108.0, 110.5, 111.4, 118.9, 122.1, 125.4].map(v => v * 1000);
      }
      // Meaningful trend for expenses, reflecting the delta.
      return [38.5, 39.1, 36.2, 35.9, 35.0, 33.8, 34.1].map(v => v * 1000);
    },
    getArApSummary: async(): Promise<{ar: { total: number, overdue: number }, ap: { total: number, overdue: number }}> => {
      await new Promise(res => setTimeout(res, 200));
      return {
        ar: { total: 113500.50, overdue: 8500.50 },
        ap: { total: 85000, overdue: 15000 }
      };
    },
    getTopSellingProducts: async(): Promise<TopProductReport[]> => { 
        await new Promise(res => setTimeout(res, 300)); 
        return [
            { id: 2, name: 'Mechanical Keyboard', sku: 'MK-202', imageUrl: 'https://picsum.photos/seed/p2/200/200', quantity: 25, revenue: 250000, price: 10000 },
            { id: 1, name: 'Wireless Mouse', sku: 'WM-101', imageUrl: 'https://picsum.photos/seed/p1/200/200', quantity: 80, revenue: 160000, price: 2000 },
            { id: 3, name: 'USB-C Hub', sku: 'UH-303', imageUrl: 'https://picsum.photos/seed/p3/200/200', quantity: 30, revenue: 120000, price: 4000 },
        ];
    },
    getSalesComparisonData: async(): Promise<{ labels: string[], datasets: { label: string, data: number[] }[] }> => { await new Promise(res => setTimeout(res, 300)); return { labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'], datasets: [ { label: 'Last Month', data: [65, 59, 80, 81, 56, 55, 40] }, { label: 'This Month', data: [28, 48, 40, 19, 86, 27, 90] } ] } },
    getCashflowSnapshot: async(): Promise<CashflowSnapshot> => {
        await new Promise(res => setTimeout(res, 450));
        const invoicesSeries = [50, 70, 90, 80, 110, 125.4, 150, 180, 210, 250, 280, 318.5].map(v => v * 1000);
        const expensesSeries = [20, 30, 40, 35, 38, 34.1, 45, 50, 55, 60, 62, 34.1].map(v => v * 1000);
        return {
            invoices: {
                issued: { value: 318500.50, delta: 15.2 },
                paid: { value: 165000, delta: 5.5 },
                outstanding: { value: 153500.50, delta: 25.1 }
            },
            expenses: { value: 34100, delta: -5.2 },
            net: { value: 130900, delta: 8.9 },
            series: {
                invoices: invoicesSeries,
                expenses: expensesSeries,
                net: invoicesSeries.map((inv, i) => inv - expensesSeries[i]),
            }
        };
    },
  }

  reports = {
    getSummary: async(): Promise<ReportSummary> => {
      await new Promise(res => setTimeout(res, 300));
      const netSales = 185600;
      const cogs = 75000;
      const grossMargin = netSales - cogs;
      const expenses = 42300;
      return {
        grossSales: { value: 190000, delta: 8.2 },
        netSales: { value: netSales, delta: 7.5 },
        cogs: { value: cogs, delta: 5.1 },
        expenses: { value: expenses, delta: -3.0 },
        grossMargin: { value: grossMargin, delta: 9.1, percentage: (grossMargin / netSales) * 100 },
        netProfit: { value: grossMargin - expenses, delta: 12.5 },
        paymentMix: [
          { label: 'Cash', value: 98000 },
          { label: 'Card', value: 87600 },
          { label: 'Cheque', value: 100000 }
        ],
        arToday: { count: 3, amount: 113500.50, overdueCount: 1 },
      };
    },
    getSalesTrend: async(): Promise<SalesTrend> => {
      await new Promise(res => setTimeout(res, 400));
      return {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
          { label: 'This Week', data: [12000, 19000, 15000, 25000, 22000, 30000, 28000] },
          { label: 'Last Week', data: [11000, 18000, 16000, 23000, 21000, 28000, 27000] }
        ]
      };
    },
    getTopProducts: async(): Promise<TopProductReport[]> => {
      await new Promise(res => setTimeout(res, 250));
      return [
        { id: 2, name: 'Mechanical Keyboard', sku: 'MK-202', imageUrl: 'https://picsum.photos/seed/p2/200/200', quantity: 25, revenue: 250000, price: 10000 },
        { id: 1, name: 'Wireless Mouse', sku: 'WM-101', imageUrl: 'https://picsum.photos/seed/p1/200/200', quantity: 80, revenue: 160000, price: 2000 },
        { id: 3, name: 'USB-C Hub', sku: 'UH-303', imageUrl: 'https://picsum.photos/seed/p3/200/200', quantity: 30, revenue: 120000, price: 4000 },
      ];
    },
    getArAging: async(): Promise<ArAgingRow[]> => {
        await new Promise(res => setTimeout(res, 350));
        return MOCK_AR_AGING;
    },
    getApAging: async(): Promise<ApAgingRow[]> => {
        await new Promise(res => setTimeout(res, 380));
        return MOCK_AP_AGING;
    },
    getInventorySnapshot: async(): Promise<InventorySnapshot> => {
        await new Promise(res => setTimeout(res, 420));
        return {
            valuationLkr: { value: 850000, delta: 2.1 },
            turnProxy: { value: 4.5, delta: -0.3 },
            slowMovers: [
                { id: 4, productName: '4K Webcam', sku: 'WC-401', imageUrl: 'https://picsum.photos/seed/p4/200/200', daysSinceLastSale: 95, onHand: 40 },
                { id: 5, productName: 'Ergonomic Chair', sku: 'EC-505', imageUrl: 'https://picsum.photos/seed/p5/200/200', daysSinceLastSale: 120, onHand: 20 },
            ]
        };
    },
    getRecurringForecast: async(): Promise<RecurringForecastRow[]> => {
        await new Promise(res => setTimeout(res, 280));
        return MOCK_RECURRING_FORECAST;
    },
    getTaxSummary: async(): Promise<TaxSummaryRow[]> => {
        await new Promise(res => setTimeout(res, 320));
        return MOCK_TAX_SUMMARY;
    },
    getViews: async(): Promise<ReportView[]> => {
      await new Promise(res => setTimeout(res, 400));
      return MOCK_REPORT_VIEWS;
    },
    getView: async(id: string): Promise<ReportView | null> => {
      await new Promise(res => setTimeout(res, 150));
      return MOCK_REPORT_VIEWS.find(v => v.id === id) || null;
    },
    getSchema: async(): Promise<ReportSchema> => {
      await new Promise(res => setTimeout(res, 200));
      return {
        dimensions: [
          { key: 'customer.name', label: 'Customer Name', group: 'Customer', type: 'string' },
          { key: 'customer.type', label: 'Customer Type', group: 'Customer', type: 'string' },
          { key: 'product.name', label: 'Product Name', group: 'Product', type: 'string' },
          { key: 'product.category', label: 'Product Category', group: 'Product', type: 'string' },
          { key: 'date.month', label: 'Month', group: 'Date', type: 'string' },
          { key: 'date.quarter', label: 'Quarter', group: 'Date', type: 'string' },
          { key: 'aging_bucket', label: 'A/R Aging Bucket', group: 'Financial', type: 'string' },
        ],
        metrics: [
          { key: 'net_sales', label: 'Net Sales', group: 'Sales', type: 'currency' },
          { key: 'cogs', label: 'Cost of Goods Sold', group: 'Sales', type: 'currency' },
          { key: 'revenue', label: 'Revenue', group: 'Sales', type: 'currency' },
          { key: 'balance', label: 'Balance', group: 'Financial', type: 'currency' },
          { key: 'quantity_sold', label: 'Quantity Sold', group: 'Sales', type: 'number' },
        ]
      }
    },
    run: async(query: ReportQuery): Promise<ReportResult> => {
      const startTime = Date.now();
      await new Promise(res => setTimeout(res, 600));

// FIX: Replaced invalid 'MOCK_API' reference with 'this' to correctly call the getSchema method within the service.
      const schema = await this.reports.getSchema();
      
      const allFields = [...schema.dimensions, ...schema.metrics];
      
      const columns = [...query.dimensions, ...query.metrics].map(key => {
        const field = allFields.find(f => f.key === key);
        return { key, label: field?.label || key, type: field?.type || 'string' };
      });
      
      const data: Record<string, any>[] = [];
      const numRows = Math.floor(Math.random() * 20) + 5;

      const MOCK_DIM_VALUES: Record<string, string[]> = {
        'customer.name': MOCK_CONTACTS.filter(c => c.type === 'Customer').map(c => c.name),
        'product.name': MOCK_PRODUCTS.map(p => p.name),
        'product.category': [...new Set(MOCK_PRODUCTS.map(p => p.category))],
        'date.month': ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
      };
      
      for (let i = 0; i < numRows; i++) {
        const row: Record<string, any> = {};
        for (const dim of query.dimensions) {
          const possibleValues = MOCK_DIM_VALUES[dim] || ['-'];
          row[dim] = possibleValues[Math.floor(Math.random() * possibleValues.length)];
        }
        for (const met of query.metrics) {
          const field = allFields.find(f => f.key === met);
          if (field?.type === 'currency') {
            row[met] = Math.random() * 50000;
          } else {
            row[met] = Math.floor(Math.random() * 100);
          }
        }
        data.push(row);
      }

      if (query.sortBy && query.sortBy.length > 0) {
        const monthOrder = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        data.sort((a, b) => {
            for (const sort of query.sortBy) {
                const field = sort.field;
                const direction = sort.direction === 'asc' ? 1 : -1;
                let valA = a[field];
                let valB = b[field];

                if(field === 'date.month') {
                    valA = monthOrder.indexOf(valA);
                    valB = monthOrder.indexOf(valB);
                }

                if (valA < valB) return -1 * direction;
                if (valA > valB) return 1 * direction;
            }
            return 0;
        });
      }
      
      const endTime = Date.now();
      return {
        meta: { columns },
        data,
        queryExecutionTime: endTime - startTime,
      };
    },
  }
  
  // --- GET/LIST Methods ---
  invoices = { 
    list: async (params?: { query?: string }): Promise<Invoice[]> => { await new Promise(res => setTimeout(res, 50)); return params?.query ? filterData(MOCK_INVOICES, params.query) : [...MOCK_INVOICES].sort((a,b) => b.id - a.id); },
    getById: async (id: number): Promise<Invoice | undefined> => { await new Promise(res => setTimeout(res, 50)); return MOCK_INVOICES.find(i => i.id === id); },
    getPayments: async (invoiceId: number): Promise<Receipt[]> => { 
      await new Promise(res => setTimeout(res, 200)); 
      return MOCK_RECEIPTS.filter(r => r.invoiceId === invoiceId); 
    },
    update: async (id: number, data: Partial<Invoice>): Promise<Invoice> => { return this.updateOneIn(MOCK_INVOICES, id, data); },
    deleteMany: async (ids: (string|number)[]): Promise<void> => { MOCK_INVOICES = this.deleteManyFrom(MOCK_INVOICES, ids); }
  };
  products = { 
    list: async (params?: { query?: string }): Promise<Product[]> => { await new Promise(res => setTimeout(res, 50)); return params?.query ? filterData(MOCK_PRODUCTS, params.query) : [...MOCK_PRODUCTS].sort((a,b) => b.id - a.id); },
    update: async (id: number, data: Partial<Product>): Promise<Product> => { return this.updateOneIn(MOCK_PRODUCTS, id, data); },
    deleteMany: async (ids: (string|number)[]): Promise<void> => { MOCK_PRODUCTS = this.deleteManyFrom(MOCK_PRODUCTS, ids); }
  };
  expenses = { 
    list: async (params?: { query?: string }): Promise<Expense[]> => { await new Promise(res => setTimeout(res, 50)); return params?.query ? filterData(MOCK_EXPENSES, params.query) : [...MOCK_EXPENSES].sort((a,b) => b.id - a.id); },
    update: async (id: number, data: Partial<Expense>): Promise<Expense> => { return this.updateOneIn(MOCK_EXPENSES, id, data); },
    deleteMany: async (ids: (string|number)[]): Promise<void> => { MOCK_EXPENSES = this.deleteManyFrom(MOCK_EXPENSES, ids); }
  };
  recurringExpenses = { 
    list: async (params?: { query?: string }): Promise<RecurringExpense[]> => { await new Promise(res => setTimeout(res, 50)); return params?.query ? filterData(MOCK_RECURRING_EXPENSES, params.query) : [...MOCK_RECURRING_EXPENSES].sort((a,b) => b.id - a.id); },
    update: async (id: number, data: Partial<RecurringExpense>): Promise<RecurringExpense> => { return this.updateOneIn(MOCK_RECURRING_EXPENSES, id, data); },
    deleteMany: async (ids: (string|number)[]): Promise<void> => { MOCK_RECURRING_EXPENSES = this.deleteManyFrom(MOCK_RECURRING_EXPENSES, ids); }
  };
  inventory = { 
    list: async(params?: { query?: string }): Promise<InventoryItem[]> => { await new Promise(res => setTimeout(res, 50)); return params?.query ? filterData(MOCK_INVENTORY, params.query) : [...MOCK_INVENTORY].sort((a,b) => b.id - a.id); },
    deleteMany: async (ids: (string|number)[]): Promise<void> => { 
      MOCK_INVENTORY = this.deleteManyFrom(MOCK_INVENTORY, ids);
      // Also delete from products
      MOCK_PRODUCTS = this.deleteManyFrom(MOCK_PRODUCTS, ids);
    }
  };
  media = { 
    list: async(params?: { query?: string }): Promise<MediaItem[]> => { await new Promise(res => setTimeout(res, 50)); return params?.query ? filterData(MOCK_MEDIA, params.query) : [...MOCK_MEDIA].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); },
    initUpload: async (fileInfo: { name: string, type: string, size: number }): Promise<{ assetId: string, uploadUrl: string }> => {
        console.log('Initiating upload for:', fileInfo.name);
        await new Promise(res => setTimeout(res, 100)); // simulate network latency
        const assetId = `temp-${Date.now()}-${Math.random()}`;
        return { assetId, uploadUrl: 'https://mock-storage.com/upload' };
    },
    completeUpload: async (assetId: string, metadata: { name: string, size: number, mimeType: string, type: MediaItem['type'], alt?: string, tags?: string[] }): Promise<MediaItem> => {
        console.log('Completing upload for assetId:', assetId, 'with metadata:', metadata);
        await new Promise(res => setTimeout(res, 200)); // simulate backend processing
        
        const newId = `media-${Date.now()}`;
        const randomSeed = Math.random().toString(36).substring(7);
        const newItem: MediaItem = {
          id: newId,
          name: metadata.name,
          url: `https://picsum.photos/seed/${randomSeed}/800/600`,
          size: metadata.size,
          type: metadata.type,
          mimeType: metadata.mimeType,
          createdAt: new Date().toISOString(),
          width: 800,
          height: 600,
          alt: metadata.alt || '',
          tags: metadata.tags || [],
        };
        MOCK_MEDIA.unshift(newItem); // Add to top of list
        this.notifyDataChange();
        return newItem;
    },
    update: async (id: string, data: Partial<MediaItem>): Promise<MediaItem> => { 
      return this.updateOneIn(MOCK_MEDIA, id, data); 
    },
    deleteMany: async (ids: (string|number)[]): Promise<void> => { MOCK_MEDIA = this.deleteManyFrom(MOCK_MEDIA, ids); }
  };
  quotations = { 
    list: async(params?: { query?: string }): Promise<Quotation[]> => { await new Promise(res => setTimeout(res, 50)); return params?.query ? filterData(MOCK_QUOTATIONS, params.query) : [...MOCK_QUOTATIONS].sort((a,b) => b.id - a.id); },
    update: async (id: number, data: Partial<Quotation>): Promise<Quotation> => { return this.updateOneIn(MOCK_QUOTATIONS, id, data); },
    deleteMany: async (ids: (string|number)[]): Promise<void> => { MOCK_QUOTATIONS = this.deleteManyFrom(MOCK_QUOTATIONS, ids); }
  };
  receipts = { 
    list: async(params?: { query?: string }): Promise<Receipt[]> => { await new Promise(res => setTimeout(res, 50)); return params?.query ? filterData(MOCK_RECEIPTS, params.query) : [...MOCK_RECEIPTS].sort((a,b) => b.id - a.id); },
    getByInvoiceId: async(invoiceId: number): Promise<Receipt[]> => { await new Promise(res => setTimeout(res, 50)); return MOCK_RECEIPTS.filter(r => r.invoiceId === invoiceId).sort((a,b) => b.id - a.id); },
    deleteMany: async (ids: (string|number)[]): Promise<void> => { MOCK_RECEIPTS = this.deleteManyFrom(MOCK_RECEIPTS, ids); }
  };
  cheques = { 
    list: async(params?: { query?: string }): Promise<Cheque[]> => { await new Promise(res => setTimeout(res, 50)); return params?.query ? filterData(MOCK_CHEQUES, params.query) : [...MOCK_CHEQUES].sort((a,b) => b.id - a.id); },
    update: async (id: number, data: Partial<Cheque>): Promise<Cheque> => { return this.updateOneIn(MOCK_CHEQUES, id, data); },
    deleteMany: async (ids: (string|number)[]): Promise<void> => { MOCK_CHEQUES = this.deleteManyFrom(MOCK_CHEQUES, ids); }
  };
  purchaseOrders = { 
    list: async(params?: { query?: string }): Promise<PurchaseOrder[]> => { await new Promise(res => setTimeout(res, 50)); return params?.query ? filterData(MOCK_PURCHASE_ORDERS, params.query) : [...MOCK_PURCHASE_ORDERS].sort((a,b) => b.id - a.id); },
    update: async (id: number, data: Partial<PurchaseOrder>): Promise<PurchaseOrder> => { return this.updateOneIn(MOCK_PURCHASE_ORDERS, id, data); },
    deleteMany: async (ids: (string|number)[]): Promise<void> => { MOCK_PURCHASE_ORDERS = this.deleteManyFrom(MOCK_PURCHASE_ORDERS, ids); }
  };
  contacts = { 
    list: async(params?: { query?: string }): Promise<Contact[]> => { 
      await new Promise(res => setTimeout(res, 50)); 
      const data = params?.query ? filterContacts(MOCK_CONTACTS, params.query) : [...MOCK_CONTACTS];
      return data.sort((a,b) => a.name.localeCompare(b.name));
    },
    getRecentActivity: async(contact: Contact): Promise<(Invoice | PurchaseOrder)[]> => {
        await new Promise(res => setTimeout(res, 250));
        if (contact.type === 'Customer') {
            return MOCK_INVOICES.filter(inv => inv.customerName === contact.name)
              .sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime())
              .slice(0, 3);
        } else { // Supplier
            return MOCK_PURCHASE_ORDERS.filter(po => po.supplierName === contact.name)
              .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())
              .slice(0, 3);
        }
    },
    update: async (id: number, data: Partial<Contact>): Promise<Contact> => { return this.updateOneIn(MOCK_CONTACTS, id, data); },
    deleteMany: async (ids: (string|number)[]): Promise<void> => { MOCK_CONTACTS = this.deleteManyFrom(MOCK_CONTACTS, ids); }
  };
  
  logs = {
    search: async(params: { query: string; severities: LogSeverity[] }): Promise<{ rows: LogEntry[] }> => {
        await new Promise(res => setTimeout(res, 200));
        let results = [...MOCK_LOGS];
        if (params.query) {
            const q = params.query.toLowerCase();
            results = results.filter(log => log.message.toLowerCase().includes(q) || log.service.toLowerCase().includes(q) || log.source.toLowerCase().includes(q));
        }
        if (params.severities && params.severities.length > 0) {
            const severitiesSet = new Set(params.severities);
            results = results.filter(log => severitiesSet.has(log.severity));
        }
        return { rows: results.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) };
    },
    createMockLog: (): LogEntry => {
      const severities: LogSeverity[] = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
      const services = ['auth-service', 'payment-processor', 'product-service', 'api-gateway'];
      const messages = ['User action recorded', 'Data fetched successfully', 'Cache miss for key', 'Request timed out', 'Invalid input received'];
      const newId = `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const newLog: LogEntry = {
          id: newId,
          timestamp: new Date().toISOString(),
          severity: severities[Math.floor(Math.random() * severities.length)],
          message: messages[Math.floor(Math.random() * messages.length)],
          source: 'frontend',
          service: services[Math.floor(Math.random() * services.length)],
          attributes: { userId: 'user-abc' }
      };
      MOCK_LOGS.unshift(newLog);
      return newLog;
    }
  };

  // FIX: Add missing updateQuotationStatus method.
  async updateQuotationStatus(id: number, status: QuotationStatus): Promise<Quotation> {
    const quotation = MOCK_QUOTATIONS.find(q => q.id === id);
    if (!quotation) throw new Error('Quotation not found');
    quotation.status = status;
    this.notifyDataChange();
    return quotation;
  }

  // FIX: Add missing convertPoToStock method.
  async convertPoToStock(poId: number): Promise<void> {
    console.log(`Converting PO #${poId} to stock.`);
    const po = MOCK_PURCHASE_ORDERS.find(p => p.id === poId);
    if (!po) {
      console.error(`PO with id ${poId} not found.`);
      return;
    }
    if (po.status !== 'Ordered' && po.status !== 'Shipped') {
        console.warn(`PO #${poId} is already ${po.status}. Cannot convert to stock again.`);
        return;
    }

    po.lineItems?.forEach(item => {
      const product = MOCK_PRODUCTS.find(p => p.id === item.productId);
      if (product) {
        // Assuming stock goes to main warehouse
        product.stock.mainWarehouse += item.quantity;
      } else {
          console.warn(`Product with id ${item.productId} not found for PO #${poId}`);
      }
    });

    po.status = 'Received';

    // Re-sync MOCK_INVENTORY from MOCK_PRODUCTS
    MOCK_INVENTORY = MOCK_PRODUCTS.map((p) => ({
        id: p.id, productId: p.id, productName: p.name, sku: p.sku, imageUrl: p.imageUrl, onHand: p.stock, committed: p.committed, description: p.description
    }));

    this.notifyDataChange();
    await new Promise(res => setTimeout(res, 500));
  }
  
  // FIX: Add missing transferStock method.
  async transferStock(params: { productIds: (string | number)[], from: LocationKey, to: LocationKey, quantity: number | 'All' }): Promise<void> {
    console.log('Transferring stock:', params);
    // Mock logic
    params.productIds.forEach(id => {
        const product = MOCK_PRODUCTS.find(p => p.id === id);
        if (product) {
            const availableFrom = product.stock[params.from] - product.committed[params.from];
            const quantityToMove = params.quantity === 'All' ? availableFrom : Math.min(params.quantity, availableFrom);

            if (quantityToMove > 0) {
                product.stock[params.from] -= quantityToMove;
                product.stock[params.to] += quantityToMove;
            }
        }
    });
    // Re-sync MOCK_INVENTORY from MOCK_PRODUCTS
    MOCK_INVENTORY = MOCK_PRODUCTS.map((p) => ({
        id: p.id, productId: p.id, productName: p.name, sku: p.sku, imageUrl: p.imageUrl, onHand: p.stock, committed: p.committed, description: p.description
    }));
    this.notifyDataChange();
    await new Promise(res => setTimeout(res, 500));
  }

  // --- CREATE Methods ---
  createInvoice = async (data: Partial<Invoice>): Promise<Invoice> => { const newInvoice: Invoice = { id: this.getNextId(MOCK_INVOICES), invoiceNumber: `INV-2024-${String(this.getNextId(MOCK_INVOICES)).padStart(3, '0')}`, status: 'Draft', amount: data.amount || 0, totalPaid: 0, balance: data.amount || 0, ...data, } as Invoice; MOCK_INVOICES.push(newInvoice); this.notifyDataChange(); return newInvoice; }
  createReceipt = async (data: { invoiceId: number, amount: number, method: ReceiptPaymentMethod, paymentDate: string }): Promise<Receipt> => { const invoice = MOCK_INVOICES.find(i => i.id === data.invoiceId); if (!invoice) throw new Error('Invoice not found'); const newReceipt: Receipt = { id: this.getNextId(MOCK_RECEIPTS), receiptNumber: `REC-2024-${String(this.getNextId(MOCK_RECEIPTS)).padStart(3, '0')}`, invoiceId: invoice.id, invoiceNumber: invoice.invoiceNumber, customerName: invoice.customerName, amount: data.amount, method: data.method, paymentDate: data.paymentDate, }; MOCK_RECEIPTS.push(newReceipt); invoice.totalPaid += data.amount; invoice.balance = invoice.amount - invoice.totalPaid; if (invoice.balance <= 0) { invoice.status = 'Paid'; invoice.balance = 0; } else { invoice.status = 'Pending'; } this.notifyDataChange(); return newReceipt; }
  createExpense = async (data: Partial<Expense>): Promise<Expense> => { const newExpense: Expense = { id: this.getNextId(MOCK_EXPENSES), status: 'Unpaid', ...data, } as Expense; MOCK_EXPENSES.push(newExpense); this.notifyDataChange(); return newExpense; }
  createProduct = async (data: Partial<Product>): Promise<Product> => { const newProduct: Product = { id: this.getNextId(MOCK_PRODUCTS), ...data, } as Product; MOCK_PRODUCTS.push(newProduct); this.notifyDataChange(); return newProduct; }
  createContact = async (data: Partial<Contact>): Promise<Contact> => { 
    const nextId = this.getNextId(MOCK_CONTACTS);
    const newContact: Contact = { 
        ...data,
        id: nextId, 
        avatarUrl: data.avatarUrl || `https://picsum.photos/seed/${nextId}/40/40`,
    } as Contact; 
    MOCK_CONTACTS.push(newContact); 
    this.notifyDataChange(); 
    return newContact; 
  }
  createPurchaseOrder = async (data: Partial<PurchaseOrder>): Promise<PurchaseOrder> => { const newPO: PurchaseOrder = { id: this.getNextId(MOCK_PURCHASE_ORDERS), poNumber: `PO-2024-${String(this.getNextId(MOCK_PURCHASE_ORDERS)).padStart(3, '0')}`, status: 'Ordered', amount: data.amount || 0, ...data } as PurchaseOrder; MOCK_PURCHASE_ORDERS.push(newPO); this.notifyDataChange(); return newPO; }
  createQuotation = async (data: Partial<Quotation>): Promise<Quotation> => { const newQuotation: Quotation = { id: this.getNextId(MOCK_QUOTATIONS), quotationNumber: `QUO-2024-${String(this.getNextId(MOCK_QUOTATIONS)).padStart(3, '0')}`, status: 'Draft', amount: data.amount || 0, ...data } as Quotation; MOCK_QUOTATIONS.push(newQuotation); this.notifyDataChange(); return newQuotation; }
  createCheque = async (data: Partial<Cheque>): Promise<Cheque> => { const newCheque: Cheque = { id: this.getNextId(MOCK_CHEQUES), status: 'Pending', ...data } as Cheque; MOCK_CHEQUES.push(newCheque); this.notifyDataChange(); return newCheque; }
  createRecurringExpense = async (data: Partial<RecurringExpense>): Promise<RecurringExpense> => { const newRecExpense: RecurringExpense = { id: this.getNextId(MOCK_RECURRING_EXPENSES), ...data } as RecurringExpense; MOCK_RECURRING_EXPENSES.push(newRecExpense); this.notifyDataChange(); return newRecExpense; }
  createSale = async (data: { customer: Contact | null, amount: number, paymentMethod: ReceiptPaymentMethod, notes: string }) => {
    const customerName = data.customer?.name || 'Walk-in Customer';
    const customerAvatarUrl = data.customer?.avatarUrl;
    const today = new Date().toISOString();

    const saleInvoice = await this.createInvoice({
      customerName: customerName,
      customerAvatarUrl: customerAvatarUrl,
      amount: data.amount,
      issueDate: today,
      dueDate: today,
      status: 'Paid',
      lineItems: [{ productId: 999, productName: data.notes || 'Point of Sale Transaction', quantity: 1, unitPrice: data.amount, total: data.amount }],
      subtotal: data.amount,
      tax: 0,
      totalPaid: data.amount,
      balance: 0,
    });

    await this.createReceipt({
      invoiceId: saleInvoice.id,
      amount: data.amount,
      method: data.paymentMethod,
      paymentDate: today,
    });
    this.notifyDataChange();
  }
  createCustomerPayment = async(data: { customer: Contact, amount: number, paymentMethod: ReceiptPaymentMethod, paymentDate: string }) => {
    // Find the oldest outstanding invoice for the customer
    const outstandingInvoice = MOCK_INVOICES
      .filter(inv => inv.customerName === data.customer.name && (inv.status === 'Pending' || inv.status === 'Overdue'))
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];