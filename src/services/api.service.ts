import { Injectable, signal } from '@angular/core';
import { Invoice, Product, Contact, Kpi, InventoryItem, Quotation, Receipt, Cheque, PurchaseOrder, MediaItem, DailyReport, Expense, ReceiptPaymentMethod, LineItem, RecurringExpense, LocationKey } from '../models/types';

const MOCK_INVOICES: Invoice[] = [
  { id: 1, invoiceNumber: 'INV-2024-001', customerName: 'Tech Innovators Inc.', customerAvatarUrl: 'https://picsum.photos/seed/1/40/40', amount: 15000.00, issueDate: '2024-07-20', dueDate: '2024-08-19', status: 'Paid', totalPaid: 15000, balance: 0, lineItems: [{productId: 1, productName: 'Wireless Mouse', quantity: 5, unitPrice: 3000, total: 15000}] },
  { id: 2, invoiceNumber: 'INV-2024-002', customerName: 'Creative Solutions', customerAvatarUrl: 'https://picsum.photos/seed/2/40/40', amount: 8500.50, issueDate: '2024-07-18', dueDate: '2024-08-17', status: 'Overdue', totalPaid: 0, balance: 8500.50 },
  { id: 3, invoiceNumber: 'INV-2024-003', customerName: 'Global Exports', customerAvatarUrl: 'https://picsum.photos/seed/3/40/40', amount: 250000.00, issueDate: '2024-07-15', dueDate: '2024-07-30', status: 'Pending', totalPaid: 150000, balance: 100000 },
  { id: 4, invoiceNumber: 'INV-2024-004', customerName: 'Local Supplies Co.', customerAvatarUrl: 'https://picsum.photos/seed/4/40/40', amount: 5000.00, issueDate: '2024-07-22', dueDate: '2024-08-21', status: 'Pending', totalPaid: 0, balance: 5000.00 },
];

const MOCK_PRODUCTS: Product[] = [
    { id: 1, name: 'Wireless Mouse', sku: 'WM-101', category: 'Electronics', price: 2000, cost: 800, stock: { mainWarehouse: 50, downtownStore: 15, online: 30 }, committed: { mainWarehouse: 10, downtownStore: 5, online: 15}, imageUrl: 'https://picsum.photos/seed/p1/200/200', flags: { price_below_cost: false } },
    { id: 2, name: 'Mechanical Keyboard', sku: 'MK-202', category: 'Electronics', price: 10000, cost: 4500, stock: { mainWarehouse: 30, downtownStore: 10, online: 15 }, committed: { mainWarehouse: 5, downtownStore: 2, online: 8}, imageUrl: 'https://picsum.photos/seed/p2/200/200', flags: { price_below_cost: false } },
    { id: 3, name: 'USB-C Hub', sku: 'UH-303', category: 'Accessories', price: 4000, cost: 1800, stock: { mainWarehouse: 80, downtownStore: 25, online: 40 }, committed: { mainWarehouse: 20, downtownStore: 10, online: 20}, imageUrl: 'https://picsum.photos/seed/p3/200/200', flags: { price_below_cost: false } },
    { id: 4, name: '4K Webcam', sku: 'WC-401', category: 'Electronics', price: 8500, cost: 9000, stock: { mainWarehouse: 25, downtownStore: 5, online: 10 }, committed: { mainWarehouse: 5, downtownStore: 1, online: 5}, imageUrl: 'https://picsum.photos/seed/p4/200/200', flags: { price_below_cost: true } },
    { id: 5, name: 'Ergonomic Chair', sku: 'EC-505', category: 'Furniture', price: 25000, cost: 11000, stock: { mainWarehouse: 15, downtownStore: 5, online: 0 }, committed: { mainWarehouse: 2, downtownStore: 1, online: 0}, imageUrl: 'https://picsum.photos/seed/p5/200/200', flags: { price_below_cost: false } },
];

const MOCK_EXPENSES: Expense[] = [
    { id: 1, category: 'Utilities', amount: 15000, date: '2024-07-20', vendor: 'Electricity Board', status: 'Paid' },
    { id: 2, category: 'Rent', amount: 75000, date: '2024-07-01', vendor: 'City Properties', status: 'Paid' },
];

const MOCK_RECURRING_EXPENSES: RecurringExpense[] = [
  { id: 1, description: 'SaaS Subscription', category: 'Software', amount: 5000, cadence: 'Monthly', nextDueDate: '2024-08-15', vendor: 'CloudCorp' },
  { id: 2, description: 'Office Rent', category: 'Rent', amount: 75000, cadence: 'Monthly', nextDueDate: '2024-08-01', vendor: 'City Properties' },
];

