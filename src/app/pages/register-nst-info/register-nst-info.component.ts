import { Component, OnInit } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatTableModule } from '@angular/material/table';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { AuthService } from '../../services/auth.service';
import { NstRegisterService, NstRegister, SchoolOption, LookupItem } from '../../services/nst-register.service';
import { DashboardService } from '../../services/dashboard.service';
import { DialogService } from '../../services/dialog.service';

// สีพื้นหลังตามประเภทบัญชี (จาก register_nst_info.jsp lines 39)
const STATUS_COLORS: Record<string, string> = {
  A1: '#F0FFF0', // Honeydew - เลื่อนชั้น
  A2: '#FAF0E6', // Linen - ซ้ำชั้น
  A3: '#F0FFFF', // Azure - รอรับสิทธิ → เลื่อนชั้น
  A4: '#FFFAFA', // Snow - รอรับสิทธิ → ซ้ำชั้น
  A5: '#F0F8FF', // Aliceblue - โอนย้าย → เลื่อนชั้น
  A6: '#FDF5E6', // Oldlace - โอนย้าย → ซ้ำชั้น
  A7: '#F8F8FF', // Ghostwhite - โอนย้าย → รอรับสิทธิ → เลื่อนชั้น
  A8: '#FFFFF0', // Ivory - โอนย้าย → รอรับสิทธิ → ซ้ำชั้น
};

const STATUS_LABELS: Record<string, string> = {
  A1: 'เลื่อนชั้น',
  A2: 'ซ้ำชั้น',
  A3: 'รอรับสิทธิ → เลื่อนชั้น',
  A4: 'รอรับสิทธิ → ซ้ำชั้น',
  A5: 'โอนย้าย → เลื่อนชั้น',
  A6: 'โอนย้าย → ซ้ำชั้น',
  A7: 'โอนย้าย → รอรับสิทธิ → เลื่อนชั้น',
  A8: 'โอนย้าย → รอรับสิทธิ → ซ้ำชั้น',
};

interface NstListItem {
  pid: string;
  nstId: string;
  statusId: string;
  rd25: string;
  name: string;
  bgColor: string;
  groupLabel: string;
  atYear: string;
  atClass: string;
  raw: NstRegister;
}

@Component({
  selector: 'app-register-nst-info',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatTableModule,
    MatAutocompleteModule
  ],
  templateUrl: './register-nst-info.component.html',
  styleUrls: ['./register-nst-info.component.scss']
})
export class RegisterNstInfoComponent implements OnInit {
  currentYear: string = '';
  schoolId: string = '';
  schoolName: string = '';

  // ตัวกรองค้นหา (จาก register_nst_info.jsp)
  nstStatus: string = '';
  filterSex: string = '';
  filterAtClass: string = '';
  isLoading: boolean = false;
  hasSearched: boolean = false;
  MAX_PER_TRANSACTION = 15;

  // รายชื่อ นศท. ระหว่างรายงานตัว (ขวา - rs_req)
  reqList: NstListItem[] = [];
  selectedReqItems: Set<string> = new Set();

  // รายชื่อ นศท. ยังไม่ได้รายงานตัว (ซ้าย - rs_nreq)
  nreqList: NstListItem[] = [];
  selectedNReqItems: Set<string> = new Set();

  nreqDisplayedColumns: string[] = ['idx', 'rd25', 'nstId', 'name'];
  reqDisplayedColumns: string[] = ['idx', 'rd25', 'nstId', 'name'];

  // โอนย้ายเข้า
  showTransferSection: boolean = false;
  transferRegId: string = '';
  transferProvinceId: string = '';
  transferProvinceFilterText: string = '';
  transferSchoolId: string = '';
  transferSchoolName: string = '';
  transferSchoolFilterText: string = '';
  transferSchoolOptions: SchoolOption[] = [];
  transferProvinceOptions: LookupItem[] = [];
  transferNstInfo: any = null;
  transferDoc: string = '';

  // ชั้นปี (เดิม) — ตาม register_nst_info.jsp: for (int i=1; i<6; i++) ครบทุกชั้น 1–5
  classYears: string[] = ['1', '2', '3', '4', '5'];

