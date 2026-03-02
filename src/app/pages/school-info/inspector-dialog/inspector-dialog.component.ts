import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface InspectorDialogData {
  schoolId: string;
  pid: string;
}

@Component({
  selector: 'app-inspector-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './inspector-dialog.component.html',
  styleUrls: ['./inspector-dialog.component.scss']
})
export class InspectorDialogComponent {
  errorMsg = '';
  isLoading = false;

  constructor(
    public dialogRef: MatDialogRef<InspectorDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: InspectorDialogData
  ) {
    if (!data.pid) data.pid = '';
  }

  submit(): void {
    this.errorMsg = '';
    const pid = this.data.pid.trim();

    if (pid.length !== 13) {
      this.errorMsg = 'กรุณากรอกเลขประจำตัวประชาชนให้ครบ 13 หลัก';
      return;
    }

    if (!/^\d{13}$/.test(pid)) {
      this.errorMsg = 'กรุณากรอกเฉพาะเลขอารบิกเท่านั้น';
      return;
    }

    if (!this.validatePid(pid)) {
      this.errorMsg = 'เลขประจำตัวประชาชนไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง';
      return;
    }

    this.dialogRef.close(pid);
  }

  validatePid(pid: string): boolean {
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(pid[i]) * (13 - i);
    }
    const mod = sum % 11;
    const check = (11 - mod) % 10;
    return check === parseInt(pid[12]);
  }
}
