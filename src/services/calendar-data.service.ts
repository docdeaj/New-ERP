import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { CalendarEvent, CalendarEventType, CalendarEventColor } from '../models/types';
import { RecurringExpense } from '../models/types';

const SRI_LANKAN_HOLIDAYS_2024 = [
    { month: 0, day: 15, name: 'Tamil Thai Pongal Day', type: 'Public' },
    { month: 0, day: 25, name: 'Duruthu Full Moon Poya Day', type: 'Public' },
    { month: 1, day: 4, name: 'National Day', type: 'Public' },
    { month: 1, day: 23, name: 'Navam Full Moon Poya Day', type: 'Public' },
    { month: 2, day: 8, name: 'Mahasivarathri Day', type: 'Public' },
    { month: 2, day: 24, name: 'Medin Full Moon Poya Day', type: 'Public' },
    { month: 2, day: 29, name: 'Good Friday', type: 'Public' },
    { month: 3, day: 11, name: 'Id-Ul-Fitr (Ramazan)', type: 'Public' },
    { month: 3, day: 12, name: 'Day prior to Sinhala & Tamil New Year Day', type: 'Bank' },
    { month: 3, day: 13, name: 'Sinhala & Tamil New Year Day', type: 'Public' },
    { month: 3, day: 14, name: 'Day following Sinhala & Tamil New Year Day', type: 'Public' },
    { month: 3, day: 23, name: 'Bak Full Moon Poya Day', type: 'Public' },
    { month: 4, day: 1, name: 'May Day', type: 'Public' },
    { month: 4, day: 23, name: 'Vesak Full Moon Poya Day', type: 'Public' },
    { month: 4, day: 24, name: 'Day following Vesak', type: 'Public' },
    { month: 5, day: 17, name: 'Id-Ul-Alha (Hajj)', type: 'Public' },
    { month: 5, day: 21, name: 'Poson Full Moon Poya Day', type: 'Public' },
    { month: 6, day: 20, name: 'Esala Full Moon Poya Day', type: 'Public' },
    { month: 7, day: 19, name: 'Nikini Full Moon Poya Day', type: 'Public' },
    { month: 8, day: 16, name: 'Milad-Un-Nabi (Prophet Muhammad\'s Birthday)', type: 'Public' },
    { month: 8, day: 17, name: 'Binara Full Moon Poya Day', type: 'Public' },
    { month: 9, day: 17, name: 'Vap Full Moon Poya Day', type: 'Public' },
    { month: 9, day: 31, name: 'Deepavali Festival Day', type: 'Public' },
    { month: 10, day: 15, name: 'Il Full Moon Poya Day', type: 'Public' },
    { month: 11, day: 14, name: 'Unduvap Full Moon Poya Day', type: 'Public' },
    { month: 11, day: 25, name: 'Christmas Day', type: 'Public' },
    { month: 11, day: 31, name: 'Special Bank Holiday', type: 'Bank' },
];


@Injectable({
  providedIn: 'root'
})
export class CalendarDataService {
  private api = inject(ApiService);

  async getEventsForMonth(year: number, month: number): Promise<Map<string, CalendarEvent[]>> {
    const eventsMap = new Map<string, CalendarEvent[]>();
    const [invoices, recurring, cheques, pos] = await Promise.all([
      this.api.invoices.list(),
      this.api.recurringExpenses.list(),
      this.api.cheques.list(),
      this.api.purchaseOrders.list(),
    ]);

    const addEvent = (event: CalendarEvent) => {
      const dateKey = event.date;
      if (!eventsMap.has(dateKey)) {
        eventsMap.set(dateKey, []);
      }
      eventsMap.get(dateKey)!.push(event);
    };

    // 1. Process Invoices (Receivables)
    invoices.forEach(inv => {
      if (inv.status === 'Pending' || inv.status === 'Overdue') {
        addEvent({
          id: `invoice-${inv.id}`,
          type: 'receivable',
          date: inv.dueDate.split('T')[0],
          title: `Invoice #${inv.invoiceNumber}`,
          secondary: inv.customerName,
          amount_lkr: inv.balance,
          color_hint: 'emerald',
          meta: { invoice_id: inv.id }
        });
      }
    });

    // 2. Process Recurring Expenses
    recurring.forEach(exp => {
      this.generateRecurringEvents(exp, year, month).forEach(addEvent);
    });

    // 3. Process Cheques
    cheques.forEach(chq => {
      addEvent({
        id: `cheque-${chq.id}`,
        type: 'cheque',
        date: chq.chequeDate.split('T')[0],
        title: `Cheque #${chq.chequeNumber}`,
        secondary: `${chq.payee} -> ${chq.payer}`,
        amount_lkr: chq.amount,
        color_hint: 'violet'
      });
    });
    
    // 4. Process Purchase Orders
    pos.forEach(p => {
      addEvent({
        id: `po-${p.id}`,
        type: 'po_eta',
        date: p.expectedDate.split('T')[0],
        title: `PO #${p.poNumber}`,
        secondary: p.supplierName,
        amount_lkr: p.amount,
        color_hint: 'blue',
        meta: { po_id: p.id }
      });
    });

    // 5. Add Sri Lankan Holidays
    this.getSriLankanHolidays(year, month).forEach(addEvent);

    return eventsMap;
  }

  private generateRecurringEvents(expense: RecurringExpense, year: number, month: number): CalendarEvent[] {
    const events: CalendarEvent[] = [];
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);
    const baseDate = new Date(expense.nextDueDate);
    
    const createEvent = (date: Date): CalendarEvent => ({
      id: `recurring-${expense.id}-${date.toISOString().split('T')[0]}`,
      type: 'recurring_expense',
      date: date.toISOString().split('T')[0],
      title: expense.description,
      secondary: expense.vendor,
      amount_lkr: expense.amount,
      color_hint: 'orange'
    });

    switch (expense.cadence) {
      case 'Monthly':
        const eventDate = new Date(year, month, baseDate.getDate());
        if (eventDate >= startDate && eventDate <= endDate) {
            events.push(createEvent(eventDate));
        }
        break;
      case 'Weekly':
        let currentDate = new Date(startDate);
        while(currentDate.getDay() !== baseDate.getDay()) {
            currentDate.setDate(currentDate.getDate() + 1);
        }
        while(currentDate <= endDate) {
            if (currentDate.getMonth() === month) {
              events.push(createEvent(new Date(currentDate)));
            }
            currentDate.setDate(currentDate.getDate() + 7);
        }
        break;
       case 'Daily':
        for(let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
           events.push(createEvent(new Date(d)));
        }
        break;
       case 'Yearly':
        if(baseDate.getMonth() === month) {
           events.push(createEvent(new Date(year, month, baseDate.getDate())));
        }
        break;
    }
    return events;
  }

  private getSriLankanHolidays(year: number, month: number): CalendarEvent[] {
    if (year !== 2024) {
      return []; // Data is only for 2024
    }
    
    return SRI_LANKAN_HOLIDAYS_2024
        .filter(h => h.month === month)
        .map(h => ({
            id: `holiday-${year}-${h.month}-${h.day}`,
            type: 'holiday',
            date: new Date(year, h.month, h.day).toISOString().split('T')[0],
            title: h.name,
            secondary: `${h.type} Holiday`,
            color_hint: 'slate'
        }));
  }
}
