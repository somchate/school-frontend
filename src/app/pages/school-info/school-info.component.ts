import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../services/auth.service';
import { SchoolInfoService, Inspector } from '../../services/school-info.service';

@Component({
  selector: 'app-school-info',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatTableModule,
    MatDividerModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule
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

  isEditing: boolean = false;
  isLoading: boolean = true;

  // ผกท.พ. (M0 + มีคำสั่ง)
  inspectorM0: Inspector[] = [];
  // ผกท. (M1 + มีคำสั่ง)
  inspectorM1: Inspector[] = [];
  // เจ้าหน้าที่ผ่านการฝึกแต่ยังไม่ได้แต่งตั้ง (M0/M1 + ไม่มีคำสั่ง)
  inspectorTrained: Inspector[] = [];
  // เจ้าหน้าที่อื่นๆ
  inspectorOther: Inspector[] = [];

  constructor(
    private authService: AuthService,
    private schoolInfoService: SchoolInfoService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser.subscribe(user => {
      if (user) {
        this.schoolData.schoolId = user.schoolId || '';
        if (this.schoolData.schoolId) {
          this.loadSchoolInfo();
          this.loadInspectors();
        }
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
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading school info:', err);
        this.isLoading = false;
      }
    });
  }

  loadInspectors(): void {
    this.schoolInfoService.getInspectors(this.schoolData.schoolId).subscribe({
      next: (data) => {
        this.inspectorM0 = data.filter(i => i.inspectorType?.trim() === 'M0' && i.orderCommand);
        this.inspectorM1 = data.filter(i => i.inspectorType?.trim() === 'M1' && i.orderCommand);
        this.inspectorTrained = data.filter(i =>
          (i.inspectorType?.trim() === 'M0' || i.inspectorType?.trim() === 'M1') && !i.orderCommand
        );
        this.inspectorOther = data.filter(i =>
          !i.inspectorType || (i.inspectorType.trim() !== 'M0' && i.inspectorType.trim() !== 'M1')
        );
      },
      error: (err) => {
        console.error('Error loading inspectors:', err);
      }
    });
  }

  getFullName(i: Inspector): string {
    return `${i.titleName || ''} ${i.firstName || ''} ${i.lastName || ''}`.trim();
  }

  maskPid(pid: string): string {
    if (!pid) return '-';
    const p = pid.trim();
    if (p.length !== 13) return p;
    return `${p[0]}-${p[1]}XXX-XXXX${p[9]}-${p[10]}${p[11]}-${p[12]}`;
  }

  saveInform(): void {
    this.schoolInfoService.updateInform(this.schoolData.schoolId, this.schoolData.inform).subscribe({
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