const MOCK_INVENTORY: InventoryItem[] = MOCK_PRODUCTS.map((p) => ({
    id: p.id, productId: p.id, productName: p.name, sku: p.sku, imageUrl: p.imageUrl, onHand: p.stock, committed: p.committed
}));

const MOCK_QUOTATIONS: Quotation[] = [
  { id: 1, quotationNumber: 'QUO-2024-001', customerName: 'Pixel Perfect Designs', customerAvatarUrl: 'https://picsum.photos/seed/q1/40/40', amount: 44000, issueDate: '2024-07-28', expiryDate: '2024-08-12', status: 'Sent', items: [{ productId: 3, productName: 'USB-C Hub', quantity: 10, unitPrice: 4000, total: 40000 }], subtotal: 40000, tax: 4000 },
];

const MOCK_RECEIPTS: Receipt[] = [
  { id: 1, receiptNumber: 'REC-2024-001', invoiceId: 1, invoiceNumber: 'INV-2024-001', customerName: 'Tech Innovators Inc.', amount: 15000, paymentDate: '2024-07-22', method: 'Card' },
  { id: 3, receiptNumber: 'REC-2024-003', invoiceId: 3, invoiceNumber: 'INV-2024-003', customerName: 'Global Exports', amount: 150000, paymentDate: '2024-07-28', method: 'Cash' },
];

const MOCK_CHEQUES: Cheque[] = [
  { id: 2, chequeNumber: '654321', bank: 'Commercial Bank', payee: 'Global Exports', payer: 'Aurora ERP', amount: 100000, chequeDate: '2024-08-05', status: 'Pending' },
];

const MOCK_PURCHASE_ORDERS: PurchaseOrder[] = [
  { id: 1, poNumber: 'PO-2024-001', supplierName: 'Global Tech Suppliers', amount: 130000, orderDate: '2024-07-15', expectedDate: '2024-08-15', status: 'Ordered', lineItems: [{ productId: 1, productName: 'Wireless Mouse', quantity: 50, unitPrice: 800, total: 40000 }, { productId: 2, productName: 'Mechanical Keyboard', quantity: 20, unitPrice: 4500, total: 90000 }] },
  { id: 2, poNumber: 'PO-2024-002', supplierName: 'Office Essentials Ltd.', amount: 45000, orderDate: '2024-07-20', expectedDate: '2024-07-28', status: 'Received', lineItems: [{ productId: 3, productName: 'USB-C Hub', quantity: 25, unitPrice: 1800, total: 45000 }] },
];

const MOCK_CONTACTS: Contact[] = [
  { id: 1, name: 'Tech Innovators Inc.', type: 'Customer', email: 'contact@techinnovators.com', phone: '+94 112 345 678', avatarUrl: 'https://picsum.photos/seed/1/40/40' },
];

const MOCK_MEDIA: MediaItem[] = Array.from({ length: 15 }, (_, i) => ({
  id: `media-${i + 1}`, name: `product_image_${i + 1}.jpg`, url: `https://picsum.photos/seed/img${i}/400/400`, size: 1024 * (150 + i*10), type: 'image/jpeg', createdAt: new Date(Date.now() - i * 1000 * 60 * 60 * 24).toISOString(),
}));

