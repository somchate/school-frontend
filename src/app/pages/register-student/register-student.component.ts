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
import { forkJoin, of } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import {
  StudentRegisterService,
  PersonData,
  StudentFormData,
  LookupItem
} from '../../services/student-register.service';
import { DashboardService } from '../../services/dashboard.service';
import { DialogService } from '../../services/dialog.service';
import { SchoolInfoService } from '../../services/school-info.service';

@Component({
  selector: 'app-register-student',
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
    MatDividerModule
  ],
  templateUrl: './register-student.component.html',
  styleUrls: ['./register-student.component.scss']
})
export class RegisterStudentComponent implements OnInit {
  currentYear: string = '';
  schoolId: string = '';
  schoolName: string = '';

  // ค้นหาผู้สมัคร
  searchPid: string = '';
  isSearching: boolean = false;
  searchMessage: string = '';
  searchMessageType: string = '';  // 'error' | 'warning' | 'success'

  // ข้อมูลบุคคลจาก Linkage
  personData: PersonData | null = null;
  showForm: boolean = false;
  formMode: string = '';  // 'New' | 'Edit' | 'ChangeSchl'

  isFetchingPhoto: boolean = false;

  // ข้อมูลแบบฟอร์ม (editable fields)
  form: StudentFormData = this.createEmptyForm();

  // Lookup data
  natList: LookupItem[] = [];
  relegList: LookupItem[] = [];
  employmentList: LookupItem[] = [];
  provinceList: LookupItem[] = [];

  isSaving: boolean = false;

  constructor(
    private authService: AuthService,
    private studentRegisterService: StudentRegisterService,
    private dashboardService: DashboardService,
    private dialogService: DialogService,
    private schoolInfoService: SchoolInfoService
  ) {}

  ngOnInit(): void {
    this.dashboardService.getYearEducate().subscribe({
      next: (data) => { this.currentYear = data.yearEducate || ''; },
      error: () => {
        const n = new Date();
        let y = n.getFullYear() + 543;
        if (n.getMonth() < 4) { y--; }
        this.currentYear = y.toString();
      }
    });
    this.onReady();

    // โหลด lookup data
    this.loadLookups();
  }

  onReady(): void {
    this.authService.currentUser.subscribe(user => {
      if (user) {
        this.schoolId = user.schoolId || '';
        this.schoolName = user.schoolName || '';

        // ถ้ายังไม่มีชื่อ ให้ดึงจาก API
        if (this.schoolId && !this.schoolName) {
          this.schoolInfoService.getSchoolInfo(this.schoolId).subscribe({
            next: (info) => {
              this.schoolName = info.schoolName || this.schoolId;
            },
            error: () => {
              this.schoolName = this.schoolId;
            }
          });
        }
      }
    });
  }

  loadLookups(): void {
    forkJoin({
      nat: this.studentRegisterService.getNatList(),
      releg: this.studentRegisterService.getRelegList(),
      employment: this.studentRegisterService.getEmploymentList(),
      province: this.studentRegisterService.getProvinceList()
    }).subscribe({
      next: (result) => {
        this.natList = result.nat;
        this.relegList = result.releg;
        this.employmentList = result.employment;
        this.provinceList = result.province;
      },
      error: (err) => {
        console.error('Error loading lookups:', err);
      }
    });
  }

  createEmptyForm(): StudentFormData {
    return {
      mode: '', pid: '', titleId: '', fname: '', lname: '',
      sexId: '', birthday: '', natId: '', nationId: '', relegId: '',
      endSchool: '', endSchoolProvCid: '', grade: '', telPerson: '', telParents: '',
      addrNo: '', addrMoo: '', trokId: '', soiId: '', roadId: '',
      districtId: '', amphurId: '', provinceCid: '', houseId: '', rCode: '',
      fatherPid: '', fatherFname: '', fatherLname: '', fatherNatId: '', fatherJobId: '',
      motherPid: '', motherFname: '', motherLname: '', motherNatId: '', motherJobId: '',
      faMaStatusId: '', familyWealthId: '', familyStatusId: '', armyNote: ''
    };
  }

