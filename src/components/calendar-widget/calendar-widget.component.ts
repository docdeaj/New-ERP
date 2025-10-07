import { Component, ChangeDetectionStrategy, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { CalendarEvent, CalendarEventType, CalendarEventColor } from '../../models/types';
import { CalendarDataService } from '../../services/calendar-data.service';

interface CalendarDay {
  date: Date;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isPast: boolean;
  dateString: string;
}

@Component({
  selector: 'app-calendar-widget',
  templateUrl: './calendar-widget.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, CurrencyPipe],
})
export class CalendarWidgetComponent implements OnInit {
  private calendarDataService = inject(CalendarDataService);

  // --- State Signals ---
  currentDate = signal(new Date()); // The month/year being viewed
  selectedDate = signal(new Date());
  events = signal<Map<string, CalendarEvent[]>>(new Map());
  activeFilters = signal<Set<CalendarEventType>>(new Set());
  isLoading = signal(true);

  weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  colorMap: Record<CalendarEventColor, string> = {
    emerald: 'bg-emerald-500',
    orange: 'bg-orange-500',
    violet: 'bg-violet-500',
    blue: 'bg-blue-500',
    slate: 'bg-slate-500',
    cyan: 'bg-cyan-500'
  };

  filterChips: { key: CalendarEventType, label: string }[] = [
    { key: 'receivable', label: 'Receivables' },
    { key: 'recurring_expense', label: 'Recurring' },
    { key: 'cheque', label: 'Cheques' },
    { key: 'po_eta', label: 'POs' }
  ];

  ngOnInit() {
    this.loadEventsForCurrentMonth();
    this.selectedDate.set(new Date());
  }

  async loadEventsForCurrentMonth() {
    this.isLoading.set(true);
    const date = this.currentDate();
    const year = date.getFullYear();
    const month = date.getMonth();
    const eventsMap = await this.calendarDataService.getEventsForMonth(year, month);
    this.events.set(eventsMap);
    this.isLoading.set(false);
  }

  // --- Computed Signals ---
  monthDisplay = computed(() => this.currentDate().toLocaleString('default', { month: 'long', year: 'numeric' }));
  selectedDateString = computed(() => this.selectedDate().toISOString().split('T')[0]);

  calendarGrid = computed<CalendarDay[]>(() => {
    const date = this.currentDate();
    const year = date.getFullYear();
    const month = date.getMonth();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstDayOfMonth = new Date(year, month, 1);
    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(startDate.getDate() - firstDayOfMonth.getDay());

    const grid: CalendarDay[] = [];
    for (let i = 0; i < 42; i++) {
      const day = new Date(startDate);
      day.setDate(day.getDate() + i);
      grid.push({
        date: day,
        dayOfMonth: day.getDate(),
        isCurrentMonth: day.getMonth() === month,
        isToday: day.getTime() === today.getTime(),
        isPast: day < today,
        dateString: day.toISOString().split('T')[0]
      });
    }
    return grid;
  });
  
  eventsForSelectedDate = computed(() => {
    const dateStr = this.selectedDateString();
    return this.events().get(dateStr) || [];
  });

  filteredEventsForSelectedDate = computed(() => {
    const events = this.eventsForSelectedDate();
    const filters = this.activeFilters();
    if (filters.size === 0) return events;
    return events.filter(event => filters.has(event.type));
  });

  dailyTotals = computed(() => {
    const events = this.eventsForSelectedDate();
    const totals = { receivables: 0, expenses: 0 };
    for (const event of events) {
      if (event.type === 'receivable') {
        totals.receivables += event.amount_lkr || 0;
      } else if (event.type === 'recurring_expense') {
        totals.expenses += event.amount_lkr || 0;
      }
    }
    return totals;
  });

  // --- Methods ---
  changeMonth(delta: number) {
    this.currentDate.update(d => {
      const newDate = new Date(d);
      newDate.setMonth(newDate.getMonth() + delta);
      return newDate;
    });
    this.loadEventsForCurrentMonth();
  }
  
  selectDay(day: CalendarDay) {
    this.selectedDate.set(day.date);
  }
  
  goToToday() {
    this.currentDate.set(new Date());
    this.selectedDate.set(new Date());
    this.loadEventsForCurrentMonth();
  }

  toggleFilter(filter: CalendarEventType) {
    this.activeFilters.update(filters => {
      const newFilters = new Set(filters);
      if (newFilters.has(filter)) {
        newFilters.delete(filter);
      } else {
        newFilters.add(filter);
      }
      return newFilters;
    });
  }

  clearFilters() {
    this.activeFilters.set(new Set());
  }
}