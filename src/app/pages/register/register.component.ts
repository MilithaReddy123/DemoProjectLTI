import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
})
export class RegisterComponent {
  registerForm: FormGroup;
  loading = false;
  errorMessage = '';
  successMessage = '';
  private apiUrl = 'http://localhost:3000/api';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private http: HttpClient,
  ) {
    this.registerForm = this.fb.group(
      {
        name: [
          '',
          [
            Validators.required,
            Validators.minLength(2),
            Validators.pattern(/^[a-zA-Z\s]+$/),
          ],
        ],
        username: [
          '',
          [Validators.required, Validators.pattern(/^[a-zA-Z0-9_@]{4,20}$/)],
        ],
        email: ['', [Validators.required, this.emailValidator]],
        password: [
          '',
          [
            Validators.required,
            Validators.minLength(8),
            Validators.pattern(
              /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).+$/,
            ),
          ],
        ],
        confirmPassword: ['', Validators.required],
      },
      { validators: this.passwordsMatchValidator },
    );
  }

  // Custom email validator to check for valid TLD (including .com, .org, .net, etc.)
  emailValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null; // Let required validator handle empty values
    }

    // Check basic email format
    const basicEmailPattern = /^[^\s@]+@[^\s@]+$/;
    if (!basicEmailPattern.test(control.value)) {
      return { invalidEmail: true };
    }

    // Check for valid TLD (at least 2 characters, e.g., .com, .org, .net)
    const tldPattern = /\.[a-zA-Z]{2,}$/;
    if (!tldPattern.test(control.value)) {
      return { invalidTld: true };
    }

    return null;
  }

  passwordsMatchValidator(control: AbstractControl) {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;

    if (!password || !confirmPassword) {
      return null;
    }

    return password === confirmPassword ? null : { mismatch: true };
  }

  get f(): any {
    return this.registerForm.controls;
  }

  onSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const { name, username, email, password } = this.registerForm.value;

    this.http
      .post(`${this.apiUrl}/register`, { name, username, email, password })
      .subscribe({
        next: (res: any) => {
          // store current user for downloads (cover sheet "Downloaded by")
          if (res?.user)
            localStorage.setItem('current_user', JSON.stringify(res.user));
          this.successMessage =
            'Registration successful! Redirecting to home...';
          this.loading = false;

          setTimeout(() => {
            this.router.navigate(['/home']);
          }, 1500);
        },
        error: (err: any) => {
          this.errorMessage =
            err?.error?.message ||
            'Registration failed. Username or email might already exist or data is invalid.';
          this.loading = false;
        },
      });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