  // ตัวเลือกประเภทบัญชี (จาก register_nst_info.jsp lines 262-275)
  nstStatusOptions = [
    { value: '*', label: '--- ทั้งหมด ---', color: '' },
    { value: '5', label: 'เลื่อนชั้น', color: STATUS_COLORS['A1'] },
    { value: '2', label: 'ซ้ำชั้น', color: STATUS_COLORS['A2'] },
    { value: 'E5', label: 'รอรับสิทธิ → เลื่อนชั้น', color: STATUS_COLORS['A3'], group: 'รอรับสิทธิ' },
    { value: 'E2', label: 'รอรับสิทธิ → ซ้ำชั้น', color: STATUS_COLORS['A4'], group: 'รอรับสิทธิ' },
    { value: '35', label: 'โอนย้าย → เลื่อนชั้น', color: STATUS_COLORS['A5'], group: 'โอนย้าย' },
    { value: '32', label: 'โอนย้าย → ซ้ำชั้น', color: STATUS_COLORS['A6'], group: 'โอนย้าย' },
    { value: '3E5', label: 'โอนย้าย → รอรับสิทธิ → เลื่อนชั้น', color: STATUS_COLORS['A7'], group: 'โอนย้าย' },
    { value: '3E2', label: 'โอนย้าย → รอรับสิทธิ → ซ้ำชั้น', color: STATUS_COLORS['A8'], group: 'โอนย้าย' },
  ];

  constructor(
    private authService: AuthService,
    private nstRegisterService: NstRegisterService,
    private dashboardService: DashboardService,
    private dialogService: DialogService
  ) {}

  ngOnInit(): void {
    this.dashboardService.getYearEducate().subscribe({
      next: (data) => { this.currentYear = data.yearEducate || ''; this.onReady(); },
      error: () => {
        const n = new Date(); let y = n.getFullYear() + 543;
        if (n.getMonth() < 4) { y--; }
        this.currentYear = y.toString(); this.onReady();
      }
    });
  }

  onReady(): void {
    this.authService.currentUser.subscribe(user => {
      if (user) {
        this.schoolId = user.schoolId || '';
        this.schoolName = user.schoolName || user.schoolId || '';
      }
    });

    this.nstRegisterService.getSchoolList().subscribe({
      next: (list) => {
        this.transferSchoolOptions = list || [];
      },
      error: (err) => {
        console.error('Error loading school list:', err);
        this.transferSchoolOptions = [];
      }
    });

    this.nstRegisterService.getProvinceList().subscribe({
      next: (list) => {
        this.transferProvinceOptions = list || [];
      },
      error: (err) => {
        console.error('Error loading province list:', err);
        this.transferProvinceOptions = [];
      }
    });
  }

  clearResults(): void {
    this.reqList = [];
    this.nreqList = [];
    this.selectedReqItems.clear();
    this.selectedNReqItems.clear();
    this.hasSearched = false;
    this.transferNstInfo = null;
  }

  onAtClassChange(): void {
    this.filterSex = '';
    this.nstStatus = '';
    this.clearResults();
  }

  onSexChange(): void {
    this.nstStatus = '';
    this.clearResults();
  }

  // เป็นประเภทโอนย้าย (3x) หรือ ทั้งหมด (*) - แสดง section โอนย้ายเข้า
  get isTransferMode(): boolean {
    return this.nstStatus === '*' || this.nstStatus.startsWith('3');
  }

  // เป็นประเภทที่แสดง list ยังไม่ได้รายงานตัว (ซ้าย)
  get showNReqList(): boolean {
    return this.nstStatus === '*' || this.nstStatus === '5' || this.nstStatus === '2' ||
           this.nstStatus.startsWith('E');
  }

  // พิมพ์บัญชี disabled เมื่อเลือก "ทั้งหมด"
  get printDisabled(): boolean {
    return this.nstStatus === '*';
  }

  get canSearch(): boolean {
    return !!(this.filterAtClass && this.filterSex && this.nstStatus);
  }

