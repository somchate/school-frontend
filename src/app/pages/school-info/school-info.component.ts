import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
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
  selector: 'app-school-info',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatDividerModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTableModule
  ],
  templateUrl: './school-info.component.html',
  styleUrls: ['./school-info.component.scss']
})
export class SchoolInfoComponent implements OnInit {
  schoolData = {
    schoolId: '',
    schoolName: '',
    schoolShortName: '',
    openDate: '',
    address: '',
    inform: ''
  };

  certifierData = {
    fname: '',
    lname: '',
    position: ''
  };

  isEditing: boolean = false;
  isEditingCertifier: boolean = false;
  isSavingCertifier: boolean = false;
  isLoading: boolean = true;

  currentYear: string = '';
  schedules: Schedule[] = [];

  constructor(
    private authService: AuthService,
    private dashboardService: DashboardService,
    private schoolInfoService: SchoolInfoService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser.subscribe(user => {
      if (user) {
        this.schoolData.schoolId = user.schoolId || '';
        this.schoolData.schoolName = user.schoolName || '';
        if (this.schoolData.schoolId) {
          this.loadSchoolInfo();
          this.loadYearAndSchedules();
        }
      }
    });
  }

  private loadYearAndSchedules(): void {
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
  }

  private loadSchedules(): void {
    this.dashboardService.getSchedules(this.schoolData.schoolId, this.currentYear).subscribe({
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

  loadSchoolInfo(): void {
    this.isLoading = true;
    this.schoolInfoService.getSchoolInfo(this.schoolData.schoolId).subscribe({
      next: (data) => {
        this.schoolData.schoolName = data.schoolName || '';
        this.schoolData.schoolShortName = data.schoolShortName || '';
        this.schoolData.openDate = data.schoolOpenDate || '';
        this.schoolData.address = data.schoolAddr || '';
        this.schoolData.inform = data.usrInform || '';
        this.certifierData.fname = data.certifierFname || '';
        this.certifierData.lname = data.certifierLname || '';
        this.certifierData.position = data.certifierPosition || '';
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading school info:', err);
        this.isLoading = false;
      }
    });
  }

  saveInform(): void {
    this.schoolInfoService.updateInform(this.schoolData.inform).subscribe({
      next: (data) => {
        this.schoolData.inform = data.usrInform || '';
        this.isEditing = false;
      },
      error: (err) => {
        console.error('Error saving inform:', err);
      }
    });
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.loadSchoolInfo();
  }

  saveCertifier(): void {
    this.isSavingCertifier = true;
    this.schoolInfoService.updateCertifier(
      this.certifierData.fname,
      this.certifierData.lname,
      this.certifierData.position
    ).subscribe({
      next: (data) => {
        this.certifierData.fname = data.certifierFname || '';
        this.certifierData.lname = data.certifierLname || '';
        this.certifierData.position = data.certifierPosition || '';
        this.isEditingCertifier = false;
        this.isSavingCertifier = false;
      },
      error: (err) => {
        console.error('Error saving certifier:', err);
        this.isSavingCertifier = false;
      }
    });
  }

  cancelCertifierEdit(): void {
    this.isEditingCertifier = false;
    this.loadSchoolInfo();
  }

  hasCertifier(): boolean {
    return !!(this.certifierData.fname || this.certifierData.lname || this.certifierData.position);
  }

  formatThaiDate(dateStr: string): string {
    if (!dateStr) return '-';
    
    const thaiMonths = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน',
      'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม',
      'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;

    const day = date.getDate();
    const month = thaiMonths[date.getMonth()];
    const buddhistYear = date.getFullYear() + 543;

    return `${day} ${month} ${buddhistYear}`;
  }
}
