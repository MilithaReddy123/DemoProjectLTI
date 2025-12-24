import { Component, OnInit, ViewChild } from '@angular/core';
import { UserService } from '../../services/user.service';
import { User } from '../../models/user.model';
import { Table } from 'primeng/table';
import { HttpClient } from '@angular/common/http';
import { MessageService } from 'primeng/api';

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
  displayAddDialog = false;
  loading = false;
  clonedUsers: { [id: string]: User } = {};
  fieldErrors: { [userId: string]: { [field: string]: string } } = {};

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
    if (!user.id) return;

    const confirmed = confirm(`Delete user "${user.name}"?`);
    if (!confirmed) {
      return;
    }

    this.userService.deleteUser(user.id).subscribe({
      next: () => this.loadUsers(),
      error: (err: any) => console.error('Failed to delete user', err)
    });
  }

  onRowEditInit(user: User): void {
    if (!user.id) return;
    
    const creditCardLast4 = this.extractCreditCardLast4(user.creditCard);
    
    this.clonedUsers[user.id] = {
      ...user,
      creditCard: creditCardLast4,
      hobbies: this.ensureArray(user.hobbies),
      techInterests: this.ensureArray(user.techInterests)
    };
    
    user.creditCard = creditCardLast4;
    this.fieldErrors[user.id] = {};
  }

  onRowEditSave(user: User): void {
    if (!user.id) return;

    this.processCreditCard(user);
    this.normalizeUserData(user);

    const errors = this.validateUser(user);
    if (Object.keys(errors).length > 0) {
      this.fieldErrors[user.id] = errors;
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation Error',
        detail: `Please fix the errors before saving. Check fields: ${Object.keys(errors).join(', ')}`
      });
      return;
    }

    delete this.fieldErrors[user.id];
    this.loading = true;
    
    this.userService.updateUser(user.id, this.prepareUserDataForUpdate(user)).subscribe({
      next: () => this.handleSaveSuccess(user.id!),
      error: (err: any) => this.handleSaveError(err, user)
    });
  }

  private handleSaveSuccess(userId: string): void {
    delete this.clonedUsers[userId];
    this.loading = false;
    this.messageService.add({
      severity: 'success',
      summary: 'Saved Successfully',
      detail: 'Member updated successfully',
      life: 3000
    });
    this.loadUsers();
  }

  private handleSaveError(err: any, user: User): void {
    console.error('Failed to update user', err);
    this.loading = false;
    const original = this.clonedUsers[user.id!];
    if (original) {
      const index = this.users.findIndex((u) => u.id === user.id);
      if (index > -1) this.users[index] = { ...original };
      delete this.clonedUsers[user.id!];
    }
    this.messageService.add({
      severity: 'error',
      summary: 'Update failed',
      detail: err?.error?.message || 'Could not save changes. Please try again.'
    });
  }

  onRowEditCancel(user: User, index: number): void {
    if (!user.id) return;
    const original = this.clonedUsers[user.id];
    if (original) {
      this.users[index] = { ...original };
      delete this.clonedUsers[user.id];
    }
    delete this.fieldErrors[user.id];
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
    const originalUser = this.clonedUsers[user.id!];
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
}

