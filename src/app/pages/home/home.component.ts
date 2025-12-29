import { Component, OnInit, ViewChild } from '@angular/core';
import { UserService } from '../../services/user.service';
import { User } from '../../models/user.model';
import { Table } from 'primeng/table';
import { HttpClient } from '@angular/common/http';
import { MessageService } from 'primeng/api';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

interface LocationData {
  states: string[];
  citiesByState: Record<string, string[]>;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html'
})
export class HomeComponent implements OnInit {
  @ViewChild('dt') dt!: Table;
  
  users: User[] = [];
  /**
   * Snapshot of the last loaded server state (keyed by userId).
   * Used as the baseline to determine what changed, regardless of how the UI mutates `users` while editing.
   */
  private baselineUsers: Record<string, User> = {};
  displayAddDialog = false;
  displayDeleteDialog = false;
  userToDelete: User | null = null;
  loading = false;
  fieldErrors: { [userId: string]: { [field: string]: string } } = {};
  savingChanges = false;

  /**
   * Stores all pending edits across the table (keyed by userId).
   * Requirement: this object is maintained by `celledited(...)` and later persisted by `savechanges()`.
   */
  editedRows: Record<
    string,
    {
      original: User;
      last: Record<string, any>;
      events: Array<{
        field: string;
        previousValue: any;
        currentValue: any;
        at: string;
      }>;
    }
  > = {};

  states: { label: string; value: string | null }[] = [{ label: 'Select State', value: null }];
  citiesByState: Record<string, string[]> = {};
  hobbiesOptions = [
    { label: 'Reading', value: 'Reading' },
    { label: 'Music', value: 'Music' },
    { label: 'Sports', value: 'Sports' }
  ];
  techOptions = [
    { label: 'Angular', value: 'Angular' },
    { label: 'React', value: 'React' },
    { label: 'Node.js', value: 'Node.js' },
    { label: 'Java', value: 'Java' }
  ];
  genders = ['Male', 'Female', 'Other'];
  genderOptions: { label: string; value: string }[] = [];

  constructor(
    private userService: UserService,
    private http: HttpClient,
    private messageService: MessageService
  ) {
    this.genderOptions = this.genders.map(g => ({ label: g, value: g }));
  }

  ngOnInit(): void {
    this.loadUsers();
    this.loadLocations();
  }

  loadUsers(): void {
    this.loading = true;
    this.userService.getUsers().subscribe({
      next: (data: User[]) => {
        this.users = data;
        // Refresh baseline from latest server state (deep clone to avoid accidental mutations).
        this.baselineUsers = {};
        data.forEach((u) => {
          if (u.id) this.baselineUsers[u.id] = this.cloneUser(u);
        });
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Failed to load users', err);
        this.loading = false;
      }
    });
  }

  openAddUser(): void {
    this.displayAddDialog = true;
  }

  onUserSaved(): void {
    this.displayAddDialog = false;
    this.loadUsers();
  }

  onDialogHide(): void {
    this.displayAddDialog = false;
  }

  deleteUser(user: User): void {
    // Open PrimeNG dialog instead of browser confirm().
    if (!user.id) return;
    this.userToDelete = user;
    this.displayDeleteDialog = true;
  }

  cancelDelete(): void {
    this.displayDeleteDialog = false;
    this.userToDelete = null;
  }