  // ค้นหา (Submit)
  async search(): Promise<void> {
    if (!this.schoolId) {
      await this.dialogService.alert('ไม่พบข้อมูลสถานศึกษา');
      return;
    }

    this.isLoading = true;
    this.hasSearched = true;
    this.reqList = [];
    this.nreqList = [];
    this.selectedReqItems.clear();
    this.selectedNReqItems.clear();
    this.transferNstInfo = null;

    const req$ = this.nstRegisterService.searchReq(this.schoolId, this.currentYear, this.filterAtClass, this.filterSex, this.nstStatus);
    const nreq$ = this.showNReqList
      ? this.nstRegisterService.searchNReq(this.schoolId, this.currentYear, this.filterAtClass, this.filterSex, this.nstStatus)
      : of([] as NstRegister[]);

    forkJoin({ req: req$, nreq: nreq$ }).subscribe({
      next: ({ req, nreq }) => {
        this.reqList = this.mapToListItems(req);
        this.nreqList = this.mapToListItems(nreq);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading lists:', err);
        this.isLoading = false;
      }
    });
  }

  private mapToListItems(data: NstRegister[]): NstListItem[] {
    return this.sortListItems(data.map(n => this.toListItem(n)));
  }

  private toListItem(n: NstRegister): NstListItem {
    return {
      pid: (n.regPid || '').trim(),
      nstId: (n.nstId || '').trim(),
      statusId: (n.nstStatusId || '').trim(),
      rd25: n.nstRd25 != null ? String(n.nstRd25).trim() : '',
      name: `${(n.regTitle || '').trim()} ${(n.regFname || '').trim()} ${(n.regLname || '').trim()}`.trim(),
      bgColor: STATUS_COLORS[n.nstStatusId] || '#FFFFFF',
      groupLabel: STATUS_LABELS[n.nstStatusId] || '',
      atYear: n.atYear != null ? String(n.atYear).trim() : '',
      atClass: n.nstAtClass != null ? String(n.nstAtClass).trim() : '',
      raw: n
    };
  }

  private sortListItems(items: NstListItem[]): NstListItem[] {
    return [...items].sort((left, right) => {
      const leftRd25 = Number(left.rd25 || '0');
      const rightRd25 = Number(right.rd25 || '0');
      if (leftRd25 !== rightRd25) {
        return leftRd25 - rightRd25;
      }
      const nstIdCompare = left.nstId.localeCompare(right.nstId);
      if (nstIdCompare !== 0) {
        return nstIdCompare;
      }
      return left.name.localeCompare(right.name, 'th');
    });
  }

  private getReqStatusForCurrentFilter(): string | null {
    switch (this.nstStatus) {
      case '5':
        return 'A1';
      case '2':
        return 'A2';
      case 'E5':
        return 'A3';
      case 'E2':
        return 'A4';
      case '35':
        return 'A5';
      case '32':
        return 'A6';
      case '3E5':
        return 'A7';
      case '3E2':
        return 'A8';
      default:
        return null;
    }
  }

  private getNReqStatusForCurrentFilter(): string | null {
    switch (this.nstStatus) {
      case '5':
        return `5${this.filterAtClass}`;
      case '2':
        return `2${this.filterAtClass}`;
      case 'E5':
        return 'E1';
      case 'E2':
        return 'E2';
      default:
        return null;
    }
  }

  private toReqListItem(item: NstListItem): NstListItem {
    const nextStatusId = this.getReqStatusForCurrentFilter() || item.statusId;
    return this.toListItem({
      ...item.raw,
      nstStatusId: nextStatusId,
      atYear: this.currentYear,
      nstAtClass: this.filterAtClass
    });
  }

  private toNReqListItem(item: NstListItem): NstListItem | null {
    const nextStatusId = this.getNReqStatusForCurrentFilter();
    if (!nextStatusId) {
      return null;
    }
    return this.toListItem({
      ...item.raw,
      nstStatusId: nextStatusId,
      atYear: String(Number(this.currentYear) - 1),
      nstAtClass: this.filterAtClass
    });
  }

  // แสดงข้อความใน list item: [RD25] NstId ชื่อ
  getItemDisplay(item: NstListItem): string {
    const rd25Part = item.rd25 && item.rd25 !== '0' ? `[${item.rd25}] ` : '';
    return `${rd25Part}${item.nstId} ${item.name}`;
  }

