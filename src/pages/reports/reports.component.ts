import { Component, ChangeDetectionStrategy, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { ReportView, ArAgingRow, ApAgingRow, PnlRow, InventoryValuationRow, SalesByCustomerRow, StockOnHandRow, SalesByProductRow, TaxSummaryRow, BalanceSheetRow, PurchasesBySupplierRow } from '../../models/types';
import { UiStateService } from '../../services/ui-state.service';
import { DataTableComponent, ColumnDefinition } from '../../components/data-table/data-table.component';
import { PdfGenerationService } from '../../services/pdf.service';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: 'financials' | 'sales' | 'inventory' | 'operational';
}

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, RouterLink, DataTableComponent, CurrencyPipe],
})
export class ReportsComponent implements OnInit {
  private api = inject(ApiService);
  private pdfService = inject(PdfGenerationService);
  
  isLoading = signal(true);
  
  // Report Data Signals
  arAgingData = signal<ArAgingRow[]>([]);
  apAgingData = signal<ApAgingRow[]>([]);
  salesByCustomerData = signal<SalesByCustomerRow[]>([]);
  inventoryValuationData = signal<InventoryValuationRow[]>([]);
  pnlData = signal<PnlRow[]>([]);
  balanceSheetData = signal<BalanceSheetRow[]>([]);
  purchasesBySupplierData = signal<PurchasesBySupplierRow[]>([]);
  salesByProductData = signal<SalesByProductRow[]>([]);
  stockOnHandData = signal<StockOnHandRow[]>([]);
  taxSummaryData = signal<TaxSummaryRow[]>([]);
  
  // Loading State Signals
  isArAgingLoading = signal(true);
  isApAgingLoading = signal(true);
  isSalesByCustomerLoading = signal(true);
  isInventoryValuationLoading = signal(true);
  isPnlLoading = signal(true);
  isBalanceSheetLoading = signal(true);
  isPurchasesBySupplierLoading = signal(true);
  isSalesByProductLoading = signal(true);
  isStockOnHandLoading = signal(true);
  isTaxSummaryLoading = signal(true);

  activeTimeRange = signal<'this-month' | 'last-month' | 'this-quarter' | 'year-to-date'>('this-month');

  reportTemplates: ReportTemplate[] = [
    { id: 'pnl', name: 'Profit & Loss', description: 'Summarizes revenues, costs, and expenses incurred during a specific period.', category: 'financials' },
    { id: 'balance-sheet', name: 'Balance Sheet', description: 'Provides a snapshot of your company’s assets, liabilities, and equity.', category: 'financials' },
    { id: 'tax-summary', name: 'Sales Tax Summary', description: 'Summarizes tax collected from sales and paid on purchases.', category: 'financials' },
    { id: 'ar-aging', name: 'A/R Aging Summary', description: 'Lists unpaid customer invoices and how long they have been outstanding.', category: 'financials' },
    { id: 'ap-aging', name: 'A/P Aging Summary', description: 'Lists unpaid bills to suppliers and how long they have been outstanding.', category: 'financials' },
    { id: 'sales-by-product', name: 'Sales by Product', description: 'Ranks your products by sales revenue, quantity sold, or profit.', category: 'sales' },
    { id: 'sales-by-customer', name: 'Sales by Customer', description: 'Identifies your most valuable customers by sales volume.', category: 'sales' },
    { id: 'purchases-by-supplier', name: 'Purchases by Supplier', description: 'Shows total purchase volume for each supplier.', category: 'operational' },
    { id: 'inventory-valuation', name: 'Inventory Valuation', description: 'Calculates the current value of your inventory on hand.', category: 'inventory' },
    { id: 'stock-on-hand', name: 'Stock on Hand', description: 'Shows the quantity of each product available at each location.', category: 'inventory' },
  ];

