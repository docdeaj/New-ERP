import { Component, ChangeDetectionStrategy, inject, signal, computed, afterNextRender, viewChild, ElementRef, effect } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Product, CartItem, ReceiptPaymentMethod, LineItem, Contact } from '../../models/types';
import { CheckoutModalComponent } from '../../components/checkout-modal/checkout-modal.component';
import { CustomerPickerComponent } from '../../components/customer-picker/customer-picker.component';
import { AnalyticsService } from '../../services/analytics.service';
import { CdkTrapFocus } from '@angular/cdk/a11y';
import { ToastService } from '../../services/toast.service';

type SortOption = 'Popular' | 'Name A-Z' | 'Price High-Low' | 'Price Low-High';

@Component({
  selector: 'app-pos',
  templateUrl: './pos.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, FormsModule, CheckoutModalComponent, CurrencyPipe, CustomerPickerComponent, CdkTrapFocus],
  host: {
    '(window:keydown)': 'handleKeyboardEvent($event)',
    '(document:click)': 'onDocumentClick($event)',
  }
})
export class PosComponent {
  private api = inject(ApiService);
  private analytics = inject(AnalyticsService);
  private toastService = inject(ToastService);
  
  // State
  products = signal<Product[]>([]);
  searchQuery = signal('');
  sortOption = signal<SortOption>('Popular');
  cart = signal<CartItem[]>([]);
  heldOrders = signal<CartItem[][]>([]);
  isCheckoutVisible = signal(false);
  isHeldOrdersVisible = signal(false);
  editingCartItemId = signal<string | null>(null);
  liveRegionMessage = signal('');
  isSortDropdownOpen = signal(false);
  sortOptions: SortOption[] = ['Popular', 'Name A-Z', 'Price High-Low', 'Price Low-High'];
  selectedCustomer = signal<Contact | null>(null);
  shakingProductId = signal<string | null>(null);
  discountType = signal<'percent' | 'fixed'>('percent');
  discountValue = signal<number | null>(null);

  // Elements
  searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');
  sortDropdownButton = viewChild<ElementRef<HTMLButtonElement>>('sortDropdownButton');
  
  constructor() {
    afterNextRender(() => this.searchInput()?.nativeElement.focus());
    this.loadProducts();

    effect(() => {
        const discount = this.cartDiscount();
        if (discount > 0) {
            this.analytics.emitEvent('pos_discount_apply', {
                discount_type: this.discountType(),
                discount_value: this.discountValue(),
                calculated_discount: discount,
                cart_total: this.cartTotal()
            });
        }
    }, { allowSignalWrites: true });
  }

  filteredAndSortedProducts = computed(() => {
    const query = this.searchQuery().toLowerCase();
    let filtered = this.products();
    if (query) {
      filtered = this.products().filter(p => p.name.toLowerCase().includes(query) || p.sku.toLowerCase().includes(query));
    }

    switch (this.sortOption()) {
      case 'Name A-Z': return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
      case 'Price High-Low': return [...filtered].sort((a, b) => b.price_lkr - a.price_lkr);
      case 'Price Low-High': return [...filtered].sort((a, b) => a.price_lkr - b.price_lkr);
      default: return filtered; // 'Popular' is default order
    }
  });

  cartSubtotal = computed(() => this.cart().reduce((acc, item) => acc + item.price_lkr * item.quantity, 0));
  cartDiscount = computed(() => {
    const type = this.discountType();
    const value = this.discountValue() || 0;
    const subtotal = this.cartSubtotal();
    if (subtotal === 0) return 0;
    
    let discount = 0;
    if (type === 'percent') {
        discount = subtotal * (value / 100);
    } else { // fixed
        discount = value * 100; // convert fixed amount to cents
    }
    return Math.min(discount, subtotal); // Cannot discount more than the total
  });
  cartSubtotalAfterDiscount = computed(() => this.cartSubtotal() - this.cartDiscount());
  cartTax = computed(() => this.cartSubtotalAfterDiscount() * 0.10); // Tax on discounted price
  cartTotal = computed(() => this.cartSubtotalAfterDiscount() + this.cartTax());
  cartHasWarning = computed(() => this.cart().some(item => item.flags?.price_below_cost));

  // --- Core Methods ---

  async loadProducts() { this.products.set(await this.api.products.list()); }
  
  isPriceBelowCost(product: Product): boolean {
    return product.price_lkr < product.cost_lkr;
  }

  addToCart(product: Product) {
    if (this.getAvailableStock(product) <= 0) {
      this.shakingProductId.set(product.id);
      this.liveRegionMessage.set(`${product.name} is out of stock.`);
      setTimeout(() => this.shakingProductId.set(null), 500); // Reset after animation
      return;
    }

    const existingItem = this.cart().find(item => item.id === product.id);
    if (existingItem) {
      this.updateQuantity(existingItem.id, existingItem.quantity + 1);
    } else {
      const cartItem: CartItem = { 
        ...product, 
        quantity: 1, 
        price_lkr: product.price_lkr, 
        cost_lkr: product.cost_lkr, 
        name: product.name, 
        sku: product.sku, 
        id: product.id,
        flags: {
          price_below_cost: this.isPriceBelowCost(product)
        }
      };
      this.cart.update(current => [...current, cartItem]);
    }
    this.liveRegionMessage.set(`${product.name} added to cart.`);
  }

