import { Component, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { LoginType, LoginRequest } from '../../models/auth.model';
import { DialogService } from '../../services/dialog.service';

/** ค่าเดียวกับ TDC Recruit login.component.ts */
const RECAPTCHA_SITE_KEY = '6Lc9kGEsAAAAACV0BgLv-Pt9fnwpruT-KuyqgQQv';
const RECAPTCHA_SCRIPT_ID = 'recaptcha-v3-script';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnDestroy {
  schoolId: string = '';
  passwordSid: string = '';
  upid: string = '';
  passwordPid: string = '';
  errorMessage: string = '';
  showSchoolLogin: boolean = false;
  loading: boolean = false;

  private recaptchaReadyPromise: Promise<void> | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private dialogService: DialogService
  ) {}

  ngOnDestroy(): void {
    const badge = document.querySelector('.grecaptcha-badge');
    if (badge) {
      badge.remove();
    }
    const script = document.getElementById(RECAPTCHA_SCRIPT_ID);
    if (script) {
      script.remove();
    }
    this.recaptchaReadyPromise = null;
  }

  toggleLoginType(): void {
    this.showSchoolLogin = !this.showSchoolLogin;
    this.errorMessage = '';
  }

  goToThaiDLogin(): void {
    const thaidUrl = (window as any).__THAID_SIGNIN_URL__ || 'http://localhost:15043/signin';
    window.location.href = thaidUrl;
  }

  async loginBySchoolId(): Promise<void> {
    if (!this.schoolId || !this.passwordSid) {
      await this.dialogService.alert('กรุณากรอกข้อมูลให้ครบ');
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    await this.ensureRecaptchaReady();
    const recaptchaToken = await this.getRecaptchaToken();
    if (!recaptchaToken) {
      this.loading = false;
      this.errorMessage = 'ไม่สามารถยืนยัน reCAPTCHA ได้ กรุณาลองใหม่อีกครั้ง';
      return;
    }

    const loginRequest: LoginRequest = {
      loginType: LoginType.SCHOOL_ID,
      username: this.schoolId,
      password: this.passwordSid,
      recaptchaToken
    };

    this.authService.login(loginRequest).pipe(
      finalize(() => (this.loading = false))
    ).subscribe({
      next: (response) => {
        if (response.success) {
          this.router.navigate(['/school-info']);
        } else {
          this.errorMessage = response.message || 'เข้าสู่ระบบไม่สำเร็จ';
        }
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ';
      }
    });
  }

  async loginByPID(): Promise<void> {
    if (!this.upid || !this.passwordPid) {
      await this.dialogService.alert('กรุณากรอกข้อมูลให้ครบ');
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    await this.ensureRecaptchaReady();
    const recaptchaToken = await this.getRecaptchaToken();
    if (!recaptchaToken) {
      this.loading = false;
      this.errorMessage = 'ไม่สามารถยืนยัน reCAPTCHA ได้ กรุณาลองใหม่อีกครั้ง';
      return;
    }

    const loginRequest: LoginRequest = {
      loginType: LoginType.PID,
      username: this.upid,
      password: this.passwordPid,
      recaptchaToken
    };

    this.authService.login(loginRequest).pipe(
      finalize(() => (this.loading = false))
    ).subscribe({
      next: (response) => {
        if (response.success && response.user) {
          this.router.navigate(['/school-info']);
        } else {
          this.errorMessage = response.message || 'เข้าสู่ระบบไม่สำเร็จ';
        }
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ';
      }
    });
  }

  private ensureRecaptchaReady(): Promise<void> {
    if (this.recaptchaReadyPromise) {
      return this.recaptchaReadyPromise;
    }

    this.recaptchaReadyPromise = new Promise((resolve) => {
      const g = (window as { grecaptcha?: { ready?: (cb: () => void) => void } }).grecaptcha;
      if (g && typeof g.ready === 'function') {
        g.ready(() => resolve());
        return;
      }

      const existing = document.getElementById(RECAPTCHA_SCRIPT_ID) as HTMLScriptElement | null;
      if (existing) {
        existing.addEventListener('load', () => {
          const loaded = (window as { grecaptcha?: { ready?: (cb: () => void) => void } }).grecaptcha;
          if (loaded && typeof loaded.ready === 'function') {
            loaded.ready(() => resolve());
          } else {
            resolve();
          }
        });
        return;
      }

      const script = document.createElement('script');
      script.id = RECAPTCHA_SCRIPT_ID;
      script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        const loaded = (window as { grecaptcha?: { ready?: (cb: () => void) => void } }).grecaptcha;
        if (loaded && typeof loaded.ready === 'function') {
          loaded.ready(() => resolve());
        } else {
          resolve();
        }
      };
      document.head.appendChild(script);
    });

    return this.recaptchaReadyPromise;
  }

  private async getRecaptchaToken(): Promise<string> {
    const g = (window as {
      grecaptcha?: { execute: (key: string, options: { action: string }) => Promise<string> };
    }).grecaptcha;
    if (!g || typeof g.execute !== 'function') {
      return '';
    }
    try {
      return await g.execute(RECAPTCHA_SITE_KEY, { action: 'login' });
    } catch {
      return '';
    }
  }
}
