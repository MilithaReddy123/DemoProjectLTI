import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html'
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  loading = false;
  errorMessage = '';
  returnUrl = '/home';
  private apiUrl = 'http://localhost:3000/api';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private http: HttpClient
  ) {
    this.loginForm = this.fb.group({
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
      ]
    });
  }

  ngOnInit(): void {
    this.returnUrl = '/home';
  }

  get f(): any {
    return this.loginForm.controls;
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const { username, password } = this.loginForm.value;
    this.http.post(`${this.apiUrl}/login`, { username, password }).subscribe({
      next: (res: any) => {
        // store current user for downloads (cover sheet "Downloaded by")
        if (res?.user) localStorage.setItem('current_user', JSON.stringify(res.user));
        this.router.navigate([this.returnUrl]);
        this.loading = false;
      },
      error: (err: any) => {
        this.errorMessage = err?.error?.message || 'Invalid username or password';
        this.loading = false;
      }
    });
  }
}


