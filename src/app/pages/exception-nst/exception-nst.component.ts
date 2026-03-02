import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { AuthService } from '../../services/auth.service';
import { DashboardService } from '../../services/dashboard.service';
import { ExceptionService, ExceptionNst } from '../../services/exception.service';
import { DialogService } from '../../services/dialog.service';

@Component({
  selector: 'app-exception-nst',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTableModule
  ],
  templateUrl: './exception-nst.component.html',
  styleUrls: ['./exception-nst.component.scss']
})
export class ExceptionNstComponent implements OnInit {
  schoolId: string = '';
  schoolName: string = '';
  yearEducate: string = '';

  displayedColumns: string[] = ['idx', 'nstId', 'fname', 'lname', 'class'];

  // ค้นหา (จาก searchForm ใน exception_nst.jsp)
  searchYear: string = '';
  hasSearched: boolean = false;

  // ผลลัพธ์
  exceptionList: ExceptionNst[] = [];
  isLoading: boolean = false;

  constructor(
    private authService: AuthService,
    private dashboardService: DashboardService,
    private exceptionService: ExceptionService,
    private dialogService: DialogService
  ) {}

  ngOnInit(): void {
    this.dashboardService.getYearEducate().subscribe({
      next: (data) => {
        this.yearEducate = data.yearEducate || '';
        this.searchYear = this.yearEducate;
      },
      error: () => {
        const now = new Date();
        let y = now.getFullYear() + 543;
        if (now.getMonth() < 4) y--;
        this.yearEducate = y.toString();
        this.searchYear = this.yearEducate;
      }
    });

    this.authService.currentUser.subscribe(user => {
      if (user) {
        this.schoolId = user.schoolId || '';
        this.schoolName = user.schoolName || '';
      }
    });
  }

  // ค้นหา (จาก checkSearch + searchForm ใน JSP)
  async search(): Promise<void> {
    if (!this.searchYear) {
      await this.dialogService.alert('กรุณากรอก ปีการศึกษา');
      return;
    }
    if (!this.schoolId) return;

    this.isLoading = true;
    this.hasSearched = true;

    this.exceptionService.searchException(this.schoolId, this.searchYear).subscribe({
      next: (data) => { this.exceptionList = data || []; this.isLoading = false; },
      error: () => { this.exceptionList = []; this.isLoading = false; }
    });
  }
}
