import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { finalize, filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-login-thaid',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './login-thaid.component.html',
  styleUrls: ['./login-thaid.component.scss']
})
export class LoginThaidComponent implements OnInit, OnDestroy {
  private readonly thaidPidStorageKey = 'lk2_thaid_pid';
  private readonly thaidTokenStorageKey = 'lk2_thaid_token';
  private readonly allowedLinkage2Origins = this.computeAllowedLinkage2Origins();
  private postMessageHandler?: (event: MessageEvent) => void;
  private routerSub?: Subscription;

  errorMessage = '';
  loading = false;
  hasThaiDCallback = false;
  isWaitingForThaiDCallback = true;

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly http: HttpClient
  ) {}

  ngOnInit(): void {
    // popup path: รับ postMessage จาก linkage2 popup
    this.postMessageHandler = (event: MessageEvent) => this.handlePostMessage(event);
    window.addEventListener('message', this.postMessageHandler);

    // NavigationEnd: ตรวจ sessionStorage และ nonce ทุกครั้งที่ navigate มาหน้านี้
    this.routerSub = this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => this.checkCallbackData());

    // ตรวจทันทีที่ component โหลด
    this.checkCallbackData();
  }

  ngOnDestroy(): void {
    if (this.postMessageHandler) {
      window.removeEventListener('message', this.postMessageHandler);
    }
    this.routerSub?.unsubscribe();
  }

  private checkCallbackData(): void {
    // tray path: ตรวจ ?nonce= ใน URL ก่อน
    const nonce = this.route.snapshot.queryParamMap.get('nonce');
    if (nonce) {
      this.redeemNonce(nonce);
      return;
    }

    // popup fallback path: ตรวจ sessionStorage
    const pid = this.getSessionValue(this.thaidPidStorageKey);
    const token = this.getSessionValue(this.thaidTokenStorageKey);
    console.log('[ThaiD] checkCallbackData — pid length:', pid.length, 'token length:', token.length);

    if (pid && pid.length === 13 && token) {
      this.hasThaiDCallback = true;
      this.isWaitingForThaiDCallback = false;
      this.clearThaiDSessionState();
      this.submitThaiD(pid, token);
    }
  }

  private redeemNonce(nonce: string): void {
    if (this.loading) return;
    this.loading = true;
    this.isWaitingForThaiDCallback = false;
    // ล้าง nonce ออกจาก URL โดยไม่ reload
    this.router.navigate([], { replaceUrl: true, queryParams: {} });

    this.http.get<{ pid: string; token: string }>(
      `${environment.linkage2Url}/thaid-nonce/${nonce}`
    ).subscribe({
      next: (data) => {
        if (data?.pid && data?.token) {
          this.hasThaiDCallback = true;
          this.submitThaiD(data.pid, data.token);
        } else {
          this.loading = false;
          this.errorMessage = 'ไม่สามารถแลก nonce ได้ กรุณาลองใหม่อีกครั้ง';
        }
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'nonce หมดอายุหรือไม่ถูกต้อง กรุณายืนยันตัวตนใหม่อีกครั้ง';
      }
    });
  }

  private handlePostMessage(event: MessageEvent): void {
    console.log('[ThaiD] postMessage received from origin:', event.origin, 'allowed:', Array.from(this.allowedLinkage2Origins));
    if (!this.allowedLinkage2Origins.has(event.origin)) {
      console.warn('[ThaiD] origin not in allowed list — ignoring message');
      return;
    }

    const data = event.data;
    console.log('[ThaiD] message data type:', data?.type);
    if (!data || data.type !== 'thaid_callback') return;

    if (data.error) {
      this.errorMessage = 'การยืนยันตัวตนผ่าน ThaiD ล้มเหลว กรุณาลองใหม่อีกครั้ง';
      this.isWaitingForThaiDCallback = false;
      return;
    }

    const pid = (data.pid || '').toString().trim();
    const token = (data.token || '').toString().trim();

    if (pid && pid.length === 13 && token) {
      this.hasThaiDCallback = true;
      this.isWaitingForThaiDCallback = false;
      this.submitThaiD(pid, token);
    }
  }

  get thaiDStatusMessage(): string {
    if (this.loading) return 'กำลังตรวจสอบข้อมูลจาก ThaiD...';
    if (this.hasThaiDCallback) return 'ได้รับข้อมูลยืนยันตัวตนจาก ThaiD แล้ว ระบบกำลังเข้าสู่ระบบให้โดยอัตโนมัติ';
    return 'กรุณายืนยันตัวตนผ่านแอป ThaiD หรือสแกน QR Code เพื่อเข้าสู่ระบบ';
  }

  private submitThaiD(pid: string, token: string): void {
    if (this.loading && !this.hasThaiDCallback) return;
    console.log('[ThaiD] submitting to backend, pid length:', pid.length, 'token length:', token.length);
    this.errorMessage = '';
    this.loading = true;

    this.authService
      .thaidLogin(pid, token)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (response) => {
          console.log('[ThaiD] backend response:', { success: response.success, hasUser: !!response.user, message: response.message });
          if (response.success && response.user) {
            console.log('[ThaiD] navigating to /school-info');
            this.router.navigate(['/school-info']);
          } else {
            this.errorMessage = response.message || 'ไม่สามารถเข้าระบบได้';
            this.isWaitingForThaiDCallback = false;
            this.hasThaiDCallback = false;
          }
        },
        error: (err) => {
          console.error('[ThaiD] backend error:', err);
          this.errorMessage = 'ไม่สามารถเชื่อมต่อระบบได้ กรุณาลองใหม่อีกครั้ง';
          this.isWaitingForThaiDCallback = false;
          this.hasThaiDCallback = false;
        }
      });
  }

  startThaiDSignIn(): void {
    this.errorMessage = '';
    this.isWaitingForThaiDCallback = true;
    const signinUrl = `${environment.linkage2Url}/signin`;
    const popup = window.open(signinUrl, 'thaid_signin', 'width=500,height=700,menubar=no,toolbar=no');
    if (!popup) {
      window.location.href = signinUrl;
    }
  }

  backToLogin(): void {
    this.router.navigate(['/login']);
  }

  private clearThaiDSessionState(): void {
    const storage = this.getSessionStorage();
    if (!storage) return;
    storage.removeItem(this.thaidPidStorageKey);
    storage.removeItem(this.thaidTokenStorageKey);
  }

  private getSessionValue(key: string): string {
    const storage = this.getSessionStorage();
    return storage ? storage.getItem(key) || '' : '';
  }

  private getSessionStorage(): Storage | null {
    try {
      return typeof window !== 'undefined' ? window.sessionStorage : null;
    } catch {
      return null;
    }
  }

  private computeAllowedLinkage2Origins(): Set<string> {
    const origins = new Set<string>();
    try {
      const url = new URL(environment.linkage2Url);
      origins.add(url.origin);
      const port = url.port || (url.protocol === 'https:' ? '443' : '80');
      const protocol = url.protocol;
      if (url.hostname === 'localhost') {
        origins.add(`${protocol}//127.0.0.1:${port}`);
      } else if (url.hostname === '127.0.0.1') {
        origins.add(`${protocol}//localhost:${port}`);
      }
    } catch { /* fail-closed */ }
    return origins;
  }
}
