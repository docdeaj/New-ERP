import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private router = inject(Router);
  private readonly TOKEN_KEY = 'aurora_auth_token';
  
  isAuthenticated = signal<boolean>(false);

  constructor() {
    // Check for token on service initialization
    const token = this.getToken();
    this.isAuthenticated.set(!!token);
  }

  private getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  login(): void {
    // In a real app, this would involve an API call with credentials
    const mockToken = `mock-token-${Date.now()}`;
    localStorage.setItem(this.TOKEN_KEY, mockToken);
    this.isAuthenticated.set(true);
    this.router.navigate(['/dashboard']);
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this.isAuthenticated.set(false);
    this.router.navigate(['/login']);
  }

  signup(): void {
    // Mock signup is the same as login for now
    this.login();
  }
}
