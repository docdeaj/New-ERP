import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private tenant_id = '1234';
  private user_id = 'user-abc';

  constructor() { }

  emitEvent(eventName: string, payload: object) {
    const eventData = {
      ...payload,
      tenant_id: this.tenant_id,
      user_id: this.user_id,
      timestamp: new Date().toISOString(),
    };
    
    // In a real application, you would send this to your analytics provider (e.g., Google Analytics, Mixpanel, etc.)
    console.log(`[ANALYTICS] Event: ${eventName}`, eventData);
  }
}
