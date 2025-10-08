
import { Component, ChangeDetectionStrategy, input, output, computed, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormArray, FormGroup } from '@angular/forms';
import { DrawerContext, UiStateService } from '../../services/ui-state.service';
import { MiniMediaBrowserComponent } from '../mini-media-browser/mini-media-browser.component';
import { MediaItem, Product, Quotation, Contact, ReceiptPaymentMethod, Invoice, Expense, PurchaseOrder, Cheque, RecurringExpense, RecurringCadence, ContactType } from '../../models/types';
import { ApiService } from '../../services/api.service';
import { startWith } from 'rxjs/operators';
import { CustomerPickerComponent } from '../customer-picker/customer-picker.component';
import { GeminiService } from '../../services/gemini.service';
import { SettingsService } from '../../services/settings.service';
import { DatePickerComponent } from '../date-picker/date-picker.component';
import { ProductPickerComponent } from '../product-picker/product-picker.component';
import { SupplierPickerComponent } from '../supplier-picker/supplier-picker.component';
import { AnalyticsService } from '../../services/analytics.service';
import { ToastService } from '../../services/toast.service';
import { CdkTrapFocus } from '@angular/cdk/a11y';
import { SelectComponent } from '../select/select.component';

@Component({
  selector: 'app-universal-add-drawer',
  templateUrl: './universal-add-drawer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MiniMediaBrowserComponent, CustomerPickerComponent, DatePickerComponent, ProductPickerComponent, SupplierPickerComponent, CdkTrapFocus, SelectComponent],
})
export class UniversalAddDrawerComponent {
  context = input.required<DrawerContext | null>();
  close = output<void>();

  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private uiState = inject(UiStateService);
  private geminiService = inject(GeminiService);
  private settingsService = inject(SettingsService);
  private analytics = inject(AnalyticsService);
  private toastService = inject(ToastService);

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
  subtotal = computed(() => {
    const items = this.currentItems() || [];
    return items.reduce((acc, item) => {
        const lineTotal = (item.quantity * item.unitPrice) - (item.lineDiscount || 0);
        return acc + lineTotal;
    }, 0);
  });
  
  discountAmount = computed(() => {
    const form = this.getCurrentForm();
    if (!form || !('discountType' in form.controls)) return 0;
    
    const type = (form as FormGroup).get('discountType')?.value;
    const value = (form as FormGroup).get('discountValue')?.value || 0;
    const sub = this.subtotal();
    
    let discount = 0;
    if (type === 'percent') {
        discount = sub * (value / 100);
    } else { // fixed
        discount = value * 100; // convert to cents
    }
    return Math.min(discount, sub);
  });

  subtotalAfterDiscount = computed(() => this.subtotal() - this.discountAmount());
  taxRate = this.settingsService.get<number>('regional.tax.vat_rate');
  tax = computed(() => this.subtotalAfterDiscount() * (this.taxRate() / 100));
  total = computed(() => this.subtotalAfterDiscount() + this.tax());
  
  discountOptions = [
    { value: 'percent', label: '%' },
    { value: 'fixed', label: 'LKR' }
  ];

