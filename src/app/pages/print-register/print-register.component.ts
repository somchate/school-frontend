import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTableModule } from '@angular/material/table';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { DashboardService } from '../../services/dashboard.service';
import { NstRegisterService, NstRegister } from '../../services/nst-register.service';
import { DialogService } from '../../services/dialog.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-print-register',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    MatCardModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
    MatTooltipModule,
    MatTableModule
  ],
  templateUrl: './print-register.component.html',
  styleUrls: ['./print-register.component.scss']
})
export class PrintRegisterComponent implements OnInit {
  schoolId: string = '';
  schoolName: string = '';
  currentYear: string = '';

  displayedColumns: string[] = ['select', 'idx', 'pid', 'nstId', 'name', 'birth', 'print'];

  psnStatus: string = '0';
  atClass: string = '';
  sex: string = '';

  psnStatusOptions = [
    { value: '0', label: 'สมัครใหม่' },
    { value: '5', label: 'เลื่อนชั้น' },
    { value: '2', label: 'ซ้ำชั้น' },
    { value: 'E5', label: 'รอรับสิทธิ --> เลื่อนชั้น', group: 'รอรับสิทธิ' },
    { value: 'E2', label: 'รอรับสิทธิ --> ซ้ำชั้น', group: 'รอรับสิทธิ' },
    { value: '35', label: 'โอนย้าย --> เลื่อนชั้น', group: 'โอนย้าย' },
    { value: '32', label: 'โอนย้าย --> ซ้ำชั้น', group: 'โอนย้าย' },
    { value: '3E5', label: 'โอนย้าย --> รอรับสิทธิ --> เลื่อนชั้น', group: 'โอนย้าย' },
    { value: '3E2', label: 'โอนย้าย --> รอรับสิทธิ --> ซ้ำชั้น', group: 'โอนย้าย' }
  ];

  classOptions: string[] = [];
  showAtClass: boolean = false;
  nstList: NstRegister[] = [];
  isLoading: boolean = false;
  searched: boolean = false;
  checkAll: boolean = false;
  selectedPids: Set<string> = new Set();

  constructor(
    private authService: AuthService,
    private dashboardService: DashboardService,
    private nstService: NstRegisterService,
    private dialogService: DialogService,
    private http: HttpClient
  ) {}

  private getAuthHeaders(): HttpHeaders | undefined {
    const token = this.authService.getToken();
    return token ? new HttpHeaders().set('Authorization', `Bearer ${token}`) : undefined;
  }

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

    this.prepareClass();
  }

  prepareClass(): void {
    // Port จาก legacy print_register.jsp: prepareClass() + SQL builder
    //   PsnStatus = '0' (สมัครใหม่)    → ซ่อนชั้นปี (ไม่ใช้ filter NST_AT_CLASS)
    //   PsnStatus ลงท้าย '5' (เลื่อนชั้น) → ชั้นปี (ใหม่) 2-5 (disable ชั้น 1)
    //   อื่นๆ                         → ชั้นปี 1-5
    if (this.psnStatus === '0') {
      this.showAtClass = false;
      this.classOptions = [];
      this.atClass = '';
      this.sex = ''; // reset เพศให้เลือกใหม่
    } else if (this.psnStatus.endsWith('5')) {
      this.showAtClass = true;
      this.classOptions = ['2', '3', '4', '5'];
      if (!this.classOptions.includes(this.atClass)) {
        this.atClass = '2';
      }
    } else {
      this.showAtClass = true;
      this.classOptions = ['1', '2', '3', '4', '5'];
      if (!this.classOptions.includes(this.atClass)) {
        this.atClass = '1';
      }
    }
  }

  get canSearch(): boolean {
    if (this.sex === '') return false;
    if (this.psnStatus !== '0' && this.atClass === '') return false;
    return true;
  }

  search(): void {
    if (!this.schoolId) return;
    this.isLoading = true;
    this.searched = true;
    this.selectedPids.clear();
    this.checkAll = false;

    // Legacy: ถ้า PsnStatus ลงท้าย '5' ใช้ atClass-1 ใน query
    //   (เพราะ MIA_NST_REGISTER บันทึก NST_AT_CLASS = ชั้นเดิม ไม่ใช่ชั้นใหม่)
    //   (print_register.jsp line 48)
    let queryAtClass = this.atClass;
    if (this.psnStatus !== '0' && this.psnStatus.endsWith('5') && this.atClass) {
      queryAtClass = String(Number(this.atClass) - 1);
    }
    // psnStatus='0' → ไม่ใช้ atClass (legacy SQL ไม่ได้ filter NST_AT_CLASS)
    if (this.psnStatus === '0') {
      queryAtClass = '';
    }

    this.nstService.searchNst(this.schoolId, this.currentYear, '', queryAtClass, this.sex, '', '', this.psnStatus).subscribe({
      next: (data) => { this.nstList = data || []; this.isLoading = false; },
      error: () => { this.nstList = []; this.isLoading = false; }
    });
  }

  getFullName(n: NstRegister): string {
    return `${n.regTitle || ''} ${n.regFname || ''} ${n.regLname || ''}`.trim();
  }

  toggleAll(): void {
    if (this.checkAll) {
      this.nstList.forEach(n => this.selectedPids.add(n.regPid));
    } else {
      this.selectedPids.clear();
    }
  }

  toggleOne(pid: string): void {
    if (this.selectedPids.has(pid)) {
      this.selectedPids.delete(pid);
    } else {
      this.selectedPids.add(pid);
    }
    this.checkAll = this.nstList.length > 0
      && this.nstList.every(n => this.selectedPids.has(n.regPid));
  }

  isSelected(pid: string): boolean {
    return this.selectedPids.has(pid);
  }

  printOne(pid: string): void {
    const body = {
      pid,
      psnStatus: this.psnStatus,
      year: this.currentYear
    };
    const headers = this.getAuthHeaders();

    this.http.post(`${environment.apiUrl}/nst/report/rd`, body, { responseType: 'blob', headers }).subscribe({
      next: (blob) => {
        this.downloadBlob(blob, `rd_${pid}.pdf`);
      },
      error: async (err) => {
        console.error('Error generating RD report:', err);
        await this.dialogService.alert('เกิดข้อผิดพลาดในการสร้างรายงาน');
      }
    });
  }

  async printSelected(): Promise<void> {
    if (this.selectedPids.size === 0) {
      await this.dialogService.alert('กรุณาเลือก นศท. ที่ต้องการพิมพ์ใบสมัคร');
      return;
    }

    const pids = Array.from(this.selectedPids);
    const body = {
      pids,
      schoolId: this.schoolId,
      schoolName: this.schoolName,
      atClass: this.atClass,
      sex: this.sex,
      psnStatus: this.psnStatus,
      year: this.currentYear
    };

    const headers = this.getAuthHeaders();

    this.http.post(`${environment.apiUrl}/nst/report/register`, body, { responseType: 'blob', headers }).subscribe({
      next: (blob) => {
        this.downloadBlob(blob, `register_${this.currentYear}.pdf`);
      },
      error: async (err) => {
        console.error('Error generating report:', err);
        await this.dialogService.alert('เกิดข้อผิดพลาดในการสร้างรายงาน');
      }
    });
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }
}
