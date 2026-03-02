import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { NstRegisterService, NstDetailData, LookupItem } from '../../services/nst-register.service';
import { DashboardService } from '../../services/dashboard.service';
import { DialogService } from '../../services/dialog.service';

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
    MatSelectModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatCheckboxModule
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

  // Lookup data
  nstStatusList: LookupItem[] = [];
  natList: LookupItem[] = [];
  relegList: LookupItem[] = [];
  employmentList: LookupItem[] = [];

  isSaving: boolean = false;

  constructor(
    private authService: AuthService,
    private nstService: NstRegisterService,
    private dashboardService: DashboardService,
    private dialogService: DialogService
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
      }
    });

    this.loadLookups();
  }

  loadLookups(): void {
    forkJoin({
      nstStatus: this.nstService.getNstStatusList(),
      nat: this.nstService.getNatList(),
      releg: this.nstService.getRelegList(),
      employment: this.nstService.getEmploymentList()
    }).subscribe({
      next: (result) => {
        this.nstStatusList = result.nstStatus;
        this.natList = result.nat;
        this.relegList = result.releg;
        this.employmentList = result.employment;
      },
      error: (err) => console.error('Error loading lookups:', err)
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

    this.nstService.searchNstDetail(pid, nstId, this.schoolId).subscribe({
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

  // บันทึก (จาก checkNull ใน JSP)
  async saveForm(): Promise<void> {
    if (!this.nstData) return;

    if (!this.nstData.nstAtClass || !this.nstData.nstStatusId) {
      await this.dialogService.alert('กรุณาเลือกชั้นปีการศึกษา / สถานะ นศท. และโรงเรียน ให้ครบ!!!');
      return;
    }

    // ตรวจสอบ email
    if (this.nstData.regEmail) {
      const emailFilter = /^.+@.+\..{2,3}$/;
      if (!emailFilter.test(this.nstData.regEmail)) {
        await this.dialogService.alert('ท่านใส่อีเมล์ไม่ถูกต้อง');
        return;
      }
    }

    this.isSaving = true;
    this.nstService.saveNstDetail(this.nstData).subscribe({
      next: async () => {
        this.isSaving = false;
        await this.dialogService.alert('บันทึกข้อมูล นศท. สำเร็จ');
      },
      error: async (err) => {
        this.isSaving = false;
        console.error('Error saving NST:', err);
        await this.dialogService.alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
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
}
