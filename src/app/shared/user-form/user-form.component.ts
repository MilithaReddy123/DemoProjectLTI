import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { User } from '../../models/user.model';

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

  states = [
    { label: 'Select State', value: null },
    { label: 'Telangana', value: 'Telangana' },
    { label: 'Andhra Pradesh', value: 'Andhra Pradesh' }
  ];

  allCities = [
    {
      state: 'Telangana',
      cities: ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar']
    },
    {
      state: 'Andhra Pradesh',
      cities: ['Vijayawada', 'Visakhapatnam', 'Guntur', 'Tirupati']
    }
  ];

  cities: { label: string; value: string }[] = [];

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

  constructor(private fb: FormBuilder, private userService: UserService) {}

  ngOnInit(): void {
    this.buildForm();
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

  private patchForm(): void {
    if (this.user) {
      // Load cities for the user's state first
      if (this.user.state) {
        this.onStateChange(this.user.state);
      }

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
    const match = this.allCities.find((x) => x.state === state);
    this.cities = match ? match.cities.map((c) => ({ label: c, value: c })) : [];
    
    // Only clear city if state changed and current city is not in new list
    const currentCity = this.userForm.get('city')?.value;
    if (currentCity && !this.cities.find(c => c.value === currentCity)) {
      this.userForm.get('city')?.setValue(null);
    }
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  async onSubmit(): Promise<void> {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    this.submitting = true;

    try {
      const formValue = this.userForm.value;

      if (this.user && this.user.id) {
        // Edit mode - send all fields except password
        await this.userService
          .updateUser(this.user.id, {
            name: formValue.name,
            email: formValue.email,
            mobile: formValue.mobile,
            state: formValue.state,
            city: formValue.city,
            gender: formValue.gender,
            hobbies: formValue.hobbies,
            techInterests: formValue.techInterests,
            address: formValue.address
          })
          .toPromise();
      } else {
        // Add mode - send all fields including password
        console.log('Submitting form data:', {
          ...formValue,
          password: '***hidden***',
          confirmPassword: '***hidden***'
        });
        await this.userService.addUser(formValue).toPromise();
      }

      this.saved.emit();
    } catch (err: any) {
      console.error('Failed to save user', err);
      alert(err?.error?.message || 'Failed to save user. Please check all required fields.');
    } finally {
      this.submitting = false;
    }
  }
}


