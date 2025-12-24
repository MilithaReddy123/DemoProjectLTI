import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { User } from '../../models/user.model';

type DropdownOption<T> = { label: string; value: T };

interface LocationData {
  states: string[];
  citiesByState: Record<string, string[]>;
}

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

  states: DropdownOption<string | null>[] = [{ label: 'Select State', value: null }];
  cities: DropdownOption<string>[] = [];
  private citiesByState: Record<string, string[]> = {};
  private locationsLoaded = false;

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

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.loadLocations();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['user'] && this.userForm) {
      this.patchForm();
    }
  }

  private buildForm(): void {
    this.userForm = this.fb.group(
      {
        name: ['', [Validators.required, Validators.minLength(2)]],
        email: ['', [Validators.required, Validators.email]],
        mobile: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
        creditCard: ['', [Validators.required, Validators.pattern(/^\d{16}$/)]],
        state: [null, Validators.required],
        city: [null, Validators.required],
        gender: ['Male', Validators.required],
        hobbies: [[], Validators.required],
        techInterests: [[], Validators.required],
        address: [''],
        username: [
          '',
          [Validators.required, Validators.pattern(/^[a-zA-Z0-9._-]{4,20}$/)]
        ],
        password: [
          '',
          [
            Validators.required,
            Validators.minLength(8),
            Validators.pattern(
              /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).+$/
            )
          ]
        ],
        confirmPassword: ['', Validators.required],
        dob: ['', Validators.required]
      },
      { validators: this.passwordsMatchValidator }
    );

    this.userForm.get('state')?.valueChanges.subscribe((state) => {
      this.onStateChange(state);
    });

    this.patchForm();
  }

  private loadLocations(): void {
    this.http.get<LocationData>('assets/locations.json').subscribe({
      next: (data) => {
        this.citiesByState = data.citiesByState ?? {};
        this.states = [
          { label: 'Select State', value: null },
          ...(data.states ?? []).map((s) => ({ label: s, value: s }))
        ];
        this.locationsLoaded = true;

        // If a state is already selected (edit mode / patched value), refresh city list now.
        const currentState = this.userForm?.get('state')?.value;
        if (currentState) {
          this.onStateChange(currentState);
        }
      },
      error: (err) => {
        console.error('Failed to load locations.json', err);
        this.locationsLoaded = true; // prevent blocking state changes forever
      }
    });
  }

  private patchForm(): void {
    if (this.user) {
      // Format date for input type="date"
      let formattedDob = this.user.dob;
      if (this.user.dob) {
        const dobDate = new Date(this.user.dob);
        formattedDob = dobDate.toISOString().split('T')[0];
      }

      // Then patch all form values including credit card
      this.userForm.patchValue({
        name: this.user.name,
        email: this.user.email,
        mobile: this.user.mobile,
        creditCard: this.user.creditCard || '',
        state: this.user.state,
        city: this.user.city,
        gender: this.user.gender,
        hobbies: this.user.hobbies || [],
        techInterests: this.user.techInterests || [],
        address: this.user.address || '',
        username: this.user.username,
        dob: formattedDob
      });

      // Refresh cities after patching (guarded until locations are loaded)
      if (this.user.state) {
        this.onStateChange(this.user.state);
      }

      // Password is not required for editing
      this.userForm.get('password')?.clearValidators();
      this.userForm.get('password')?.updateValueAndValidity();
      this.userForm.get('confirmPassword')?.clearValidators();
      this.userForm.get('confirmPassword')?.updateValueAndValidity();
    } else {
      this.userForm.reset({
        gender: 'Male',
        hobbies: [],
        techInterests: []
      });
    }
  }

  private passwordsMatchValidator(group: FormGroup) {
    const pwd = group.get('password')?.value;
    const cpwd = group.get('confirmPassword')?.value;
    if (!pwd && !cpwd) {
      return null;
    }
    return pwd === cpwd ? null : { mismatch: true };
  }

  get f(): any {
    return this.userForm.controls;
  }

  get isEditMode(): boolean {
    return this.user !== null && this.user.id !== undefined;
  }

  onStateChange(state: string): void {
    if (!this.locationsLoaded) {
      return;
    }

    const citiesForState = this.citiesByState?.[state] ?? [];
    this.cities = citiesForState.map((c) => ({ label: c, value: c }));

    // Only clear city if state changed and current city is not in new list
    const currentCity = this.userForm.get('city')?.value;
    if (currentCity && !this.cities.find((c) => c.value === currentCity)) {
      this.userForm.get('city')?.setValue(null);
    }
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  onSubmit(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    this.submitting = true;
    const formValue = this.userForm.value;
    const userData = this.user && this.user.id
      ? { name: formValue.name, email: formValue.email, mobile: formValue.mobile, creditCard: formValue.creditCard, state: formValue.state, city: formValue.city, gender: formValue.gender, hobbies: formValue.hobbies, techInterests: formValue.techInterests, address: formValue.address, dob: formValue.dob }
      : formValue;
    
    const request = this.user && this.user.id
      ? this.userService.updateUser(this.user.id, userData)
      : this.userService.addUser(userData);

    request.subscribe({
      next: () => {
        this.saved.emit();
        this.submitting = false;
      },
      error: (err: any) => {
        console.error('Failed to save user', err);
        alert(err?.error?.message || 'Failed to save user. Please check all required fields.');
        this.submitting = false;
      }
    });
  }
}


