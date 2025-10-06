import { Component, ChangeDetectionStrategy, inject, signal, computed, afterNextRender, viewChild, ElementRef, HostListener, effect } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Product, CartItem, ReceiptPaymentMethod, LineItem } from '../../models/types';
import { CheckoutModalComponent } from '../../components/checkout-modal/checkout-modal.component';

type SortOption = 'Popular' | 'Name A-Z' | 'Price High-Low' | 'Price Low-High';

@Component({
  selector: 'app-pos',
  templateUrl: './pos.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, FormsModule, CheckoutModalComponent, CurrencyPipe],
})
export class PosComponent {
  private api = inject(ApiService);
  
  // State
  products = signal<Product[]>([]);
  searchQuery = signal('');
  sortOption = signal<SortOption>('Popular');
  cart = signal<CartItem[]>([]);
  heldOrders = signal<CartItem[][]>([]);
  isCheckoutVisible = signal(false);
  isHeldOrdersVisible = signal(false);
  editingCartItemId = signal<number | null>(null);
  liveRegionMessage = signal('');

  // Elements
  searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');
  
  constructor() {
    afterNextRender(() => this.searchInput()?.nativeElement.focus());
    this.loadProducts();
  }

  filteredAndSortedProducts = computed(() => {
    const query = this.searchQuery().toLowerCase();
    let filtered = this.products();
    if (query) {
      filtered = this.products().filter(p => p.name.toLowerCase().includes(query) || p.sku.toLowerCase().includes(query));
    }

    switch (this.sortOption()) {
      case 'Name A-Z': return filtered.sort((a, b) => a.name.localeCompare(b.name));
      case 'Price High-Low': return filtered.sort((a, b) => b.price - a.price);
      case 'Price Low-High': return filtered.sort((a, b) => a.price - b.price);
      default: return filtered; // 'Popular' is default order
    }
  });

  cartSubtotal = computed(() => this.cart().reduce((acc, item) => acc + item.price * item.quantity, 0));
  cartTax = computed(() => this.cartSubtotal() * 0.10);
  cartTotal = computed(() => this.cartSubtotal() + this.cartTax());
  cartHasWarning = computed(() => this.cart().some(item => item.flags?.price_below_cost));

  // --- Core Methods ---

  async loadProducts() { this.products.set(await this.api.products.list()); }

  addToCart(product: Product) {
    const existingItem = this.cart().find(item => item.id === product.id);
    if (existingItem) {
      this.updateQuantity(existingItem.id, existingItem.quantity + 1);
    } else {
      const cartItem: CartItem = { ...product, quantity: 1 };
      this.cart.update(current => [...current, cartItem]);
    }
    this.liveRegionMessage.set(`${product.name} added to cart.`);
  }

  updateQuantity(productId: number, newQuantity: number | string) {
    const quantity = typeof newQuantity === 'string' ? parseInt(newQuantity, 10) : newQuantity;
    if (isNaN(quantity) || quantity <= 0) {
      this.removeFromCart(productId);
    } else {
      this.cart.update(current => current.map(item => item.id === productId ? { ...item, quantity } : item));
    }
    this.editingCartItemId.set(null);
  }

  removeFromCart(productId: number) { this.cart.update(current => current.filter(item => item.id !== productId)); }
  clearCart() { this.cart.set([]); }
  
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

  async handleCheckoutComplete(paymentDetails: { method: ReceiptPaymentMethod, amountTendered: number | null }) {
    if (this.cart().length === 0) return;
    const newInvoice = await this.api.createInvoice({ customerName: 'POS Customer', issueDate: new Date().toISOString(), dueDate: new Date().toISOString(), amount: this.cartTotal(), subtotal: this.cartSubtotal(), tax: this.cartTax(), status: 'Paid', lineItems: this.cart().map(item => ({ productId: item.id, productName: item.name, quantity: item.quantity, unitPrice: item.price, total: item.quantity * item.price }))});
    await this.api.createReceipt({ invoiceId: newInvoice.id, amount: this.cartTotal(), method: paymentDetails.method, paymentDate: new Date().toISOString() });
    this.clearCart();
    this.isCheckoutVisible.set(false);
    this.liveRegionMessage.set('Checkout complete. New sale recorded.');
  }
  
  // --- UI Helpers ---
  
  getAvailableStock(p: Product): number { return Object.values(p.stock).reduce((a,b) => a+b, 0) - Object.values(p.committed).reduce((a,b) => a+b, 0); }
  getTotalStock(p: Product): number { return Object.values(p.stock).reduce((a,b) => a+b, 0); }
  
  getStockRingDashOffset(p: Product): number {
    const total = this.getTotalStock(p);
    if (total === 0) return 57; // Empty circle
    const available = this.getAvailableStock(p);
    const percentage = Math.max(0, available / total);
    return 57 * (1 - percentage);
  }

  getStockRingColor(p: Product): string {
    const available = this.getAvailableStock(p);
    const total = this.getTotalStock(p);
    if (available <= 0) return 'text-red-500';
    if (available / total < 0.2) return 'text-yellow-500';
    return 'text-indigo-500';
  }

  getHeldOrderTotal(order: CartItem[]): number {
    const subtotal = order.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const tax = subtotal * 0.10;
    return subtotal + tax;
  }
  
  // --- Host Listeners for Keyboard Shortcuts ---
  @HostListener('window:keydown', ['$event'])
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
}
