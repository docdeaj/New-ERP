import { Component, ChangeDetectionStrategy, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { ReportView } from '../../models/types';
import { UiStateService } from '../../services/ui-state.service';

type ReportTab = 'my-reports' | 'shared' | 'favorites';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, RouterLink],
})
export class ReportsComponent implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);
  private uiStateService = inject(UiStateService);

  isLoading = signal(true);
  allReports = signal<ReportView[]>([]);
  activeTab = signal<ReportTab>('my-reports');
  searchQuery = signal('');
  
  constructor() {}

  ngOnInit() {
    this.loadReports();
  }

  async loadReports() {
    this.isLoading.set(true);
    const reports = await this.api.reports.getViews();
    this.allReports.set(reports);
    this.isLoading.set(false);
  }

  filteredReports = computed(() => {
    const reports = this.allReports();
    const tab = this.activeTab();
    const query = this.searchQuery().toLowerCase();

    let filtered = reports;

    if (tab === 'favorites') {
      filtered = reports.filter(r => r.isFavorite);
    } else if (tab === 'shared') {
      // Mocking this logic for now
      filtered = reports.filter(r => r.owner.name !== 'Admin User');
    } else { // 'my-reports'
      filtered = reports.filter(r => r.owner.name === 'Admin User');
    }
    
    if (query) {
        filtered = filtered.filter(r => 
            r.name.toLowerCase().includes(query) || 
            r.description.toLowerCase().includes(query)
        );
    }
    
    return filtered;
  });

  onNewReport() {
    this.router.navigate(['/reports/builder']);
  }

  onSearch(event: Event) {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }
  
  toggleFavorite(report: ReportView, event: MouseEvent) {
    event.stopPropagation();
    event.preventDefault();
    // In a real app, this would call an API. Here, we'll just update the signal.
    this.allReports.update(reports => 
      reports.map(r => r.id === report.id ? { ...r, isFavorite: !r.isFavorite } : r)
    );
  }
  
  deleteReport(report: ReportView, event: MouseEvent) {
    event.stopPropagation();
    event.preventDefault();
    this.uiStateService.showConfirmation(
        'Delete Report',
        `Are you sure you want to delete the report "${report.name}"? This action cannot be undone.`,
        () => {
            // Mock API call
            this.allReports.update(reports => reports.filter(r => r.id !== report.id));
        }
    );
  }
}