  // toggle selection ใน list (รองรับ multi-select ด้วย Ctrl/Shift)
  toggleNReqSelection(pid: string): void {
    // เลือกฝั่งซ้ายแล้วเคลียร์ฝั่งขวา เพื่อให้ active เฉพาะลูกศรฝั่งที่กำลังย้าย
    this.selectedReqItems.clear();
    if (this.selectedNReqItems.has(pid)) {
      this.selectedNReqItems.delete(pid);
    } else {
      this.selectedNReqItems.add(pid);
    }
  }

  toggleReqSelection(pid: string): void {
    // เลือกฝั่งขวาแล้วเคลียร์ฝั่งซ้าย เพื่อให้ active เฉพาะลูกศรฝั่งที่กำลังย้าย
    this.selectedNReqItems.clear();
    if (this.selectedReqItems.has(pid)) {
      this.selectedReqItems.delete(pid);
    } else {
      this.selectedReqItems.add(pid);
    }
  }

  isNReqSelected(pid: string): boolean {
    return this.selectedNReqItems.has(pid);
  }

  isReqSelected(pid: string): boolean {
    return this.selectedReqItems.has(pid);
  }

  get canMoveToReq(): boolean {
    return this.selectedNReqItems.size > 0 && !this.isLoading;
  }

  get canMoveFromReq(): boolean {
    return this.selectedReqItems.size > 0 && !this.isLoading;
  }

  // เปิดปุ่ม ยกเลิกโอนย้าย เมื่อเลือกแถวที่โอนย้ายเข้า (status A5/A6/A7/A8)
  get canCancelTransfer(): boolean {
    if (this.selectedReqItems.size === 0 || this.isLoading) return false;
    return Array.from(this.selectedReqItems).every(pid => {
      const item = this.reqList.find(r => r.pid === pid);
      return !!item && /^A[5-8]$/.test(item.statusId);
    });
  }

  // ยกเลิกโอนย้าย นศท. เข้า — ใช้ flow เดียวกับ legacy "Delete" (register_nst_info_edit.jsp)
  // ไปเรียก removeFromReq — DELETE SIA_NST_STATUS ในปีปัจจุบัน และ rollback MIA_NST_REGISTER จากปีก่อน
  async cancelTransferSelected(): Promise<void> {
    if (!this.canCancelTransfer) return;
    const count = this.selectedReqItems.size;
    const ok = await this.dialogService.confirm(`ยืนยันยกเลิกการโอนย้าย นศท. จำนวน ${count} รายการ?`);
    if (!ok) return;

    // รูปแบบ "pid_statusId" ตาม NstReqList ของ legacy
    const nstReqList = Array.from(this.selectedReqItems)
      .map(pid => {
        const item = this.reqList.find(r => r.pid === pid);
        return item ? pid + '_' + item.statusId : null;
      })
      .filter((v): v is string => v !== null);
    if (nstReqList.length === 0) return;

    this.isLoading = true;
    this.nstRegisterService.removeFromReq(nstReqList, this.filterAtClass, this.filterSex).subscribe({
      next: async () => {
        this.reqList = this.reqList.filter(item => !this.selectedReqItems.has(item.pid));
        this.selectedReqItems.clear();
        this.isLoading = false;
        await this.dialogService.alert(`ยกเลิกการโอนย้าย ${count} รายการ สำเร็จ`);
      },
      error: async (err) => {
        this.isLoading = false;
        console.error('cancelTransfer error:', err);
        await this.dialogService.alert('เกิดข้อผิดพลาดในการยกเลิกโอนย้าย');
      }
    });
  }

  // ดับเบิ้ลคลิก → แสดงข้อมูล นศท. (จาก showNSTInfo ใน JSP)
  showNstInfo(item: NstListItem): void {
    const statusLabel = STATUS_LABELS[item.statusId] || item.statusId;
    const classLabel = item.atClass ? ` ปีที่ ${item.atClass}` : '';
    const yearLabel = item.atYear ? `ปีการศึกษา ${item.atYear}` : '-';
    this.dialogService.alert(
      `ข้อมูล นศท.\n\n` +
      `เลข ปชช.: ${item.pid}\n` +
      `รหัส นศท.: ${item.nstId}\n` +
      `ชื่อ: ${item.name}\n` +
      `${yearLabel}\n` +
      `สถานะ: ${statusLabel}${classLabel}`
    );
  }

