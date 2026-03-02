import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface TransferDetailData {
  nstId: string;
  name: string;
  atClass: string;
  fromSchool: string;
  toSchool: string;
  transferDate: string;
  commandNo: string;
}

@Component({
  selector: 'app-transfer-detail-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  templateUrl: './transfer-detail-dialog.component.html',
  styleUrls: ['./transfer-detail-dialog.component.scss']
})
export class TransferDetailDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<TransferDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TransferDetailData
  ) {}
}
