import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../services/auth.service';
import { DashboardService } from '../../services/dashboard.service';
import { TransferService, TransferNst } from '../../services/transfer.service';

// ข้อมูลรายละเอียดโอนย้าย (จาก transfer_nst_info.jsp)
export interface TransferDetail {
  nstId: string;
  title: string;
  fname: string;
  lname: string;
  nstAtClass: string;
  fromSchoolName: string;
  toSchoolName: string;
  transferDate: string;
  commandNo: string;
}

@Component({
  selector: 'app-transfer-nst',
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
  templateUrl: './transfer-nst.component.html',
  styleUrls: ['./transfer-nst.component.scss']
})
export class TransferNstComponent implements OnInit {
  schoolId: string = '';
  schoolName: string = '';
  currentYear: string = '';
  transferList: TransferNst[] = [];
  isLoading: boolean = false;

  // Inline detail (จาก transfer_nst_info.jsp)
  showDetail: boolean = false;
  detail: TransferDetail | null = null;
  isLoadingDetail: boolean = false;

  constructor(
    private authService: AuthService,
    private dashboardService: DashboardService,
    private transferService: TransferService
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
      this.loadTransferList();
    }
  }

  loadTransferList(): void {
    if (!this.schoolId) return;
    this.isLoading = true;
    this.showDetail = false;
    this.detail = null;
    this.transferService.getTransferList(this.schoolId, this.currentYear).subscribe({
      next: (data) => { this.transferList = data || []; this.isLoading = false; },
      error: () => { this.transferList = []; this.isLoading = false; }
    });
  }

  getFullName(t: TransferNst): string {
    return `${t.regTitle || ''} ${t.regFname || ''} ${t.regLname || ''}`.trim();
  }

  // คลิกที่แถว → แสดง inline detail (จาก transfer_nst_info.jsp)
  viewDetail(t: TransferNst): void {
    this.isLoadingDetail = true;
    this.showDetail = true;

    this.transferService.getTransferDetail(t.nstId).subscribe({
      next: (data) => {
        this.isLoadingDetail = false;
        if (data) {
          // แปลง title code เป็นข้อความ (จาก JSP)
          let title = data.regTitle || t.regTitle || '';
          if (title === '002') {
            title = 'นางสาว';
          } else if (title && title !== '002') {
            title = 'นาย';
          }

          this.detail = {
            nstId: data.nstId || t.nstId,
            title: title,
            fname: data.regFname || t.regFname || '',
            lname: data.regLname || t.regLname || '',
            nstAtClass: data.nstAtClass || t.nstAtClass || '',
            fromSchoolName: data.fromSchoolName || t.fromSchoolName || '',
            toSchoolName: data.toSchoolName || t.toSchoolName || '',
            transferDate: data.transferDate || t.transferDate || '',
            commandNo: data.commandNo || t.commandNo || ''
          };
        }
      },
      error: () => {
        this.isLoadingDetail = false;
        // fallback ใช้ข้อมูลจาก list
        let title = t.regTitle || '';
        if (title === '002') title = 'นางสาว';
        else if (title) title = 'นาย';

        this.detail = {
          nstId: t.nstId,
          title: title,
          fname: t.regFname || '',
          lname: t.regLname || '',
          nstAtClass: t.nstAtClass || '',
          fromSchoolName: t.fromSchoolName || '',
          toSchoolName: t.toSchoolName || '',
          transferDate: t.transferDate || '',
          commandNo: t.commandNo || ''
        };
      }
    });
  }

  // ปิด detail กลับไป list (จาก resetPage)
  closeDetail(): void {
    this.showDetail = false;
    this.detail = null;
  }
}
