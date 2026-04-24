import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../services/auth.service';
import { NstRegisterService, NstDetailData, LookupItem, NstStatusHistoryItem } from '../../services/nst-register.service';
import { DashboardService } from '../../services/dashboard.service';
import { DialogService } from '../../services/dialog.service';
import { SchoolInfoService } from '../../services/school-info.service';

@Component({
  selector: 'app-register-nst',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './register-nst.component.html',
  styleUrls: ['./register-nst.component.scss']
})
export class RegisterNstComponent implements OnInit {
  schoolId: string = '';
  schoolName: string = '';
  currentYear: string = '';

  // ค้นหา
  searchNstId: string = '';
  searchNstPid: string = '';
  isSearching: boolean = false;
  searchResult: string = '';  // 'found' | 'notfound' | ''

  // ข้อมูล นศท. (inline form)
  nstData: NstDetailData | null = null;
  showForm: boolean = false;

  /** สำหรับแปลงรหัสสถานะ นศท. เป็นชื่อ (แสดงแบบ readonly) */
  nstStatusList: LookupItem[] = [];

  constructor(
    private authService: AuthService,
    private nstService: NstRegisterService,
    private dashboardService: DashboardService,
    private dialogService: DialogService,
    private schoolInfoService: SchoolInfoService
  ) {}

  ngOnInit(): void {
    this.dashboardService.getYearEducate().subscribe({
      next: (data) => { this.currentYear = data.yearEducate || ''; },
      error: () => {
        const now = new Date();
        let y = now.getFullYear() + 543;
        if (now.getMonth() < 4) y--;
        this.currentYear = y.toString();
      }
    });

    this.authService.currentUser.subscribe(user => {
      if (user) {
        this.schoolId = user.schoolId || '';
        this.schoolName = user.schoolName || '';

        if (this.schoolId && !this.schoolName) {
          this.schoolInfoService.getSchoolInfo(this.schoolId).subscribe({
            next: (info) => { this.schoolName = info.schoolName || this.schoolId; },
            error: () => { this.schoolName = this.schoolId; }
          });
        }
      }
    });

    this.nstService.getNstStatusList().subscribe({
      next: (list) => { this.nstStatusList = list; },
      error: (err) => console.error('Error loading NST status list:', err)
    });
  }

  // ตรวจสอบเลข (จาก checknumber ใน JSP)
  onNumberKeyPress(event: KeyboardEvent): boolean {
    const charCode = event.charCode || event.keyCode;
    if (charCode === 13) return true;
    if (charCode < 48 || charCode > 57) {
      this.dialogService.alert('รับเฉพาะเลขอารบิกเท่านั้น');
      return false;
    }
    return true;
  }

  // ค้นหา (จาก checkSearch + searchNst ใน JSP)
  async search(): Promise<void> {
    const pid = this.searchNstPid.trim();
    const nstId = this.searchNstId.trim();

    if (!pid && !nstId) {
      await this.dialogService.alert('กรุณากรอก รหัส นศท.หรือเลขประจำตัวประชาชน ที่ต้องการค้นหา!!!');
      return;
    }
    if (nstId && nstId.length !== 10) {
      await this.dialogService.alert('กรุณากรอก รหัส นศท. ให้ครบ 10 หลัก');
      return;
    }
    if (pid && pid.length !== 13) {
      await this.dialogService.alert('กรุณากรอก เลขประจำตัวประชาชน ให้ครบ 13 หลัก');
      return;
    }

    this.isSearching = true;
    this.searchResult = '';
    this.showForm = false;
    this.nstData = null;

    this.nstService.searchNstDetail(pid, nstId).subscribe({
      next: (data) => {
        this.isSearching = false;
        if (data && data.regPid) {
          this.nstData = data;
          this.showForm = true;
          this.searchResult = 'found';
        } else {
          this.searchResult = 'notfound';
        }
      },
      error: (err) => {
        this.isSearching = false;
        console.error('Error searching NST:', err);
        this.searchResult = 'notfound';
      }
    });
  }

  // ปิด/รีเซ็ต (จาก resetPage ใน JSP)
  resetPage(): void {
    this.showForm = false;
    this.nstData = null;
    this.searchResult = '';
  }

  getSexDisplay(): string {
    if (!this.nstData) return '';
    return this.nstData.regSex === 'M' ? 'ชาย' : this.nstData.regSex === 'F' ? 'หญิง' : '';
  }

  getNstStatusDesc(): string {
    if (!this.nstData?.nstStatusId) return '';
    const id = String(this.nstData.nstStatusId).trim();
    const hit = this.nstStatusList.find(s => String(s.id ?? '').trim() === id);
    if (hit?.desc?.trim()) return hit.desc.trim();
    return id;
  }

  get statusHistoryRows(): NstStatusHistoryItem[] {
    return this.nstData?.statusHistory ?? [];
  }
}
