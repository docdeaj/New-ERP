import { Component, ChangeDetectionStrategy, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UiStateService, DrawerContext } from '../../services/ui-state.service';
import { ApiService } from '../../services/api.service';
import { Kpi, Product } from '../../models/types';
import { SimpleBarChartComponent } from '../../components/simple-bar-chart/simple-bar-chart.component';
import { CalendarWidgetComponent } from '../../components/calendar-widget/calendar-widget.component';
import { SparklineChartComponent } from '../../components/sparkline-chart/sparkline-chart.component';

interface QuickAction {
  icon: string;
  label: string;
  context: DrawerContext;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, RouterLink, SimpleBarChartComponent, CalendarWidgetComponent, SparklineChartComponent, DatePipe],
})
export class DashboardComponent implements OnInit, OnDestroy {
  private uiStateService = inject(UiStateService);
  private api = inject(ApiService);

  salesKpi = signal<Kpi | null>(null);
  expensesKpi = signal<Kpi | null>(null);
  topSellingProducts = signal<Product[]>([]);
  salesChartData = signal<{ labels: string[], datasets: { label: string, data: number[] }[] } | null>(null);
  
  // Dynamic Dashboard Data
  currentTime = signal(new Date());
  salesTrend = signal<number[]>([]);
  expensesTrend = signal<number[]>([]);
  arApSummary = signal<{ar: { total: number, overdue: number }, ap: { total: number, overdue: number }} | null>(null);

  private intervalId?: number;

  quickActions: QuickAction[] = [
    { icon: 'fa-cash-register', label: 'Record Sale', context: 'record-sale' },
    { icon: 'fa-money-bill-wave', label: 'Add Expense', context: 'new-expense' },
    { icon: 'fa-file-invoice-dollar', label: 'New Invoice', context: 'new-invoice' },
    { icon: 'fa-receipt', label: 'Record Payment', context: 'record-payment' },
    { icon: 'fa-cart-shopping', label: 'New PO', context: 'new-po' },
    { icon: 'fa-address-book', label: 'New Contact', context: 'new-contact' },
  ];

  ngOnInit() {
    this.loadDashboardData();
    this.intervalId = window.setInterval(() => {
      this.currentTime.set(new Date());
    }, 1000);
  }

  ngOnDestroy() {
    clearInterval(this.intervalId);
  }

  async loadDashboardData() {
    const [kpis, products, chartData, salesTrendData, expensesTrendData, arApData] = await Promise.all([
      this.api.dashboard.getKpis(),
      this.api.dashboard.getTopSellingProducts(),
      this.api.dashboard.getSalesComparisonData(),
      this.api.dashboard.getKpiTrend('sales'),
      this.api.dashboard.getKpiTrend('expenses'),
      this.api.dashboard.getArApSummary()
    ]);
    this.salesKpi.set(kpis.sales);
    this.expensesKpi.set(kpis.expenses);
    this.topSellingProducts.set(products);
    this.salesChartData.set(chartData);
    this.salesTrend.set(salesTrendData);
    this.expensesTrend.set(expensesTrendData);
    this.arApSummary.set(arApData);
  }
  
  onQuickAction(context: DrawerContext) {
    this.uiStateService.openDrawer(context);
  }
}
