

import { Component, ChangeDetectionStrategy, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { ReportView, ArAgingRow } from '../../models/types';
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
  
  // A/R Aging Report State
  arAgingData = signal<ArAgingRow[]>([]);
  isArAgingLoading = signal(true);

  activeTimeRange = signal<'this-month' | 'last-month' | 'this-quarter' | 'year-to-date'>('this-month');

  reportTemplates: ReportTemplate[] = [
    { id: 'pnl', name: 'Profit & Loss', description: 'Summarizes revenues, costs, and expenses incurred during a specific period.', category: 'financials' },
    { id: 'balance-sheet', name: 'Balance Sheet', description: 'Provides a snapshot of your company’s assets, liabilities, and equity.', category: 'financials' },
    { id: 'cash-flow', name: 'Cash Flow Statement', description: 'Shows how cash has moved in and out of your business.', category: 'financials' },
    { id: 'ar-aging', name: 'A/R Aging Summary', description: 'Lists unpaid customer invoices and how long they have been outstanding.', category: 'financials' },
    { id: 'ap-aging', name: 'A/P Aging Summary', description: 'Lists unpaid bills to suppliers and how long they have been outstanding.', category: 'financials' },
    { id: 'sales-by-product', name: 'Sales by Product', description: 'Ranks your products by sales revenue, quantity sold, or profit.', category: 'sales' },
    { id: 'sales-by-customer', name: 'Sales by Customer', description: 'Identifies your most valuable customers by sales volume.', category: 'sales' },
    { id: 'inventory-valuation', name: 'Inventory Valuation', description: 'Calculates the current value of your inventory on hand.', category: 'inventory' },
    { id: 'stock-on-hand', name: 'Stock on Hand', description: 'Shows the quantity of each product available at each location.', category: 'inventory' },
  ];

  financialReports = computed(() => this.reportTemplates.filter(r => r.category === 'financials'));
  salesReports = computed(() => this.reportTemplates.filter(r => r.category === 'sales'));
  inventoryReports = computed(() => this.reportTemplates.filter(r => r.category === 'inventory'));
  
  arAgingColumns: ColumnDefinition<ArAgingRow>[] = [
    { key: 'customerName', label: 'Customer', type: 'avatar', avatarUrlKey: 'customerAvatarUrl' },
    { key: 'bucket_0_30', label: '0-30 Days', type: 'currency' },
    { key: 'bucket_31_60', label: '31-60 Days', type: 'currency' },
    { key: 'bucket_61_90', label: '61-90 Days', type: 'currency' },
    { key: 'bucket_90_plus', label: '90+ Days', type: 'currency' },
    { key: 'total', label: 'Total Due', type: 'currency' },
  ];
  
  constructor() {}

  ngOnInit() {
    this.loadArAgingData();
  }

  async loadArAgingData() {
    this.isArAgingLoading.set(true);
    const data = await this.api.reports.getArAging();
    this.arAgingData.set(data);
    this.isArAgingLoading.set(false);
  }

  exportReport(format: 'pdf' | 'csv' | 'xlsx', reportId: string) {
    // This is a placeholder for the actual export logic
    const reportName = this.reportTemplates.find(r => r.id === reportId)?.name || 'Report';
    console.log(`Exporting "${reportName}" as ${format.toUpperCase()}`);
    
    // For demonstration, let's export the A/R Aging table as CSV
    if (reportId === 'ar-aging' && format === 'csv') {
       // We would need to implement a more generic export service or pass data here
       alert('CSV export for A/R Aging would be triggered here.');
    } else if (reportId === 'ar-aging' && format === 'pdf') {
       const tableElement = document.getElementById('ar-aging-table');
       if (tableElement) {
         this.pdfService.generatePdfFromElement(tableElement, 'ar_aging_summary.pdf');
       }
    }
  }
}