  // ตรวจสอบเลข ปชช. 13 หลัก (จาก check13DigitValid ใน JSP)
  async check13DigitValid(pid: string): Promise<boolean> {
    if (pid.length !== 13) return false;
    const validChars = '0123456789';
    for (let i = 0; i < 13; i++) {
      if (validChars.indexOf(pid.charAt(i)) === -1) {
        await this.dialogService.alert('ท่านกรอกเลขประจำตัวประชาชนไม่ถูกต้อง(ตัวเลข) กรุณาตรวจสอบอีกครั้ง!!!');
        return false;
      }
    }
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(pid.charAt(i)) * (13 - i);
    }
    const mod = sum % 11;
    const checkDigit = (11 - mod) % 10;
    if (checkDigit !== parseInt(pid.charAt(12))) {
      await this.dialogService.alert('ท่านกรอกเลขประจำตัวประชาชนไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง!!!');
      return false;
    }
    return true;
  }

  // ค้นหาข้อมูลผู้สมัครจาก PID (จาก QueryPersonBySelf / QueryPerson ใน JSP)
  async searchByPid(mode: string = 'linkage'): Promise<void> {
    this.searchMessage = '';
    this.searchMessageType = '';
    this.personData = null;
    this.showForm = false;

    if (!this.searchPid || this.searchPid.length !== 13) {
      await this.dialogService.alert('กรุณาใส่ เลขประจำตัวประชาชน 13 หลัก!!');
      return;
    }
    if (!(await this.check13DigitValid(this.searchPid))) return;
    if (!this.schoolId) {
      await this.dialogService.alert('ไม่พบข้อมูลสถานศึกษา');
      return;
    }

    this.isSearching = true;

    this.studentRegisterService.searchStudents(this.schoolId, this.currentYear, this.searchPid).subscribe({
      next: async (students) => {
        const hasInDb = Array.isArray(students) && students.length > 0;
        const summary = hasInDb ? students[0] : null;

        if (hasInDb) {
          const regSchoolId = (summary?.regSchoolId || '').trim();
          const regSchoolName = (summary?.regSchoolName || '').trim();
          const otherSchool = regSchoolId && this.schoolId && regSchoolId !== this.schoolId;

          this.studentRegisterService.searchByPid(this.searchPid, this.schoolId, this.currentYear, mode).subscribe({
            next: (data) => {
              this.isSearching = false;
              if (otherSchool) {
                // บังคับ flag ให้เข้าเงื่อนไข "มีอยู่ในสถานศึกษาอื่น" แล้วแสดงปุ่มโอนย้าย
                data.isRegistered = true;
                data.isSameSchool = false;
                const sch = regSchoolName || regSchoolId;
                this.searchMessage = `ข้อมูลของ ${data.pid} มีรายชื่อสมัครผ่าน สถานศึกษา ${sch} แล้ว`;
              }
              this.personData = data;
              // ดึง fname+middleName จาก Linkage2 เพื่ออัปเดตชื่อให้ครบ
              this.studentRegisterService.fetchPersonNameLinkage2(this.searchPid).subscribe({
                next: (lk) => {
                  if (lk.fname && this.personData) {
                    this.personData.fname = lk.fname;
                    this.form.fname = lk.fname;
                  }
                },
                error: () => { /* ถ้า Linkage2 ไม่ตอบ ใช้ชื่อจาก DB ต่อไป */ }
              });
              this.handlePersonDataResult(data);
            },
            error: (err: any) => {
              this.isSearching = false;
              console.error('Error searching person (DB):', err);
              const errMsg = err.error?.message || 'ไม่สามารถดำเนินการตามร้องขอ กรุณาตรวจสอบอีกครั้ง';
              this.searchMessage = errMsg;
              this.searchMessageType = 'error';
            }
          });
          return;
        }

        // ไม่พบในฐานข้อมูล → ถามผู้ใช้ก่อนว่าต้องการค้นจากทะเบียนราษฎร์ (Linkage) หรือไม่
        this.isSearching = false;
        const proceed = await this.dialogService.confirm(
          'ไม่พบข้อมูลผู้สมัครในฐานข้อมูล\n\nต้องการค้นหาจากฐานข้อมูลทะเบียนราษฎร์ (Linkage) หรือไม่?',
          'ไม่พบข้อมูล'
        );
        if (!proceed) {
          this.searchMessage = 'ยกเลิกการค้นหา';
          this.searchMessageType = 'info';
          return;
        }
        this.isSearching = true;

        this.studentRegisterService.searchByPidLinkage2(this.searchPid).subscribe({
          next: (partial) => {
            this.isSearching = false;
            const data: PersonData = {
              pid: partial.pid || this.searchPid,
              titleId: partial.titleId || '',
              titleDesc: partial.titleDesc || '',
              fname: partial.fname || '',
              lname: partial.lname || '',
              sexId: partial.sexId || '',
              birthday: partial.birthday || '',
              natId: partial.natId || '',
              natDesc: partial.natDesc || '',
              age: partial.age || 0,
              photoBase64: partial.photoBase64,
              photoMimeType: partial.photoMimeType,
              fatherPid: partial.fatherPid || '',
              fatherName: partial.fatherName || '',
              fatherLname: partial.fatherLname || '',
              fatherNatId: partial.fatherNatId || '',
              motherPid: partial.motherPid || '',
              motherName: partial.motherName || '',
              motherLname: partial.motherLname || '',
              motherNatId: partial.motherNatId || '',
              houseId: partial.houseId || '',
              addrNo: partial.addrNo || '',
              addrMoo: partial.addrMoo || '',
              trokId: partial.trokId || '',
              trokName: partial.trokName || '',
              soiId: partial.soiId || '',
              soiName: partial.soiName || '',
              roadId: partial.roadId || '',
              roadName: partial.roadName || '',
              districtId: partial.districtId || '',
              districtName: partial.districtName || '',
              amphurId: partial.amphurId || '',
              amphurName: partial.amphurName || '',
              provinceCid: partial.provinceCid || '',
              provinceName: partial.provinceName || '',
              rCode: partial.rCode || '',
              isRegistered: false,
              isSameSchool: true,
              isNst: false,
              nstId: '',
              existingData: null,
              isExceptArea: false,
              exceptAreaId: ''
            };

            this.personData = data;
            this.handlePersonDataResult(data);
          },
          error: (err: any) => {
            this.isSearching = false;
            console.error('Error searching person (Linkage2):', err);
            this.searchMessage = 'ไม่สามารถเรียกข้อมูลจากทะเบียนราษฏร์ได้ กรุณาตรวจสอบ Linkage2 Client';
            this.searchMessageType = 'error';
          }
        });
      },
      error: (err: any) => {
        this.isSearching = false;
        console.error('Error checking DB by pid:', err);
        const errMsg = err.error?.message || 'ไม่สามารถดำเนินการตามร้องขอ กรุณาตรวจสอบอีกครั้ง';
        this.searchMessage = errMsg;
        this.searchMessageType = 'error';
      }
    });
  }

  fetchPhotoFromLinkage2(): void {
    if (!this.personData?.pid) return;
    if (this.isFetchingPhoto) return;

    this.isFetchingPhoto = true;
    this.studentRegisterService.fetchPhotoLinkage2(this.personData.pid).subscribe({
      next: (photo) => {
        this.isFetchingPhoto = false;
        if (!this.personData) return;

        this.personData.photoBase64 = photo.photoBase64 || '';
        this.personData.photoMimeType = photo.photoMimeType || '';

        if (!this.personData.photoBase64) {
          this.searchMessage = 'ไม่พบรูปจาก Linkage2';
          this.searchMessageType = 'warning';
        }
      },
      error: (err) => {
        this.isFetchingPhoto = false;
        console.error('Error fetching photo (linkage2):', err);
        this.searchMessage = 'ไม่สามารถเรียกข้อมูลจากทะเบียนราษฏร์ได้ กรุณาตรวจสอบ Linkage2 Client';
        this.searchMessageType = 'error';
      }
    });
  }

  private handlePersonDataResult(data: PersonData): void {
    const normalizedAge = this.calculateAgeFromBirthday(data.birthday);
    if (normalizedAge !== null) {
      data.age = normalizedAge;
    }

    // เป็น นศท. แล้ว
    if (data.isNst) {
      this.searchMessage = `ข้อมูลของ ${data.pid} มีสถานะเป็น นศท. รหัส ${data.nstId} แล้ว!!`;
      this.searchMessageType = 'error';
      return;
    }

    // มีอยู่ในบัญชีรายชื่อของสถานศึกษาอื่น
    if (data.isRegistered && !data.isSameSchool) {
      this.searchMessage = `ข้อมูลของ ${data.pid} มีอยู่ในบัญชีรายชื่อผู้สมัครฯ ของสถานศึกษาวิชาทหารอื่นแล้ว!!`;
      this.searchMessageType = 'error';
      this.showTransferConfirm = true;
      return;
    }

    // มีอยู่ในบัญชีรายชื่อของสถานศึกษาเดียวกัน
    if (data.isRegistered && data.isSameSchool) {
      this.searchMessage = `ข้อมูลของ ${data.pid} มีอยู่ในบัญชีรายชื่อผู้สมัครฯ ของสถานศึกษาวิชาทหารของท่านแล้ว!! ท่านสามารถทำการแก้ไขข้อมูลแล้วบันทึก หรือ ไม่ดำเนินการใดๆแล้วค้นหาผู้สมัครฯ อื่น ต่อไป`;
      this.searchMessageType = 'success';
      this.formMode = 'Edit';
      this.populateForm(data);
      this.showForm = true;
      return;
    }

    // ตรวจสอบอายุ (15-22)
    if (data.age < 15) {
      this.searchMessage = `${data.pid} มีอายุน้อยกว่า 15 ปี ไม่สามารถสมัคร นศท. ได้ !!!`;
      this.searchMessageType = 'error';
      return;
    }
    if (data.age > 22) {
      this.searchMessage = `${data.pid} มีอายุมากกว่า 22 ปี ไม่สามารถสมัคร นศท. ได้ !!!`;
      this.searchMessageType = 'error';
      return;
    }

    // ตรวจสอบสัญชาติ (ต้องเป็นไทย)
    if (data.natId !== '099') {
      this.searchMessage = `${data.pid} ไม่ใช่สัญชาติไทย ไม่สามารถสมัคร นศท. ได้ !!!`;
      this.searchMessageType = 'error';
      return;
    }

    // แจ้งเตือนเขตพื้นที่ยกเว้น
    if (data.isExceptArea) {
      this.searchMessage = `ที่อยู่ตามทะเบียนบ้านของ ${data.pid} ${data.fname} ${data.lname} อาจอยู่ในเขตพื้นที่ยกเว้น กรุณาตรวจสอบก่อนบันทึก !!!`;
      this.searchMessageType = 'warning';
    }

    // แสดงฟอร์มสมัครใหม่
    this.formMode = 'New';
    this.populateForm(data);
    this.showForm = true;

    this.populateParentsSurnameFromLinkage2();
  }

  private populateParentsSurnameFromLinkage2(): void {
    if (!this.personData) return;
    if (this.personData.isRegistered) return;

    const fatherPid = (this.personData.fatherPid || '').trim();
    const motherPid = (this.personData.motherPid || '').trim();

    const father$ = fatherPid
      ? this.studentRegisterService.fetchPersonNameLinkage2(fatherPid)
      : of(null);
    const mother$ = motherPid
      ? this.studentRegisterService.fetchPersonNameLinkage2(motherPid)
      : of(null);

    forkJoin({ father: father$, mother: mother$ }).subscribe({
      next: (res) => {
        if (!this.personData) return;

        const fatherLname = (res.father as any)?.lname ? String((res.father as any).lname).trim() : '';
        if (fatherLname && !this.form.fatherLname) {
          this.form.fatherLname = fatherLname;
          this.personData.fatherLname = fatherLname;
        }

        const motherLname = (res.mother as any)?.lname ? String((res.mother as any).lname).trim() : '';
        if (motherLname && !this.form.motherLname) {
          this.form.motherLname = motherLname;
          this.personData.motherLname = motherLname;
        }
      },
      error: (err) => {
        console.error('Error fetching parent name (Linkage2):', err);
      }
    });
  }

  private calculateAgeFromBirthday(birthday: string): number | null {
    if (!birthday) return null;

    const b = birthday.trim();
    let y: number | null = null;

    // yyyyMMdd compact (Linkage2 returns this format, e.g. 25540718)
    const compactMatch = b.match(/^(\d{4})(\d{2})(\d{2})$/);
    if (compactMatch) {
      y = Number(compactMatch[1]);
    }

    // yyyy-MM-dd
    if (y === null) {
      const isoMatch = b.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (isoMatch) {
        y = Number(isoMatch[1]);
      }
    }

    // dd/MM/yyyy
    if (y === null) {
      const parts = b.split('/');
      if (parts.length === 3) {
        y = Number(parts[2]);
      }
    }

    // ISO with time fallback
    if (y === null) {
      const dt = new Date(b);
      if (!isNaN(dt.getTime())) {
        y = dt.getFullYear() + 543; // treat as CE, convert to BE
      }
    }

    if (!y) return null;

    // Normalize: if CE (< 2400) convert to BE
    let birthYearBE = y < 2400 ? y + 543 : y;

    // อายุทางทหาร = ปีการศึกษา (BE) - ปีเกิด (BE)
    const eduYearBE = Number(this.currentYear) || (new Date().getFullYear() + 543);
    return eduYearBE - birthYearBE;
  }

  showTransferConfirm: boolean = false;

  // ยืนยันโอนย้ายผู้สมัครจากสถานศึกษาอื่น
  confirmTransfer(): void {
    this.showTransferConfirm = false;
    this.formMode = 'ChangeSchl';
    if (this.personData) {
      this.populateForm(this.personData);
      this.showForm = true;
      this.searchMessage = '';
    }
  }

  cancelTransfer(): void {
    this.showTransferConfirm = false;
    this.searchMessage = '';
  }

  // เติมข้อมูลฟอร์ม
  populateForm(data: PersonData): void {
    this.form = this.createEmptyForm();
    this.form.mode = this.formMode;
    this.form.pid = data.pid;
    this.form.titleId = data.titleId;
    this.form.fname = data.fname;
    this.form.lname = data.lname;
    this.form.sexId = data.sexId;
    this.form.birthday = data.birthday;
    this.form.natId = data.natId;
    // ค่าเริ่มต้น เชื้อชาติ = ไทย (099)
    this.form.nationId = data.existingData?.nationId || '099';
    // ค่าเริ่มต้น ศาสนา = พุทธ
    this.form.relegId = data.existingData?.relegId || '';
    this.form.endSchool = data.existingData?.endSchool || '';
    this.form.endSchoolProvCid = data.existingData?.endSchoolProvCid || '';
    this.form.grade = data.existingData?.grade || '';
    this.form.telPerson = data.existingData?.telPerson || '';
    this.form.telParents = data.existingData?.telParents || '';
    // ที่อยู่ (readonly จาก Linkage)
    this.form.addrNo = data.addrNo;
    this.form.addrMoo = data.addrMoo;
    this.form.trokId = data.trokId;
    this.form.soiId = data.soiId;
    this.form.roadId = data.roadId;
    this.form.districtId = data.districtId;
    this.form.amphurId = data.amphurId;
    this.form.provinceCid = data.provinceCid;
    this.form.houseId = data.houseId;
    this.form.rCode = data.rCode;
    // บิดา-มารดา
    this.form.fatherPid = data.fatherPid;
    this.form.fatherFname = data.fatherName;
    this.form.fatherLname = data.existingData?.fatherLname || data.fatherLname || '';
    this.form.fatherNatId = data.fatherNatId;
    this.form.fatherJobId = data.existingData?.fatherJobId || '';
    this.form.motherPid = data.motherPid;
    this.form.motherFname = data.motherName;
    this.form.motherLname = data.existingData?.motherLname || data.motherLname || '';
    this.form.motherNatId = data.motherNatId;
    this.form.motherJobId = data.existingData?.motherJobId || '';
    this.form.faMaStatusId = data.existingData?.faMaStatusId || '';
    this.form.familyWealthId = data.existingData?.familyWealthId || '';
    this.form.familyStatusId = data.existingData?.familyStatusId || '';
    this.form.armyNote = data.existingData?.armyNote || '';

    // ตั้งค่า default ศาสนาพุทธ ถ้าเป็นการสมัครใหม่
    if (this.formMode === 'New' && !this.form.relegId) {
      const buddhism = this.relegList.find(r => r.desc === 'พุทธ');
      if (buddhism) this.form.relegId = buddhism.id;
    }
    if (this.formMode === 'New' && !this.form.nationId) {
      this.form.nationId = '099';
    }
  }

  // บันทึกข้อมูล (จาก checkNull ใน JSP)
  async saveForm(): Promise<void> {
    // ตรวจสอบเชื้อชาติไม่ใช่ไทย (alert แต่ไม่ block)
    if (this.form.nationId !== '099' && this.personData) {
      await this.dialogService.alert(`คำเตือน: ${this.form.pid} ${this.personData.titleDesc} ${this.form.fname} ${this.form.lname} ไม่ใช่เชื้อชาติไทย !!!`);
    }

    // ตรวจสอบเกรดเฉลี่ย (ไม่บังคับกรอก; ถ้ากรอก ต้องอยู่ในช่วง 1.00-4.00)
    const gradeRaw = (this.form.grade ?? '').toString().trim();
    if (gradeRaw !== '') {
      const grade = parseFloat(gradeRaw);
      if (isNaN(grade) || grade <= 0 || grade > 4) {
        await this.dialogService.alert('ท่านกรอกข้อมูลเกรดเฉลี่ยไม่ถูกต้อง !!!\n\nกรุณากรอก เกรดเฉลี่ย ในช่วง 0.01 - 4.00');
        return;
      }
      if (grade < 1) {
        await this.dialogService.alert('เกรดเฉลี่ยน้อยกว่า 1.00 ไม่สามารถสมัคร นศท.ได้ !!!');
        return;
      }
    }

    // ตรวจสอบฐานะครอบครัว
    if (!this.form.familyWealthId) {
      await this.dialogService.alert('ท่านยังไม่ได้เลือก ฐานะครอบครัว !!!\n\nกรุณาเลือก ฐานะครอบครัว');
      return;
    }

    // ตรวจสอบสภาพครอบครัว
    if (!this.form.familyStatusId) {
      await this.dialogService.alert('ท่านยังไม่ได้เลือก สภาพครอบครัว !!!\n\nกรุณาเลือก สภาพครอบครัว');
      return;
    }

    // Defense-in-depth: re-copy ค่าจาก personData (LK snapshot) ทับ form
    // ก่อน submit อีกครั้ง เพื่อไม่ให้ user ที่แก้ form ผ่าน DevTools ส่งค่าปลอมเข้าไป
    // (field LK ใน template ก็ readonly อยู่แล้ว แต่ระดับ JS memory แก้ได้ ต้อง guard ซ้ำ)
    this.lockLkFieldsFromPersonData();

    this.isSaving = true;
    this.studentRegisterService.saveStudent(
      this.form,
      this.schoolId,
      this.currentYear,
      {
        photoBase64: this.personData?.photoBase64,
        photoMimeType: this.personData?.photoMimeType
      },
      this.personData?.titleDesc
    ).subscribe({
      next: async () => {
        this.isSaving = false;
        await this.dialogService.alert('บันทึกข้อมูลผู้สมัคร สำเร็จ');
        this.resetPage();
      },
      error: async (err) => {
        this.isSaving = false;
        console.error('Error saving student:', err);
        await this.dialogService.alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      }
    });
  }

  /**
   * Re-populate LK-sourced fields จาก personData ทับ form ก่อน submit
   * ป้องกันการแก้ค่าผ่าน DevTools (window.ng หรือ direct memory patch)
   * ยกเว้น field ที่ผู้ใช้กรอกเอง (nationId, relegId, telPerson, telParents, grade,
   *  fatherLname, fatherJobId, motherLname, motherJobId, faMaStatusId,
   *  familyWealthId, familyStatusId, armyNote) — ไม่แตะต้อง
   */
  private lockLkFieldsFromPersonData(): void {
    if (!this.personData) return;
    const p = this.personData;
    this.form.pid = p.pid;
    this.form.titleId = p.titleId;
    this.form.fname = p.fname;
    this.form.lname = p.lname;
    this.form.sexId = p.sexId;
    this.form.birthday = p.birthday;
    this.form.natId = p.natId;
    this.form.addrNo = p.addrNo;
    this.form.addrMoo = p.addrMoo;
    this.form.trokId = p.trokId;
    this.form.soiId = p.soiId;
    this.form.roadId = p.roadId;
    this.form.districtId = p.districtId;
    this.form.amphurId = p.amphurId;
    this.form.provinceCid = p.provinceCid;
    this.form.houseId = p.houseId;
    this.form.rCode = p.rCode;
    this.form.fatherPid = p.fatherPid;
    this.form.fatherFname = p.fatherName;
    this.form.fatherNatId = p.fatherNatId;
    this.form.motherPid = p.motherPid;
    this.form.motherFname = p.motherName;
    this.form.motherNatId = p.motherNatId;
  }

  // ยกเลิก (resetPage จาก JSP)
  resetPage(): void {
    this.showForm = false;
    this.personData = null;
    this.searchMessage = '';
    this.searchMessageType = '';
    this.showTransferConfirm = false;
    this.form = this.createEmptyForm();
    this.searchPid = '';
  }

  // รับเฉพาะตัวเลข (จาก checkNumber ใน JSP)
  onPidKeyPress(event: KeyboardEvent): boolean {
    const charCode = event.charCode || event.keyCode;
    if (charCode === 13) {
      this.searchByPid();
      return false;
    }
    if (charCode < 48 || charCode > 57) {
      this.dialogService.alert('รับเฉพาะเลขอารบิกเท่านั้น !!!');
      return false;
    }
    return true;
  }

  getSexDisplay(): string {
    if (!this.personData) return '';
    return this.personData.sexId === 'M' ? 'ชาย' : this.personData.sexId === 'F' ? 'หญิง' : '';
  }

  // ถ้าไม่มีข้อมูล (null, '', '0', '00', ...) ให้แสดงเป็น '-'
  displayDash(v: any): string {
    if (v === null || v === undefined) return '-';
    const s = String(v).trim();
    if (s === '') return '-';
    if (/^0+$/.test(s)) return '-';
    return s;
  }

  displayMoo(v: any): string {
    return this.displayDash(v);
  }

  getAgeDisplay(): string {
    if (!this.personData) return '';
    return `${this.personData.age} ปี ทางทหาร (คำนวณจากผลต่างปี)`;
  }
}