  confirmDelete(): void {
    const user = this.userToDelete;
    if (!user?.id) {
      this.cancelDelete();
      return;
    }

    this.loading = true;
    this.userService.deleteUser(user.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Deleted',
          detail: `Deleted "${user.name}".`,
          life: 2500
        });
        this.cancelDelete();
        this.loadUsers();
      },
      error: (err: any) => {
        console.error('Failed to delete user', err);
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Delete failed',
          detail: err?.error?.message || 'Could not delete user. Please try again.'
        });
      }
    });
  }

  hasPendingChanges(): boolean {
    return Object.keys(this.editedRows).length > 0;
  }

  /**
   * Called whenever a cell edit is completed.
   * - Tracks edits inside `editedRows` (per user id)
   * - Stores an event history (field + previous/current values)
   * - Re-validates the edited row and updates `fieldErrors`
   */
  celledited(event: any): void {
    const user: User | undefined = (event?.data as User) ?? (event?.rowData as User);
    const field: string | undefined =
      event?.field ?? event?.column?.field ?? event?.columnField ?? event?.dataField;

    if (!user?.id || !field) return;

    // Ensure we keep data normalized as users type (trim strings, arrays, mobile digits, etc.)
    this.normalizeUserData(user);
    this.processCreditCard(user);

    if (!this.editedRows[user.id]) {
      // Use the last loaded server snapshot as the true "original" baseline.
      const original = this.cloneUser(this.baselineUsers[user.id] ?? user);
      this.editedRows[user.id] = {
        original,
        last: { ...original } as any,
        events: []
      };
    }

    const rowState = this.editedRows[user.id];
    const previousValue =
      event?.originalValue ?? event?.previousValue ?? rowState.last[field];
    const currentValue = (user as any)[field];

    rowState.last[field] = currentValue;

    // Only store an event when the value actually changed.
    if (previousValue !== currentValue) {
      rowState.events.push({
        field,
        previousValue,
        currentValue,
        at: new Date().toISOString()
      });
    }

    // Validate the whole row but only update the edited field error for UI.
    const errors = this.validateUser(user);
    this.upsertFieldError(user.id, field, errors[field]);

    // If the row matches the original (no real diffs), remove it from pending edits.
    if (!this.isRowDirty(user.id, user)) {
      delete this.editedRows[user.id];
      delete this.fieldErrors[user.id];
    }
  }

  savechanges(): void {
    if (this.savingChanges || this.loading) return;

    const userIds = Object.keys(this.editedRows);
    if (userIds.length === 0) {
      this.messageService.add({
        severity: 'info',
        summary: 'No changes',
        detail: 'There are no pending edits to save.'
      });
      return;
    }

    // Validate all pending rows before doing any API calls.
    const invalidIds: string[] = [];
    for (const id of userIds) {
      const user = this.users.find((u) => u.id === id);
      if (!user) continue;
      const errors = this.validateUser(user);
      if (Object.keys(errors).length > 0) {
        this.fieldErrors[id] = errors;
        invalidIds.push(id);
      }
    }

    if (invalidIds.length > 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation Error',
        detail: 'Please fix validation errors before saving.'
      });
      return;
    }

    this.savingChanges = true;
    this.loading = true;

    const requests = userIds
      .map((id) => {
        const user = this.users.find((u) => u.id === id);
        if (!user) return null;
        return this.userService.updateUser(id, this.prepareUserDataForUpdate(user)).pipe(
          map(() => ({ id, ok: true as const })),
          catchError((error) => of({ id, ok: false as const, error }))
        );
      })
      .filter((r): r is NonNullable<typeof r> => !!r);

    forkJoin(requests).subscribe({
      next: (results) => {
        const successIds = results.filter((r) => r.ok).map((r) => r.id);
        const failed = results.filter((r) => !r.ok);

        successIds.forEach((id) => {
          delete this.editedRows[id];
          delete this.fieldErrors[id];
        });

        this.savingChanges = false;
        this.loading = false;

        if (failed.length === 0) {
          this.messageService.add({
            severity: 'success',
            summary: 'Saved Successfully',
            detail: `Saved ${successIds.length} member(s).`,
            life: 3000
          });
          this.loadUsers();
          return;
        }

        // Revert failed rows to their original snapshots and keep them pending.
        failed.forEach((f: any) => {
          const state = this.editedRows[f.id];
          if (!state?.original) return;
          const idx = this.users.findIndex((u) => u.id === f.id);
          if (idx > -1) this.users[idx] = { ...state.original };
        });

        this.messageService.add({
          severity: 'error',
          summary: 'Partial save',
          detail: `Saved ${successIds.length} member(s). Failed ${failed.length}. Please retry.`
        });
      },
      error: () => {
        this.savingChanges = false;
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Save failed',
          detail: 'Could not save changes. Please try again.'
        });
      }
    });
  }

  onStateChange(user: User): void {
    if (!user.state) {
      user.city = '';
      return;
    }
    const availableCities = this.citiesByState[user.state] || [];
    if (user.city && !availableCities.includes(user.city)) {
      user.city = '';
    }
  }

  cityOptions(state: string | null | undefined): { label: string; value: string }[] {
    const cities = state ? this.citiesByState[state] || [] : [];
    return cities.map((c) => ({ label: c, value: c }));
  }

  private loadLocations(): void {
    this.http.get<LocationData>('assets/locations.json').subscribe({
      next: (data: LocationData) => {
        this.citiesByState = data.citiesByState ?? {};
        this.states = [
          { label: 'Select State', value: null },
          ...(data.states ?? []).map((s: string) => ({ label: s, value: s }))
        ];
      },
      error: (err: any) => console.error('Failed to load locations.json', err)
    });
  }

  hasValue(value: any): boolean {
    return value !== null && value !== undefined && value !== '' && (typeof value !== 'string' || value.trim() !== '');
  }

  formatDate(date: string | Date | null | undefined): string {
    return this.formatDateInternal(date, { hour: '2-digit', minute: '2-digit' });
  }

  formatDateOnly(date: string | Date | null | undefined): string {
    return this.formatDateInternal(date);
  }

  private formatDateInternal(date: string | Date | null | undefined, options?: Intl.DateTimeFormatOptions): string {
    if (!this.hasValue(date)) return '-';
    const d = new Date(date as string | Date);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...options
    });
  }

  formatArray(arr: string[] | null | undefined): string[] {
    return this.ensureArray(arr);
  }

  getGenderSeverity(gender: string | null | undefined): string {
    if (!gender) return 'info';
    if (gender === 'Male') return 'success';
    if (gender === 'Female') return 'warning';
    return 'info';
  }

  getTooltipText(text: string | null | undefined, maxLength: number): string {
    if (!text || text.length <= maxLength) return '';
    return text;
  }

  private normalizeUserData(user: User): void {
    const stringFields: (keyof User)[] = ['email', 'username', 'mobile', 'creditCard', 'state', 'city', 'gender', 'address'];
    stringFields.forEach(field => {
      if (typeof user[field] === 'string') {
        (user[field] as string) = (user[field] as string).trim();
      }
    });

    if (user.mobile) {
      user.mobile = String(user.mobile).replace(/\D/g, '');
    }

    user.hobbies = this.ensureArray(user.hobbies);
    user.techInterests = this.ensureArray(user.techInterests);
  }

  private processCreditCard(user: User): void {
    const originalUser = this.editedRows[user.id!]?.original;
    const currentCard = String(user.creditCard || '').replace(/\D/g, '');
    
    if (currentCard.length === 16) {
      user.creditCard = currentCard;
    } else if (currentCard.length === 4) {
      user.creditCard = currentCard;
    } else if (currentCard.length > 0 && currentCard.length < 16) {
      user.creditCard = currentCard.length >= 4 ? currentCard.slice(-4) : currentCard;
    } else if (originalUser?.creditCard) {
      user.creditCard = String(originalUser.creditCard).replace(/\D/g, '').slice(-4);
    }
  }

  private extractCreditCardLast4(creditCard: string | null | undefined): string {
    if (!creditCard) return '';
    return String(creditCard).replace(/\D/g, '').slice(-4);
  }

  private ensureArray<T>(value: T[] | null | undefined): T[] {
    return Array.isArray(value) ? value : [];
  }

  private getStringValue(value: any): string {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value.trim();
    if (typeof value === 'number') return String(value).trim();
    return String(value).trim();
  }

  validateUser(user: User): { [field: string]: string } {
    const errors: { [field: string]: string } = {};
    const emailStr = this.getStringValue(user.email);
    const usernameStr = this.getStringValue(user.username);
    const mobileStr = String(user.mobile || '').replace(/\D/g, '');
    const creditCardStr = String(user.creditCard || '').replace(/\D/g, '');

    // Email validation
    if (!emailStr) {
      errors['email'] = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr)) {
      errors['email'] = 'Please enter a valid email address';
    } else if (!emailStr.toLowerCase().endsWith('.com')) {
      errors['email'] = 'Email must end with .com';
    }

    // Username validation
    if (!usernameStr) {
      errors['username'] = 'Username is required';
    } else if (usernameStr.length < 4 || usernameStr.length > 20) {
      errors['username'] = 'Username must be 4-20 characters';
    } else if (!/^[a-zA-Z0-9._-]+$/.test(usernameStr)) {
      errors['username'] = 'Username can only contain letters, numbers, _, @, and -';
    }

    // Mobile validation
    if (!mobileStr) {
      errors['mobile'] = 'Mobile number is required';
    } else if (mobileStr.length !== 10) {
      errors['mobile'] = 'Mobile must be exactly 10 digits';
    }

    // Credit Card validation
    if (!creditCardStr) {
      errors['creditCard'] = 'Credit card number is required';
    } else if (creditCardStr.length !== 4 && creditCardStr.length !== 16) {
      errors['creditCard'] = 'Please enter either last 4 digits or full 16-digit card number';
    }

    // Required string fields
    const requiredFields: Array<{ field: keyof User; message: string }> = [
      { field: 'state', message: 'State is required' },
      { field: 'city', message: 'City is required' },
      { field: 'gender', message: 'Gender is required' }
    ];
    requiredFields.forEach(({ field, message }) => {
      if (!this.getStringValue(user[field])) {
        errors[field as string] = message;
      }
    });

    // Array validations
    if (this.ensureArray(user.hobbies).length === 0) {
      errors['hobbies'] = 'Select at least one hobby';
    }
    if (this.ensureArray(user.techInterests).length === 0) {
      errors['techInterests'] = 'Select at least one technology';
    }

    // DOB validation
    if (!user.dob) {
      errors['dob'] = 'Date of birth is required';
    } else {
      const dobDate = new Date(user.dob);
      if (isNaN(dobDate.getTime())) {
        errors['dob'] = 'Please enter a valid date';
      }
    }

    return errors;
  }

  getFieldError(userId: string | undefined, field: string): string {
    if (!userId) return '';
    return this.fieldErrors[userId]?.[field] || '';
  }

  hasFieldError(userId: string | undefined, field: string): boolean {
    if (!userId) return false;
    return !!this.fieldErrors[userId]?.[field];
  }

  onFieldBlur(user: User, field: string): void {
    if (!user.id) return;
    const errors = this.validateUser(user);
    
    if (!this.fieldErrors[user.id]) {
      this.fieldErrors[user.id] = {};
    }
    
    if (errors[field]) {
      this.fieldErrors[user.id][field] = errors[field];
    } else {
      delete this.fieldErrors[user.id][field];
      if (Object.keys(this.fieldErrors[user.id]).length === 0) {
        delete this.fieldErrors[user.id];
      }
    }
  }

  private prepareUserDataForUpdate(user: User): any {
    const dobDate = user.dob ? new Date(user.dob) : null;
    const formattedDob = dobDate && !isNaN(dobDate.getTime())
      ? `${dobDate.getFullYear()}-${String(dobDate.getMonth() + 1).padStart(2, '0')}-${String(dobDate.getDate()).padStart(2, '0')}`
      : null;

    return {
      name: user.name,
      username: user.username,
      email: user.email,
      mobile: user.mobile,
      creditCard: user.creditCard,
      state: user.state,
      city: user.city,
      gender: user.gender,
      hobbies: this.ensureArray(user.hobbies),
      techInterests: this.ensureArray(user.techInterests),
      address: user.address || '',
      dob: formattedDob
    };
  }

  private cloneUser(user: User): User {
    // Good enough for this UI use-case (serializable fields). Avoids mutating originals.
    return JSON.parse(JSON.stringify(user)) as User;
  }

  private upsertFieldError(userId: string, field: string, message: string | undefined): void {
    if (!this.fieldErrors[userId]) this.fieldErrors[userId] = {};

    if (message) {
      this.fieldErrors[userId][field] = message;
      return;
    }

    delete this.fieldErrors[userId][field];
    if (Object.keys(this.fieldErrors[userId]).length === 0) {
      delete this.fieldErrors[userId];
    }
  }

  private isRowDirty(userId: string, current: User): boolean {
    const original = this.editedRows[userId]?.original;
    if (!original) return false;
    return (
      JSON.stringify(this.prepareUserDataForUpdate(original)) !==
      JSON.stringify(this.prepareUserDataForUpdate(current))
    );
  }
}

