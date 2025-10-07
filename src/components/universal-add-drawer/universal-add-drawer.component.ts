import { Component, ChangeDetectionStrategy, input, output, computed, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormArray, FormGroup } from '@angular/forms';
import { DrawerContext, UiStateService } from '../../services/ui-state.service';
import { MiniMediaBrowserComponent } from '../mini-media-browser/mini-media-browser.component';
import { MediaItem, Product, Quotation, Contact, ReceiptPaymentMethod, Invoice, Expense, PurchaseOrder, Cheque, RecurringExpense } from '../../models/types';
import { ApiService } from '../../services/api.service';
import { startWith } from 'rxjs/operators';
import { CustomerPickerComponent } from '../customer-picker/customer-picker.component';
import { GeminiService } from '../../services/gemini.service';

@Component({
  selector: 'app-universal-add-drawer',
  templateUrl: './universal-add-drawer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MiniMediaBrowserComponent, CustomerPickerComponent],
})
export class UniversalAddDrawerComponent {
  context = input.required<DrawerContext | null>();
  close = output<void>();

  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private uiState = inject(UiStateService);
  private geminiService = inject(GeminiService);

  isMediaBrowserOpen = signal(false);
  mediaFieldContext = signal<'expense-attachment' | 'product-image' | 'contact-avatar' | null>(null);
  isSaving = signal(false);
  products = signal<Product[]>([]);
  isGeneratingDescription = signal(false);

  // --- Edit Mode State ---
  isEditMode = computed(() => !!this.uiState.drawerData());
  currentItem = computed(() => this.uiState.drawerData());