interface ApiParams { tenant_id: string; user_id: string; }
const filterData = <T,>(data: T[], query: string): T[] => {
    const lowerQuery = query.toLowerCase();
    return data.filter(item => Object.values(item as any).some(val => String(val).toLowerCase().includes(lowerQuery)));
}

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

  dashboard = {
    getKpis: async(): Promise<{ sales: Kpi, expenses: Kpi }> => { await new Promise(res => setTimeout(res, 300)); return { sales: { value: 125430, delta: 12.5 }, expenses: { value: 34100, delta: -5.2 } }; },
    getTopSellingProducts: async(): Promise<Product[]> => { await new Promise(res => setTimeout(res, 300)); return MOCK_PRODUCTS.slice(0, 3); },
    getSalesComparisonData: async(): Promise<{ labels: string[], datasets: { label: string, data: number[] }[] }> => { await new Promise(res => setTimeout(res, 300)); return { labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'], datasets: [ { label: 'Last Month', data: [65, 59, 80, 81, 56, 55, 40] }, { label: 'This Month', data: [28, 48, 40, 19, 86, 27, 90] } ] } }
  }

  reports = { getDailyClosePack: async(): Promise<DailyReport> => { await new Promise(res => setTimeout(res, 400)); return { totalSales: 185600, totalExpenses: 42300, net: 143300, cashSales: 98000, nonCashSales: 87600, chequesPending: 100000 }; } }
  
  // --- GET/LIST Methods ---
  invoices = { 
    list: async (params?: { query?: string }): Promise<Invoice[]> => { await new Promise(res => setTimeout(res, 50)); return params?.query ? filterData(MOCK_INVOICES, params.query) : [...MOCK_INVOICES].sort((a,b) => b.id - a.id); },
    getById: async (id: number): Promise<Invoice | undefined> => { await new Promise(res => setTimeout(res, 50)); return MOCK_INVOICES.find(i => i.id === id); }
  };
  products = { list: async (params?: { query?: string }): Promise<Product[]> => { await new Promise(res => setTimeout(res, 50)); return params?.query ? filterData(MOCK_PRODUCTS, params.query) : [...MOCK_PRODUCTS].sort((a,b) => b.id - a.id); } };
  expenses = { list: async (params?: { query?: string }): Promise<Expense[]> => { await new Promise(res => setTimeout(res, 50)); return params?.query ? filterData(MOCK_EXPENSES, params.query) : [...MOCK_EXPENSES].sort((a,b) => b.id - a.id); } };
  recurringExpenses = { list: async (params?: { query?: string }): Promise<RecurringExpense[]> => { await new Promise(res => setTimeout(res, 50)); return params?.query ? filterData(MOCK_RECURRING_EXPENSES, params.query) : [...MOCK_RECURRING_EXPENSES].sort((a,b) => b.id - a.id); } };
  inventory = { list: async(params?: { query?: string }): Promise<InventoryItem[]> => { await new Promise(res => setTimeout(res, 50)); return params?.query ? filterData(MOCK_INVENTORY, params.query) : [...MOCK_INVENTORY].sort((a,b) => b.id - a.id); } };
  media = { list: async(params?: { query?: string }): Promise<MediaItem[]> => { await new Promise(res => setTimeout(res, 50)); return params?.query ? filterData(MOCK_MEDIA, params.query) : [...MOCK_MEDIA]; } };
  quotations = { list: async(params?: { query?: string }): Promise<Quotation[]> => { await new Promise(res => setTimeout(res, 50)); return params?.query ? filterData(MOCK_QUOTATIONS, params.query) : [...MOCK_QUOTATIONS].sort((a,b) => b.id - a.id); } };
  receipts = { 
    list: async(params?: { query?: string }): Promise<Receipt[]> => { await new Promise(res => setTimeout(res, 50)); return params?.query ? filterData(MOCK_RECEIPTS, params.query) : [...MOCK_RECEIPTS].sort((a,b) => b.id - a.id); },
    getByInvoiceId: async(invoiceId: number): Promise<Receipt[]> => { await new Promise(res => setTimeout(res, 50)); return MOCK_RECEIPTS.filter(r => r.invoiceId === invoiceId).sort((a,b) => b.id - a.id); }
  };
  cheques = { list: async(params?: { query?: string }): Promise<Cheque[]> => { await new Promise(res => setTimeout(res, 50)); return params?.query ? filterData(MOCK_CHEQUES, params.query) : [...MOCK_CHEQUES].sort((a,b) => b.id - a.id); } };
  purchaseOrders = { list: async(params?: { query?: string }): Promise<PurchaseOrder[]> => { await new Promise(res => setTimeout(res, 50)); return params?.query ? filterData(MOCK_PURCHASE_ORDERS, params.query) : [...MOCK_PURCHASE_ORDERS].sort((a,b) => b.id - a.id); } };
  contacts = { list: async(params?: { query?: string }): Promise<Contact[]> => { await new Promise(res => setTimeout(res, 50)); return params?.query ? filterData(MOCK_CONTACTS, params.query) : [...MOCK_CONTACTS].sort((a,b) => b.id - a.id); } };

  // --- CREATE Methods ---
  createInvoice = async (data: Partial<Invoice>): Promise<Invoice> => { const newInvoice: Invoice = { id: this.getNextId(MOCK_INVOICES), invoiceNumber: `INV-2024-${String(this.getNextId(MOCK_INVOICES)).padStart(3, '0')}`, status: 'Draft', amount: data.amount || 0, totalPaid: 0, balance: data.amount || 0, ...data, } as Invoice; MOCK_INVOICES.push(newInvoice); this.notifyDataChange(); return newInvoice; }
  createReceipt = async (data: { invoiceId: number, amount: number, method: ReceiptPaymentMethod, paymentDate: string }): Promise<Receipt> => { const invoice = MOCK_INVOICES.find(i => i.id === data.invoiceId); if (!invoice) throw new Error('Invoice not found'); const newReceipt: Receipt = { id: this.getNextId(MOCK_RECEIPTS), receiptNumber: `REC-2024-${String(this.getNextId(MOCK_RECEIPTS)).padStart(3, '0')}`, invoiceId: invoice.id, invoiceNumber: invoice.invoiceNumber, customerName: invoice.customerName, amount: data.amount, method: data.method, paymentDate: data.paymentDate, }; MOCK_RECEIPTS.push(newReceipt); invoice.totalPaid += data.amount; invoice.balance = invoice.amount - invoice.totalPaid; if (invoice.balance <= 0) { invoice.status = 'Paid'; invoice.balance = 0; } else { invoice.status = 'Pending'; } this.notifyDataChange(); return newReceipt; }
  createExpense = async (data: Partial<Expense>): Promise<Expense> => { const newExpense: Expense = { id: this.getNextId(MOCK_EXPENSES), status: 'Unpaid', ...data, } as Expense; MOCK_EXPENSES.push(newExpense); this.notifyDataChange(); return newExpense; }
  createProduct = async (data: Partial<Product>): Promise<Product> => { const newProduct: Product = { id: this.getNextId(MOCK_PRODUCTS), ...data, } as Product; MOCK_PRODUCTS.push(newProduct); this.notifyDataChange(); return newProduct; }
  createContact = async (data: Partial<Contact>): Promise<Contact> => { const newContact: Contact = { id: this.getNextId(MOCK_CONTACTS), ...data, } as Contact; MOCK_CONTACTS.push(newContact); this.notifyDataChange(); return newContact; }
  createPurchaseOrder = async (data: Partial<PurchaseOrder>): Promise<PurchaseOrder> => { const newPO: PurchaseOrder = { id: this.getNextId(MOCK_PURCHASE_ORDERS), poNumber: `PO-2024-${String(this.getNextId(MOCK_PURCHASE_ORDERS)).padStart(3, '0')}`, status: 'Ordered', amount: data.amount || 0, ...data } as PurchaseOrder; MOCK_PURCHASE_ORDERS.push(newPO); this.notifyDataChange(); return newPO; }
  createQuotation = async (data: Partial<Quotation>): Promise<Quotation> => { const newQuotation: Quotation = { id: this.getNextId(MOCK_QUOTATIONS), quotationNumber: `QUO-2024-${String(this.getNextId(MOCK_QUOTATIONS)).padStart(3, '0')}`, status: 'Draft', amount: data.amount || 0, ...data } as Quotation; MOCK_QUOTATIONS.push(newQuotation); this.notifyDataChange(); return newQuotation; }
  createCheque = async (data: Partial<Cheque>): Promise<Cheque> => { const newCheque: Cheque = { id: this.getNextId(MOCK_CHEQUES), status: 'Pending', ...data } as Cheque; MOCK_CHEQUES.push(newCheque); this.notifyDataChange(); return newCheque; }
  createRecurringExpense = async (data: Partial<RecurringExpense>): Promise<RecurringExpense> => { const newRecExpense: RecurringExpense = { id: this.getNextId(MOCK_RECURRING_EXPENSES), ...data } as RecurringExpense; MOCK_RECURRING_EXPENSES.push(newRecExpense); this.notifyDataChange(); return newRecExpense; }
  
  // --- UPDATE/WORKFLOW Methods ---
  updateQuotationStatus = async (quotationId: number, status: 'Accepted'): Promise<void> => { const quotation = MOCK_QUOTATIONS.find(q => q.id === quotationId); if (quotation) { quotation.status = status; } await new Promise(res => setTimeout(res, 100)); this.notifyDataChange(); }
  convertPoToStock = async (poId: number): Promise<void> => { const po = MOCK_PURCHASE_ORDERS.find(p => p.id === poId); if (!po || !po.lineItems) throw new Error(`PO not found or has no items.`); po.status = 'Received'; for (const item of po.lineItems) { const inventoryItem = MOCK_INVENTORY.find(inv => inv.productId === item.productId); if (inventoryItem) { inventoryItem.onHand.mainWarehouse += item.quantity; } } await new Promise(res => setTimeout(res, 400)); this.notifyDataChange(); }
  transferStock = async (data: { productIds: (number|string)[], from: LocationKey, to: LocationKey, quantity: number | 'All' }): Promise<void> => { for(const productId of data.productIds) { const invItem = MOCK_INVENTORY.find(i => i.id === productId); if (invItem) { const available = invItem.onHand[data.from] - invItem.committed[data.from]; const qtyToMove = data.quantity === 'All' ? available : Math.min(data.quantity, available); if (qtyToMove > 0) { invItem.onHand[data.from] -= qtyToMove; invItem.onHand[data.to] += qtyToMove; } } } await new Promise(res => setTimeout(res, 400)); this.notifyDataChange(); }
}