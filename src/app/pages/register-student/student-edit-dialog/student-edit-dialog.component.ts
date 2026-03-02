import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';

export interface StudentEditData {
  regPid: string;
  titleId: string;
  regTitle: string;
  regFname: string;
  regLname: string;
  regBirthday: string;
  regSex: string;
  regStatusId: string;
  telReg: string;
  telParents: string;
  regDate: string;
  regYear: string;
  regSchoolId: string;
}

@Component({
  selector: 'app-student-edit-dialog',
  standalone: true,
  imports: [
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule
  ],
  templateUrl: './student-edit-dialog.component.html',
  styleUrls: ['./student-edit-dialog.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class StudentEditDialogComponent {
  student: StudentEditData;
  birthdayDate: Date | null = null;

  constructor(
    public dialogRef: MatDialogRef<StudentEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: StudentEditData
  ) {
    this.student = { ...data };
    this.birthdayDate = this.parseDate(data.regBirthday);
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.birthdayDate) {
      const y = this.birthdayDate.getFullYear();
      const m = String(this.birthdayDate.getMonth() + 1).padStart(2, '0');
      const d = String(this.birthdayDate.getDate()).padStart(2, '0');
      this.student.regBirthday = `${y}-${m}-${d}`;
    }
    // Truncate regDate to yyyy-MM-dd for LocalDate compatibility
    if (this.student.regDate && this.student.regDate.length > 10) {
      this.student.regDate = this.student.regDate.substring(0, 10);
    }
    this.dialogRef.close(this.student);
  }

  private parseDate(dateStr: string): Date | null {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  }

  getSexDisplay(sex: string): string {
    const s = (sex || '').trim();
    return s === 'M' ? 'ชาย' : s === 'F' ? 'หญิง' : '-';
  }
}
