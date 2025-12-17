import { Component, OnInit, ViewChild } from '@angular/core';
import { UserService } from '../../services/user.service';
import { User } from '../../models/user.model';
import { Table } from 'primeng/table';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html'
})
export class HomeComponent implements OnInit {
  @ViewChild('dt') dt!: Table;
  
  users: User[] = [];
  displayAddDialog = false;
  displayEditDialog = false;
  selectedUser: User | null = null;
  loading = false;

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.userService.getUsers().subscribe({
      next: (data) => {
        this.users = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load users', err);
        this.loading = false;
      }
    });
  }

  openAddUser(): void {
    this.selectedUser = null;
    this.displayAddDialog = true;
  }

  openEditUser(user: User): void {
    if (!user.id) return;
    
    // Fetch full user details from backend for editing
    this.userService.getUserById(user.id).subscribe({
      next: (fullUser) => {
        this.selectedUser = fullUser;
        this.displayEditDialog = true;
      },
      error: (err) => console.error('Failed to load user details', err)
    });
  }

  onUserSaved(): void {
    this.displayAddDialog = false;
    this.displayEditDialog = false;
    this.selectedUser = null;
    this.loadUsers();
  }

  onDialogHide(): void {
    this.displayAddDialog = false;
    this.displayEditDialog = false;
    this.selectedUser = null;
  }

  deleteUser(user: User): void {
    if (!user.id) return;

    const confirmed = confirm(`Delete user "${user.name}"?`);
    if (!confirmed) {
      return;
    }

    this.userService.deleteUser(user.id).subscribe({
      next: () => this.loadUsers(),
      error: (err) => console.error('Failed to delete user', err)
    });
  }
}


