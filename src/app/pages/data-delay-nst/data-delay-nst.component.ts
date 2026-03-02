import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { DashboardService } from '../../services/dashboard.service';
import { DelayTrainingService, DelayTraining, DelayTrainingNst, GroundDetail } from '../../services/delay-training.service';

@Component({
  selector: 'app-data-delay-nst',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatTableModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatDividerModule
  ],
  templateUrl: './data-delay-nst.component.html',
  styleUrls: ['./data-delay-nst.component.scss']
})
export class DataDelayNstComponent implements OnInit {
  schoolId: string = '';
  schoolName: string = '';
  currentYear: string = '';
  delayList: DelayTraining[] = [];
  isLoading: boolean = false;

  // Inline detail (จาก add_list_nst.jsp)
  showDetail: boolean = false;
  groundDetail: GroundDetail | null = null;
  nstList: DelayTrainingNst[] = [];
  isLoadingDetail: boolean = false;

  constructor(
    private authService: AuthService,
    private dashboardService: DashboardService,
    private delayService: DelayTrainingService
  ) {}

  ngOnInit(): void {
    this.dashboardService.getYearEducate().subscribe({
      next: (data) => {
        this.currentYear = data.yearEducate || '';
        this.tryLoadList();
      },
      error: () => {
        const now = new Date();
        let y = now.getFullYear() + 543;
        if (now.getMonth() < 4) y--;
        this.currentYear = y.toString();
        this.tryLoadList();
      }
    });

    this.authService.currentUser.subscribe(user => {
      if (user) {
        this.schoolId = user.schoolId || '';
        this.schoolName = user.schoolName || '';
        this.tryLoadList();
      }
    });
  }

  private tryLoadList(): void {
    if (this.schoolId && this.currentYear) {
      this.loadDelayList();
    }
  }

  loadDelayList(): void {
    if (!this.schoolId) return;
    this.isLoading = true;
    this.showDetail = false;
    this.groundDetail = null;
    this.nstList = [];
    this.delayService.getDelayList(this.schoolId, this.currentYear).subscribe({
      next: (data) => { this.delayList = data || []; this.isLoading = false; },
      error: () => { this.delayList = []; this.isLoading = false; }
    });
  }

  getSexText(sex: string): string {
    return (sex || '').trim() === 'M' ? 'ชาย' : 'หญิง';
  }

  // แปลงประเภทการฝึก (จาก add_list_nst.jsp)
  getTrainTypeText(type: string): string {
    if (type === '1') return 'ผลัดฝึกปกติ';
    if (type === '2') return 'ผลัดฝึกพาราเซล';
    return type || '-';
  }

  // คลิก "รายละเอียด" → แสดง inline detail (จาก add_list_nst.jsp)
  viewDetail(item: DelayTraining): void {
    this.isLoadingDetail = true;
    this.showDetail = true;
    this.groundDetail = null;
    this.nstList = [];

    forkJoin({
      detail: this.delayService.getGroundDetail(item.id),
      nstList: this.delayService.getDelayNstList(item.id)
    }).subscribe({
      next: (result) => {
        this.isLoadingDetail = false;
        this.groundDetail = result.detail;
        this.nstList = result.nstList || [];
      },
      error: () => {
        this.isLoadingDetail = false;
        // fallback: สร้าง detail จากข้อมูล list
        this.groundDetail = {
          id: item.id,
          regYear: this.currentYear,
          atClass: item.atClass,
          regSex: item.regSex,
          trainType: '-',
          trainNo: item.trainNo,
          unitNo: '-',
          dateStart: '-',
          dateEnd: '-',
          remarks: '-'
        };
      }
    });
  }

  // กลับไป list (จาก backForm ใน JSP)
  goBack(): void {
    this.showDetail = false;
    this.groundDetail = null;
    this.nstList = [];
  }
}
