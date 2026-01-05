import { Component, OnInit, ViewChild } from '@angular/core';
import { UserService } from '../../services/user.service';
import { User } from '../../models/user.model';
import { Table } from 'primeng/table';
import { HttpClient } from '@angular/common/http';
import { MessageService } from 'primeng/api';
import { MenuItem } from 'primeng/api';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

interface City { cityName: string; cityCode: string; }
interface StateData { stateName: string; stateCode: string; cities: City[]; }
interface LocationData { states: StateData[]; }
type Opt<T = string> = { label: string; value: T | null };

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html'
})
export class HomeComponent implements OnInit {
  @ViewChild('dt') dt!: Table;
  users: User[] = [];
  filteredUsers: User[] = [];
  showFilters = false;
  todayDate = new Date();
  stateFilterOptions: Opt[] = [{ label: 'All States', value: null }];
  genderFilterOptions: Opt[] = [{ label: 'All Genders', value: null }];
  filterModel = { name: '', state: null as string | null, city: null as string | null, gender: null as string | null, techInterests: [] as string[] };
  private baselineUsers: Record<string, User> = {};
  displayAddDialog = false;
  displayDeleteDialog = false;
  userToDelete: User | null = null;
  loading = false;
  fieldErrors: Record<string, Record<string, string>> = {};
  savingChanges = false;
  editedRows: Record<string, { original: User; last: Record<string, any>; events: { field: string; previousValue: any; currentValue: any; at: string }[] }> = {};
  states: Opt[] = [{ label: 'Select State', value: null }];
  citiesByState: Record<string, string[]> = {};
  hobbiesOptions = ['Reading', 'Music', 'Sports'].map(h => ({ label: h, value: h }));
  techOptions = ['Angular', 'React', 'Node.js', 'Java'].map(t => ({ label: t, value: t }));
  genders = ['Male', 'Female', 'Other'];
  genderOptions = this.genders.map(g => ({ label: g, value: g }));

  // Bulk Excel UI state
  bulkDialogVisible = false;
  bulkStep: 1 | 2 | 3 = 1;
  bulkFile: File | null = null;
  bulkValidating = false;
  bulkUploading = false;
  bulkResult: any = null;
  bulkErrorRows: { rowNumber: number; reason: string }[] = [];
  downloadMode: 'blank' | 'data' = 'blank';
  downloadModeOptions: Opt<'blank' | 'data'>[] = [
    { label: 'Blank Template', value: 'blank' },
    { label: 'Template with Data', value: 'data' }
  ];
  excelMenuItems: MenuItem[] = [];

  constructor(private userService: UserService, private http: HttpClient, private messageService: MessageService, private router: Router) {
    this.genderFilterOptions = [{ label: 'All Genders', value: null }, ...this.genderOptions];

    this.excelMenuItems = [
      {
        label: 'Download',
        icon: 'pi pi-download',
        items: [
          { label: 'Blank Template', icon: 'pi pi-file', command: () => { this.downloadMode = 'blank'; this.downloadTemplate(); } },
          { label: 'Template with Data', icon: 'pi pi-database', command: () => { this.downloadMode = 'data'; this.downloadTemplate(); } }
        ]
      },
      { label: 'Upload', icon: 'pi pi-upload', command: () => this.openBulkDialog() }
    ];
  }

  logout(): void { localStorage.removeItem('current_user'); this.router.navigate(['/login']); }

  ngOnInit(): void { this.loadUsers(); this.loadLocations(); }

  // -------- Bulk Excel actions --------
  openBulkDialog(): void {
    this.bulkDialogVisible = true;
    this.bulkStep = 1;
    this.bulkFile = null;
    this.bulkResult = null;
    this.bulkErrorRows = [];
  }

  onBulkDialogHide(): void {
    this.bulkDialogVisible = false;
  }

  onBulkFileSelected(e: any): void {
    const f: File | undefined = e?.target?.files?.[0];
    this.bulkFile = f || null;
    this.bulkStep = 1;
    this.bulkResult = null;
    this.bulkErrorRows = [];
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
    this.userService.downloadUsersTemplate(this.downloadMode, downloadedBy).subscribe({
      next: (blob: Blob) => this.downloadBlob(blob, `Users_Template_${this.downloadMode}.xlsx`),
      error: () => this.toast('error', 'Download failed', 'Unable to download template')
    });
  }

  validateBulk(): void {
    if (!this.bulkFile) { this.toast('warn', 'No file', 'Please select an Excel file'); return; }
    this.bulkValidating = true;
    this.userService.validateBulkExcel(this.bulkFile).subscribe({
      next: (res: any) => {
        this.bulkResult = res;
        this.bulkErrorRows = res?.errorDetails || [];
        this.bulkStep = this.bulkErrorRows.length ? 2 : 3;
        this.bulkValidating = false;
      },
      error: (err: any) => {
        this.toast('error', 'Validation failed', err?.error?.message || 'Unable to validate file');
        this.bulkValidating = false;
      }
    });
  }

