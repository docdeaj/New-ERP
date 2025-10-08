import { Injectable, signal } from '@angular/core';
import {
  Invoice, Product, Contact, Kpi, InventoryItem, Quotation, Receipt, Cheque, PurchaseOrder, MediaItem, Expense, ReceiptPaymentMethod, LineItem, RecurringExpense, LocationKey, ReportSummary, SalesTrend, TopProductReport, ArAgingRow, ApAgingRow, PnlRow, InventoryValuationRow, InventorySnapshot, RecurringForecastRow, TaxSummaryRow, ReportView, ReportQuery, ReportResult, ReportSchema, LogEntry, LogSeverity, CashflowSnapshot, QuotationStatus, ContactType, SalesByCustomerRow, StockOnHandRow, SalesByProductRow, BalanceSheetRow, PurchasesBySupplierRow
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
        sales: { value: todaySales, delta: 12.5, previousValue: todaySales / 1.125 },
        expenses: { value: todayExpenses, delta: -5.2, previousValue: todayExpenses / 0.948 }
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
    getSalesByCustomer: async (): Promise<SalesByCustomerRow[]> => {
      await this.delay(400);
      const customerSales: { [customerId: string]: { totalSales: number; invoiceCount: number; lastSaleDate: string; customer: Contact } } = {};

      this._invoices().forEach(invoice => {
        if (!customerSales[invoice.party_id]) {
          const customer = this._contacts().find(c => c.id === invoice.party_id);
          if (customer) {
            customerSales[invoice.party_id] = { totalSales: 0, invoiceCount: 0, lastSaleDate: '', customer };
          }
        }
        if (customerSales[invoice.party_id]) {
          customerSales[invoice.party_id].totalSales += invoice.total_lkr;
          customerSales[invoice.party_id].invoiceCount++;
          if (!customerSales[invoice.party_id].lastSaleDate || new Date(invoice.issue_date) > new Date(customerSales[invoice.party_id].lastSaleDate)) {
            customerSales[invoice.party_id].lastSaleDate = invoice.issue_date;
          }
        }
      });
      
      return Object.values(customerSales).map(cs => ({
        id: cs.customer.id,
        customerName: cs.customer.name,
        customerAvatarUrl: cs.customer.avatar_url || '',
        totalSales: cs.totalSales,
        invoiceCount: cs.invoiceCount,
        lastSaleDate: cs.lastSaleDate,
      })).sort((a,b) => b.totalSales - a.totalSales);
    },
    getApAging: async (): Promise<ApAgingRow[]> => {
      await this.delay(400);
      const suppliers = this._contacts().filter(c => c.type === 'supplier');
      const agingData: ApAgingRow[] = suppliers.map(s => ({
          id: s.id,
          supplierName: s.name,
          supplierAvatarUrl: s.avatar_url || '',
          bucket_0_30: Math.random() * 300000,
          bucket_31_60: Math.random() * 100000,
          bucket_61_90: 0,
          bucket_90_plus: 0,
          total: 0
      }));
       agingData.forEach(row => {
          row.total = row.bucket_0_30 + row.bucket_31_60 + row.bucket_61_90 + row.bucket_90_plus;
      });
      return agingData;
    },
    getPnlData: async (): Promise<PnlRow[]> => {
      await this.delay(500);
      const totalRevenue = this._invoices().filter(i => i.status === 'Paid').reduce((sum, i) => sum + i.subtotal_lkr, 0);
      const totalExpenses = this._expenses().reduce((sum, e) => sum + e.amount_lkr, 0);
      const netIncome = totalRevenue - totalExpenses;

      return [
        { category: 'Revenue', isHeader: true, isTotal: false, items: [] },
        { category: '', isHeader: false, isTotal: false, items: [{ label: 'Product Sales', amount: totalRevenue }] },
        { category: 'Total Revenue', isHeader: false, isTotal: true, items: [{ label: 'Total Revenue', amount: totalRevenue, isSubtotal: true }] },
        { category: 'Expenses', isHeader: true, isTotal: false, items: [] },
        { category: '', isHeader: false, isTotal: false, items: [{ label: 'Utilities', amount: 1500000 }] },
        { category: '', isHeader: false, isTotal: false, items: [{ label: 'Software', amount: 500000 }] },
        { category: '', isHeader: false, isTotal: false, items: [{ label: 'Rent', amount: 15000000 }] },
        { category: 'Total Expenses', isHeader: false, isTotal: true, items: [{ label: 'Total Expenses', amount: totalExpenses, isSubtotal: true }] },
        { category: 'Net Income', isHeader: false, isTotal: true, items: [{ label: 'Net Income', amount: netIncome, isSubtotal: true }] },
      ];
    },
    getBalanceSheet: async (): Promise<BalanceSheetRow[]> => {
        await this.delay(550);
        const totalReceivables = this._invoices().reduce((sum, i) => sum + i.balance_lkr, 0);
        const inventoryValue = this._products().reduce((sum, p) => sum + (p.cost_lkr * Object.values(p.onHand).reduce((a,b) => a+b, 0)), 0);
        const cash = 50000000;
        const totalAssets = totalReceivables + inventoryValue + cash;
        const totalLiabilities = 1250000;
        const equity = totalAssets - totalLiabilities;
        
        return [
            { category: 'Assets', isHeader: true, isTotal: false, items: [] },
            { category: 'Assets', isHeader: false, isTotal: false, items: [{ label: 'Cash', amount: cash }] },
            { category: 'Assets', isHeader: false, isTotal: false, items: [{ label: 'Accounts Receivable', amount: totalReceivables }] },
            { category: 'Assets', isHeader: false, isTotal: false, items: [{ label: 'Inventory', amount: inventoryValue }] },
            { category: 'Assets', isHeader: false, isTotal: true, items: [{ label: 'Total Assets', amount: totalAssets, isSubtotal: true }] },
            { category: 'Liabilities', isHeader: true, isTotal: false, items: [] },
            { category: 'Liabilities', isHeader: false, isTotal: false, items: [{ label: 'Accounts Payable', amount: totalLiabilities }] },
            { category: 'Liabilities', isHeader: false, isTotal: true, items: [{ label: 'Total Liabilities', amount: totalLiabilities, isSubtotal: true }] },
            { category: 'Equity', isHeader: true, isTotal: false, items: [] },
            { category: 'Equity', isHeader: false, isTotal: false, items: [{ label: 'Retained Earnings', amount: equity }] },
            { category: 'Equity', isHeader: false, isTotal: true, items: [{ label: 'Total Equity', amount: equity, isSubtotal: true }] },
        ];
    },
    getPurchasesBySupplier: async (): Promise<PurchasesBySupplierRow[]> => {
        await this.delay(400);
        const supplierPurchases: { [supplierId: string]: { totalPurchases: number; poCount: number; supplier: Contact } } = {};

        this._purchaseOrders().forEach(po => {
            if (!supplierPurchases[po.party_id]) {
                const supplier = this._contacts().find(c => c.id === po.party_id);
                if (supplier) {
                    supplierPurchases[po.party_id] = { totalPurchases: 0, poCount: 0, supplier };
                }
            }
            if (supplierPurchases[po.party_id]) {
                supplierPurchases[po.party_id].totalPurchases += po.total_lkr;
                supplierPurchases[po.party_id].poCount++;
            }
        });
        
        return Object.values(supplierPurchases).map(sp => ({
            id: sp.supplier.id,
            supplierName: sp.supplier.name,
            supplierAvatarUrl: sp.supplier.avatar_url || '',
            totalPurchases: sp.totalPurchases,
            poCount: sp.poCount,
        })).sort((a,b) => b.totalPurchases - a.totalPurchases);
    },
     getInventoryValuation: async (): Promise<InventoryValuationRow[]> => {
      await this.delay(300);
      return this._products().map(p => {
        const onHand = Object.values(p.onHand).reduce((a,b) => a + b, 0);
        return {
          id: p.id,
          productName: p.name,
          sku: p.sku,
          onHand: onHand,
          costPerUnit: p.cost_lkr,
          totalValue: onHand * p.cost_lkr
        };
      });
    },
    getSalesByProduct: async (): Promise<SalesByProductRow[]> => {
        await this.delay(450);
        const productSales: { [productId: string]: { p: Product, qty: number, revenue: number } } = {};

        this._invoices().forEach(invoice => {
            invoice.items.forEach(item => {
                if (!productSales[item.product_id]) {
                    const product = this._products().find(p => p.id === item.product_id);
                    if (product) {
                        productSales[item.product_id] = { p: product, qty: 0, revenue: 0 };
                    }
                }
                if (productSales[item.product_id]) {
                    productSales[item.product_id].qty += item.qty;
                    productSales[item.product_id].revenue += item.qty * item.unit_price_lkr;
                }
            });
        });

        return Object.values(productSales).map(ps => ({
            id: ps.p.id,
            productName: ps.p.name,
            sku: ps.p.sku,
            quantitySold: ps.qty,
            totalRevenue: ps.revenue,
            avgPrice: ps.qty > 0 ? ps.revenue / ps.qty : 0
        })).sort((a,b) => b.totalRevenue - a.totalRevenue);
    },
    getStockOnHand: async (): Promise<StockOnHandRow[]> => {
        await this.delay(200);
        return this._products().map(p => {
            const total = Object.values(p.onHand).reduce((a,b) => a + b, 0);
            return {
                id: p.id,
                productName: p.name,
                sku: p.sku,
                mainWarehouse: p.onHand.mainWarehouse,
                downtownStore: p.onHand.downtownStore,
                online: p.onHand.online,
                totalOnHand: total
            };
        });
    },
    getTaxSummary: async (): Promise<TaxSummaryRow[]> => {
        await this.delay(350);
        const taxableSales = this._invoices().reduce((sum, inv) => sum + inv.subtotal_lkr, 0);
        const taxCollected = this._invoices().reduce((sum, inv) => sum + inv.tax_lkr, 0);
        const taxablePurchases = this._expenses().reduce((sum, exp) => sum + exp.amount_lkr, 0);
        const taxPaid = this._expenses().reduce((sum, exp) => sum + (exp.tax_lkr || 0), 0);

        return [{
            period: 'This Month',
            taxable_sales: taxableSales,
            tax_collected: taxCollected,
            taxable_purchases: taxablePurchases,
            tax_paid: taxPaid,
            net_tax_due: taxCollected - taxPaid
        }];
    },
    // Add other report methods if needed
    getSummary: (): Promise<ReportSummary> => Promise.resolve({} as ReportSummary),
    getSalesTrend: (): Promise<SalesTrend> => Promise.resolve({} as SalesTrend),
    getTopProducts: (): Promise<TopProductReport[]> => Promise.resolve([]),
    getInventorySnapshot: (): Promise<InventorySnapshot> => Promise.resolve({} as InventorySnapshot),
    getRecurringForecast: (): Promise<RecurringForecastRow[]> => Promise.resolve([]),
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
  purchaseOrders = {
     ...this.createCrudService<PurchaseOrder>(this._purchaseOrders),
     receivePO: async (poId: string | number): Promise<void> => {
        await this.delay(600);
        const po = this._purchaseOrders().find(p => String(p.id) === String(poId));
        if (!po || po.status !== 'Ordered') {
            throw new Error(`Purchase Order ${poId} not found or cannot be received.`);
        }

        // Atomically update product stock
        this._products.update(products => {
            const newProducts = [...products];
            po.items.forEach(item => {
                const productIndex = newProducts.findIndex(p => p.id === item.product_id);
                if (productIndex !== -1) {
                    const updatedProduct = { ...newProducts[productIndex] };
                    updatedProduct.onHand = { ...updatedProduct.onHand };
                    updatedProduct.onHand.mainWarehouse += item.qty;
                    newProducts[productIndex] = updatedProduct;
                }
            });
            return newProducts;
        });

        // Update PO status
        await this.purchaseOrders.update(poId, { status: 'Received' });
        this.notifyDataChange();
      }
  };

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

  async updateQuotationStatus(id: string | number, status: QuotationStatus): Promise<Quotation> {
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