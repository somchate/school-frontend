import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../services/auth.service';
import { DashboardService } from '../../services/dashboard.service';
import { WaitingRightsService, WaitingRightsNst, WaitingRightsProcessData } from '../../services/waiting-rights.service';
import { DialogService } from '../../services/dialog.service';

@Component({
  selector: 'app-nst-waiting-rights',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatTableModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatDividerModule
  ],
  templateUrl: './nst-waiting-rights.component.html',
  styleUrls: ['./nst-waiting-rights.component.scss']
})
export class NstWaitingRightsComponent implements OnInit {
  schoolId: string = '';
  schoolName: string = '';
  currentYear: string = '';

  // ค้นหา (จาก queryForm ใน nst_waiting_rights.jsp)
  searchPid: string = '';
  searchFname: string = '';
  searchLname: string = '';
  hasSearched: boolean = false;

  // ผลลัพธ์
  waitingList: WaitingRightsNst[] = [];
  isLoading: boolean = false;

  // Inline process form (จาก nst_waiting_rights_process.jsp)
  showProcessForm: boolean = false;
  isLoadingProcess: boolean = false;
  processData: WaitingRightsProcessData | null = null;
  processWaiting: boolean = false;
  processRemark: string = '';
  processNote: string = '';
  processErrorText: string = '';

  // เหตุผล dropdown options (จาก nst_waiting_rights_process.jsp)
  remarkOptions: string[] = [
    'ไปต่างประเทศ',
    'ป่วย',
    'ย้ายสถานศึกษา',
    'เรียนไม่ตรงชั้นปี',
    'อื่นๆ'
  ];

  constructor(
    private authService: AuthService,
    private dashboardService: DashboardService,
    private waitingService: WaitingRightsService,
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
  }

  // ค้นหา (จาก checkNull + queryForm ใน JSP)
  async search(): Promise<void> {
    if (!this.searchPid && !this.searchFname && !this.searchLname) {
      await this.dialogService.alert('กรุณากรอกข้อมูลเพื่อทำการค้นหา');
      return;
    }
    if (this.searchPid && this.searchPid.length > 0 && this.searchPid.length < 13) {
      await this.dialogService.alert('กรุณากรอกข้อมูล เลขประจำตัวประชาชน ให้ครบ 13 หลัก');
      return;
    }
    if (!this.schoolId) return;

    this.isLoading = true;
    this.hasSearched = true;
    this.showProcessForm = false;
    this.processData = null;

    this.waitingService.searchWaitingRights(
      this.schoolId,
      this.searchPid || undefined,
      this.searchFname || undefined,
      this.searchLname || undefined
    ).subscribe({
      next: (data) => { this.waitingList = data || []; this.isLoading = false; },
      error: () => { this.waitingList = []; this.isLoading = false; }
    });
  }

  getFullName(w: WaitingRightsNst): string {
    return `${w.regTitle || ''}${w.regFname || ''}  ${w.regLname || ''}`;
  }

  // แสดงสถานะเป็น bold ถ้า status D* หรือ E* ปีปัจจุบัน (จาก JSP logic)
  isStatusBold(w: WaitingRightsNst): boolean {
    return !w.canProcess;
  }

  // คลิก nstId → ไปหน้า process (จาก nst_waiting_rights_process.jsp)
  openProcess(w: WaitingRightsNst): void {
    if (!w.canProcess) return;

    this.isLoadingProcess = true;
    this.showProcessForm = true;
    this.processData = null;
    this.processWaiting = false;
    this.processRemark = '';
    this.processNote = '';
    this.processErrorText = '';

    this.waitingService.getProcessData(w.regPid).subscribe({
      next: (data) => {
        this.isLoadingProcess = false;
        this.processData = data;
      },
      error: () => {
        this.isLoadingProcess = false;
        // fallback จากข้อมูล list
        this.processData = {
          regPid: w.regPid,
          nstId: w.nstId,
          name: this.getFullName(w),
          atClass: w.nstAtClass,
          schoolId: this.schoolId,
          atYear: this.currentYear,
          waiting: false,
          remark: '',
          note: ''
        };
      }
    });
  }

  // บันทึกขอรอรับสิทธิ (จาก checkNull + editForm ใน process.jsp)
  async saveProcess(): Promise<void> {
    if (!this.processWaiting) {
      await this.dialogService.alert('กรุณาเลือกช่อง ขอรอรับสิทธิ์ ก่อนการบันทึก');
      return;
    }
    if (!this.processRemark) {
      await this.dialogService.alert('กรุณาเลือก เหตุผล ก่อนการบันทึก');
      return;
    }
    if (this.processRemark === 'อื่นๆ' && !this.processNote) {
      await this.dialogService.alert('กรุณากรอกช่อง อื่นๆ ระบุ ก่อนการบันทึก');
      return;
    }
    // ถ้าเหตุผลไม่ใช่ "อื่นๆ" ให้เคลียร์ note (จาก JSP)
    if (this.processRemark !== 'อื่นๆ') {
      this.processNote = '';
    }

    if (!this.processData) return;

    const saveData: WaitingRightsProcessData = {
      ...this.processData,
      waiting: this.processWaiting,
      remark: this.processRemark,
      note: this.processNote
    };

    this.waitingService.saveProcess(saveData).subscribe({
      next: async () => {
        await this.dialogService.alert('ระบบได้ทำการบันทึกข้อมูล เรียบร้อยแล้ว');
        this.goBackToList();
      },
      error: async () => {
        await this.dialogService.alert('ระบบไม่สามารถทำการบันทึกข้อมูล ได้ในขณะนี้');
      }
    });
  }

  // ยกเลิกรายการ (จาก confirmCancel ใน JSP)
  async confirmCancel(w: WaitingRightsNst): Promise<void> {
    if (!w.canCancel) return;
    const name = this.getFullName(w);
    const ok = await this.dialogService.confirm(`ท่านต้องการยกเลิกรายการขอรอรับสิทธินี้หรือไม่?\n\n${w.nstId} ${name}`);
    if (!ok) return;

    this.waitingService.cancelWaitingRights(w.regPid).subscribe({
      next: async () => {
        await this.dialogService.alert('ยกเลิกรายการเรียบร้อยแล้ว');
        this.search();
      },
      error: async () => {
        await this.dialogService.alert('ระบบไม่สามารถยกเลิกรายการได้ในขณะนี้');
      }
    });
  }

  // กลับไป list (จาก backForm ใน JSP)
  goBackToList(): void {
    this.showProcessForm = false;
    this.processData = null;
    if (this.hasSearched) this.search();
  }
}