  constructor() {
    this.loadProducts();
    
    // Effect for line item totals
    effect((onCleanup) => {
      const form = this.getCurrentForm();
      if (form && 'items' in form.controls) {
        const items = (form as FormGroup).get('items') as FormArray;
        const sub = items.valueChanges.pipe(startWith(items.value)).subscribe(val => {
          this.currentItems.set(val.map(item => ({
            ...item,
            quantity: item.quantity || 0,
            unitPrice: item.unitPrice || 0,
            lineDiscount: item.lineDiscount || 0,
          })));
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

      if (ctx === 'new-invoice' && !this.isEditMode()) {
          this.analytics.emitEvent('invoice_create_start', { source: data ? ('number' in data && data.number?.startsWith('QUO') ? 'from_quotation' : 'from_contact') : 'direct' });
      }
      
      // Reset all forms first to ensure clean state
      this.resetAllForms();

      if (this.isEditMode() && data && form) {
        form.patchValue(data);
        if ('items' in form.controls && data.items) {
          const items = (form as FormGroup).get('items') as FormArray;
          items.clear();
          data.items.forEach((item: any) => items.push(this.createLineItem(item)));
        }
        
      } else if (ctx === 'new-invoice' && data) {
         // Special case: Converting a Quotation to an Invoice or starting with a customer
        if ('number' in data && data.number.startsWith('QUO')) { // from Quotation
            const quotation = data as Quotation;
            const mockCustomer: Partial<Contact> = { id: quotation.party_id, name: quotation.partyName, avatar_url: quotation.partyAvatarUrl };
            this.invoiceForm.patchValue({ customer: mockCustomer as Contact });
            
            const items = this.invoiceForm.get('items') as FormArray;
            items.clear();
            quotation.items?.forEach(item => {
              const lineItemGroup = this.createLineItem();
              lineItemGroup.patchValue({
                productId: item.product_id,
                productName: item.name,
                quantity: item.qty,
                unitPrice: item.unit_price_lkr,
                lineDiscount: item.line_discount_lkr || 0
              });
              items.push(lineItemGroup);
            });
        } else if ('name' in data) { // From Contact
             this.invoiceForm.patchValue({ customer: data as Contact });
        }
      } else if (ctx === 'new-po' && data) {
         if ('items' in data) { // from Product quick action
           const items = this.purchaseOrderForm.get('items') as FormArray;
           items.clear();
           data.items.forEach((item: any) => items.push(this.createLineItem(item)));
         } else if ('name' in data) { // from Contact
            this.purchaseOrderForm.patchValue({ supplier: data as Contact });
         }
      }
    });
  }

  async loadProducts() {
    this.products.set(await this.api.products.list());
  }

  resetAllForms() {
    this.invoiceForm.reset({ issue_date: new Date().toISOString().split('T')[0], discountType: 'percent', discountValue: 0 });
    (this.invoiceForm.get('items') as FormArray).clear();
    (this.invoiceForm.get('items') as FormArray).push(this.createLineItem());

    this.expenseForm.reset({ date: new Date().toISOString().split('T')[0], isRecurring: false, cadence: 'monthly' });
    this.productForm.reset();
    this.contactForm.reset({ type: 'customer' });
    
    this.purchaseOrderForm.reset({ issue_date: new Date().toISOString().split('T')[0] });
    (this.purchaseOrderForm.get('items') as FormArray).clear();
    (this.purchaseOrderForm.get('items') as FormArray).push(this.createLineItem());

    this.quotationForm.reset({ issue_date: new Date().toISOString().split('T')[0] });
    (this.quotationForm.get('items') as FormArray).clear();
    (this.quotationForm.get('items') as FormArray).push(this.createLineItem());
    
    this.chequeForm.reset({ chequeDate: new Date().toISOString().split('T')[0] });
    this.recordSaleForm.reset({ paymentMethod: 'cash' });
    this.recordPaymentForm.reset({ paymentDate: new Date().toISOString().split('T')[0], paymentMethod: 'cash' });
  }

  onProductSelect(product: Product, index: number) {
    const items = this.itemsFormArray;
    if (items && product) {
      const lineItem = items.at(index);
      lineItem.patchValue({
        productId: product.id,
        productName: product.name,
        unitPrice: product.price_lkr,
      });
    }
  }

  onProductClear(index: number) {
    const items = this.itemsFormArray;
    if (items) {
      const lineItem = items.at(index);
      lineItem.patchValue({
        productId: null,
        productName: '',
        unitPrice: 0,
        quantity: 1,
        lineDiscount: 0
      });
    }
  }
  
  // --- Line Item Management ---
  createLineItem(data: any = null): FormGroup {
    const group = this.fb.group({
      productId: [null, Validators.required],
      productName: [''],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unitPrice: [0, Validators.required],
      lineDiscount: [0]
    });

    if (data) {
      group.patchValue(data);
    }
    return group;
  }

  get itemsFormArray(): FormArray | null {
    const form = this.getCurrentForm();
    if (form && 'items' in form.controls) {
      return (form as FormGroup).get('items') as FormArray;
    }
    return null;
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
    issue_date: [new Date().toISOString().split('T')[0], Validators.required],
    due_date: ['', Validators.required],
    items: this.fb.array([this.createLineItem()]),
    notes: [''],
    discountType: ['percent'],
    discountValue: [0],
  });

  expenseForm = this.fb.group({
    category: ['', Validators.required],
    amount_lkr: [null, [Validators.required, Validators.min(0)]],
    date: [new Date().toISOString().split('T')[0], Validators.required],
    vendor: [''],
    note: [''],
    attachmentUrl: [''],
    isRecurring: [false],
    cadence: ['monthly' as RecurringCadence],
    next_due: [''],
  });

  productForm = this.fb.group({
    name: ['', Validators.required],
    sku: ['', Validators.required],
    category: [''],
    price_lkr: [null, [Validators.required, Validators.min(0)]],
    cost_lkr: [null, [Validators.required, Validators.min(0)]],
    description: [''],
    image_url: [''],
    onHand: this.fb.group({
      mainWarehouse: [0],
      downtownStore: [0],
      online: [0]
    })
  });

  contactForm = this.fb.group({
    name: ['', Validators.required],
    type: ['customer' as ContactType, Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    avatar_url: [''],
  });
  
  purchaseOrderForm = this.fb.group({
    supplier: [null as Contact | null, Validators.required],
    issue_date: [new Date().toISOString().split('T')[0], Validators.required],
    due_date: [''],
    items: this.fb.array([this.createLineItem()]),
    notes: [''],
    discountType: ['percent'],
    discountValue: [0],
  });
  
  quotationForm = this.fb.group({
    customer: [null as Contact | null, Validators.required],
    issue_date: [new Date().toISOString().split('T')[0], Validators.required],
    due_date: ['', Validators.required],
    items: this.fb.array([this.createLineItem()]),
    notes: [''],
    discountType: ['percent'],
    discountValue: [0],
  });

  chequeForm = this.fb.group({
    chequeNumber: ['', Validators.required],
    bank: ['', Validators.required],
    payee: ['', Validators.required],
    payer: ['', Validators.required],
    amount_lkr: [null, [Validators.required, Validators.min(0)]],
    chequeDate: [new Date().toISOString().split('T')[0], Validators.required],
  });

  recordSaleForm = this.fb.group({
    customer: [null as Contact | null],
    amount_lkr: [null, [Validators.required, Validators.min(0.01)]],
    paymentMethod: ['cash' as ReceiptPaymentMethod, Validators.required],
    notes: [''],
  });

  recordPaymentForm = this.fb.group({
    customer: [null as Contact | null, Validators.required],
    amount_lkr: [null, [Validators.required, Validators.min(0.01)]],
    paymentDate: [new Date().toISOString().split('T')[0], Validators.required],
    paymentMethod: ['cash' as ReceiptPaymentMethod, Validators.required],
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
          payload.items = formValue.items.map((item: any) => ({
            product_id: item.productId,
            name: item.productName,
            qty: item.quantity,
            unit_price_lkr: item.unitPrice,
            line_discount_lkr: item.lineDiscount || 0,
          }));
          payload.tax_rate = this.taxRate();
          payload.discount_lkr = this.discountAmount();
        }
        if ('customer' in payload && payload.customer) {
            payload.party_id = payload.customer.id;
            delete payload.customer;
        }
        if ('supplier' in payload && payload.supplier) {
            payload.party_id = payload.supplier.id;
            delete payload.supplier;
        }
        return payload;
      };

      const payload = getPayload();
      const currentItem = this.currentItem();

      let successMessage = 'Item saved successfully!';

      if (this.isEditMode() && currentItem) {
        switch(this.context()) {
          case 'new-invoice': 
            await this.api.invoices.update(currentItem.id, payload); 
            successMessage = `Invoice ${currentItem.number} updated.`;
            break;
          case 'new-product': 
            await this.api.products.update(currentItem.id, payload); 
            successMessage = `Product ${currentItem.name} updated.`;
            break;
          // ... other update cases
        }
      } else {
        switch(this.context()) {
          case 'new-invoice': 
            const newInvoice = await this.api.createInvoice(payload); 
            successMessage = `Invoice ${newInvoice.number} created.`;
            this.analytics.emitEvent('invoice_create_save', {
                invoice_id: newInvoice.id,
                amount: newInvoice.total_lkr,
                line_items_count: newInvoice.items?.length || 0,
            });
            break;
          case 'new-expense': 
            if (payload.isRecurring) {
              await this.api.createRecurringExpense(payload);
              successMessage = 'Recurring expense created.';
            } else {
              await this.api.createExpense(payload);
              successMessage = 'Expense created.';
            }
            break;
          case 'new-product': 
            const newProduct = await this.api.createProduct(payload); 
            successMessage = `Product ${newProduct.name} created.`;
            break;
          case 'new-contact': 
            const newContact = await this.api.createContact(payload); 
            successMessage = `Contact ${newContact.name} created.`;
            break;
          case 'new-po': 
            const newPO = await this.api.createPurchaseOrder(payload); 
            successMessage = `Purchase Order ${newPO.number} created.`;
            break;
          case 'new-quotation': 
            const newQuotation = await this.api.createQuotation(payload); 
            successMessage = `Quotation ${newQuotation.number} created.`;
            break;
          case 'new-cheque': 
            await this.api.createCheque(payload); 
            successMessage = 'Cheque recorded.';
            break;
          case 'record-sale': 
            await this.api.createSale(payload); 
            successMessage = 'Sale recorded.';
            break;
          case 'record-payment': 
            await this.api.createCustomerPayment(payload); 
            successMessage = 'Payment recorded.';
            break;
        }
      }
      this.toastService.show({ type: 'success', message: successMessage });
      this.onClose();
    } catch (e) {
      console.error("Save failed", e);
      this.toastService.show({ type: 'error', message: 'Failed to save. Please try again.' });
    } finally {
      this.isSaving.set(false);
    }
  }

  getCurrentForm() {
    switch (this.context()) {
      case 'new-invoice': return this.invoiceForm;
      case 'new-expense': case 'new-recurring-expense': return this.expenseForm;
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
    const context = this.mediaFieldContext();
    if (context === 'expense-attachment') {
      this.expenseForm.patchValue({ attachmentUrl: mediaItem.url });
    } else if (context === 'product-image') {
      this.productForm.patchValue({ image_url: mediaItem.url });
    } else if (context === 'contact-avatar') {
        this.contactForm.patchValue({ avatar_url: mediaItem.url });
    }
    this.closeMediaBrowser();
  }
}
