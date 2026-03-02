import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../services/auth.service';
import { LoginType, LoginRequest } from '../../models/auth.model';
import { DialogService } from '../../services/dialog.service';

@Component({
  selector: 'app-login',
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
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  schoolId: string = '';
  passwordSid: string = '';
  upid: string = '';
  passwordPid: string = '';
  errorMessage: string = '';
  showSchoolLogin: boolean = false;
  loading: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private dialogService: DialogService
  ) {}

  toggleLoginType(): void {
    this.showSchoolLogin = !this.showSchoolLogin;
    this.errorMessage = '';
  }

  async loginBySchoolId(): Promise<void> {
    if (!this.schoolId || !this.passwordSid) {
      await this.dialogService.alert('กรุณากรอกข้อมูลให้ครบ');
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const loginRequest: LoginRequest = {
      loginType: LoginType.SCHOOL_ID,
      username: this.schoolId,
      password: this.passwordSid
    };

    this.authService.login(loginRequest).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success) {
          const redirectPage = response.user && response.user.accessLevel <= 1 
            ? '/school-info' 
            : '/welcome';
          this.router.navigate([redirectPage]);
        } else {
          this.errorMessage = response.message || 'เข้าสู่ระบบไม่สำเร็จ';
        }
      },
      error: (error) => {
        this.loading = false;
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

    const loginRequest: LoginRequest = {
      loginType: LoginType.PID,
      username: this.upid,
      password: this.passwordPid
    };

    this.authService.login(loginRequest).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success && response.user) {
          const redirectPath = (response.user.accessLevel || 0) <= 1 
            ? '/school-info' 
            : '/welcome';
          this.router.navigate([redirectPath]);
        } else {
          this.errorMessage = response.message || 'เข้าสู่ระบบไม่สำเร็จ';
        }
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error.error?.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ';
      }
    });
  }

}
