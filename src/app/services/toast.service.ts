import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';

/**
 * Centralized toast notification service. Wraps PrimeNG MessageService
 * so all toasts use the same API. Used by Home, Charts, and UserForm.
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly defaultLife = 3000;

  constructor(private messageService: MessageService) {}

  /**
   * Show a toast notification.
   * @param severity - 'success' | 'info' | 'warn' | 'error'
   * @param summary - Short title
   * @param detail - Message body
   * @param life - Duration in ms before auto-dismiss (default 3000)
   */
  show(severity: string, summary: string, detail: string, life?: number): void {
    this.messageService.add({
      severity,
      summary,
      detail,
      life: life ?? this.defaultLife
    });
  }
}
