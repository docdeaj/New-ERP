import '@angular/compiler';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withHashLocation } from '@angular/router';
import { provideZonelessChangeDetection } from '@angular/core';
import { APP_ROUTES } from './src/app.routes';
import { AppComponent } from './src/app.component';
import { importProvidersFrom } from '@angular/core';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CalendarDataService } from './src/services/calendar-data.service';
import { SettingsService } from './src/services/settings.service';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { NotificationService } from './src/services/notification.service';
import { AuthService } from './src/services/auth.service';
import { ToastService } from './src/services/toast.service';

bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(APP_ROUTES, withHashLocation()),
    importProvidersFrom(ScrollingModule, FormsModule, ReactiveFormsModule, DragDropModule),
    CalendarDataService,
    SettingsService,
    NotificationService,
    AuthService,
    ToastService,
  ],
}).catch((err) => console.error(err));

// AI Studio always uses an `index.tsx` file for all project types.