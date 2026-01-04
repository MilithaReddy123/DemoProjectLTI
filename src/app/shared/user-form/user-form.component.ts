import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { User } from '../../models/user.model';
import { HttpClient } from '@angular/common/http';

interface City { cityName: string; cityCode: string; }
interface StateData { stateName: string; stateCode: string; cities: City[]; }
interface LocationData { states: StateData[]; }
type Opt<T = string> = { label: string; value: T };

@Component({
  selector: 'app-user-form',
  templateUrl: './user-form.component.html'
})
export class UserFormComponent implements OnInit, OnChanges {
  @Input() user: User | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  userForm!: FormGroup;
  submitting = false;
  todayDateStr = new Date().toISOString().split('T')[0];
  states: Opt<string | null>[] = [{ label: 'Select State', value: null }];
  cities: Opt<string>[] = [];
  private citiesByState: Record<string, string[]> = {};
  private locationsLoaded = false;
  hobbiesOptions = ['Reading', 'Music', 'Sports'].map(h => ({ label: h, value: h }));
  techOptions = ['Angular', 'React', 'Node.js', 'Java'].map(t => ({ label: t, value: t }));

  constructor(private fb: FormBuilder, private userService: UserService, private http: HttpClient) {}

  ngOnInit(): void { this.buildForm(); this.loadLocations(); }

  ngOnChanges(changes: SimpleChanges): void { if (changes['user'] && this.userForm) this.patchForm(); }

  private buildForm(): void {
    const arrValidator = (c: any) => (!c.value || !Array.isArray(c.value) || !c.value.length) ? { required: true } : null;
    this.userForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), (c: any) => c.value && /\d/.test(c.value) ? { hasNumbers: true } : null]],
      email: ['', [Validators.required, Validators.email, (c: any) => c.value && !c.value.trim().endsWith('.com') ? { mustEndWithCom: true } : null]],
      mobile: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      creditCard: ['', [Validators.required, Validators.pattern(/^\d{16}$/)]],
      state: [null, Validators.required],
      city: [null, Validators.required],
      gender: ['Male', Validators.required],
      hobbies: [[], [Validators.required, arrValidator]],
      techInterests: [[], [Validators.required, arrValidator]],
      address: ['', [Validators.pattern(/^[a-zA-Z0-9\s,._-]*$/)]],
      username: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9._-]{4,20}$/)]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).+$/)]],
      confirmPassword: ['', Validators.required],
      dob: ['', Validators.required]
    }, { validators: (g: FormGroup) => { const p = g.get('password')?.value, c = g.get('confirmPassword')?.value; return !p && !c ? null : p === c ? null : { mismatch: true }; } });

    this.userForm.get('state')?.valueChanges.subscribe(s => this.onStateChange(s));
    this.patchForm();
  }

  private loadLocations(): void {
    this.http.get<LocationData>('assets/locations.json').subscribe({
      next: (data) => {
        this.citiesByState = Object.fromEntries(data.states.map(s => [s.stateName, s.cities.map(c => c.cityName)]));
        this.states = [{ label: 'Select State', value: null }, ...data.states.map(s => ({ label: s.stateName, value: s.stateName }))];
        this.locationsLoaded = true;
        const curr = this.userForm?.get('state')?.value;
        if (curr) this.onStateChange(curr);
      },
      error: (e) => { console.error('Failed to load locations', e); this.locationsLoaded = true; }
    });
  }

  private patchForm(): void {
    if (this.user) {
      const dob = this.user.dob ? new Date(this.user.dob).toISOString().split('T')[0] : '';
      this.userForm.patchValue({ ...this.user, creditCard: this.user.creditCard || '', hobbies: this.user.hobbies || [], techInterests: this.user.techInterests || [], address: this.user.address || '', dob });
      if (this.user.state) this.onStateChange(this.user.state);
      ['password', 'confirmPassword'].forEach(f => { this.userForm.get(f)?.clearValidators(); this.userForm.get(f)?.updateValueAndValidity(); });
    } else {
      this.userForm.reset({ gender: 'Male', hobbies: [], techInterests: [] });
    }
  }

  get f(): any { return this.userForm.controls; }
  get isEditMode(): boolean { return !!this.user?.id; }

  onStateChange(state: string): void {
    if (!this.locationsLoaded) return;
    this.cities = (this.citiesByState[state] || []).map(c => ({ label: c, value: c }));
    const curr = this.userForm.get('city')?.value;
    if (curr && !this.cities.find(c => c.value === curr)) this.userForm.get('city')?.setValue(null);
  }

  onCancel(): void { this.cancelled.emit(); }

  onSubmit(): void {
    if (this.userForm.invalid) { this.userForm.markAllAsTouched(); return; }
    this.submitting = true;
    const v = this.userForm.value;
    const data = this.user?.id ? { name: v.name, email: v.email, mobile: v.mobile, creditCard: v.creditCard, state: v.state, city: v.city, gender: v.gender, hobbies: v.hobbies, techInterests: v.techInterests, address: v.address, dob: v.dob } : v;
    const req = this.user?.id ? this.userService.updateUser(this.user.id, data) : this.userService.addUser(data);
    req.subscribe({ next: () => { this.saved.emit(); this.submitting = false; }, error: (e) => { alert(e?.error?.message || 'Save failed.'); this.submitting = false; } });
  }
}
