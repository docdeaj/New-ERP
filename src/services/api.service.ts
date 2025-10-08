import { Injectable, signal } from '@angular/core';
import {
  Invoice, Product, Contact, Kpi, InventoryItem, Quotation, Receipt, Cheque, PurchaseOrder, MediaItem, Expense, ReceiptPaymentMethod, LineItem, RecurringExpense, LocationKey, ReportSummary, SalesTrend, TopProductReport, ArAgingRow, ApAgingRow, InventorySnapshot, RecurringForecastRow, TaxSummaryRow, ReportView, ReportQuery, ReportResult, ReportSchema, LogEntry, LogSeverity, CashflowSnapshot, QuotationStatus, ContactType
} from '../models/types';
import {
  SEED_PRODUCTS, SEED_CONTACTS, SEED_INVOICES, SEED_EXPENSES, SEED_QUOTATIONS, SEED_PURCHASE_ORDERS, SEED_RECEIPTS, SEED_MEDIA
} from '../data/seed-data';
import { firstValueFrom, of } from 'rxjs';
import { delay as rxjsDelay } from 'rxjs/operators';


@Injectable({ providedIn: 'root' })
export class ApiService {
  // --- Data Stores ---
  private _products = signal<Product[]>(SEED_PRODUCTS);
  private _contacts = signal<Contact[]>(SEED_CONTACTS);
  private _invoices = signal<Invoice[]>(SEED_INVOICES);
  private _expenses = signal<Expense[]>(SEED_EXPENSES);
  private _quotations = signal<Quotation[]>(SEED_QUOTATIONS);
  private _purchaseOrders = signal<PurchaseOrder[]>(SEED_PURCHASE_ORDERS);
  private _receipts = signal<Receipt[]>(SEED_RECEIPTS);
  private _media = signal<MediaItem[]>(SEED_MEDIA);
  private _recurringExpenses = signal<RecurringExpense[]>([]);
  private _cheques = signal<Cheque[]>([]);

  // --- Reactive Data Signal ---
  dataChanged = signal(0);
  private notifyDataChange() { this.dataChanged.set(Date.now()); }

  private async delay(ms: number = 200) {
    return firstValueFrom(of(true).pipe(rxjsDelay(ms + Math.random() * 150)));
  }

