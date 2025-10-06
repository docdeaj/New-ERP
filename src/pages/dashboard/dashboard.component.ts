import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiStateService, DrawerContext } from '../../services/ui-state.service';
import { ApiService } from '../../services/api.service';
import { Kpi, Product } from '../../models/types';
import { SimpleBarChartComponent } from '../../components/simple-bar-chart/simple-bar-chart.component';
import { CalendarWidgetComponent } from '../../components/calendar-widget/calendar-widget.component';

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
  imports: [CommonModule, SimpleBarChartComponent, CalendarWidgetComponent],
})
export class DashboardComponent implements OnInit {
  private uiStateService = inject(UiStateService);
  private api = inject(ApiService);

  salesKpi = signal<Kpi | null>(null);
  expensesKpi = signal<Kpi | null>(null);
  topSellingProducts = signal<Product[]>([]);
  salesChartData = signal<{ labels: string[], datasets: { label: string, data: number[] }[] } | null>(null);
  
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
  }

  async loadDashboardData() {
    const [kpis, products, chartData] = await Promise.all([
      this.api.dashboard.getKpis(),
      this.api.dashboard.getTopSellingProducts(),
      this.api.dashboard.getSalesComparisonData(),
    ]);
    this.salesKpi.set(kpis.sales);
    this.expensesKpi.set(kpis.expenses);
    this.topSellingProducts.set(products);
    this.salesChartData.set(chartData);
  }
  
  onQuickAction(context: DrawerContext) {
    this.uiStateService.openDrawer(context);
  }
}