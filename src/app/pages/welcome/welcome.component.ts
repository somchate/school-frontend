import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { DashboardService } from '../../services/dashboard.service';
import { SchoolInfoService } from '../../services/school-info.service';

interface Schedule {
  type: string;
  date: string;
  time: string;
  place: string;
  note: string;
}

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule
  ],
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.scss']
})
export class WelcomeComponent implements OnInit {
  schoolId: string = '';
  schoolName: string = '';
  schoolAddr: string = '';
  currentYear: string = '';
  schedules: Schedule[] = [];
  isLoading: boolean = true;

  constructor(
    private authService: AuthService,
    private dashboardService: DashboardService,
    private schoolInfoService: SchoolInfoService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser.subscribe(user => {
      if (user) {
        this.schoolId = user.schoolId || '';
        this.schoolName = user.schoolName || '';
        if (this.schoolId) {
          this.loadData();
        }
      }
    });
  }

  loadData(): void {
    this.isLoading = true;

    this.dashboardService.getYearEducate().subscribe({
      next: (data) => {
        this.currentYear = data.yearEducate || '';
        this.loadSchedules();
      },
      error: () => {
        const now = new Date();
        let y = now.getFullYear() + 543;
        if (now.getMonth() < 4) y--;
        this.currentYear = y.toString();
        this.loadSchedules();
      }
    });

    this.schoolInfoService
      .getSchoolInfo(this.schoolId)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (data) => {
          this.schoolName = data.schoolName || this.schoolName;
          this.schoolAddr = data.schoolAddr || '';
        },
        error: () => {}
      });
  }

  private loadSchedules(): void {
    this.dashboardService.getSchedules(this.schoolId, this.currentYear).subscribe({
      next: (data: any[]) => {
        this.schedules = (data || []).map(s => ({
          type: s.scheduleType === 'A' ? 'รับสมัคร' : 'รับรายงานตัว',
          date: s.scheduleDate || '-',
          time: s.scheduleTime === 'M' ? 'เช้า' : 'บ่าย',
          place: s.regPlace || '-',
          note: s.note || ''
        }));
      },
      error: () => {
        this.schedules = [];
      }
    });
  }
}
