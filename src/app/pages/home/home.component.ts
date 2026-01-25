import { Component, ViewChild } from '@angular/core';
import { UserService } from '../../services/user.service';
import { ToastService } from '../../services/toast.service';
import { MenuItem } from 'primeng/api';
import { Router } from '@angular/router';
import { downloadBlob } from '../../utils/download.util';
import { MembersTableComponent } from './members-table/members-table.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent {
  @ViewChild('membersTable') membersTable!: MembersTableComponent;

  displayAddDialog = false;
  bulkDialogVisible = false;
  downloadMode: 'blank' | 'data' = 'blank';
  excelMenuItems: MenuItem[] = [];

  constructor(
    private userService: UserService,
    private toastService: ToastService,
    private router: Router,
  ) {
    this.excelMenuItems = [
      {
        label: 'Download',
        icon: 'pi pi-download',
        items: [
          {
            label: 'Blank Template',
            icon: 'pi pi-file',
            command: () => {
              this.downloadMode = 'blank';
              this.downloadTemplate();
            },
          },
          {
            label: 'Template with Data',
            icon: 'pi pi-database',
            command: () => {
              this.downloadMode = 'data';
              this.downloadTemplate();
            },
          },
        ],
      },
      {
        label: 'Upload',
        icon: 'pi pi-upload',
        command: () => this.openBulkDialog(),
      },
    ];
  }

  logout(): void {
    localStorage.removeItem('current_user');
    this.router.navigate(['/login']);
  }

  navigateToCharts(): void {
    this.router.navigate(['/charts']);
  }

  openBulkDialog(): void {
    this.bulkDialogVisible = true;
  }

  private getDownloadedBy(): string {
    try {
      const u = JSON.parse(localStorage.getItem('current_user') || 'null');
      return u?.username || u?.email || u?.name || 'Unknown';
    } catch {
      return 'Unknown';
    }
  }

  downloadTemplate(): void {
    const downloadedBy = this.getDownloadedBy();
    this.userService
      .downloadUsersTemplate(this.downloadMode, downloadedBy)
      .subscribe({
        next: (blob: Blob) =>
          downloadBlob(blob, `Users_Template_${this.downloadMode}.xlsx`),
        error: () =>
          this.toastService.show(
            'error',
            'Download failed',
            'Unable to download template',
          ),
      });
  }

  onBulkUploadComplete(): void {
    this.membersTable?.loadUsers();
  }

  openAddUser(): void {
    this.displayAddDialog = true;
  }

  onUserSaved(): void {
    this.displayAddDialog = false;
    this.membersTable?.loadUsers();
  }

  onDialogHide(): void {
    this.displayAddDialog = false;
  }
}
