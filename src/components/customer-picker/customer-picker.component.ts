import { Component, ChangeDetectionStrategy, input, output, signal, computed, inject, effect, ElementRef, viewChild, HostListener } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Contact, MediaItem } from '../../models/types';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { MiniMediaBrowserComponent } from '../mini-media-browser/mini-media-browser.component';

type FilterType = 'all' | 'balance' | 'frequent';

@Component({
  selector: 'app-customer-picker',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, ReactiveFormsModule, ScrollingModule, MiniMediaBrowserComponent],
  templateUrl: './customer-picker.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerPickerComponent {
  // --- Inputs / Outputs ---
  value = input<Contact | null>(null);
  placeholder = input('Search or add customer...');
  onSelect = output<Contact>();
  onClear = output<void>();

  // --- State Signals ---
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  
  query = signal('');
  isDropdownOpen = signal(false);
  rawResults = signal<Contact[]>([]); // Results from API or recents cache
  recents = signal<Contact[]>([]);
  isLoading = signal(false);
  activeIndex = signal(0);
  isQuickCreateVisible = signal(false);
  isSaving = signal(false);
  liveRegionMessage = signal(''); // For accessibility announcements
  isMediaBrowserOpen = signal(false);
  activeFilter = signal<FilterType>('all');

  // --- Tooltip State ---
  hoveredCustomer = signal<Contact | null>(null);
  tooltipPosition = signal<{ top: string, left: string }>({ top: '0', left: '0' });

  // --- Element Refs ---
  searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');
  pickerContainer = viewChild<ElementRef<HTMLDivElement>>('pickerContainer');

  // --- Forms ---
  quickCreateForm = this.fb.group({
    name: ['', Validators.required],
    phone: [''],
    email: ['', Validators.email],
    avatarUrl: [''],
  });

  // --- Computed State ---
  results = computed(() => {
    const raw = this.rawResults();
    const filter = this.activeFilter();
    if (filter === 'all') {
      return raw;
    }
    if (filter === 'balance') {
      return raw.filter(c => c.stats?.balance_lkr && c.stats.balance_lkr > 0);
    }
    if (filter === 'frequent') {
      // Using 'VIP' tag as a proxy for frequent customers as per spec
      return raw.filter(c => c.tags?.includes('VIP'));
    }
    return raw;
  });

  activeResult = computed(() => this.results()[this.activeIndex()]);

  constructor() {
    this.fetchRecents();

    // Effect to handle searching
    effect((onCleanup) => {
      const q = this.query();
      this.activeIndex.set(0);

      // Immediately close quick create if query changes
      if (this.isQuickCreateVisible()) {
        this.isQuickCreateVisible.set(false);
      }

      const timer = setTimeout(async () => {
        if (q) {
          this.isLoading.set(true);
          const allContacts = await this.api.contacts.list({ query: q });
          this.rawResults.set(allContacts.filter(c => c.type === 'Customer'));
          this.isLoading.set(false);
        } else {
          this.rawResults.set(this.recents());
        }
      }, 150); // Debounce

      onCleanup(() => clearTimeout(timer));
    });
    
    // Effect to announce result count for accessibility
    effect(() => {
      this.liveRegionMessage.set(`${this.results().length} results found.`);
    });

    // Effect to focus input when dropdown opens
    effect(() => {
      if (this.isDropdownOpen() && !this.value()) {
        setTimeout(() => {
          this.searchInput()?.nativeElement.focus();
        }, 0);
      }
    });
  }
  
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.pickerContainer()?.nativeElement.contains(event.target as Node)) {
      this.isDropdownOpen.set(false);
    }
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (!this.isDropdownOpen()) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.activeIndex.update(i => (i + 1) % this.results().length);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.activeIndex.update(i => (i - 1 + this.results().length) % this.results().length);
        break;
      case 'Enter':
        event.preventDefault();
        if (this.results().length > 0) {
          this.selectItem(this.activeResult());
        } else if (this.query()) {
          this.showQuickCreate();
        }
        break;
      case 'Tab':
        if (this.results().length > 0) {
          this.selectItem(this.activeResult());
        }
        break;
      case 'Escape':
        this.isDropdownOpen.set(false);
        break;
    }
  }

  async fetchRecents() {
    const contacts = await this.api.contacts.list();
    const recents = contacts.filter(c => c.type === 'Customer').slice(0, 5);
    this.recents.set(recents);
    this.rawResults.set(recents); // Initially show recents
  }

  openDropdown() {
    this.isDropdownOpen.set(true);
    if (!this.query()) {
      this.rawResults.set(this.recents());
    }
  }
  
  setFilter(filter: FilterType) {
    this.activeFilter.set(filter);
    this.activeIndex.set(0);
  }

  selectItem(customer: Contact) {
    this.onSelect.emit(customer);
    this.query.set('');
    this.isDropdownOpen.set(false);
    this.isQuickCreateVisible.set(false);
  }

  clearSelection(event?: MouseEvent) {
    event?.stopPropagation();
    this.onClear.emit();
    this.query.set('');
    this.openDropdown();
  }

  showQuickCreate() {
    this.quickCreateForm.reset();
    this.quickCreateForm.patchValue({ name: this.query() });
    this.isQuickCreateVisible.set(true);
  }

  async saveNewCustomer() {
    if (this.quickCreateForm.invalid) return;

    this.isSaving.set(true);
    const newContactData: Partial<Contact> = {
      name: this.quickCreateForm.value.name || '',
      phone: this.quickCreateForm.value.phone || '',
      email: this.quickCreateForm.value.email || '',
      avatarUrl: this.quickCreateForm.value.avatarUrl || '',
      type: 'Customer',
    };
    try {
      const newContact = await this.api.createContact(newContactData);
      this.liveRegionMessage.set(`Customer ${newContact.name} created.`); // Announce creation
      this.selectItem(newContact);
    } catch (e) {
      console.error('Failed to create contact', e);
      this.liveRegionMessage.set(`Error creating customer.`);
    } finally {
      this.isSaving.set(false);
    }
  }

  onMouseOver(event: MouseEvent, customer: Contact) {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    this.tooltipPosition.set({
      top: `${rect.bottom + 8}px`, // Position below the list item
      left: `${rect.left}px`
    });
    this.hoveredCustomer.set(customer);
  }

  onMouseOut() {
    this.hoveredCustomer.set(null);
  }

  openMediaBrowser() {
    this.isMediaBrowserOpen.set(true);
  }

  onMediaSelect(mediaItem: MediaItem) {
    this.quickCreateForm.patchValue({ avatarUrl: mediaItem.url });
    this.isMediaBrowserOpen.set(false);
  }
}