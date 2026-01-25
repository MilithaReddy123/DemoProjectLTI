import { Component, OnInit, Output, EventEmitter, ViewChild } from '@angular/core';
import { UserService } from '../../../services/user.service';
import { User } from '../../../models/user.model';
import { Table } from 'primeng/table';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../../services/toast.service';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

interface City {
  cityName: string;
  cityCode: string;
}

interface StateData {
  stateName: string;
  stateCode: string;
  cities: City[];
}

interface LocationData {
  states: StateData[];
}

type Opt<T = string> = { label: string; value: T | null };

@Component({
  selector: 'app-members-table',
  templateUrl: './members-table.component.html',
  styleUrls: ['./members-table.component.css'],
})
export class MembersTableComponent implements OnInit {
  @ViewChild('dt') dt!: Table;
  @Output() openAdd = new EventEmitter<void>();

  users: User[] = [];
  filteredUsers: User[] = [];
  showFilters = false;
  todayDate = new Date();
  stateFilterOptions: Opt[] = [{ label: 'All States', value: null }];
  genderFilterOptions: Opt[] = [{ label: 'All Genders', value: null }];
  filterModel = {
    name: '',
    state: null as string | null,
    city: null as string | null,
    gender: null as string | null,
    techInterests: [] as string[],
  };
  private baselineUsers: Record<string, User> = {};
  displayDeleteDialog = false;
  userToDelete: User | null = null;
  loading = false;
  totalRecords = 0;
  pageSize = 10;
  pageOffset = 0;
  pagerVisible = false;
  fieldErrors: Record<string, Record<string, string>> = {};
  savingChanges = false;
  editedRows: Record<string, { original: User; last: Record<string, any> }> = {};
  states: Opt[] = [{ label: 'Select State', value: null }];
  citiesByState: Record<string, string[]> = {};
  hobbiesOptions = ['Reading', 'Music', 'Sports'].map((h) => ({
    label: h,
    value: h,
  }));
  techOptions = ['Angular', 'React', 'Node.js', 'Java'].map((t) => ({
    label: t,
    value: t,
  }));
  genders = ['Male', 'Female', 'Other'];
  genderOptions = this.genders.map((g) => ({ label: g, value: g }));

  constructor(
    private userService: UserService,
    private http: HttpClient,
    private toastService: ToastService,
  ) {
    this.genderFilterOptions = [
      { label: 'All Genders', value: null },
      ...this.genderOptions,
    ];
  }

  ngOnInit(): void {
    this.loadUsers();
    this.loadLocations();
  }

  loadUsers(): void {
    this.loading = true;
    this.userService.getUsers(this.pageSize, this.pageOffset).subscribe({
      next: (res) => {
        const data = res?.items || [];
        this.totalRecords = Number(res?.total) || 0;
        this.users = data;
        this.baselineUsers = Object.fromEntries(
          data.filter((u) => u.id).map((u) => [u.id!, this.clone(u)]),
        );
        this.applyLocalFilters();
        this.loading = false;
      },
      error: () => {
        this.filteredUsers = [];
        this.loading = false;
      },
    });
  }

  onPageChange(e: any): void {
    if (this.hasPendingChanges()) {
      this.toastService.show(
        'warn',
        'Unsaved changes',
        'Save changes before changing pages.',
      );
      return;
    }
    this.pageSize = Number(e?.rows) || this.pageSize;
    this.pageOffset = Number(e?.first) || 0;
    this.loadUsers();
  }

  togglePager(): void {
    this.pagerVisible = !this.pagerVisible;
  }

  closePager(): void {
    this.pagerVisible = false;
  }

  onPagerDragEnded(event: any): void {
    const el = event.source.element.nativeElement;
    const rect = el.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    let left = rect.left;
    let top = rect.top;
    if (left < 0) left = 0;
    if (left + rect.width > viewportWidth) left = viewportWidth - rect.width;
    if (top < 0) top = 0;
    if (top + rect.height > viewportHeight) top = viewportHeight - rect.height;
    if (left !== rect.left || top !== rect.top) {
      el.style.left = left + 'px';
      el.style.top = top + 'px';
      el.style.right = 'auto';
      el.style.bottom = 'auto';
    }
  }