  // --- Form Totals Calculation ---
  private currentItems = signal<any[]>([]);
  subtotal = computed(() => this.currentItems().reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0));
  tax = computed(() => this.subtotal() * 0.1); // 10% tax
  total = computed(() => this.subtotal() + this.tax());

  constructor() {
    this.loadProducts();
    
    // Effect for line item totals
    effect((onCleanup) => {
      const form = this.getCurrentForm();
      const items = form?.get('items') as FormArray | null;
      if (items) {
        const sub = items.valueChanges.pipe(startWith(items.value)).subscribe(val => {
          this.currentItems.set(val);
        });
        onCleanup(() => sub.unsubscribe());
      } else {
        this.currentItems.set([]);
      }
    });
    
    // Effect to pre-populate forms from passed data
    effect(() => {
      const data = this.currentItem();
      const ctx = this.context();
      const form = this.getCurrentForm();
      
      // Reset all forms first to ensure clean state
      this.resetAllForms();

      if (this.isEditMode() && data && form) {
        form.patchValue(data);
        const items = form.get('items') as FormArray;
        if (items && data.lineItems) {
          items.clear();
          data.lineItems.forEach((item: any) => items.push(this.createLineItem(item)));
        }
        
      } else if (ctx === 'new-invoice' && data) {
         // Special case: Converting a Quotation to an Invoice
        const quotation = data as Quotation;
        const mockCustomer: Partial<Contact> = { name: quotation.customerName, avatarUrl: quotation.customerAvatarUrl };
        this.invoiceForm.patchValue({ customer: mockCustomer as Contact });
        
        const items = this.invoiceForm.get('items') as FormArray;
        items.clear();
        quotation.lineItems?.forEach(item => {
          const lineItemGroup = this.createLineItem();
          lineItemGroup.patchValue(item);
          items.push(lineItemGroup);
        });
      }
    });
  }

  async loadProducts() {
    this.products.set(await this.api.products.list());
  }

  resetAllForms() {
    this.invoiceForm.reset({ issueDate: new Date().toISOString().split('T')[0] });
    (this.invoiceForm.get('items') as FormArray).clear();
    (this.invoiceForm.get('items') as FormArray).push(this.createLineItem());

    this.expenseForm.reset({ date: new Date().toISOString().split('T')[0], isRecurring: false, cadence: 'Monthly' });
    this.productForm.reset();
    this.contactForm.reset({ type: 'Customer' });
    
    this.purchaseOrderForm.reset({ orderDate: new Date().toISOString().split('T')[0] });
    (this.purchaseOrderForm.get('items') as FormArray).clear();
    (this.purchaseOrderForm.get('items') as FormArray).push(this.createLineItem());

    this.quotationForm.reset({ issueDate: new Date().toISOString().split('T')[0] });
    (this.quotationForm.get('items') as FormArray).clear();
    (this.quotationForm.get('items') as FormArray).push(this.createLineItem());
    
    this.chequeForm.reset({ chequeDate: new Date().toISOString().split('T')[0] });
    this.recordSaleForm.reset({ paymentMethod: 'Cash' });
    this.recordPaymentForm.reset({ paymentDate: new Date().toISOString().split('T')[0], paymentMethod: 'Cash' });
  }

  // --- Line Item Management ---
  createLineItem(data: any = null): FormGroup {
    const group = this.fb.group({
      productId: [null, Validators.required],
      productName: [''],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unitPrice: [0, Validators.required],
      total: [0]
    });

    if (data) {
      group.patchValue(data);
    }

    group.get('productId')?.valueChanges.subscribe(id => {
      const product = this.products().find(p => p.id === +id);
      if (product) {
        group.patchValue({ 
          unitPrice: product.price,
          productName: product.name,
        }, { emitEvent: false });
      }
    });

    return group;
  }

  get itemsFormArray(): FormArray | null {
    const form = this.getCurrentForm();
    return form ? form.get('items') as FormArray : null;
  }

  addLineItem() {
    this.itemsFormArray?.push(this.createLineItem());
  }

  removeLineItem(index: number) {
    this.itemsFormArray?.removeAt(index);
  }


  // --- Form Definitions ---
  invoiceForm = this.fb.group({
    customer: [null as Contact | null, Validators.required],
    issueDate: [new Date().toISOString().split('T')[0], Validators.required],
    dueDate: ['', Validators.required],
    items: this.fb.array([this.createLineItem()]),
    notes: [''],
  });

  expenseForm = this.fb.group({
    category: ['', Validators.required],
    amount: [null, [Validators.required, Validators.min(0)]],
    date: [new Date().toISOString().split('T')[0], Validators.required],
    vendor: [''],
    notes: [''],
    attachmentUrl: [''],
    isRecurring: [false],
    cadence: ['Monthly'],
    nextDueDate: [''],
  });

  productForm = this.fb.group({
    name: ['', Validators.required],
    sku: ['', Validators.required],
    category: ['', Validators.required],
    price: [null, [Validators.required, Validators.min(0)]],
    cost: [null, [Validators.required, Validators.min(0)]],
    description: [''],
    imageUrl: [''],
    stock: this.fb.group({
      mainWarehouse: [0],
      downtownStore: [0],
      online: [0]
    })
  });

  contactForm = this.fb.group({
    name: ['', Validators.required],
    type: ['Customer', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    avatarUrl: [''],
  });
  
  purchaseOrderForm = this.fb.group({
    supplierName: ['', Validators.required],
    orderDate: [new Date().toISOString().split('T')[0], Validators.required],
    expectedDate: [''],
    items: this.fb.array([this.createLineItem()]),
    notes: [''],
  });
  
  quotationForm = this.fb.group({
    customerName: ['', Validators.required],
    issueDate: [new Date().toISOString().split('T')[0], Validators.required],
    expiryDate: ['', Validators.required],
    items: this.fb.array([this.createLineItem()]),
    notes: [''],
  });

  chequeForm = this.fb.group({
    chequeNumber: ['', Validators.required],
    bank: ['', Validators.required],
    payee: ['', Validators.required],
    payer: ['', Validators.required],
    amount: [null, [Validators.required, Validators.min(0)]],
    chequeDate: [new Date().toISOString().split('T')[0], Validators.required],
  });

  recordSaleForm = this.fb.group({
    customer: [null as Contact | null],
    amount: [null, [Validators.required, Validators.min(0.01)]],
    paymentMethod: ['Cash' as ReceiptPaymentMethod, Validators.required],
    notes: [''],
  });

  recordPaymentForm = this.fb.group({
    customer: [null as Contact | null, Validators.required],
    amount: [null, [Validators.required, Validators.min(0.01)]],
    paymentDate: [new Date().toISOString().split('T')[0], Validators.required],
    paymentMethod: ['Cash' as ReceiptPaymentMethod, Validators.required],
  });

  title = computed(() => {
    const edit = this.isEditMode();
    switch(this.context()) {
      case 'new-invoice': return edit ? 'Edit Invoice' : 'Create New Invoice';
      case 'new-expense': return edit ? 'Edit Expense' : 'Add New Expense';
      case 'new-quotation': return edit ? 'Edit Quotation' : 'Create New Quotation';
      case 'new-po': return edit ? 'Edit Purchase Order' : 'Create New Purchase Order';
      case 'new-contact': return edit ? 'Edit Contact' : 'Add New Contact';
      case 'new-product': return edit ? 'Edit Product' : 'Add New Product';
      case 'new-cheque': return edit ? 'Edit Cheque' : 'Record New Cheque';
      case 'record-sale': return 'Record a Quick Sale';
      case 'record-payment': return 'Record Customer Payment';
      default: return 'Add New';
    }
  });
  
  saveButtonText = computed(() => this.isEditMode() ? 'Update' : 'Save');

  onClose() {
    this.close.emit();
  }

  async onGenerateDescription() {
    const name = this.productForm.get('name')?.value;
    const category = this.productForm.get('category')?.value;

    if (!name) {
      console.error('Product name is required to generate a description.');
      return;
    }

    this.isGeneratingDescription.set(true);
    try {
      const description = await this.geminiService.generateProductDescription(name, category || 'general');
      this.productForm.patchValue({ description });
    } catch (error) {
      console.error('Failed to generate description', error);
    } finally {
      this.isGeneratingDescription.set(false);
    }
  }

  async onSave() {
    const form = this.getCurrentForm();
    if (!form || form.invalid) {
      form?.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    
    try {
      const getPayload = () => {
        const formValue = form.getRawValue(); // Use getRawValue to include disabled fields if any
        const payload: any = { ...formValue };
        if ('items' in formValue) {
           payload.subtotal = this.subtotal();
           payload.tax = this.tax();
           payload.amount = this.total();
           payload.lineItems = payload.items; // Normalize to lineItems
           delete payload.items;
        }
        if ('customer' in payload && payload.customer) {
            payload.customerName = payload.customer.name;
            payload.customerAvatarUrl = payload.customer.avatarUrl;
            delete payload.customer;
        }
        return payload;
      };

      const payload = getPayload();
      const currentItem = this.currentItem();

      if (this.isEditMode() && currentItem) {
        switch(this.context()) {
          case 'new-invoice': await this.api.invoices.update(currentItem.id, payload); break;
          case 'new-expense': await this.api.expenses.update(currentItem.id, payload); break;
          case 'new-product': await this.api.products.update(currentItem.id, payload); break;
          case 'new-contact': await this.api.contacts.update(currentItem.id, payload); break;
          case 'new-po': await this.api.purchaseOrders.update(currentItem.id, payload); break;
          case 'new-quotation': await this.api.quotations.update(currentItem.id, payload); break;
          case 'new-cheque': await this.api.cheques.update(currentItem.id, payload); break;
          case 'new-recurring-expense': await this.api.recurringExpenses.update(currentItem.id, payload); break;
        }
      } else {
         switch(this.context()) {
          case 'new-invoice': await this.api.createInvoice(payload); break;
          case 'new-po': await this.api.createPurchaseOrder(payload); break;
          case 'new-quotation': await this.api.createQuotation(payload); break;
          case 'new-expense':
            if (payload.isRecurring) {
              await this.api.createRecurringExpense({
                description: payload.notes || 'Recurring Expense',
                category: payload.category, amount: payload.amount, cadence: payload.cadence,
                nextDueDate: payload.nextDueDate, vendor: payload.vendor,
              });
            } else { await this.api.createExpense(payload); }
            break;
          case 'new-product': await this.api.createProduct(payload); break;
          case 'new-contact': await this.api.createContact(payload); break;
          case 'new-cheque': await this.api.createCheque(payload); break;
          case 'record-sale': await this.api.createSale(payload); break;
          case 'record-payment': await this.api.createCustomerPayment(payload); break;
          default: console.warn(`No save handler for context: ${this.context()}`);
        }
      }

      this.uiState.closeDrawer();
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      this.isSaving.set(false);
    }
  }

  getCurrentForm(): FormGroup | null {
    switch(this.context()) {
      case 'new-invoice': return this.invoiceForm;
      case 'new-expense': return this.expenseForm;
      case 'new-product': return this.productForm;
      case 'new-contact': return this.contactForm;
      case 'new-po': return this.purchaseOrderForm;
      case 'new-quotation': return this.quotationForm;
      case 'new-cheque': return this.chequeForm;
      case 'record-sale': return this.recordSaleForm;
      case 'record-payment': return this.recordPaymentForm;
      default: return null;
    }
  }

  openMediaBrowser(context: 'expense-attachment' | 'product-image' | 'contact-avatar') {
    this.mediaFieldContext.set(context);
    this.isMediaBrowserOpen.set(true);
  }

  closeMediaBrowser() {
    this.isMediaBrowserOpen.set(false);
  }

  onMediaSelect(mediaItem: MediaItem) {
    switch (this.mediaFieldContext()) {
      case 'expense-attachment':
        this.expenseForm.patchValue({ attachmentUrl: mediaItem.url });
        break;
      case 'product-image':
        this.productForm.patchValue({ imageUrl: mediaItem.url });
        break;
      case 'contact-avatar':
        this.contactForm.patchValue({ avatarUrl: mediaItem.url });
        break;
    }
    this.closeMediaBrowser();
  }
}