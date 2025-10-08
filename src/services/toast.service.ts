import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: number;
  type: ToastType;
  message: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  toasts = signal<Toast[]>([]);
  private nextId = 0;

  show(toast: { type: ToastType, message: string, duration?: number }) {
    const newToast: Toast = {
      id: this.nextId++,
      ...toast
    };

    this.toasts.update(toasts => [newToast, ...toasts]);

    setTimeout(() => {
      this.remove(newToast.id);
    }, toast.duration || 5000);
  }

  remove(id: number) {
    this.toasts.update(toasts => toasts.filter(t => t.id !== id));
  }
}