  // นำ นศท. เข้ารายงานตัว (ซ้าย → ขวา) (จาก checkAddNull ใน JSP)
  async addToReq(): Promise<void> {
    if (this.selectedNReqItems.size === 0) {
      await this.dialogService.alert('กรุณาเลือกรายการ นศท. ที่ต้องการนำเข้าการรายงานตัว!!');
      return;
    }
    if (this.selectedNReqItems.size > this.MAX_PER_TRANSACTION) {
      await this.dialogService.alert(`ระบบได้จำกัดจำนวนในการดำเนินการ ครั้งละไม่เกิน ${this.MAX_PER_TRANSACTION} รายการ\nกรุณาเลือกรายการใหม่`);
      return;
    }
    const count = this.selectedNReqItems.size;
    const ok = await this.dialogService.confirm(`ยืนยันนำ นศท. เข้าการรายงานตัว จำนวน ${count} รายการ?`);
    if (!ok) return;

    const pids = Array.from(this.selectedNReqItems);
    this.isLoading = true;
    this.nstRegisterService.addToReq(pids, this.nstStatus, this.filterAtClass, this.filterSex).subscribe({
      next: async () => {
        const movedItems = this.nreqList.filter(item => this.selectedNReqItems.has(item.pid));
        const updatedReqItems = movedItems.map(item => this.toReqListItem(item));

        this.nreqList = this.nreqList.filter(item => !this.selectedNReqItems.has(item.pid));
        this.reqList = this.sortListItems([...this.reqList, ...updatedReqItems]);
        this.selectedNReqItems.clear();
        this.isLoading = false;
        await this.dialogService.alert(`นำ นศท. เข้ารายงานตัว ${count} รายการ สำเร็จ`);
      },
      error: async (err) => {
        this.isLoading = false;
        console.error('Error adding to req:', err);
        await this.dialogService.alert('เกิดข้อผิดพลาดในการดำเนินการ');
      }
    });
  }

  // นำ นศท. ออกจากรายงานตัว (ขวา → ซ้าย) (จาก checkDelNull ใน JSP)
  async removeFromReq(): Promise<void> {
    if (this.selectedReqItems.size === 0) {
      await this.dialogService.alert('กรุณาเลือกรายการ นศท. ที่ต้องการนำออกจากการรายงานตัว!!');
      return;
    }
    if (this.selectedReqItems.size > this.MAX_PER_TRANSACTION) {
      await this.dialogService.alert(`ระบบได้จำกัดจำนวนในการดำเนินการ ครั้งละไม่เกิน ${this.MAX_PER_TRANSACTION} รายการ\nกรุณาเลือกรายการใหม่`);
      return;
    }
    const count = this.selectedReqItems.size;
    const ok = await this.dialogService.confirm(`ยืนยันนำ นศท. ออกจากการรายงานตัว จำนวน ${count} รายการ?`);
    if (!ok) return;

    // สร้าง nstReqList = ["pid_statusId", ...] ตรงตาม NstReqList value ของ JSP legacy
    // โดย lookup statusId จาก reqList (ไม่เก็บไว้ใน selectedReqItems เพื่อหลีกเลี่ยง stale data)
    const nstReqList = Array.from(this.selectedReqItems)
      .map(pid => {
        const item = this.reqList.find(r => r.pid === pid);
        return item ? pid + '_' + item.statusId : null;
      })
      .filter((v): v is string => v !== null);
    if (nstReqList.length === 0) return;
    this.isLoading = true;
    this.nstRegisterService.removeFromReq(nstReqList, this.filterAtClass, this.filterSex).subscribe({
      next: async () => {
        const movedItems = this.reqList.filter(item => this.selectedReqItems.has(item.pid));
        const restoredItems = this.showNReqList
          ? movedItems
              .map(item => this.toNReqListItem(item))
              .filter((item): item is NstListItem => item !== null)
          : [];

        this.reqList = this.reqList.filter(item => !this.selectedReqItems.has(item.pid));
        if (restoredItems.length > 0) {
          this.nreqList = this.sortListItems([...this.nreqList, ...restoredItems]);
        }
        this.selectedReqItems.clear();
        this.isLoading = false;
        await this.dialogService.alert(`นำ นศท. ออกจากรายงานตัว ${count} รายการ สำเร็จ`);
      },
      error: async (err) => {
        this.isLoading = false;
        console.error('Error removing from req:', err);
        await this.dialogService.alert('เกิดข้อผิดพลาดในการดำเนินการ');
      }
    });
  }

