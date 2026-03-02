import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NstEditData } from './nst-edit-data';

@Component({
  selector: 'app-nst-edit-dialog',
  standalone: true,
  imports: [
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './nst-edit-dialog.component.html',
  styleUrls: ['./nst-edit-dialog.component.scss']
})
export class NstEditDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<NstEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: NstEditData
  ) {}

  save(): void {
    this.dialogRef.close(this.data);
  }
}
