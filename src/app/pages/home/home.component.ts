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

  constructor(
    private userService: UserService,
    private http: HttpClient,
    private messageService: MessageService
  ) {}

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
    this.clonedUsers[user.id] = {
      ...user,
      hobbies: Array.isArray(user.hobbies) ? [...user.hobbies] : [],
      techInterests: Array.isArray(user.techInterests) ? [...user.techInterests] : []
    };
  }

  onRowEditSave(user: User): void {
    if (!user.id) return;

    this.userService.updateUser(user.id, { ...user }).subscribe({
      next: () => {
        delete this.clonedUsers[user.id as string];
        this.messageService.add({
          severity: 'success',
          summary: 'Updated',
          detail: 'Member updated successfully'
        });
      },
      error: (err: any) => {
        console.error('Failed to update user', err);
        const original = this.clonedUsers[user.id as string];
        if (original) {
          const index = this.users.findIndex((u) => u.id === user.id);
          if (index > -1) {
            this.users[index] = { ...original };
          }
          delete this.clonedUsers[user.id as string];
        }
        this.messageService.add({
          severity: 'error',
          summary: 'Update failed',
          detail: err?.error?.message || 'Could not save changes'
        });
      }
    });
  }

  onRowEditCancel(user: User, index: number): void {
    if (!user.id) return;
    const original = this.clonedUsers[user.id];
    if (original) {
      this.users[index] = { ...original };
      delete this.clonedUsers[user.id];
    }
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
    if (!this.hasValue(date)) return '-';
    const d = new Date(date as string | Date);
    return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('en-US', { 
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }

  formatDateOnly(date: string | Date | null | undefined): string {
    if (!this.hasValue(date)) return '-';
    const d = new Date(date as string | Date);
    return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('en-US', { 
      year: 'numeric', month: 'short', day: 'numeric'
    });
  }

  formatArray(arr: string[] | null | undefined): string[] {
    return Array.isArray(arr) ? arr : [];
  }
}


