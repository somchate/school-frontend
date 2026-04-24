import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoginRequest, LoginResponse, User } from '../models/auth.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = environment.apiUrl;
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;

  constructor(private http: HttpClient) {
    const storedUser = localStorage.getItem('currentUser');
    this.currentUserSubject = new BehaviorSubject<User | null>(
      storedUser ? JSON.parse(storedUser) : null
    );
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  login(loginRequest: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/auth/login`, loginRequest)
      .pipe(
        tap(response => {
          if (response.success && response.token && response.user) {
            localStorage.setItem('token', response.token);
            localStorage.setItem('currentUser', JSON.stringify(response.user));
            this.currentUserSubject.next(response.user);
          }
        })
      );
  }

  thaidLogin(pid: string, token?: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/auth/thaid-login`, { pid, token: token || '' })
      .pipe(
        tap(response => {
          if (response.success && response.token && response.user) {
            localStorage.setItem('token', response.token);
            localStorage.setItem('currentUser', JSON.stringify(response.user));
            this.currentUserSubject.next(response.user);
          }
        })
      );
  }

  // ออกจากระบบ (จาก logout.jsp: processLogout → invalidate session → redirect login)
  logout(): void {
    const token = this.getToken();
    // เรียก backend เพื่อ invalidate session (จาก bean.processLogout + session.invalidate ใน logout.jsp)
    if (token) {
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
      this.http.post(`${this.API_URL}/auth/logout`, {}, { headers }).subscribe({
        next: () => {},
        error: () => {}
      });
    }
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  verifyToken(): Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get(`${this.API_URL}/auth/verify`, { headers });
  }
}