  financialReports = computed(() => this.reportTemplates.filter(r => r.category === 'financials'));
  salesReports = computed(() => this.reportTemplates.filter(r => r.category === 'sales'));
  inventoryReports = computed(() => this.reportTemplates.filter(r => r.category === 'inventory'));
  operationalReports = computed(() => this.reportTemplates.filter(r => r.category === 'operational'));
  
  // --- Column Definitions ---
  arAgingColumns: ColumnDefinition<ArAgingRow>[] = [
    { key: 'customerName', label: 'Customer', type: 'avatar', avatarUrlKey: 'customerAvatarUrl' },
    { key: 'bucket_0_30', label: '0-30 Days', type: 'currency' },
    { key: 'bucket_31_60', label: '31-60 Days', type: 'currency' },
    { key: 'bucket_61_90', label: '61-90 Days', type: 'currency' },
    { key: 'bucket_90_plus', label: '90+ Days', type: 'currency' },
    { key: 'total', label: 'Total Due', type: 'currency' },
  ];
  
  apAgingColumns: ColumnDefinition<ApAgingRow>[] = [
    { key: 'supplierName', label: 'Supplier', type: 'avatar', avatarUrlKey: 'supplierAvatarUrl' },
    { key: 'bucket_0_30', label: '0-30 Days', type: 'currency' },
    { key: 'bucket_31_60', label: '31-60 Days', type: 'currency' },
    { key: 'bucket_61_90', label: '61-90 Days', type: 'currency' },
    { key: 'bucket_90_plus', label: '90+ Days', type: 'currency' },
    { key: 'total', label: 'Total Due', type: 'currency' },
  ];

  salesByCustomerColumns: ColumnDefinition<SalesByCustomerRow>[] = [
    { key: 'customerName', label: 'Customer', type: 'avatar', avatarUrlKey: 'customerAvatarUrl' },
    { key: 'invoiceCount', label: '# Invoices', type: 'number' },
    { key: 'lastSaleDate', label: 'Last Sale', type: 'date' },
    { key: 'totalSales', label: 'Total Sales', type: 'currency' },
  ];
  
  purchasesBySupplierColumns: ColumnDefinition<PurchasesBySupplierRow>[] = [
    { key: 'supplierName', label: 'Supplier', type: 'avatar', avatarUrlKey: 'supplierAvatarUrl' },
    { key: 'poCount', label: '# POs', type: 'number' },
    { key: 'totalPurchases', label: 'Total Purchases', type: 'currency' },
  ];

  inventoryValuationColumns: ColumnDefinition<InventoryValuationRow>[] = [
    { key: 'productName', label: 'Product', type: 'string' },
    { key: 'sku', label: 'SKU', type: 'string' },
    { key: 'onHand', label: 'On Hand Qty', type: 'number' },
    { key: 'costPerUnit', label: 'Cost/Unit', type: 'currency' },
    { key: 'totalValue', label: 'Total Value', type: 'currency' },
  ];

  salesByProductColumns: ColumnDefinition<SalesByProductRow>[] = [
    { key: 'productName', label: 'Product', type: 'string' },
    { key: 'sku', label: 'SKU', type: 'string' },
    { key: 'quantitySold', label: 'Qty Sold', type: 'number' },
    { key: 'avgPrice', label: 'Avg. Price', type: 'currency' },
    { key: 'totalRevenue', label: 'Total Revenue', type: 'currency' },
  ];

  stockOnHandColumns: ColumnDefinition<StockOnHandRow>[] = [
    { key: 'productName', label: 'Product', type: 'string' },
    { key: 'sku', label: 'SKU', type: 'string' },
    { key: 'mainWarehouse', label: 'Main WH', type: 'number' },
    { key: 'downtownStore', label: 'Downtown Store', type: 'number' },
    { key: 'online', label: 'Online', type: 'number' },
    { key: 'totalOnHand', label: 'Total On Hand', type: 'number' },
  ];
  
