
import { Component, ChangeDetectionStrategy, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTableComponent, ColumnDefinition } from '../../components/data-table/data-table.component';
import { Quotation } from '../../models/types';
import { ApiService } from '../../services/api.service';
import { UiStateService } from '../../services/ui-state.service';
import { PdfGenerationService } from '../../services/pdf.service';

@Component({
  selector: 'app-quotations',
  templateUrl: './quotations.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, DataTableComponent],
})
export class QuotationsComponent {
  private api = inject(ApiService);
  private uiStateService = inject(UiStateService);
  private pdfService = inject(PdfGenerationService);
  quotations = signal<Quotation[]>([]);
  isLoading = signal(true);

  // FIX: Corrected column definition keys to match the Quotation model.
  columns: ColumnDefinition<Quotation>[] = [
    { key: 'number', label: 'Quotation #', type: 'string' },
    { key: 'partyName', label: 'Customer', type: 'avatar', avatarUrlKey: 'partyAvatarUrl' },
    { key: 'issue_date', label: 'Issue Date', type: 'date' },
    { key: 'due_date', label: 'Expiry Date', type: 'date' },
    { key: 'total_lkr', label: 'Amount', type: 'currency' },
    { key: 'status', label: 'Status', type: 'chip' },
  ];

  constructor() {
    this.loadQuotations();
    effect(() => {
      this.api.dataChanged();
      this.loadQuotations();
    });
  }

  async loadQuotations() {
    this.isLoading.set(true);
    const data = await this.api.quotations.list();
    this.quotations.set(data);
    this.isLoading.set(false);
  }
  
  openPreview(quotation: Quotation) {
    this.uiStateService.showDocumentPreview(quotation);
  }

  handleRowAction(event: { action: string, item: Quotation }) {
    switch (event.action) {
      case 'convert-to-invoice':
        this.uiStateService.openDrawer('new-invoice', event.item);
        // FIX: Cast string id to number for API call.
        this.api.updateQuotationStatus(+event.item.id, 'Accepted');
        break;
      case 'edit':
        this.uiStateService.openDrawer('new-quotation', event.item);
        break;
      case 'delete':
        this.deleteQuotations([event.item.id]);
        break;
      case 'download-pdf':
        this.pdfService.generatePdf(event.item);
        break;
      default:
        console.log('Row Action:', event.action, 'on item:', event.item);
    }
  }

  handleBulkAction(event: { action: string, selectedIds: (string | number)[] }) {
    if (event.action === 'delete') {
      this.deleteQuotations(event.selectedIds);
    } else if (event.action === 'export-pdf') {
        const selected = this.quotations().filter(q => event.selectedIds.includes(q.id));
        this.pdfService.generateBulkPdfZip(selected);
    } else {
      console.log('Bulk Action:', event.action, 'on ids:', event.selectedIds);
    }
  }
  
  openAddNewQuotationDrawer() {
    this.uiStateService.openDrawer('new-quotation');
  }

  deleteQuotations(ids: (string | number)[]) {
    this.uiStateService.showConfirmation(
      'Delete Quotations',
      `Are you sure you want to delete ${ids.length} quotation(s)?`,
      () => {
        this.api.quotations.deleteMany(ids);
      }
    );
  }
}
