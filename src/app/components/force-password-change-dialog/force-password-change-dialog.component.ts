import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { environment } from '../../../environments/environment';

/** Regex: อย่างน้อย 8 ตัวอักษร, รับเฉพาะ A-Z a-z 0-9 และอักขระพิเศษ (ไม่รับตัวอักษรภาษาไทย/ช่องว่าง) */
export const PASSWORD_PATTERN = /^[A-Za-z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]{8,}$/;
export const PASSWORD_RULE_MESSAGE =
  'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 8 ตัวอักษร และประกอบด้วยตัวอักษรภาษาอังกฤษ ตัวเลข หรืออักขระพิเศษเท่านั้น';

export interface ForcePasswordChangeDialogData {
  oldPassword: string;
}

@Component({
  selector: 'app-force-password-change-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="dialog-overlay">
      <div class="dialog-box">
        <div class="dialog-header">
          เปลี่ยนรหัสผ่านก่อนเริ่มใช้งาน
        </div>
        <div class="dialog-body">
          <p class="notice">
            ระบบตรวจพบว่าคุณกำลังใช้รหัสผ่านเริ่มต้น (<b>123</b>)
            เพื่อความปลอดภัย กรุณาตั้งรหัสผ่านใหม่ก่อนเริ่มใช้งาน
          </p>

          <div class="form-group">
            <label>รหัสผ่านใหม่</label>
            <input
              type="password"
              [(ngModel)]="newPassword"
              maxlength="20"
              [disabled]="isLoading"
              autocomplete="new-password" />
          </div>

          <div class="form-group">
            <label>ยืนยันรหัสผ่านใหม่</label>
            <input
              type="password"
              [(ngModel)]="confirmPassword"
              maxlength="20"
              [disabled]="isLoading"
              autocomplete="new-password" />
          </div>

          <ul class="rule-list">
            <li>ความยาวอย่างน้อย 8 ตัวอักษร</li>
            <li>ประกอบด้วยตัวอักษรภาษาอังกฤษ (A-Z, a-z) ตัวเลข (0-9) หรืออักขระพิเศษ (เช่น ! &#64; # $ % ^ &amp; *)</li>
            <li>ไม่สามารถใช้ซ้ำกับรหัสผ่านเดิม (123)</li>
          </ul>

          <div class="error" *ngIf="errorMessage">{{ errorMessage }}</div>
        </div>
        <div class="dialog-footer">
          <button class="btn btn-ok" (click)="onSave()" [disabled]="isLoading">
            {{ isLoading ? 'กำลังบันทึก...' : 'บันทึกรหัสผ่านใหม่' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dialog-overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.45);
      display: flex; align-items: center; justify-content: center;
      z-index: 9999;
    }
    .dialog-box {
      background: #fff;
      border-radius: 6px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.2);
      min-width: 380px;
      max-width: 480px;
      width: 92%;
    }
    .dialog-header {
      background-color: #6d7856;
      color: #fff;
      font-weight: bold;
      font-size: 14px;
      padding: 10px 16px;
      border-radius: 6px 6px 0 0;
    }
    .dialog-body {
      padding: 16px 20px;
      font-size: 13px;
      color: #333;
    }
    .notice {
      background: #fff7e6;
      border: 1px solid #ffd591;
      color: #8a5a00;
      padding: 8px 10px;
      border-radius: 4px;
      margin: 0 0 14px;
      line-height: 1.6;
    }
    .form-group { margin-bottom: 10px; display: flex; flex-direction: column; }
    .form-group label { font-weight: 600; margin-bottom: 4px; }
    .form-group input {
      padding: 7px 10px;
      border: 1px solid #bbb;
      border-radius: 4px;
      font-size: 13px;
    }
    .rule-list {
      margin: 10px 0 0;
      padding-left: 18px;
      color: #555;
      font-size: 12px;
      line-height: 1.6;
    }
    .error {
      margin-top: 10px;
      color: #c62828;
      background: #fdecea;
      border: 1px solid #f5c2bd;
      padding: 8px 10px;
      border-radius: 4px;
      white-space: pre-line;
    }
    .dialog-footer {
      padding: 10px 16px 14px;
      text-align: center;
      border-top: 1px solid #eee;
    }
    .btn {
      padding: 7px 20px;
      font-size: 13px;
      border: 1px solid #6d7856;
      border-radius: 3px;
      background: #6d7856;
      color: #fff;
      cursor: pointer;
    }
    .btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn:hover:not(:disabled) { background: #5c6648; }
  `]
})
export class ForcePasswordChangeDialogComponent {
  newPassword = '';
  confirmPassword = '';
  errorMessage = '';
  isLoading = false;

  constructor(
    private dialogRef: DialogRef<boolean>,
    private http: HttpClient,
    @Inject(DIALOG_DATA) public data: ForcePasswordChangeDialogData
  ) {
    this.dialogRef.disableClose = true;
  }

  onSave(): void {
    this.errorMessage = '';

    if (!this.newPassword || !this.confirmPassword) {
      this.errorMessage = 'กรุณากรอกรหัสผ่านใหม่และยืนยันรหัสผ่านให้ครบ';
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน';
      return;
    }
    if (this.newPassword === this.data.oldPassword) {
      this.errorMessage = 'รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านเดิม';
      return;
    }
    if (!PASSWORD_PATTERN.test(this.newPassword)) {
      this.errorMessage = PASSWORD_RULE_MESSAGE;
      return;
    }

    this.isLoading = true;
    this.http.post<any>(`${environment.apiUrl}/auth/change-password`, {
      oldPassword: this.data.oldPassword,
      newPassword: this.newPassword
    }).subscribe({
      next: () => {
        this.isLoading = false;
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.message || 'ไม่สามารถเปลี่ยนรหัสผ่านได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง';
      }
    });
  }
}