  pageRangeStart(): number {
    return this.totalRecords ? this.pageOffset + 1 : 0;
  }

  pageRangeEnd(): number {
    return Math.min(this.pageOffset + this.pageSize, this.totalRecords);
  }

  deleteUser(user: User): void {
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
      return this.cancelDelete();
    }
    this.loading = true;
    this.userService.deleteUser(user.id).subscribe({
      next: () => {
        this.toastService.show('success', 'Deleted', `Deleted "${user.name}".`);
        this.cancelDelete();
        this.loadUsers();
      },
      error: (e) => {
        this.loading = false;
        this.toastService.show(
          'error',
          'Delete failed',
          e?.error?.message || 'Could not delete.',
        );
      },
    });
  }

  hasPendingChanges(): boolean {
    return Object.keys(this.editedRows).length > 0;
  }

  celledited(event: any): void {
    const user: User | undefined = event?.data ?? event?.rowData;
    const field: string | undefined =
      event?.field ?? event?.column?.field ?? event?.columnField;
    if (!user?.id || !field) return;

    this.normalize(user, field);
    if (!this.editedRows[user.id]) {
      const original = this.clone(this.baselineUsers[user.id] ?? user);
      this.editedRows[user.id] = { original, last: { ...original } as any };
    }
    const row = this.editedRows[user.id];
    const prev =
      event?.originalValue ?? event?.previousValue ?? row.last[field];
    const curr = (user as any)[field];
    row.last[field] = curr;

    const errors = this.validateUser(user);
    this.setFieldError(user.id, field, errors[field]);
    if (!this.isDirty(user.id, user)) {
      delete this.editedRows[user.id];
      delete this.fieldErrors[user.id];
    }
    this.applyLocalFilters();
  }

  savechanges(): void {
    if (this.savingChanges || this.loading) return;
    const ids = Object.keys(this.editedRows);
    if (!ids.length) {
      this.toastService.show('info', 'No changes', 'No pending edits.');
      return;
    }

    const invalid = ids.filter((id) => {
      const u = this.users.find((x) => x.id === id);
      if (!u) return false;
      const e = this.validateUser(u);
      if (Object.keys(e).length) {
        this.fieldErrors[id] = e;
        return true;
      }
      return false;
    });
    if (invalid.length) {
      this.toastService.show(
        'warn',
        'Validation Error',
        'Fix errors before saving.',
      );
      return;
    }

    this.savingChanges = this.loading = true;
    const reqs = ids
      .map((id) => {
        const u = this.users.find((x) => x.id === id);
        if (!u) return null;
        return this.userService.updateUser(id, this.prepareUpdate(u)).pipe(
          map(() => ({ id, ok: true as const })),
          catchError((err) => of({ id, ok: false as const, err })),
        );
      })
      .filter(Boolean) as any[];

    forkJoin(reqs).subscribe({
      next: (res: any[]) => {
        const ok = res.filter((r) => r.ok).map((r) => r.id);
        const fail = res.filter((r) => !r.ok);
        ok.forEach((id) => {
          delete this.editedRows[id];
          delete this.fieldErrors[id];
        });
        this.savingChanges = this.loading = false;
        if (!fail.length) {
          this.toastService.show(
            'success',
            'Saved',
            `Saved ${ok.length} member(s).`,
          );
          this.loadUsers();
          return;
        }
        fail.forEach((f: any) => {
          const s = this.editedRows[f.id];
          if (s?.original) {
            const i = this.users.findIndex((u) => u.id === f.id);
            if (i > -1) {
              this.users[i] = { ...s.original };
            }
          }
        });
        this.toastService.show(
          'error',
          'Partial save',
          `Saved ${ok.length}. Failed ${fail.length}.`,
        );
        this.applyLocalFilters();
      },
      error: () => {
        this.savingChanges = this.loading = false;
        this.toastService.show('error', 'Save failed', 'Could not save.');
      },
    });
  }

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  clearFilters(): void {
    this.filterModel = {
      name: '',
      state: null,
      city: null,
      gender: null,
      techInterests: [],
    };
    this.applyLocalFilters();
  }

  getFilterCityOptions(): Opt[] {
    const cities = this.filterModel.state
      ? this.citiesByState[this.filterModel.state] || []
      : Object.values(this.citiesByState).flat();
    return [
      { label: 'All Cities', value: null },
      ...[...new Set(cities)].sort().map((c) => ({ label: c, value: c })),
    ];
  }

  applyLocalFilters(): void {
    const { name, state, city, gender, techInterests } = this.filterModel;
    const nq = (name || '').trim().toLowerCase();
    const tq = (techInterests || []).filter(Boolean);
    if (state && city && !(this.citiesByState[state] || []).includes(city)) {
      this.filterModel.city = null;
    }

    this.filteredUsers = this.users.filter((u) => {
      if (
        nq &&
        !String(u.name || '')
          .toLowerCase()
          .includes(nq)
      ) {
        return false;
      }
      if (state && u.state !== state) return false;
      if (city && u.city !== city) return false;
      if (gender && u.gender !== gender) return false;
      if (tq.length && !tq.some((t) => (u.techInterests || []).includes(t))) {
        return false;
      }
      return true;
    });
  }

  onStateChange(user: User): void {
    if (!user.state) {
      user.city = '';
      return;
    }
    if (
      user.city &&
      !(this.citiesByState[user.state] || []).includes(user.city)
    ) {
      user.city = '';
    }
  }

  cityOptions(
    state: string | null | undefined,
  ): { label: string; value: string }[] {
    const list = state ? this.citiesByState[state] || [] : [];
    return list.map((c) => ({ label: c, value: c }));
  }

  private loadLocations(): void {
    this.http.get<LocationData>('assets/locations.json').subscribe({
      next: (data) => {
        const stateNames = data.states.map((s) => s.stateName);
        this.citiesByState = Object.fromEntries(
          data.states.map((s) => [
            s.stateName,
            s.cities.map((c) => c.cityName),
          ]),
        );
        this.states = [
          { label: 'Select State', value: null },
          ...stateNames.map((s) => ({ label: s, value: s })),
        ];
        this.stateFilterOptions = [
          { label: 'All States', value: null },
          ...stateNames.map((s) => ({ label: s, value: s })),
        ];
        this.applyLocalFilters();
      },
      error: (e) => {
        console.error('Failed to load locations', e);
      },
    });
  }

  hasValue(v: any): boolean {
    return v != null && v !== '' && (typeof v !== 'string' || v.trim() !== '');
  }

  formatDateOnly(d: any): string {
    if (!this.hasValue(d)) return '-';
    if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}/.test(d)) {
      return d.split('T')[0];
    }
    return '-';
  }

  formatArray(arr: any): string[] {
    return Array.isArray(arr) ? arr : [];
  }

  getGenderSeverity(g: string | null | undefined): string {
    return g === 'Male' ? 'success' : g === 'Female' ? 'warning' : 'info';
  }

  getTooltipText(t: string | null | undefined, max: number): string {
    return t && t.length > max ? t : '';
  }

  formatCreditCard(cc: string | null | undefined): string {
    if (!cc) return '-';
    const digits = String(cc).replace(/\D/g, '');
    const last4 = digits.slice(-4);
    return last4 ? `**** **** **** ${last4}` : '-';
  }

  private normalize(u: User, field?: string): void {
    [
      'email',
      'username',
      'mobile',
      'state',
      'city',
      'gender',
      'address',
    ].forEach((f) => {
      if (typeof (u as any)[f] === 'string') {
        (u as any)[f] = (u as any)[f].trim();
      }
    });
    if (u.mobile) {
      u.mobile = String(u.mobile).replace(/\D/g, '');
    }
    u.hobbies = Array.isArray(u.hobbies) ? u.hobbies : [];
    u.techInterests = Array.isArray(u.techInterests) ? u.techInterests : [];
    if (field === 'creditCard') {
      const cc = String(u.creditCard || '').replace(/\D/g, '');
      u.creditCard =
        cc.length === 16 || cc.length === 4
          ? cc
          : cc.length > 0
            ? cc.slice(-4)
            : this.baselineUsers[u.id!]?.creditCard || '';
    }
  }

  validateUser(u: User): { [k: string]: string } {
    const e: { [k: string]: string } = {};
    const str = (v: any) => (v == null ? '' : String(v).trim());
    const email = str(u.email);
    const username = str(u.username);
    const mobile = str(u.mobile).replace(/\D/g, '');
    const cc = str(u.creditCard).replace(/\D/g, '');
    const addr = str(u.address);

    if (!email) e['email'] = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(email))
      e['email'] = 'Invalid email format';

    if (!username) e['username'] = 'Username is required';
    else if (username.length < 4 || username.length > 20)
      e['username'] = 'Username must be 4-20 characters';
    else if (!/^[a-zA-Z0-9._-]{4,20}$/.test(username))
      e['username'] =
        'Username must be 4-20 characters (letters, numbers, _, -, . only)';

    if (!mobile) e['mobile'] = 'Mobile required';
    else if (mobile.length !== 10) e['mobile'] = '10 digits required';

    if (!cc) e['creditCard'] = 'Credit card required';
    else if (cc.length !== 4 && cc.length !== 16)
      e['creditCard'] = '4 or 16 digits';

    if (!str(u.state)) e['state'] = 'State required';
    if (!str(u.city)) e['city'] = 'City required';
    if (!str(u.gender)) e['gender'] = 'Gender required';
    if (!(u.hobbies || []).length) e['hobbies'] = 'Select hobby';
    if (!(u.techInterests || []).length) e['techInterests'] = 'Select tech';
    if (!u.dob) e['dob'] = 'DOB required';
    else if (isNaN(new Date(u.dob).getTime())) e['dob'] = 'Invalid date';
    if (addr && !/^[a-zA-Z0-9\s,._-]*$/.test(addr))
      e['address'] = 'Invalid characters';
    return e;
  }

  getFieldError(id: string | undefined, f: string): string {
    return id ? this.fieldErrors[id]?.[f] || '' : '';
  }

  hasFieldError(id: string | undefined, f: string): boolean {
    return !!this.getFieldError(id, f);
  }

  private prepareUpdate(u: User): any {
    let fmtDob = null;
    if (u.dob) {
      if (typeof u.dob === 'string' && /^\d{4}-\d{2}-\d{2}/.test(u.dob)) {
        fmtDob = u.dob.split('T')[0];
      } else {
        const d = u.dob instanceof Date ? u.dob : new Date(u.dob);
        if (!isNaN(d.getTime())) {
          fmtDob = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        }
      }
    }
    return {
      name: u.name,
      username: u.username,
      email: u.email,
      mobile: u.mobile,
      creditCard: u.creditCard,
      state: u.state,
      city: u.city,
      gender: u.gender,
      hobbies: u.hobbies || [],
      techInterests: u.techInterests || [],
      address: u.address || '',
      dob: fmtDob,
    };
  }

  private clone(u: User): User {
    return JSON.parse(JSON.stringify(u));
  }

  private setFieldError(id: string, f: string, msg?: string): void {
    if (!this.fieldErrors[id]) {
      this.fieldErrors[id] = {};
    }
    if (msg) {
      this.fieldErrors[id][f] = msg;
    } else {
      delete this.fieldErrors[id][f];
    }
    if (!Object.keys(this.fieldErrors[id]).length) {
      delete this.fieldErrors[id];
    }
  }

  private isDirty(id: string, curr: User): boolean {
    const orig = this.editedRows[id]?.original;
    return orig
      ? JSON.stringify(this.prepareUpdate(orig)) !==
          JSON.stringify(this.prepareUpdate(curr))
      : false;
  }
}
