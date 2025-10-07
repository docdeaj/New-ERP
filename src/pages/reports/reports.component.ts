import { Component, ChangeDetectionStrategy, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { ReportSummary, SalesTrend, TopProductReport, ArAgingRow, Cheque, ApAgingRow, InventorySnapshot, RecurringForecastRow, TaxSummaryRow } from '../../models/types';
import { SimpleBarChartComponent } from '../../components/simple-bar-chart/simple-bar-chart.component';
import { DonutChartComponent } from '../../components/donut-chart/donut-chart.component';
import { DataTableComponent, ColumnDefinition } from '../../components/data-table/data-table.component';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, DecimalPipe, SimpleBarChartComponent, DonutChartComponent, DataTableComponent],
})
export class ReportsComponent implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);

  isLoading = signal(true);
  
  // Data Signals
  summary = signal<ReportSummary | null>(null);
  salesTrend = signal<SalesTrend | null>(null);
  topProducts = signal<TopProductReport[]>([]);
  arAgingData = signal<ArAgingRow[]>([]);
  apAgingData = signal<ApAgingRow[]>([]);
  inventorySnapshot = signal<InventorySnapshot | null>(null);
  chequeRegisterData = signal<Cheque[]>([]);
  recurringForecastData = signal<RecurringForecastRow[]>([]);
  taxSummaryData = signal<TaxSummaryRow[]>([]);
  
  // UI State
  activeDateRange = signal('This Month');

  // Computed descriptions for data tables
  arAgingDescription = computed(() => `Outstanding receivables grouped by aging buckets for ${this.activeDateRange()}.`);
  apAgingDescription = computed(() => `Supplier payables grouped by aging buckets for ${this.activeDateRange()}.`);
  chequeRegisterDescription = computed(() => `All recorded cheques for ${this.activeDateRange()}. Currency is LKR.`);
  recurringForecastDescription = computed(() => `Upcoming scheduled expenses for ${this.activeDateRange()}. Currency is LKR.`);
  taxSummaryDescription = computed(() => `Summary of taxes collected on sales for ${this.activeDateRange()}.`);

  // Column Definitions for Data Tables
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

  chequeRegisterColumns: ColumnDefinition<Cheque>[] = [
    { key: 'chequeDate', label: 'Date', type: 'date' },
    { key: 'chequeNumber', label: 'Cheque #', type: 'string' },
    { key: 'bank', label: 'Bank', type: 'string' },
    { key: 'payee', label: 'Payee', type: 'string' },
    { key: 'amount', label: 'Amount', type: 'currency' },
    { key: 'status', label: 'Status', type: 'chip' },
  ];

  recurringForecastColumns: ColumnDefinition<RecurringForecastRow>[] = [
    { key: 'name', label: 'Expense', type: 'string' },
    { key: 'cadence', label: 'Cadence', type: 'chip' },
    { key: 'nextDueDate', label: 'Next Due', type: 'date' },
    { key: 'amount', label: 'Amount', type: 'currency' },
  ];

  taxSummaryColumns: ColumnDefinition<TaxSummaryRow>[] = [
    { key: 'rate', label: 'Tax Rate', type: 'string' },
    { key: 'taxableSales', label: 'Taxable Sales', type: 'currency' },
    { key: 'taxCollected', label: 'Tax Collected', type: 'currency' },
  ];

  ngOnInit() {
    this.loadAllReports();
  }

  async loadAllReports() {
    this.isLoading.set(true);
    const [summaryData, salesTrendData, topProductsData, arAging, apAging, inventorySnap, cheques, recurring, tax] = await Promise.all([
      this.api.reports.getSummary(),
      this.api.reports.getSalesTrend(),
      this.api.reports.getTopProducts(),
      this.api.reports.getArAging(),
      this.api.reports.getApAging(),
      this.api.reports.getInventorySnapshot(),
      this.api.cheques.list(),
      this.api.reports.getRecurringForecast(),
      this.api.reports.getTaxSummary(),
    ]);
    this.summary.set(summaryData);
    this.salesTrend.set(salesTrendData);
    this.topProducts.set(topProductsData);
    this.arAgingData.set(arAging);
    this.apAgingData.set(apAging);
    this.inventorySnapshot.set(inventorySnap);
    this.chequeRegisterData.set(cheques);
    this.recurringForecastData.set(recurring);
    this.taxSummaryData.set(tax);
    this.isLoading.set(false);
  }

  // --- UI Interaction Handlers ---
  onDateRangeChange(range: string) {
    this.activeDateRange.set(range);
    // In a real app, this would trigger a data reload with new date params
    console.log(`Date range changed to: ${range}`);
  }

  scrollToSection(sectionId: string) {
    const element = document.getElementById(sectionId);
    element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  handleRowAction(event: { action: string, item: any }, context: string) {
    if (context === 'ar-aging' && event.action === 'view-invoices') {
      this.router.navigate(['/invoices'], { queryParams: { q: (event.item as ArAgingRow).customerName } });
    } else if (context === 'ap-aging' && event.action === 'view-bills') {
      this.router.navigate(['/expenses'], { queryParams: { q: (event.item as ApAgingRow).supplierName } });
    } else {
      console.log(`Action '${event.action}' on item in '${context}':`, event.item);
    }
  }
  
  navigateTo(path: string) {
    this.router.navigate([path]);
  }

  navigateToProduct(product: TopProductReport) {
    this.router.navigate(['/inventory'], { queryParams: { q: product.sku } });
  }
}