  uploadBulk(): void {
    if (!this.bulkFile) { this.toast('warn', 'No file', 'Please select an Excel file'); return; }
    this.bulkUploading = true;
    this.userService.uploadBulkExcel(this.bulkFile).subscribe({
      next: (res: any) => {
        this.bulkResult = res;
        this.bulkErrorRows = res?.errorDetails || [];
        this.bulkStep = 3;
        this.bulkUploading = false;
        this.toast('success', 'Bulk upload complete', `Created: ${res?.createdCount || 0}, Updated: ${res?.updatedCount || 0}, Errors: ${res?.errorCount || 0}`);
        if (res?.errorFileBase64) this.downloadBase64Excel(res.errorFileBase64, 'Users_Bulk_Errors.xlsx');
        this.loadUsers();
      },
      error: (err: any) => {
        this.toast('error', 'Upload failed', err?.error?.message || 'Unable to upload file');
        this.bulkUploading = false;
      }
    });
  }

  downloadValidationErrors(): void {
    if (this.bulkResult?.errorFileBase64) this.downloadBase64Excel(this.bulkResult.errorFileBase64, 'Users_Bulk_Validation_Errors.xlsx');
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  private downloadBase64Excel(base64: string, filename: string): void {
    const bin = atob(base64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    this.downloadBlob(blob, filename);
  }

  loadUsers(): void {
    this.loading = true;
    this.userService.getUsers().subscribe({
      next: (data) => {
        this.users = data;
        this.baselineUsers = Object.fromEntries(data.filter(u => u.id).map(u => [u.id!, this.clone(u)]));
        this.applyLocalFilters();
        this.loading = false;
      },
      error: () => { this.filteredUsers = []; this.loading = false; }
    });
  }

  openAddUser(): void { this.displayAddDialog = true; }
  onUserSaved(): void { this.displayAddDialog = false; this.loadUsers(); }
  onDialogHide(): void { this.displayAddDialog = false; }

  deleteUser(user: User): void {
    if (!user.id) return;
    this.userToDelete = user;
    this.displayDeleteDialog = true;
  }

  cancelDelete(): void { this.displayDeleteDialog = false; this.userToDelete = null; }

  confirmDelete(): void {
    const user = this.userToDelete;
    if (!user?.id) return this.cancelDelete();
    this.loading = true;
    this.userService.deleteUser(user.id).subscribe({
      next: () => { this.toast('success', 'Deleted', `Deleted "${user.name}".`); this.cancelDelete(); this.loadUsers(); },
      error: (e) => { this.loading = false; this.toast('error', 'Delete failed', e?.error?.message || 'Could not delete.'); }
    });
  }

  hasPendingChanges(): boolean { return Object.keys(this.editedRows).length > 0; }

  celledited(event: any): void {
    const user: User | undefined = event?.data ?? event?.rowData;
    const field: string | undefined = event?.field ?? event?.column?.field ?? event?.columnField;
    if (!user?.id || !field) return;

    this.normalize(user, field);
    if (!this.editedRows[user.id]) {
      const original = this.clone(this.baselineUsers[user.id] ?? user);
      this.editedRows[user.id] = { original, last: { ...original } as any, events: [] };
    }
    const row = this.editedRows[user.id];
    const prev = event?.originalValue ?? event?.previousValue ?? row.last[field];
    const curr = (user as any)[field];
    row.last[field] = curr;
    if (prev !== curr) row.events.push({ field, previousValue: prev, currentValue: curr, at: new Date().toISOString() });

    const errors = this.validateUser(user);
    this.setFieldError(user.id, field, errors[field]);
    if (!this.isDirty(user.id, user)) { delete this.editedRows[user.id]; delete this.fieldErrors[user.id]; }
    this.applyLocalFilters();
  }

  savechanges(): void {
    if (this.savingChanges || this.loading) return;
    const ids = Object.keys(this.editedRows);
    if (!ids.length) return this.toast('info', 'No changes', 'No pending edits.');

    const invalid = ids.filter(id => {
      const u = this.users.find(x => x.id === id);
      if (!u) return false;
      const e = this.validateUser(u);
      if (Object.keys(e).length) { this.fieldErrors[id] = e; return true; }
      return false;
    });
    if (invalid.length) return this.toast('warn', 'Validation Error', 'Fix errors before saving.');

    this.savingChanges = this.loading = true;
    const reqs = ids.map(id => {
      const u = this.users.find(x => x.id === id);
      if (!u) return null;
      return this.userService.updateUser(id, this.prepareUpdate(u)).pipe(map(() => ({ id, ok: true as const })), catchError(err => of({ id, ok: false as const, err })));
    }).filter(Boolean) as any[];

    forkJoin(reqs).subscribe({
      next: (res: any[]) => {
        const ok = res.filter(r => r.ok).map(r => r.id);
        const fail = res.filter(r => !r.ok);
        ok.forEach(id => { delete this.editedRows[id]; delete this.fieldErrors[id]; });
        this.savingChanges = this.loading = false;
        if (!fail.length) { this.toast('success', 'Saved', `Saved ${ok.length} member(s).`); this.loadUsers(); return; }
        fail.forEach((f: any) => { const s = this.editedRows[f.id]; if (s?.original) { const i = this.users.findIndex(u => u.id === f.id); if (i > -1) this.users[i] = { ...s.original }; } });
        this.toast('error', 'Partial save', `Saved ${ok.length}. Failed ${fail.length}.`);
        this.applyLocalFilters();
      },
      error: () => { this.savingChanges = this.loading = false; this.toast('error', 'Save failed', 'Could not save.'); }
    });
  }

  toggleFilters(): void { this.showFilters = !this.showFilters; }
  clearFilters(): void { this.filterModel = { name: '', state: null, city: null, gender: null, techInterests: [] }; this.applyLocalFilters(); }

  getFilterCityOptions(): Opt[] {
    const cities = this.filterModel.state ? this.citiesByState[this.filterModel.state] || [] : Object.values(this.citiesByState).flat();
    return [{ label: 'All Cities', value: null }, ...[...new Set(cities)].sort().map(c => ({ label: c, value: c }))];
  }

  applyLocalFilters(): void {
    const { name, state, city, gender, techInterests } = this.filterModel;
    const nq = (name || '').trim().toLowerCase();
    const tq = (techInterests || []).filter(Boolean);
    if (state && city && !(this.citiesByState[state] || []).includes(city)) this.filterModel.city = null;

    this.filteredUsers = this.users.filter(u => {
      if (nq && !String(u.name || '').toLowerCase().includes(nq)) return false;
      if (state && u.state !== state) return false;
      if (city && u.city !== city) return false;
      if (gender && u.gender !== gender) return false;
      if (tq.length && !tq.some(t => (u.techInterests || []).includes(t))) return false;
      return true;
    });
  }

  onStateChange(user: User): void {
    if (!user.state) { user.city = ''; return; }
    if (user.city && !(this.citiesByState[user.state] || []).includes(user.city)) user.city = '';
  }

  cityOptions(state: string | null | undefined): { label: string; value: string }[] {
    return (state ? this.citiesByState[state] || [] : []).map(c => ({ label: c, value: c }));
  }

  private loadLocations(): void {
    this.http.get<LocationData>('assets/locations.json').subscribe({
      next: (data) => {
        const stateNames = data.states.map(s => s.stateName);
        this.citiesByState = Object.fromEntries(data.states.map(s => [s.stateName, s.cities.map(c => c.cityName)]));
        this.states = [{ label: 'Select State', value: null }, ...stateNames.map(s => ({ label: s, value: s }))];
        this.stateFilterOptions = [{ label: 'All States', value: null }, ...stateNames.map(s => ({ label: s, value: s }))];
        this.applyLocalFilters();
      },
      error: (e) => console.error('Failed to load locations', e)
    });
  }

  hasValue(v: any): boolean { return v != null && v !== '' && (typeof v !== 'string' || v.trim() !== ''); }
  formatDate(d: any): string { return this.fmtDate(d, { hour: '2-digit', minute: '2-digit' }); }
  formatDateOnly(d: any): string { return this.fmtDate(d); }
  private fmtDate(d: any, opt?: Intl.DateTimeFormatOptions): string {
    if (!this.hasValue(d)) return '-';
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? '-' : dt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', ...opt });
  }
  formatArray(arr: any): string[] { return Array.isArray(arr) ? arr : []; }
  getGenderSeverity(g: string | null | undefined): string { return g === 'Male' ? 'success' : g === 'Female' ? 'warning' : 'info'; }
  getTooltipText(t: string | null | undefined, max: number): string { return t && t.length > max ? t : ''; }
  formatCreditCard(cc: string | null | undefined): string {
    if (!cc) return '-';
    const digits = String(cc).replace(/\D/g, '');
    const last4 = digits.slice(-4);
    return last4 ? `**** **** **** ${last4}` : '-';
  }

  private normalize(u: User, field?: string): void {
    ['email', 'username', 'mobile', 'state', 'city', 'gender', 'address'].forEach(f => { if (typeof (u as any)[f] === 'string') (u as any)[f] = (u as any)[f].trim(); });
    if (u.mobile) u.mobile = String(u.mobile).replace(/\D/g, '');
    u.hobbies = Array.isArray(u.hobbies) ? u.hobbies : [];
    u.techInterests = Array.isArray(u.techInterests) ? u.techInterests : [];
    // Only process credit card when that field is edited
    if (field === 'creditCard') {
      const cc = String(u.creditCard || '').replace(/\D/g, '');
      u.creditCard = cc.length === 16 || cc.length === 4 ? cc : cc.length > 0 ? cc.slice(-4) : this.baselineUsers[u.id!]?.creditCard || '';
    }
  }

  validateUser(u: User): { [k: string]: string } {
    const e: { [k: string]: string } = {};
    const str = (v: any) => (v == null ? '' : String(v).trim());
    const email = str(u.email), username = str(u.username), mobile = str(u.mobile).replace(/\D/g, ''), cc = str(u.creditCard).replace(/\D/g, ''), addr = str(u.address);

    if (!email) e['email'] = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e['email'] = 'Invalid email';
    else if (!email.toLowerCase().endsWith('.com')) e['email'] = 'Must end with .com';

    if (!username) e['username'] = 'Username is required';
    else if (username.length < 4 || username.length > 20) e['username'] = '4-20 characters';
    else if (!/^[a-zA-Z0-9._-]+$/.test(username)) e['username'] = 'Letters, numbers, _, -, . only';

    if (!mobile) e['mobile'] = 'Mobile required';
    else if (mobile.length !== 10) e['mobile'] = '10 digits required';

    if (!cc) e['creditCard'] = 'Credit card required';
    else if (cc.length !== 4 && cc.length !== 16) e['creditCard'] = '4 or 16 digits';

    if (!str(u.state)) e['state'] = 'State required';
    if (!str(u.city)) e['city'] = 'City required';
    if (!str(u.gender)) e['gender'] = 'Gender required';
    if (!(u.hobbies || []).length) e['hobbies'] = 'Select hobby';
    if (!(u.techInterests || []).length) e['techInterests'] = 'Select tech';
    if (!u.dob) e['dob'] = 'DOB required';
    else if (isNaN(new Date(u.dob).getTime())) e['dob'] = 'Invalid date';
    if (addr && !/^[a-zA-Z0-9\s,._-]*$/.test(addr)) e['address'] = 'Invalid characters';
    return e;
  }

  getFieldError(id: string | undefined, f: string): string { return id ? this.fieldErrors[id]?.[f] || '' : ''; }
  hasFieldError(id: string | undefined, f: string): boolean { return !!this.getFieldError(id, f); }

  onFieldBlur(u: User, f: string): void {
    if (!u.id) return;
    const e = this.validateUser(u);
    if (!this.fieldErrors[u.id]) this.fieldErrors[u.id] = {};
    if (e[f]) this.fieldErrors[u.id][f] = e[f]; else delete this.fieldErrors[u.id][f];
    if (!Object.keys(this.fieldErrors[u.id]).length) delete this.fieldErrors[u.id];
  }

  private prepareUpdate(u: User): any {
    const dob = u.dob ? new Date(u.dob) : null;
    const fmtDob = dob && !isNaN(dob.getTime()) ? `${dob.getFullYear()}-${String(dob.getMonth() + 1).padStart(2, '0')}-${String(dob.getDate()).padStart(2, '0')}` : null;
    return { name: u.name, username: u.username, email: u.email, mobile: u.mobile, creditCard: u.creditCard, state: u.state, city: u.city, gender: u.gender, hobbies: u.hobbies || [], techInterests: u.techInterests || [], address: u.address || '', dob: fmtDob };
  }

  private clone(u: User): User { return JSON.parse(JSON.stringify(u)); }
  private setFieldError(id: string, f: string, msg?: string): void {
    if (!this.fieldErrors[id]) this.fieldErrors[id] = {};
    if (msg) this.fieldErrors[id][f] = msg; else delete this.fieldErrors[id][f];
    if (!Object.keys(this.fieldErrors[id]).length) delete this.fieldErrors[id];
  }
  private isDirty(id: string, curr: User): boolean {
    const orig = this.editedRows[id]?.original;
    return orig ? JSON.stringify(this.prepareUpdate(orig)) !== JSON.stringify(this.prepareUpdate(curr)) : false;
  }
  private toast(sev: string, sum: string, det: string): void { this.messageService.add({ severity: sev, summary: sum, detail: det, life: 3000 }); }
}