  updateQuantity(productId: string, newQuantity: number | string) {
    const product = this.products().find(p => p.id === productId);
    if (!product) return;

    const quantity = typeof newQuantity === 'string' ? parseInt(newQuantity, 10) : newQuantity;
    if (isNaN(quantity) || quantity <= 0) {
      this.removeFromCart(productId);
      return;
    }
    
    const serverAvailable = this.getTotalStock(product) - this.getCommittedStock(product);
    if (quantity > serverAvailable) {
        this.liveRegionMessage.set(`Only ${serverAvailable} units of ${product.name} are available.`);
        this.cart.update(current => current.map(item => item.id === productId ? { ...item, quantity: serverAvailable } : item));
        this.editingCartItemId.set(null);
        return;
    }

    this.cart.update(current => current.map(item => item.id === productId ? { ...item, quantity } : item));
    this.editingCartItemId.set(null);
  }

  removeFromCart(productId: string) { this.cart.update(current => current.filter(item => item.id !== productId)); }
  clearCart() { 
    this.cart.set([]); 
    this.discountValue.set(null);
  }
  
  holdOrder() {
    if (this.cart().length > 0) {
      this.heldOrders.update(orders => [...orders, this.cart()]);
      this.clearCart();
      this.liveRegionMessage.set('Order held.');
    }
  }

  restoreOrder(index: number) {
    const orderToRestore = this.heldOrders()[index];
    this.cart.set(orderToRestore);
    this.heldOrders.update(orders => orders.filter((_, i) => i !== index));
    this.isHeldOrdersVisible.set(false);
    this.liveRegionMessage.set('Order restored.');
  }

  async handleCheckoutComplete(paymentDetails: { method: ReceiptPaymentMethod, amountTendered: number | null, customer: Contact | null }) {
    if (this.cart().length === 0) return;
    
    const customer = paymentDetails.customer || this.selectedCustomer();

    try {
      const newInvoice = await this.api.createInvoice({ 
        party_id: customer?.id,
        partyName: customer?.name || 'POS Customer',
        partyAvatarUrl: customer?.avatar_url,
        issue_date: new Date().toISOString(), 
        due_date: new Date().toISOString(), 
        status: 'Paid', 
        items: this.cart().map(item => ({ 
          product_id: item.id, 
          name: item.name,
          sku: item.sku,
          qty: item.quantity, 
          unit_price_lkr: item.price_lkr,
          line_discount_lkr: 0
        })),
        discount_lkr: this.cartDiscount(),
        tax_rate: 10,
        paid_lkr: this.cartTotal() // Mark as fully paid
      });

      await this.api.createReceipt({ 
        invoiceId: newInvoice.id, 
        amount: newInvoice.total_lkr, 
        method: paymentDetails.method, 
        paymentDate: new Date().toISOString() 
      });
      
      this.clearCart();
      this.isCheckoutVisible.set(false);
      this.toastService.show({type: 'success', message: 'Checkout complete. New sale recorded.'});
      this.liveRegionMessage.set('Checkout complete. New sale recorded.');
      
    } catch (e: any) {
      console.error('Checkout failed:', e);
      this.toastService.show({type: 'error', message: `Checkout failed: ${e.message}`});
      this.liveRegionMessage.set(`Checkout failed: ${e.message}`);
    }
  }
  
  // --- UI Helpers ---
  selectSort(option: SortOption) {
    this.sortOption.set(option);
    this.isSortDropdownOpen.set(false);
  }

  private getQuantityInCart(productId: string): number {
    return this.cart().find(item => item.id === productId)?.quantity || 0;
  }
  private getTotalStock(p: Product): number { return Object.values(p.onHand).reduce((a,b) => a+b, 0); }
  private getCommittedStock(p: Product): number { return Object.values(p.committed).reduce((a,b) => a+b, 0); }

  getAvailableStock(p: Product): number { 
    const serverAvailable = this.getTotalStock(p) - this.getCommittedStock(p);
    const inCart = this.getQuantityInCart(p.id);
    return serverAvailable - inCart;
  }
  
  getStockRingDashOffset(p: Product): number {
    const total = this.getTotalStock(p);
    if (total === 0) return 94.2; // Empty circle for circumference 94.2
    const available = this.getAvailableStock(p);
    const percentage = Math.max(0, available / total);
    return 94.2 * (1 - percentage);
  }

  getStockRingColor(p: Product): string {
    const total = this.getTotalStock(p);
    if (total === 0) return 'text-red-500'; // danger
    const available = this.getAvailableStock(p);
    const percentage = (available / total) * 100;
    
    if (percentage <= 20) return 'text-red-500'; // danger
    if (percentage <= 50) return 'text-amber-500'; // warn
    return 'text-green-500'; // success
  }

  getHeldOrderTotal(order: CartItem[]): number {
    const subtotal = order.reduce((acc, item) => acc + item.price_lkr * item.quantity, 0);
    const tax = subtotal * 0.10;
    return subtotal + tax;
  }
  
  // --- Host Listeners for Keyboard Shortcuts ---
  handleKeyboardEvent(event: KeyboardEvent) {
    const target = event.target as HTMLElement;
    const isTypingInInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable;

    if (event.key === '/' && !isTypingInInput) {
      event.preventDefault();
      this.searchInput()?.nativeElement.focus();
    }
    if (event.altKey && event.key === 'h') {
      event.preventDefault();
      this.holdOrder();
    }
  }

  onDocumentClick(event: MouseEvent) {
      if (this.isSortDropdownOpen() && !this.sortDropdownButton()?.nativeElement.contains(event.target as Node)) {
          this.isSortDropdownOpen.set(false);
      }
  }
}