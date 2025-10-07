import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { CalendarEvent, CalendarEventType, CalendarEventColor } from '../models/types';
import { RecurringExpense } from '../models/types';

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

    // 5. Add Mock Holidays
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
    const holidays = [
        { month: 0, day: 15, name: 'Tamil Thai Pongal Day' },
        { month: 1, day: 4, name: 'National Day' },
        { month: 4, day: 1, name: 'May Day' },
        { month: 11, day: 25, name: 'Christmas Day' }
    ];
    return holidays
        .filter(h => h.month === month)
        .map(h => ({
            id: `holiday-${h.name.replace(' ', '-')}`,
            type: 'holiday',
            date: new Date(year, h.month, h.day).toISOString().split('T')[0],
            title: h.name,
            color_hint: 'slate'
        }));
  }
}
