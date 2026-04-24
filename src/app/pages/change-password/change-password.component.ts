import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { DialogService } from '../../services/dialog.service';

@Component({
  selector: 'app-change-password',
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
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.scss']
})
export class ChangePasswordComponent {
  oldPassword: string = '';
  newPassword: string = '';
  confirmPassword: string = '';
  isLoading: boolean = false;
  schoolId: string = '';
  schoolName: string = '';

  constructor(
    private authService: AuthService,
    private http: HttpClient,
    private dialogService: DialogService
  ) {
    this.authService.currentUser.subscribe(user => {
      if (user) {
        this.schoolId = user.schoolId || '';
        this.schoolName = user.schoolName || '';
      }
    });
  }

  // รับเฉพาะตัวเลข (จาก checkNumber ใน JSP)
  onKeyPressNumber(event: KeyboardEvent): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
      return false;
    }
    return true;
  }

  // Validation + บันทึก (จาก CheckNull ใน change_password.jsp)
  async changePassword(): Promise<void> {
    // กรุณากรอกข้อมูลให้ครบ
    if (!this.newPassword || !this.confirmPassword) {
      await this.dialogService.alert('กรุณากรอกข้อมูลให้ครบ');
      this.newPassword = '';
      this.confirmPassword = '';
      return;
    }

    // รหัสผ่านเดิมไม่ถูกต้อง → ตรวจสอบฝั่ง server
    if (!this.oldPassword) {
      await this.dialogService.alert('กรุณากรอกรหัสผ่านเดิม');
      return;
    }

    // รหัสผ่านใหม่กับยืนยันรหัสต้องตรงกัน และอย่างน้อย 4 ตัวอักษร
    if (this.newPassword !== this.confirmPassword || this.newPassword.length < 4) {
      await this.dialogService.alert('รหัสผ่านใหม่กับยืนยันรหัสต้องตรงกัน\n\nและอย่างน้อย 4 ตัวอักษร\n\nกรุณากรอกอีกครั้ง !!!');
      this.oldPassword = '';
      this.newPassword = '';
      this.confirmPassword = '';
      return;
    }

    this.isLoading = true;

    this.http.post<any>(`${environment.apiUrl}/auth/change-password`, {
      oldPassword: this.oldPassword,
      newPassword: this.newPassword
    }).subscribe({
      next: async (res) => {
        this.isLoading = false;
        const msg = res?.message || 'ระบบได้ทำการ เปลี่ยนรหัสผ่าน เรียบร้อยแล้ว';
        await this.dialogService.alert(msg);
        this.oldPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
      },
      error: async (err) => {
        this.isLoading = false;
        const msg = err?.error?.message || 'ระบบไม่สามารถทำการ เปลี่ยนรหัสผ่าน ได้ในขณะนี้';
        await this.dialogService.alert(msg);
      }
    });
  }

  // ยกเลิก = reset (จาก type="reset" ใน JSP)
  resetForm(): void {
    this.oldPassword = '';
    this.newPassword = '';
    this.confirmPassword = '';
  }
}
