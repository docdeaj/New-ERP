import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../services/toast.service';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast-container.component.html',
  styleUrls: ['./toast-container.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastContainerComponent {
  toastService = inject(ToastService);
  toasts = this.toastService.toasts;

  getIconClass(type: string): string {
    switch (type) {
      case 'success': return 'fa-solid fa-check-circle';
      case 'error': return 'fa-solid fa-times-circle';
      case 'info': return 'fa-solid fa-info-circle';
      case 'warning': return 'fa-solid fa-exclamation-triangle';
      default: return '';
    }
  }

  getBorderClass(type: string): string {
    switch (type) {
        case 'success': return 'border-green-500';
        case 'error': return 'border-red-500';
        case 'info': return 'border-blue-500';
        case 'warning': return 'border-yellow-500';
        default: return 'border-charcoal-700';
    }
  }

  getTextClass(type: string): string {
     switch (type) {
        case 'success': return 'text-green-400';
        case 'error': return 'text-red-400';
        case 'info': return 'text-blue-400';
        case 'warning': return 'text-yellow-400';
        default: return 'text-charcoal-300';
    }
  }

  removeToast(id: number) {
    this.toastService.remove(id);
  }
}
