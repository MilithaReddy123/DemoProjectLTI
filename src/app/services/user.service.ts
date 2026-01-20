import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models/user.model';

export type UsersPage = { items: User[]; total: number; limit: number; offset: number };

@Injectable({ providedIn: 'root' })
export class UserService {
  private baseUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  getUsers(limit = 10, offset = 0): Observable<UsersPage> {
    const params: any = { limit: String(limit), offset: String(offset) };
    return this.http.get<UsersPage>(`${this.baseUrl}/users`, { params });
  }

  getUserById(id: string): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/users/${id}`);
  }

  addUser(user: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/users`, user);
  }

  updateUser(id: string, user: Partial<User>): Observable<any> {
    return this.http.put(`${this.baseUrl}/users/${id}`, user);
  }

  deleteUser(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/users/${id}`);
  }

  downloadUsersTemplate(mode: 'blank' | 'data', downloadedBy: string): Observable<Blob> {
    const params: any = { mode, downloadedBy };
    return this.http.get(`${this.baseUrl}/users/excel-template`, { params, responseType: 'blob' }) as any;
  }

  validateBulkExcel(file: File): Observable<any> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post(`${this.baseUrl}/users/bulk`, fd, { params: { dryRun: 'true' } });
  }

  uploadBulkExcel(file: File): Observable<any> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post(`${this.baseUrl}/users/bulk`, fd, { params: { dryRun: 'false' } });
  }

  // Chart data endpoints
  getStateDistribution(): Observable<{ label: string; value: number }[]> {
    return this.http.get<{ label: string; value: number }[]>(`${this.baseUrl}/users/charts/state`);
  }

  getHobbiesDistribution(): Observable<{ label: string; value: number }[]> {
    return this.http.get<{ label: string; value: number }[]>(`${this.baseUrl}/users/charts/hobbies`);
  }

  getTechInterestsDistribution(): Observable<{ label: string; value: number }[]> {
    return this.http.get<{ label: string; value: number }[]>(`${this.baseUrl}/users/charts/tech-interests`);
  }
}