  // ค้นหา นศท. โอนย้ายเข้า (จาก doneQueryNstForm ใน JSP)
  async searchTransferNst(): Promise<void> {
    if (!this.transferRegId || (this.transferRegId.length !== 10 && this.transferRegId.length !== 13)) {
      await this.dialogService.alert('กรุณาใส่ เลขประจำตัวประชาชน 13 หลัก หรือ รหัส นศท. 10 หลัก !!');
      return;
    }
    if (!this.transferSchoolId) {
      await this.dialogService.alert('กรุณาเลือกสถานศึกษา !!');
      return;
    }

    this.nstRegisterService.searchTransferNst(
      this.transferRegId,
      this.transferSchoolId,
      this.filterAtClass,
      this.filterSex,
      this.nstStatus
    ).subscribe({
      next: async (data) => {
        if (!data || (data.MIA_NST && data.MIA_NST.length === 0)) {
          await this.dialogService.alert('ไม่พบข้อมูล!!\n\nกรุณาตรวจสอบความถูกต้อง แล้วลองใหม่อีกครั้ง');
          return;
        }
        const nst = data.MIA_NST ? data.MIA_NST[0] : data;
        if ((this.schoolId === nst.schoolid_cur && (!nst.schoolid_req || nst.schoolid_req.length === 0)) ||
            (nst.statusid && nst.statusid.match(/A.*/) && this.schoolId === nst.schoolid_req)) {
          await this.dialogService.alert(`นศท. ${this.transferRegId} ${nst.name} อยู่ในสถานศึกษาวิชาทหารของท่านอยู่แล้ว!!\n\nกรุณาตรวจสอบความถูกต้อง แล้วลองใหม่อีกครั้ง`);
          return;
        }
        if (nst.statusid && nst.statusid.match(/A.*/)) {
          const ok = await this.dialogService.confirm(`นศท. ${this.transferRegId} มีสถานะระหว่างรายงานตัว ณ สถานศึกษาวิชาทหารอื่น!!\n\nท่านต้องการดำเนินการโอนย้าย นศท. เข้าสถานศึกษาฯ ต่อหรือไม่?`);
          if (!ok) return;
        }
        this.transferNstInfo = nst;
        this.transferDoc = '';
      },
      error: async (err) => {
        console.error('Error searching transfer NST:', err);
        await this.dialogService.alert('ไม่พบข้อมูล!!\n\nกรุณาตรวจสอบความถูกต้อง แล้วลองใหม่อีกครั้ง');
      }
    });
  }

  onTransferSchoolChange(): void {
    const selected = this.transferSchoolOptions.find(s => s.schoolId === this.transferSchoolId);
    this.transferSchoolName = selected?.schoolShortName || selected?.schoolName || '';
  }

  onSchoolInputChange(): void {
    const displayVal = (this.transferSchoolFilterText || '').trim();
    const found = this.transferSchoolOptions.find(s =>
      (s.schoolShortName || s.schoolName) === displayVal
    );
    if (!found) {
      this.transferSchoolId = '';
      this.transferSchoolName = '';
    }
  }

  onSchoolSelected(event: any): void {
    const displayVal = event.option.value;
    const found = this.filteredTransferSchoolOptions.find(s =>
      (s.schoolShortName || s.schoolName) === displayVal
    );
    this.transferSchoolId = found?.schoolId || '';
    this.transferSchoolName = found?.schoolShortName || found?.schoolName || '';
  }

  onTransferProvinceChange(): void {
    this.transferSchoolId = '';
    this.transferSchoolName = '';
    this.transferSchoolFilterText = '';
  }

  onProvinceInputChange(): void {
    const found = this.transferProvinceOptions.find(p => p.desc === this.transferProvinceFilterText);
    if (!found) {
      this.transferProvinceId = '';
      this.transferSchoolId = '';
      this.transferSchoolName = '';
      this.transferSchoolFilterText = '';
    }
  }