  // --- CRUD Helper Factory ---
  private createCrudService<T extends { id: any }>(store: ReturnType<typeof signal<T[]>>) {
    return {
      list: async (params?: any): Promise<T[]> => {
        await this.delay();
        let items = store();
        if (params?.query) {
          const query = params.query.toLowerCase();
          items = items.filter(item =>
            Object.values(item).some(val =>
              String(val).toLowerCase().includes(query)
            )
          );
        }
        return [...items];
      },
      getById: async (id: number | string): Promise<T | undefined> => {
        await this.delay();
        return store().find(item => String(item.id) === String(id));
      },
      create: async (data: Partial<T>): Promise<T> => {
        await this.delay();
        // FIX: Cast to 'unknown' first to satisfy TypeScript's generic constraints.
        const newItem = { ...data, id: `${(data as any).number || 'NEW'}-${Date.now()}`, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as unknown as T;
        store.update(items => [...items, newItem]);
        this.notifyDataChange();
        return newItem;
      },
      update: async (id: number | string, data: Partial<T>): Promise<T> => {
        await this.delay();
        let updatedItem: T | undefined;
        store.update(items => items.map(item => {
          if (String(item.id) === String(id)) {
            updatedItem = { ...item, ...data, updated_at: new Date().toISOString() };
            return updatedItem;
          }
          return item;
        }));
        this.notifyDataChange();
        if (!updatedItem) throw new Error(`Item with id ${id} not found`);
        return updatedItem;
      },
      deleteMany: async (ids: (string | number)[]): Promise<void> => {
        await this.delay();
        const idSet = new Set(ids.map(String));
        store.update(items => items.filter(item => !idSet.has(String(item.id))));
        this.notifyDataChange();
      }
    };
  }
  
  // --- Services ---

  dashboard = {
    getKpis: async (): Promise<{ sales: Kpi, expenses: Kpi }> => {
      await this.delay();
      const today = new Date().toISOString().split('T')[0];
      const todaySales = this._receipts().filter(r => r.issue_date.startsWith(today)).reduce((sum, r) => sum + r.amount_lkr, 0);
      const todayExpenses = this._expenses().filter(e => e.date.startsWith(today)).reduce((sum, e) => sum + e.amount_lkr, 0);
      return {
        sales: { value: todaySales, delta: 12.5 },
        expenses: { value: todayExpenses, delta: -5.2 }
      };
    },
    getKpiTrend: async (kpi: 'sales' | 'expenses'): Promise<number[]> => {
      await this.delay();
      return Array.from({ length: 30 }, () => Math.random() * 10000);
    },
    getArApSummary: async (): Promise<{ar: { total: number, overdue: number }, ap: { total: number, overdue: number }}> => {
      await this.delay();
      const arTotal = this._invoices().reduce((sum, inv) => sum + inv.balance_lkr, 0);
      const arOverdue = this._invoices().filter(i => i.status === 'Overdue').reduce((sum, inv) => sum + inv.balance_lkr, 0);
      return {
        ar: { total: arTotal, overdue: arOverdue },
        ap: { total: 1250000, overdue: 300000 }
      };
    },
    getTopSellingProducts: async (): Promise<TopProductReport[]> => {
      await this.delay();
      // FIX: Changed `image_url` to `imageUrl` to match the `TopProductReport` type.
      return this._products().slice(0, 5).map(p => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        imageUrl: p.image_url || '',
        quantity: Math.floor(Math.random() * 50) + 10,
        revenue_lkr: p.price_lkr * (Math.floor(Math.random() * 50) + 10),
        price_lkr: p.price_lkr
      }));
    },
    getSalesComparisonData: async (): Promise<{ labels: string[], datasets: { label: string, data: number[] }[] }> => {
        await this.delay();
        return {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [
                { label: 'This Week', data: [1200, 1900, 3000, 5000, 2300, 4100, 3800] },
                { label: 'Last Week', data: [1500, 2100, 2800, 4500, 2600, 3900, 3500] }
            ]
        };
    },
    getCashflowSnapshot: async (): Promise<CashflowSnapshot> => {
        await this.delay();
        return {
            invoices: { issued: { value: 2500000, delta: 0 }, paid: { value: 1800000, delta: 0 }, outstanding: { value: 700000, delta: 0 } },
            expenses: { value: 450000, delta: 0 },
            net: { value: 1350000, delta: 0 },
            series: {
                invoices: [1,2,5,3,8,6,10],
                expenses: [1,1,2,1,3,2,2],
                net: [0,1,3,2,5,4,8]
            }
        };
    },
  }
  
  reports = {
    getViews: async (): Promise<ReportView[]> => {
      await this.delay();
      return [];
    },
    getArAging: async (): Promise<ArAgingRow[]> => {
      await this.delay(400);
      const customers = this._contacts().filter(c => c.type === 'customer');
      const agingData: ArAgingRow[] = customers.slice(0, 5).map(c => ({
          id: c.id,
          customerName: c.name,
          customerAvatarUrl: c.avatar_url || '',
          bucket_0_30: Math.random() * 50000,
          bucket_31_60: Math.random() * 20000,
          bucket_61_90: Math.random() * 5000,
          bucket_90_plus: Math.random() > 0.7 ? Math.random() * 10000 : 0,
          total: 0 // Will be calculated
      }));
      agingData.forEach(row => {
          row.total = row.bucket_0_30 + row.bucket_31_60 + row.bucket_61_90 + row.bucket_90_plus;
      });
      return agingData;
    },
    // Add other report methods if needed
    getSummary: (): Promise<ReportSummary> => Promise.resolve({} as ReportSummary),
    getSalesTrend: (): Promise<SalesTrend> => Promise.resolve({} as SalesTrend),
    getTopProducts: (): Promise<TopProductReport[]> => Promise.resolve([]),
    getApAging: (): Promise<ApAgingRow[]> => Promise.resolve([]),
    getInventorySnapshot: (): Promise<InventorySnapshot> => Promise.resolve({} as InventorySnapshot),
    getRecurringForecast: (): Promise<RecurringForecastRow[]> => Promise.resolve([]),
    getTaxSummary: (): Promise<TaxSummaryRow[]> => Promise.resolve([]),
    getView: (id: string): Promise<ReportView | null> => Promise.resolve(null),
    getSchema: (): Promise<ReportSchema> => Promise.resolve({ dimensions: [], metrics: [] }),
    run: (query: ReportQuery): Promise<ReportResult> => Promise.resolve({} as ReportResult),
  }

  invoices = {
    ...this.createCrudService<Invoice>(this._invoices),
    getPayments: async (invoiceId: string | number): Promise<Receipt[]> => {
      await this.delay();
      return this._receipts().filter(r => r.invoice_id === String(invoiceId));
    },
  };

  products = this.createCrudService<Product>(this._products);
  expenses = this.createCrudService<Expense>(this._expenses);
  recurringExpenses = this.createCrudService<RecurringExpense>(this._recurringExpenses);
  
  inventory = {
    ...this.createCrudService<InventoryItem>(signal([])), // Inventory is derived, so we override list
    list: async (params?: any): Promise<InventoryItem[]> => {
      await this.delay();
      // FIX: Changed `product_id` to `productId`, `product_name` to `productName`, and `image_url` to `imageUrl` to match the `InventoryItem` type.
      return this._products().map(p => ({
        id: p.id,
        productId: p.id,
        productName: p.name,
        sku: p.sku,
        imageUrl: p.image_url || '',
        onHand: p.onHand,
        committed: p.committed,
      }));
    }
  };

  quotations = this.createCrudService<Quotation>(this._quotations);
  
  receipts = {
    ...this.createCrudService<Receipt>(this._receipts),
    getByInvoiceId: async (invoiceId: string | number): Promise<Receipt[]> => {
      await this.delay();
      return this._receipts().filter(r => r.invoice_id === String(invoiceId));
    },
  };

  cheques = this.createCrudService<Cheque>(this._cheques);
  purchaseOrders = this.createCrudService<PurchaseOrder>(this._purchaseOrders);

  contacts = {
    ...this.createCrudService<Contact>(this._contacts),
    getRecentActivity: async (contact: Contact): Promise<(Invoice | PurchaseOrder)[]> => {
      await this.delay();
      const invoices = this._invoices().filter(i => i.party_id === contact.id);
      const pos = this._purchaseOrders().filter(p => p.party_id === contact.id);
      return [...invoices, ...pos].slice(0, 5);
    },
  };

  // FIX: Combined media service definition into a single object to resolve duplicate identifier errors.
  media = {
    ...this.createCrudService<MediaItem>(this._media),
    initUpload: async (fileInfo: { name: string, type: string, size: number }): Promise<{ assetId: string, uploadUrl: string }> => {
      await this.delay();
      return { assetId: `temp-${Date.now()}`, uploadUrl: '#' };
    },
    completeUpload: async (assetId: string, metadata: any): Promise<MediaItem> => {
      const newItem: Partial<MediaItem> = {
        id: assetId,
        name: metadata.name,
        url: 'https://picsum.photos/seed/newupload/400/400',
        size: metadata.size,
        type: metadata.type,
        mimeType: metadata.mimeType,
        createdAt: new Date().toISOString(),
        alt: metadata.alt,
        tags: metadata.tags
      };
      // Re-implementing the create logic here to avoid circular dependency issues.
      await this.delay();
      const finalNewItem = { ...newItem, id: assetId, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as unknown as MediaItem;
      this._media.update(items => [...items, finalNewItem]);
      this.notifyDataChange();
      return finalNewItem;
    }
  };

  logs = {
    search: async (params: { query: string; severities: LogSeverity[] }): Promise<{ rows: LogEntry[] }> => {
        await this.delay();
        // Return mock data; full implementation isn't required by spec.
        return { rows: [] };
    },
    createMockLog: (): LogEntry => {
        // Mock for live tail
        return {} as LogEntry;
    }
  };
  
  // --- Authoritative Actions ---

  private calculateTotals(items: LineItem[], tax_rate: number, discount_lkr: number = 0): { subtotal_lkr: number, tax_lkr: number, total_lkr: number } {
    const subtotal_before_line_discounts = items.reduce((sum, item) => sum + (item.unit_price_lkr * item.qty), 0);
    const total_line_discount = items.reduce((sum, item) => sum + (item.line_discount_lkr || 0), 0);
    const subtotal_lkr = subtotal_before_line_discounts - total_line_discount;
    const subtotal_after_doc_discount = subtotal_lkr - discount_lkr;
    const tax_lkr = Math.round(subtotal_after_doc_discount * (tax_rate / 100));
    const total_lkr = subtotal_after_doc_discount + tax_lkr;
    return { subtotal_lkr, tax_lkr, total_lkr };
  }

  createInvoice = async (data: Partial<Invoice>): Promise<Invoice> => {
    const totals = this.calculateTotals(data.items || [], data.tax_rate || 0, data.discount_lkr);
    const newInvoice: Partial<Invoice> = {
        ...data,
        number: `INV-2024-${String(this._invoices().length + 1).padStart(3, '0')}`,
        ...totals,
        paid_lkr: 0,
        balance_lkr: totals.total_lkr,
        status: data.status || 'Draft',
    };
    return this.invoices.create(newInvoice);
  }
  
  createQuotation = async (data: Partial<Quotation>): Promise<Quotation> => {
    const totals = this.calculateTotals(data.items || [], data.tax_rate || 0, data.discount_lkr);
    const newQuotation: Partial<Quotation> = {
        ...data,
        number: `QUO-2024-${String(this._quotations().length + 1).padStart(3, '0')}`,
        ...totals,
        status: data.status || 'Draft',
    };
    return this.quotations.create(newQuotation);
  }
  
  createPurchaseOrder = async (data: Partial<PurchaseOrder>): Promise<PurchaseOrder> => {
    const totals = this.calculateTotals(data.items || [], data.tax_rate || 0, data.discount_lkr);
    const newPO: Partial<PurchaseOrder> = {
        ...data,
        number: `PO-2024-${String(this._purchaseOrders().length + 1).padStart(3, '0')}`,
        ...totals,
        status: data.status || 'Ordered',
    };
    return this.purchaseOrders.create(newPO);
  }

  createReceipt = async (data: { invoiceId: string | number, amount: number, method: ReceiptPaymentMethod, paymentDate: string }): Promise<Receipt> => {
    const newReceiptData: Partial<Receipt> = {
        invoice_id: String(data.invoiceId),
        amount_lkr: data.amount,
        method: data.method,
        issue_date: data.paymentDate,
        number: `REC-2024-${String(this._receipts().length + 1).padStart(3, '0')}`,
    };
    const newReceipt = await this.receipts.create(newReceiptData);

    // Atomically update invoice
    this._invoices.update(invoices => invoices.map(inv => {
        if (String(inv.id) === String(data.invoiceId)) {
            const newPaid = inv.paid_lkr + data.amount;
            const newBalance = inv.total_lkr - newPaid;
            return {
                ...inv,
                paid_lkr: newPaid,
                balance_lkr: newBalance,
                status: newBalance <= 0 ? 'Paid' : inv.status
            };
        }
        return inv;
    }));
    this.notifyDataChange(); // Ensure invoice list updates
    return newReceipt;
  }
  
  createContact = async (data: Partial<Contact>): Promise<Contact> => {
    const typePrefix = data.type === 'customer' ? 'CUST' : 'SUPP';
    const newId = `${typePrefix}-${String(this._contacts().length + 1).padStart(3, '0')}`;
    const newContactData: Partial<Contact> = {
      ...data,
      id: newId,
    };
    return this.contacts.create(newContactData);
  }

  async updateQuotationStatus(id: number, status: QuotationStatus): Promise<Quotation> {
    return this.quotations.update(id, { status });
  }

  async convertPoToStock(poId: number): Promise<void> {
    const po = await this.purchaseOrders.getById(poId);
    if (!po) throw new Error('Purchase order not found');

    this._products.update(products => {
        const newProducts = [...products];
        po.items.forEach(item => {
            const productIndex = newProducts.findIndex(p => p.id === item.product_id);
            if (productIndex !== -1) {
                newProducts[productIndex].onHand.mainWarehouse += item.qty;
            }
        });
        return newProducts;
    });

    await this.purchaseOrders.update(poId, { status: 'Received' });
    this.notifyDataChange();
  }

  async transferStock(params: { productIds: (string | number)[], from: LocationKey, to: LocationKey, quantity: number | 'All' }): Promise<void> {
    await this.delay(500);
    this._products.update(products => {
      const newProducts = [...products];
      params.productIds.forEach(id => {
        const productIndex = newProducts.findIndex(p => String(p.id) === String(id));
        if (productIndex > -1) {
          const product = newProducts[productIndex];
          const qtyToMove = params.quantity === 'All' ? product.onHand[params.from] : params.quantity;
          
          if(product.onHand[params.from] >= qtyToMove) {
            product.onHand[params.from] -= qtyToMove;
            product.onHand[params.to] += qtyToMove;
          }
        }
      });
      return newProducts;
    });
    this.notifyDataChange();
  }
  
  // Mocks for methods not fully specified but required by components
  createSale = async (data: any) => { await this.delay(); this.notifyDataChange(); };
  createCustomerPayment = async (data: any) => { await this.delay(); this.notifyDataChange(); };
  createExpense = this.expenses.create;
  createProduct = this.products.create;
  createCheque = this.cheques.create;
  createRecurringExpense = this.recurringExpenses.create;
}