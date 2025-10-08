import { Component, ChangeDetectionStrategy, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTableComponent, ColumnDefinition, EmptyStateConfig } from '../../components/data-table/data-table.component';
import { PurchaseOrder } from '../../models/types';
import { ApiService } from '../../services/api.service';
import { UiStateService } from '../../services/ui-state.service';
import { PoToStockModalComponent } from '../../components/po-to-stock-modal/po-to-stock-modal.component';
import { PdfGenerationService } from '../../services/pdf.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-purchase-orders',
  templateUrl: './purchase-orders.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, DataTableComponent, PoToStockModalComponent],
})
export class PurchaseOrdersComponent {
  private api = inject(ApiService);
  private uiStateService = inject(UiStateService);
  private pdfService = inject(PdfGenerationService);
  private toastService = inject(ToastService);
  purchaseOrders = signal<PurchaseOrder[]>([]);
  isLoading = signal(true);
  
  isConversionModalOpen = signal(false);
  selectedPoForConversion = signal<PurchaseOrder | null>(null);

  // FIX: Corrected column definition keys to match the PurchaseOrder model.
  columns: ColumnDefinition<PurchaseOrder>[] = [
    { key: 'number', label: 'PO #', type: 'string' },
    { key: 'partyName', label: 'Supplier', type: 'string' },
    { key: 'issue_date', label: 'Order Date', type: 'date' },
    { key: 'due_date', label: 'Expected Date', type: 'date' },
    { key: 'total_lkr', label: 'Amount', type: 'currency' },
    { key: 'status', label: 'Status', type: 'chip' },
  ];

  emptyStateConfig: EmptyStateConfig = {
    title: 'No Purchase Orders',
    message: 'Create purchase orders to track inventory from your suppliers.',
    actionText: 'New Purchase Order'
  };

  constructor() {
    this.loadPurchaseOrders();
    effect(() => {
      this.api.dataChanged();
      this.loadPurchaseOrders();
    });
  }

  async loadPurchaseOrders() {
    this.isLoading.set(true);
    const data = await this.api.purchaseOrders.list();
    this.purchaseOrders.set(data);
    this.isLoading.set(false);
  }
  
  openPreview(po: PurchaseOrder) {
    this.uiStateService.showDocumentPreview(po);
  }

  handleRowAction(event: { action: string, item: PurchaseOrder }) {
    switch (event.action) {
      case 'convert-to-stock':
        if (event.item.status === 'Ordered') {
          this.selectedPoForConversion.set(event.item);
          this.isConversionModalOpen.set(true);
        } else {
          this.toastService.show({ type: 'info', message: `This PO has already been ${event.item.status}.` });
        }
        break;
      case 'edit':
        this.uiStateService.openDrawer('new-po', event.item);
        break;
      case 'delete':
        this.deletePurchaseOrders([event.item.id]);
        break;
      case 'download-pdf':
        this.pdfService.generatePdf(event.item);
        break;
      default:
        console.log('Row Action:', event.action, 'on item:', event.item);
    }
  }
  
  async handleConfirmConversion(poId: string | number) {
    try {
      await this.api.purchaseOrders.receivePO(poId);
      this.toastService.show({ type: 'success', message: `Stock received for PO #${this.selectedPoForConversion()?.number}.` });
    } catch (e) {
      console.error(e);
      this.toastService.show({ type: 'error', message: 'Failed to receive stock.' });
    } finally {
      this.closeConversionModal();
    }
  }

  handleBulkAction(event: { action: string, selectedIds: (string | number)[] }) {
    if (event.action === 'delete') {
      this.deletePurchaseOrders(event.selectedIds);
    } else if (event.action === 'export-pdf') {
        // This correctly filters the full list of POs to get the selected items
        // and passes them to the PDF service, which handles generation, progress UI, and download.
        const selected = this.purchaseOrders().filter(po => event.selectedIds.includes(po.id));
        this.pdfService.generateBulkPdfZip(selected);
    } else {
      console.log('Bulk Action:', event.action, 'on ids:', event.selectedIds);
    }
  }
  
  openAddNewDrawer() {
    this.uiStateService.openDrawer('new-po');
  }

  handleEmptyStateAction() {
    this.openAddNewDrawer();
  }
  
  closeConversionModal() {
    this.isConversionModalOpen.set(false);
    this.selectedPoForConversion.set(null);
  }

  deletePurchaseOrders(ids: (string | number)[]) {
    this.uiStateService.showConfirmation(
      'Delete Purchase Orders',
      `Are you sure you want to delete ${ids.length} PO(s)?`,
      () => {
        this.api.purchaseOrders.deleteMany(ids);
      }
    );
  }
}
