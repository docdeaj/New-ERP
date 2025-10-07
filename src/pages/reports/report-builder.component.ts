import { Component, ChangeDetectionStrategy, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { ReportQuery, ReportResult, ReportSchema, ReportView, SchemaField } from '../../models/types';
import { DataTableComponent, ColumnDefinition } from '../../components/data-table/data-table.component';
import { SchemaExplorerComponent } from '../../components/schema-explorer/schema-explorer.component';
import { QueryBuilderComponent } from '../../components/query-builder/query-builder.component';
import { DonutChartComponent } from '../../components/donut-chart/donut-chart.component';

@Component({
  selector: 'app-report-builder',
  templateUrl: './report-builder.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, RouterLink, DataTableComponent, SchemaExplorerComponent, QueryBuilderComponent, DonutChartComponent, CurrencyPipe, DatePipe],
})
export class ReportBuilderComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);
  
  reportId = signal<string | null>(null);
  
  // State Signals
  reportView = signal<ReportView | null>(null);
  reportQuery = signal<ReportQuery>({ dimensions: [], metrics: [], filters: [], sortBy: [] });
  reportSchema = signal<ReportSchema | null>(null);
  reportResult = signal<ReportResult | null>(null);
  isLoading = signal(true);
  isDirty = signal(false);
  activeVisualization = signal<'table' | 'bar' | 'pivot' | 'donut'>('table');

  // Columns for the data table, derived from results
  dataTableColumns = computed<ColumnDefinition<Record<string, any>>[]>(() => {
    const meta = this.reportResult()?.meta;
    if (!meta) return [];

    return meta.columns.map(col => ({
      key: col.key as keyof Record<string, any>,
      label: col.label,
      type: col.type,
    }));
  });

  isDonutCompatible = computed(() => {
    const q = this.reportQuery();
    return q.dimensions.length === 1 && q.metrics.length === 1;
  });

  donutChartData = computed(() => {
      if (!this.isDonutCompatible() || !this.reportResult()) {
          return [];
      }
      const result = this.reportResult()!;
      const dimKey = this.reportQuery().dimensions[0];
      const metKey = this.reportQuery().metrics[0];
      
      return result.data.map(row => ({
          label: String(row[dimKey]),
          value: Number(row[metKey]),
      }));
  });

  ngOnInit() {
    this.reportId.set(this.route.snapshot.paramMap.get('id'));
    this.loadInitialData();
  }

  async loadInitialData() {
    this.isLoading.set(true);
    this.reportResult.set(null); // Clear previous results
    
    // Fetch schema in parallel with view data
    const schemaPromise = this.api.reports.getSchema();
    
    const id = this.reportId();
    if (id) {
      const view = await this.api.reports.getView(id);
      this.reportView.set(view);
      if (view) {
        this.reportQuery.set(view.query);
        this.activeVisualization.set(view.visualizationType);
      }
    } else {
      // Set a default query for new reports
      this.reportQuery.set({ dimensions: ['customer.name'], metrics: ['net_sales'], filters: [], sortBy: [] });
      this.activeVisualization.set('table');
    }

    this.reportSchema.set(await schemaPromise);
    this.isLoading.set(false);

    // Automatically run the report if it was loaded from a saved view
    if (id) {
      this.runReport();
    }
  }
  
  onQueryChange(newQuery: ReportQuery) {
    this.reportQuery.set(newQuery);
    this.isDirty.set(true);
  }

  onFieldAdded(field: SchemaField) {
    this.reportQuery.update(currentQuery => {
      const newQuery = { ...currentQuery };
      const isMetric = this.reportSchema()?.metrics.some(m => m.key === field.key);
      if (isMetric) {
        if (!newQuery.metrics.includes(field.key)) {
          newQuery.metrics = [...newQuery.metrics, field.key];
        }
      } else {
        if (!newQuery.dimensions.includes(field.key)) {
          newQuery.dimensions = [...newQuery.dimensions, field.key];
        }
      }
      return newQuery;
    });
    this.isDirty.set(true);
  }

  setActiveVisualization(vis: 'table' | 'bar' | 'pivot' | 'donut') {
    this.activeVisualization.set(vis);
  }

  async runReport() {
    if (this.reportQuery().metrics.length === 0) {
      alert('Please add at least one metric to your report.');
      return;
    }
    this.isLoading.set(true);
    this.reportResult.set(null);
    try {
      const result = await this.api.reports.run(this.reportQuery());
      this.reportResult.set(result);
    } catch (e) {
      console.error("Failed to run report", e);
      // In a real app, show an error toast
    } finally {
      this.isLoading.set(false);
      this.isDirty.set(false);
    }
  }
}