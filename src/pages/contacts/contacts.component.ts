import { Component, ChangeDetectionStrategy, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTableComponent, ColumnDefinition } from '../../components/data-table/data-table.component';
import { Contact } from '../../models/types';
import { ApiService } from '../../services/api.service';
import { UiStateService } from '../../services/ui-state.service';

@Component({
  selector: 'app-contacts',
  templateUrl: './contacts.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, DataTableComponent],
})
export class ContactsComponent {
  private api = inject(ApiService);
  private uiStateService = inject(UiStateService);
  contacts = signal<Contact[]>([]);
  isLoading = signal(true);

  columns: ColumnDefinition<Contact>[] = [
    { key: 'name', label: 'Name', type: 'avatar', avatarUrlKey: 'avatarUrl' },
    { key: 'email', label: 'Email', type: 'string' },
    { key: 'phone', label: 'Phone', type: 'string' },
    { key: 'type', label: 'Type', type: 'chip' },
  ];

  constructor() {
    this.loadContacts();
    effect(() => {
      this.api.dataChanged();
      this.loadContacts();
    });
  }

  async loadContacts() {
    this.isLoading.set(true);
    const data = await this.api.contacts.list();
    this.contacts.set(data);
    this.isLoading.set(false);
  }

  handleRowAction(event: { action: string, item: Contact }) {
    console.log('Row Action:', event.action, 'on item:', event.item);
  }

  handleBulkAction(event: { action: string, selectedIds: (string | number)[] }) {
    if (event.action === 'delete') {
      this.api.contacts.deleteMany(event.selectedIds);
    } else {
      console.log('Bulk Action:', event.action, 'on ids:', event.selectedIds);
    }
  }
  
  openAddNewDrawer() {
    this.uiStateService.openDrawer('new-contact');
  }
}
