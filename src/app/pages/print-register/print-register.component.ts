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
import { AuthService } from '../../services/auth.service';
import { DashboardService } from '../../services/dashboard.service';
import { NstRegisterService, NstRegister } from '../../services/nst-register.service';
import { DialogService } from '../../services/dialog.service';

@Component({
  selector: 'app-print-register',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
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
  nstList: NstRegister[] = [];
  isLoading: boolean = false;
  searched: boolean = false;
  checkAll: boolean = false;
  selectedPids: Set<string> = new Set();

  constructor(
    private authService: AuthService,
    private dashboardService: DashboardService,
    private nstService: NstRegisterService,
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

    this.prepareClass();
  }

  prepareClass(): void {
    if (this.psnStatus === '0') {
      this.classOptions = ['1', '2', '3', '4', '5'];
    } else if (this.psnStatus.includes('5')) {
      this.classOptions = ['2', '3', '4', '5'];
    } else if (this.psnStatus.includes('2')) {
      this.classOptions = ['1', '2', '3', '4', '5'];
    } else {
      this.classOptions = ['1', '2', '3', '4', '5'];
    }
    this.atClass = this.classOptions.length > 0 ? this.classOptions[0] : '';
  }

  search(): void {
    if (!this.schoolId) return;
    this.isLoading = true;
    this.searched = true;
    this.selectedPids.clear();
    this.checkAll = false;

    this.nstService.searchNst(this.schoolId, this.currentYear, '', this.atClass, this.sex, '', '', this.psnStatus).subscribe({
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
    this.checkAll = this.selectedPids.size === this.nstList.length;
  }

  isSelected(pid: string): boolean {
    return this.selectedPids.has(pid);
  }

  async printSelected(): Promise<void> {
    if (this.selectedPids.size === 0) {
      await this.dialogService.alert('กรุณาเลือก นศท. ที่ต้องการพิมพ์ใบสมัคร');
      return;
    }
    const pids = Array.from(this.selectedPids);
    const url = `print_register_form.jsp?pids=${pids.join(',')}&year=${this.currentYear}&schoolId=${this.schoolId}`;
    window.open(url, '_blank');
  }
}