  onProvinceSelected(event: any): void {
    const desc = event.option.value;
    const found = this.transferProvinceOptions.find(p => p.desc === desc);
    this.transferProvinceId = found?.id || '';
    this.transferSchoolId = '';
    this.transferSchoolName = '';
    this.transferSchoolFilterText = '';
  }

  get filteredTransferProvinceOptions(): LookupItem[] {
    const q = (this.transferProvinceFilterText || '').trim().toLowerCase();
    if (!q) return this.transferProvinceOptions;
    return this.transferProvinceOptions.filter(p => {
      const id = (p.id || '').toLowerCase();
      const desc = (p.desc || '').toLowerCase();
      return id.includes(q) || desc.includes(q);
    });
  }

  get filteredTransferSchoolOptions(): SchoolOption[] {
    const provinceId = (this.transferProvinceId || '').trim();
    if (!provinceId) return [];
    const q = (this.transferSchoolFilterText || '').trim().toLowerCase();
    return this.transferSchoolOptions.filter(s => {
      if ((s.provinceCid || '').trim() !== provinceId) return false;
      if (!q) return true;
      const id = (s.schoolId || '').toLowerCase();
      const shortName = (s.schoolShortName || '').toLowerCase();
      const name = (s.schoolName || '').toLowerCase();
      return id.includes(q) || shortName.includes(q) || name.includes(q);
    });
  }

  // บันทึกโอนย้าย นศท. เข้า
  addTransferNst(): void {
    if (!this.transferNstInfo) return;
    this.nstRegisterService.addTransferNst({
      regPid: this.transferNstInfo.pid,
      nstId: this.transferNstInfo.nid,
      nstDoc: this.transferDoc,
      atClass: this.filterAtClass,
      sex: this.filterSex,
      nstStatus: this.nstStatus,
      nstCurStatusId: this.transferNstInfo.statusid,
      schoolIdCur: this.transferNstInfo.schoolid_cur
    }).subscribe({
      next: async () => {
        await this.dialogService.alert('โอนย้าย นศท. สำเร็จ');
        this.transferNstInfo = null;
        this.transferRegId = '';
        this.transferDoc = '';
        this.search();
      },
      error: async (err) => {
        console.error('Error adding transfer NST:', err);
        await this.dialogService.alert('เกิดข้อผิดพลาดในการโอนย้าย');
      }
    });
  }

  // พิมพ์บัญชี (จาก doPrint ใน JSP)
  printReport(): void {
    if (this.nstStatus === '*') return;
    const { target, statusType } = this.getPrintTarget();
    if (!target) return;
    const url = `${target}?AtClass=${this.filterAtClass}&Sex=${this.filterSex}&StatusType=${statusType}`;
    window.open(url, '_blank');
  }

  getPrintTarget(): { target: string; statusType: string } {
    let target = '';
    let statusType = '';
    if (this.nstStatus === '5' || this.nstStatus === '2') {
      target = 'RegisterStudentServlet';
      statusType = this.nstStatus;
    } else if (this.nstStatus.startsWith('E')) {
      target = 'NSTWaitingRightsServlet';
      statusType = this.nstStatus === 'E5' ? '5' : this.nstStatus === 'E2' ? '2' : '';
    } else if (this.nstStatus.startsWith('3')) {
      target = 'TransferNSTServlet';
      statusType = this.nstStatus === '35' ? '5' : this.nstStatus === '32' ? '2' : this.nstStatus === '3E5' ? '55' : this.nstStatus === '3E2' ? '22' : '';
    }
    return { target, statusType };
  }

  getPrintLabel(): string {
    if (this.nstStatus === '*') return 'เลือกประเภทบัญชี เพื่อ พิมพ์บัญชี';
    const opt = this.nstStatusOptions.find(o => o.value === this.nstStatus);
    return `พิมพ์บัญชี ${opt ? opt.label : ''}`;
  }

  getNstStatusLabel(): string {
    const opt = this.nstStatusOptions.find(o => o.value === this.nstStatus);
    return opt ? opt.label : '';
  }
}
