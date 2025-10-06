import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { DailyReport } from '../../models/types';

interface ReportMetric {
  label: string;
  value: number;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, DatePipe],
})
export class ReportsComponent implements OnInit {
  private api = inject(ApiService);

  dailyReport = signal<DailyReport | null>(null);
  isLoading = signal(true);
  currentDate = new Date();

  ngOnInit() {
    this.loadReports();
  }

  async loadReports() {
    this.isLoading.set(true);
    const reportData = await this.api.reports.getDailyClosePack();
    this.dailyReport.set(reportData);
    this.isLoading.set(false);
  }

  formatCurrency(value: number): string {
    return `LKR ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}