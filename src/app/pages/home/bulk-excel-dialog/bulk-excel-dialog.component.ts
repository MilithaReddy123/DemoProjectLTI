import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { UserService } from '../../../services/user.service';
import { ToastService } from '../../../services/toast.service';
import { MenuItem } from 'primeng/api';
import { downloadBlob } from '../../../utils/download.util';

@Component({
  selector: 'app-bulk-excel-dialog',
  templateUrl: './bulk-excel-dialog.component.html',
  styleUrls: ['./bulk-excel-dialog.component.css'],
})
export class BulkExcelDialogComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() uploadComplete = new EventEmitter<void>();
  @ViewChild('bulkFileInput', { static: false }) bulkFileInput!: any;

  bulkStep: 1 | 2 | 3 = 1;
  bulkFile: File | null = null;
  bulkFileError = '';
  bulkValidating = false;
  bulkUploading = false;
  bulkResult: any = null;
  bulkErrorRows: { rowNumber: number; reason: string; reasons?: string[] }[] = [];
  bulkReasonLimit = 3;
  private bulkExpandedRows = new Set<number>();
  bulkSteps: MenuItem[] = [
    { label: 'Select' },
    { label: 'Validate' },
    { label: 'Upload' },
  ];

  constructor(
    private userService: UserService,
    private toastService: ToastService,
  ) {}

  /** Called when p-dialog fires onHide (e.g. after hide animation). */
  onBulkDialogHide(): void {
    this.clearAndEmitClose();
  }

  /** Called when p-dialog fires visibleChange (X button or mask click). PrimeNG emits this, not onHide, when X is clicked. */
  onDialogVisibleChange(value: boolean): void {
    if (value === false) {
      this.clearAndEmitClose();
    }
  }

  private clearAndEmitClose(): void {
    this.bulkFile = null;
    this.bulkFileError = '';
    this.bulkResult = null;
    this.bulkErrorRows = [];
    this.bulkStep = 1;
    this.bulkExpandedRows.clear();
    if (this.bulkFileInput?.nativeElement) {
      this.bulkFileInput.nativeElement.value = '';
    }
    this.visibleChange.emit(false);
  }

  onBulkFileSelected(e: any): void {
    const f: File | undefined = e?.target?.files?.[0];
    this.bulkFile = f || null;
    this.bulkFileError = '';
    if (this.bulkFile && !this.isValidTemplateFileName(this.bulkFile.name)) {
      this.bulkFileError =
        'Invalid file name. Please upload only the Excel template downloaded from this application. Note: browser downloads may add suffix like "(2)" and that is allowed.';
      this.bulkFile = null;
    }
    this.bulkStep = 1;
    this.bulkResult = null;
    this.bulkErrorRows = [];
    this.bulkExpandedRows.clear();
  }

  private splitBulkReasons(reason: any): string[] {
    const raw = String(reason || '').trim();
    if (!raw) return [];
    const parts = raw
      .split(/;|\n/g)
      .map((s) => s.trim())
      .filter(Boolean);
    const seen = new Set<string>();
    const out: string[] = [];
    for (const p of parts) {
      const key = p.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(p);
    }
    return out;
  }

  isBulkRowExpanded(rowNumber: number): boolean {
    return this.bulkExpandedRows.has(rowNumber);
  }

  toggleBulkRowExpanded(rowNumber: number): void {
    if (this.bulkExpandedRows.has(rowNumber)) {
      this.bulkExpandedRows.delete(rowNumber);
    } else {
      this.bulkExpandedRows.add(rowNumber);
    }
  }

  bulkVisibleReasons(e: { rowNumber: number; reasons?: string[] }): string[] {
    const list = e?.reasons || [];
    if (this.isBulkRowExpanded(e.rowNumber)) {
      return list;
    }
    return list.slice(0, this.bulkReasonLimit);
  }

  bulkHasMoreReasons(e: { rowNumber: number; reasons?: string[] }): boolean {
    return (e?.reasons || []).length > this.bulkReasonLimit;
  }

  validateBulk(): void {
    if (!this.bulkFile) {
      this.toastService.show(
        'warn',
        'No file',
        this.bulkFileError || 'Please select an Excel file',
      );
      return;
    }
    this.bulkValidating = true;
    this.userService.validateBulkExcel(this.bulkFile).subscribe({
      next: (res: any) => {
        this.bulkResult = res;
        this.bulkErrorRows = (res?.errorDetails || []).map((e: any) => ({
          ...e,
          reasons: this.splitBulkReasons(e?.reason),
        }));
        this.bulkStep = this.bulkErrorRows.length ? 2 : 3;
        this.bulkValidating = false;
      },
      error: (err: any) => {
        this.toastService.show(
          'error',
          'Validation failed',
          err?.error?.message || 'Unable to validate file',
        );
        this.bulkValidating = false;
      },
    });
  }

  uploadBulk(): void {
    if (!this.bulkFile) {
      this.toastService.show(
        'warn',
        'No file',
        this.bulkFileError || 'Please select an Excel file',
      );
      return;
    }
    this.bulkUploading = true;
    this.userService.uploadBulkExcel(this.bulkFile).subscribe({
      next: (res: any) => {
        this.bulkResult = res;
        this.bulkErrorRows = (res?.errorDetails || []).map((e: any) => ({
          ...e,
          reasons: this.splitBulkReasons(e?.reason),
        }));
        this.bulkStep = 3;
        this.bulkUploading = false;
        this.toastService.show(
          'success',
          'Uploaded successfully',
          'Excel file has been processed successfully.',
        );
        if (res?.errorFileBase64) {
          this.downloadBase64Excel(
            res.errorFileBase64,
            'Users_Bulk_Errors.xlsx',
          );
        }
        this.uploadComplete.emit();
      },
      error: (err: any) => {
        this.toastService.show(
          'error',
          'Upload failed',
          err?.error?.message || 'Unable to upload file',
        );
        this.bulkUploading = false;
      },
    });
  }

  downloadValidationErrors(): void {
    if (this.bulkResult?.errorFileBase64) {
      this.downloadBase64Excel(
        this.bulkResult.errorFileBase64,
        'Users_Bulk_Validation_Errors.xlsx',
      );
    }
  }

  private isValidTemplateFileName(filename: string): boolean {
    const name = String(filename || '').trim();
    if (!name) return false;
    if (!/\.xlsx$/i.test(name)) return false;
    const lower = name.toLowerCase();
    if (!lower.startsWith('users_template_')) return false;
    return (
      /^users_template_(blank|data)(\s*\(\d+\))?\.xlsx$/i.test(name) ||
      /^users_template_(blank|with_data)_\d{4}-\d{2}-\d{2}(\s*\(\d+\))?\.xlsx$/i.test(name)
    );
  }

  private downloadBase64Excel(base64: string, filename: string): void {
    const bin = atob(base64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) {
      bytes[i] = bin.charCodeAt(i);
    }
    const blob = new Blob([bytes], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    downloadBlob(blob, filename);
  }
}
