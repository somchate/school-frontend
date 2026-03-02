import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { DelayTrainingService, DelayTrainingNst } from '../../../services/delay-training.service';

export interface DelayNstListDialogData {
  groundId: string;
  trainNo: string;
  atClass: string;
  sex: string;
}

@Component({
  selector: 'app-delay-nst-list-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatButtonModule
  ],
  templateUrl: './delay-nst-list-dialog.component.html',
  styleUrls: ['./delay-nst-list-dialog.component.scss']
})
export class DelayNstListDialogComponent implements OnInit {
  nstList: DelayTrainingNst[] = [];
  isLoading = true;

  constructor(
    public dialogRef: MatDialogRef<DelayNstListDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DelayNstListDialogData,
    private delayService: DelayTrainingService
  ) {}

  ngOnInit(): void {
    this.delayService.getDelayNstList(this.data.groundId).subscribe({
      next: (list) => { this.nstList = list || []; this.isLoading = false; },
      error: () => { this.nstList = []; this.isLoading = false; }
    });
  }
}