  taxSummaryColumns: ColumnDefinition<TaxSummaryRow>[] = [
      { key: 'period', label: 'Period', type: 'string' },
      { key: 'taxable_sales', label: 'Taxable Sales', type: 'currency' },
      { key: 'tax_collected', label: 'Tax Collected', type: 'currency' },
      { key: 'net_tax_due', label: 'Net Tax Due', type: 'currency' },
  ];
  
  constructor() {}

  ngOnInit() {
    this.loadAllReports();
  }

  async loadAllReports() {
    this.loadArAgingData();
    this.loadSalesByCustomerData();
    this.loadApAgingData();
    this.loadInventoryValuationData();
    this.loadPnlData();
    this.loadBalanceSheetData();
    this.loadPurchasesBySupplierData();
    this.loadSalesByProductData();
    this.loadStockOnHandData();
    this.loadTaxSummaryData();
  }

  async loadArAgingData() { this.isArAgingLoading.set(true); this.arAgingData.set(await this.api.reports.getArAging()); this.isArAgingLoading.set(false); }
  async loadSalesByCustomerData() { this.isSalesByCustomerLoading.set(true); this.salesByCustomerData.set(await this.api.reports.getSalesByCustomer()); this.isSalesByCustomerLoading.set(false); }
  async loadApAgingData() { this.isApAgingLoading.set(true); this.apAgingData.set(await this.api.reports.getApAging()); this.isApAgingLoading.set(false); }
  async loadInventoryValuationData() { this.isInventoryValuationLoading.set(true); this.inventoryValuationData.set(await this.api.reports.getInventoryValuation()); this.isInventoryValuationLoading.set(false); }
  async loadPnlData() { this.isPnlLoading.set(true); this.pnlData.set(await this.api.reports.getPnlData()); this.isPnlLoading.set(false); }
  async loadBalanceSheetData() { this.isBalanceSheetLoading.set(true); this.balanceSheetData.set(await this.api.reports.getBalanceSheet()); this.isBalanceSheetLoading.set(false); }
  async loadPurchasesBySupplierData() { this.isPurchasesBySupplierLoading.set(true); this.purchasesBySupplierData.set(await this.api.reports.getPurchasesBySupplier()); this.isPurchasesBySupplierLoading.set(false); }
  async loadSalesByProductData() { this.isSalesByProductLoading.set(true); this.salesByProductData.set(await this.api.reports.getSalesByProduct()); this.isSalesByProductLoading.set(false); }
  async loadStockOnHandData() { this.isStockOnHandLoading.set(true); this.stockOnHandData.set(await this.api.reports.getStockOnHand()); this.isStockOnHandLoading.set(false); }
  async loadTaxSummaryData() { this.isTaxSummaryLoading.set(true); this.taxSummaryData.set(await this.api.reports.getTaxSummary()); this.isTaxSummaryLoading.set(false); }


  exportReport(format: 'pdf' | 'csv', reportId: string, data: any[], columns: ColumnDefinition<any>[]) {
    const reportName = this.reportTemplates.find(r => r.id === reportId)?.name || 'Report';
    
    if (format === 'csv') {
      this.exportAsCsv(data, columns, `${reportName}_export.csv`);
    } else if (format === 'pdf') {
       const element = document.getElementById(`${reportId}-report`);
       if (element) {
         this.pdfService.generatePdfFromElement(element, `${reportName}_export.pdf`);
       }
    }
  }

  private exportAsCsv(dataToExport: any[], columns: ColumnDefinition<any>[], filename: string) {
    if (dataToExport.length === 0) return;

    const headers = columns.map(c => c.label).join(',');
    const rows = dataToExport.map(item => {
      return columns.map(col => {
        let cellData = item[col.key as keyof any];
        if (col.type === 'currency' && typeof cellData === 'number') {
            cellData = (cellData / 100).toFixed(2);
        }
        let value = cellData === null || cellData === undefined ? '' : String(cellData);
        if (value.includes('"') || value.includes(',') || value.includes('\n')) {
          value = `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',');
    }).join('\r\n');

    const csvContent = `${headers}\r\n${rows}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}