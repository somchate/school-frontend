import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../services/auth.service';
import { DialogService } from '../../services/dialog.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-login-thaid',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './login-thaid.component.html',
  styleUrls: ['./login-thaid.component.scss']
})
export class LoginThaidComponent implements OnInit {
  private readonly thaidPidStorageKey = 'tdc.thaid.pid';
  private readonly thaidTokenStorageKey = 'tdc.thaid.token';

  citizenId = '';
  thaidToken = '';
  errorMessage = '';
  loading = false;
  hasThaiDCallback = false;
  isWaitingForThaiDCallback = true;

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly dialogService: DialogService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      const storedPid = this.getSessionValue(this.thaidPidStorageKey);
      const storedToken = this.getSessionValue(this.thaidTokenStorageKey);
      const pid = (params['pid'] || storedPid || '').toString().trim();
      const token = (params['token'] || storedToken || '').toString().trim();

      if (token) this.thaidToken = token;

      if (pid && pid.length === 13) {
        this.hasThaiDCallback = true;
        this.isWaitingForThaiDCallback = false;
        this.citizenId = pid;
        this.clearThaiDSessionState();
        this.submit();
      } else {
        this.isWaitingForThaiDCallback = true;
      }
    });
  }

  get isFormIncomplete(): boolean {
    return !this.citizenId || this.citizenId.trim().length !== 13;
  }

  get thaiDStatusMessage(): string {
    if (this.loading) return 'กำลังตรวจสอบข้อมูลจาก ThaiD...';
    if (this.hasThaiDCallback) return 'ได้รับข้อมูลยืนยันตัวตนจาก ThaiD แล้ว ระบบกำลังเข้าสู่ระบบให้โดยอัตโนมัติ';
    return 'กรุณายืนยันตัวตนผ่านแอป ThaiD หรือกรอกเลขประจำตัวประชาชน 13 หลักเพื่อเข้าสู่ระบบ';
  }

  onlyDigits(event: KeyboardEvent): void {
    if (event.key && event.key.length === 1 && !/[0-9]/.test(event.key)) {
      event.preventDefault();
    }
  }

  async submit(): Promise<void> {
    if (this.isFormIncomplete) {
      this.errorMessage = 'กรุณากรอกเลขประจำตัวประชาชน 13 หลักให้ถูกต้อง';
      return;
    }

    this.errorMessage = '';
    this.loading = true;

    this.authService
      .thaidLogin(this.citizenId.trim(), this.thaidToken || undefined)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (response) => {
          if (response.success && response.user) {
            this.router.navigate(['/school-info']);
          } else {
            this.errorMessage = response.message || 'ไม่สามารถเข้าระบบได้';
          }
        },
        error: () => {
          this.errorMessage = 'ไม่สามารถเชื่อมต่อระบบได้ กรุณาลองใหม่อีกครั้ง';
        }
      });
  }

  startThaiDSignIn(): void {
    this.errorMessage = '';
    this.persistThaiDSessionState();
    const thaidUrl = (window as any).__THAID_SIGNIN_URL__ || 'http://localhost:15043/signin';
    window.location.href = thaidUrl;
  }

  backToLogin(): void {
    this.router.navigate(['/login']);
  }

  private persistThaiDSessionState(): void {
    const storage = this.getSessionStorage();
    if (!storage) return;
    if (this.citizenId.trim()) storage.setItem(this.thaidPidStorageKey, this.citizenId.trim());
    if (this.thaidToken.trim()) storage.setItem(this.thaidTokenStorageKey, this.thaidToken.trim());
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
}
