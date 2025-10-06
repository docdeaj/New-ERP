import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Invoice } from '../../models/types';

@Component({
  selector: 'app-invoice-pdf',
  templateUrl: './invoice-pdf.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe],
})
export class InvoicePdfComponent {
  invoice = input.required<Invoice>();
}
