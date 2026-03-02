import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';

export interface NstRegisterData {
  regPid: string;
  nstId: string;
  regTitle: string;
  regFname: string;
  regLname: string;
  regSex: string;
  nstAtClass: string;
  nstStatusId: string;
  nstRd25: string;
  regSchoolId: string;
  reqSchoolId: string;
  atYear: string;
  nstApproveDate: string;
  nstDoc: string;
  isNew: boolean;
}

@Component({
  selector: 'app-nst-register-dialog',
  standalone: true,
  imports: [
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule
  ],
  templateUrl: './nst-register-dialog.component.html',
  styleUrls: ['./nst-register-dialog.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class NstRegisterDialogComponent {
  nst: NstRegisterData;
  approveDateValue: Date | null = null;

  constructor(
    public dialogRef: MatDialogRef<NstRegisterDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: NstRegisterData
  ) {
    this.nst = { ...data };
    this.approveDateValue = this.parseDate(data.nstApproveDate);
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.approveDateValue) {
      const y = this.approveDateValue.getFullYear();
      const m = String(this.approveDateValue.getMonth() + 1).padStart(2, '0');
      const d = String(this.approveDateValue.getDate()).padStart(2, '0');
      this.nst.nstApproveDate = `${y}-${m}-${d}`;
    }
    this.dialogRef.close(this.nst);
  }

  private parseDate(dateStr: string): Date | null {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  }

  get dialogTitle(): string {
    return this.nst.isNew ? 'รับรายงานตัว นศท. ใหม่' : 'แก้ไขข้อมูล นศท.';
  }
}
