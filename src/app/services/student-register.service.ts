import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface StudentRegister {
  regPid: string;
  regYear: string;
  regStatusId: string;
  titleId: string;
  regTitle: string;
  regFname: string;
  regLname: string;
  regBirthday: string;
  regSex: string;
  regSchoolId: string;
  regSchoolName?: string;
  regDate: string;
  telReg: string;
  telParents: string;
  [key: string]: any;
}

// ข้อมูลบุคคลจากกรมการปกครอง (Linkage/IKNO)
export interface PersonData {
  pid: string;
  titleId: string;
  titleDesc: string;
  fname: string;
  lname: string;
  sexId: string;
  birthday: string;         // dd/mm/yyyy (พ.ศ.)
  natId: string;
  natDesc: string;
  age: number;
  photoBase64?: string;
  photoMimeType?: string;
  fatherPid: string;
  fatherName: string;
  fatherLname: string;
  fatherNatId: string;
  motherPid: string;
  motherName: string;
  motherLname: string;
  motherNatId: string;
  houseId: string;
  addrNo: string;
  addrMoo: string;
  trokId: string;
  trokName: string;
  soiId: string;
  soiName: string;
  roadId: string;
  roadName: string;
  districtId: string;
  districtName: string;
  amphurId: string;
  amphurName: string;
  provinceCid: string;
  provinceName: string;
  rCode: string;
  // สถานะการตรวจสอบ
  isRegistered: boolean;     // มีอยู่ในบัญชีรายชื่อแล้ว
  isSameSchool: boolean;     // เป็นของสถานศึกษาเดียวกัน
  isNst: boolean;            // เป็น นศท. แล้ว
  nstId: string;
  existingData: any;         // ข้อมูลที่เคยบันทึกไว้ (กรณี isRegistered=true)
  // เขตพื้นที่ยกเว้น
  isExceptArea: boolean;
  exceptAreaId: string;
}

interface Linkage2CenterRequestItem {
  serviceID: number;
  query: {
    personalID: string;
  };
}

interface Linkage2CenterRequestBody {
  jobID: string;
  data: Linkage2CenterRequestItem[];
}

interface Linkage2CenterResponseItem {
  serviceID: number;
  responseStatus: number;
  responseError: any;
  responseData: any;
}

interface Linkage2CenterResponseBody {
  data: Linkage2CenterResponseItem[];
  executeTimeMs: number;
}

// ข้อมูลแบบฟอร์มรับสมัคร
export interface StudentFormData {
  mode: string;              // 'New' | 'Edit' | 'ChangeSchl'
  pid: string;
  titleId: string;
  fname: string;
  lname: string;
  sexId: string;
  birthday: string;
  natId: string;
  nationId: string;          // เชื้อชาติ
  relegId: string;           // ศาสนา
  endSchool: string;         // จบจากสถานศึกษา
  endSchoolProvCid: string;  // จังหวัดสถานศึกษาที่จบ
  grade: string;             // เกรดเฉลี่ย
  telPerson: string;
  telParents: string;
  // ที่อยู่
  addrNo: string;
  addrMoo: string;
  trokId: string;
  soiId: string;
  roadId: string;
  districtId: string;
  amphurId: string;
  provinceCid: string;
  houseId: string;
  rCode: string;
  // บิดา-มารดา
  fatherPid: string;
  fatherFname: string;
  fatherLname: string;
  fatherNatId: string;
  fatherJobId: string;
  motherPid: string;
  motherFname: string;
  motherLname: string;
  motherNatId: string;
  motherJobId: string;
  faMaStatusId: string;      // สถานะบิดา-มารดา
  familyWealthId: string;    // ฐานะครอบครัว
  familyStatusId: string;    // สภาพครอบครัว
  armyNote: string;          // หมายเหตุภูมิลำเนาทหาร
}

// ข้อมูลตัวเลือก dropdown
export interface LookupItem {
  id: string;
  desc: string;
}

@Injectable({
  providedIn: 'root'
})
export class StudentRegisterService {
  private readonly API_URL = environment.apiUrl;
  private readonly LINKAGE2_URL = 'http://localhost:15043/api/center/request/';
  private readonly LINKAGE2_JOB_ID = '976fb020-8ad4-4600-b3f6-a67c0a62b3fe';
  private readonly LINKAGE2_JOB_ID_PHOTO = '1532a9bc-0e60-41f7-bf9f-747f8013d2c7';
  private readonly LINKAGE2_JOB_ID_PARENT_NAME = 'de31db7a-06fe-4bb2-b99b-5bbc4bf207d0';

  constructor(private http: HttpClient) {}

  getStudents(schoolId: string, year: string): Observable<StudentRegister[]> {
    return this.http.get<StudentRegister[]>(`${this.API_URL}/student/list/${schoolId}/${year}`);
  }

  searchStudents(schoolId: string, year: string, pid?: string, firstName?: string, lastName?: string, sex?: string): Observable<StudentRegister[]> {
    let params = new HttpParams();
    if (pid) params = params.set('pid', pid);
    if (firstName) params = params.set('firstName', firstName);
    if (lastName) params = params.set('lastName', lastName);
    if (sex) params = params.set('sex', sex);
    return this.http.get<StudentRegister[]>(`${this.API_URL}/student/search/${schoolId}/${year}`, { params });
  }

  updateStudent(student: any): Observable<StudentRegister> {
    return this.http.put<StudentRegister>(`${this.API_URL}/student/update`, student);
  }

  // ค้นหาข้อมูลผู้สมัครจาก PID (เรียก Linkage กรมการปกครอง + ตรวจสอบฐานข้อมูล)
  searchByPid(pid: string, schoolId: string, year: string, mode: string): Observable<PersonData> {
    let params = new HttpParams()
      .set('pid', pid)
      .set('schoolId', schoolId)
      .set('year', year)
      .set('mode', mode);
    return this.http.get<PersonData>(`${this.API_URL}/student/searchByPid`, { params });
  }

  searchByPidLinkage2(pid: string): Observable<Partial<PersonData>> {
    const payload: Linkage2CenterRequestBody = {
      jobID: this.LINKAGE2_JOB_ID,
      data: [
        { serviceID: 1, query: { personalID: pid } },
        { serviceID: 21, query: { personalID: pid } },
        { serviceID: 38, query: { personalID: pid } }
      ]
    };

    return new Observable<Partial<PersonData>>((observer) => {
      this.http.post<Linkage2CenterResponseBody>(this.LINKAGE2_URL, payload).subscribe({
        next: (resp) => {
          const items = Array.isArray(resp?.data) ? resp.data : [];
          const byService = new Map<number, Linkage2CenterResponseItem>();
          for (const it of items) {
            if (typeof it?.serviceID === 'number') {
              byService.set(it.serviceID, it);
            }
          }

          const s1 = byService.get(1);
          const s21 = byService.get(21);
          const s38 = byService.get(38);

          const p: Partial<PersonData> = {};

          const d1 = s1?.responseData || {};
          const d38 = s38?.responseData || {};
          const d21 = s21?.responseData || {};

          const toStr = (v: any) => (v === null || v === undefined ? '' : String(v));
          const pad = (v: any, n: number) => toStr(v).padStart(n, '0');
          const normalizePhoto = (imageValue: any, mimeValue: any) => {
            let image = toStr(imageValue).trim();
            if (!image) return { base64: '', mimeType: '' };

            // If backend returns a full data URL, split it.
            if (image.startsWith('data:') && image.includes('base64,')) {
              const [prefix, b64] = image.split('base64,');
              const mimeType = prefix.replace('data:', '').replace(';', '').trim();
              return { base64: (b64 || '').trim(), mimeType };
            }

            const mimeRaw = toStr(mimeValue).trim();
            const mimeType = mimeRaw || 'image/jpeg';
            return { base64: image, mimeType };
          };
          const formatThaiYmd = (yyyymmdd: any) => {
            const s = toStr(yyyymmdd);
            if (!s || s === '0' || s.length !== 8) return '';
            const yyyy = s.slice(0, 4);
            const mm = s.slice(4, 6);
            const dd = s.slice(6, 8);
            return `${dd}/${mm}/${yyyy}`;
          };

          if (d1) {
            p.pid = toStr(pid);
            p.titleId = pad(d1.titleCode, 3);
            p.titleDesc = toStr(d1.titleName || d1.titleDesc);
            p.fname = toStr(d1.firstName);
            p.lname = toStr(d1.lastName);

            const genderCode = Number(d1.genderCode);
            p.sexId = genderCode === 1 ? 'M' : genderCode === 2 ? 'F' : '';

            p.birthday = formatThaiYmd(d1.dateOfBirth);

            p.natId = pad(d1.nationalityCode, 3);
            p.natDesc = toStr(d1.nationalityDesc);
            p.age = Number(d1.age || 0);

            p.fatherPid = d1.fatherPersonalID && Number(d1.fatherPersonalID) > 0 ? toStr(d1.fatherPersonalID) : '';
            p.fatherName = toStr(d1.fatherName);
            p.fatherLname = '';
            p.fatherNatId = pad(d1.fatherNationalityCode, 3);

            p.motherPid = d1.motherPersonalID && Number(d1.motherPersonalID) > 0 ? toStr(d1.motherPersonalID) : '';
            p.motherName = toStr(d1.motherName);
            p.motherLname = '';
            p.motherNatId = pad(d1.motherNationalityCode, 3);
          }

          if (d38) {
            p.houseId = toStr(d38.houseID);
            p.addrNo = toStr(d38.houseNo);
            p.addrMoo = pad(d38.villageNo, 2);
            p.trokId = pad(d38.alleyWayCode, 4);
            p.trokName = toStr(d38.alleyWayDesc);
            p.soiId = pad(d38.alleyCode, 4);
            p.soiName = toStr(d38.alleyDesc);
            p.roadId = pad(d38.roadCode, 4);
            p.roadName = toStr(d38.roadDesc);

            const provCode2 = pad(d38.provinceCode, 2);
            const distCode2 = pad(d38.districtCode, 2);
            const subDistCode2 = pad(d38.subdistrictCode, 2);
            // mia_student_register.REG_AMPHUR_ID  = provinceCode + districtCode (4 digits)
            // mia_student_register.REG_DISTRIC_ID = provinceCode + districtCode + subdistrictCode (6 digits)
            p.amphurId = provCode2 + distCode2;
            p.amphurName = toStr(d38.districtDesc);
            p.districtId = provCode2 + distCode2 + subDistCode2;
            p.districtName = toStr(d38.subdistrictDesc);
            p.provinceCid = toStr(d38.provinceCode);
            p.provinceName = toStr(d38.provinceDesc);
            p.rCode = toStr(d38.rcodeCode);
          }

          if (d21) {
            // Note: field name in linkage response can be mimeType or (legacy typo) mineType
            const imageFromResp =
              d21.image ??
              d21.photo ??
              d21.picture ??
              d21.imageBase64 ??
              d21.photoBase64 ??
              d21.imageData;

            const mimeFromResp =
              d21.mimeType ??
              d21.mineType ??
              d21.contentType ??
              d21.imageMimeType ??
              d21.photoMimeType;

            const photo = normalizePhoto(imageFromResp, mimeFromResp);
            if (photo.base64) {
              p.photoBase64 = photo.base64;
              // Template expects either a full data URL prefix or will fallback.
              // Provide a proper data URL prefix.
              p.photoMimeType = `data:${photo.mimeType};base64`;
            }
          }

          observer.next(p);
          observer.complete();
        },
        error: (err) => observer.error(err)
      });
    });
  }

  fetchPersonNameLinkage2(pid: string): Observable<Pick<PersonData, 'fname' | 'lname' | 'titleDesc'>> {
    const payload: Linkage2CenterRequestBody = {
      jobID: this.LINKAGE2_JOB_ID_PARENT_NAME,
      data: [
        { serviceID: 1, query: { personalID: pid } }
      ]
    };

    const toStr = (v: any) => (v === null || v === undefined ? '' : String(v));

    return new Observable<Pick<PersonData, 'fname' | 'lname' | 'titleDesc'>>((observer) => {
      this.http.post<Linkage2CenterResponseBody>(this.LINKAGE2_URL, payload).subscribe({
        next: (resp) => {
          const items = Array.isArray(resp?.data) ? resp.data : [];
          const s1 = items.find(it => it?.serviceID === 1);
          const d1 = s1?.responseData || {};

          observer.next({
            titleDesc: toStr(d1.titleDesc || d1.titleName || d1.englishTitleDesc),
            fname: toStr(d1.firstName || d1.englishFirstName),
            lname: toStr(d1.lastName || d1.englishLastName)
          });
          observer.complete();
        },
        error: (err) => observer.error(err)
      });
    });
  }

  fetchPhotoLinkage2(pid: string): Observable<Pick<PersonData, 'photoBase64' | 'photoMimeType'>> {
    const payload: Linkage2CenterRequestBody = {
      jobID: this.LINKAGE2_JOB_ID_PHOTO,
      data: [
        { serviceID: 21, query: { personalID: pid } }
      ]
    };

    const toStr = (v: any) => (v === null || v === undefined ? '' : String(v));
    const normalizePhoto = (imageValue: any, mimeValue: any) => {
      let image = toStr(imageValue).trim();
      if (!image) return { base64: '', mimeType: '' };

      let mimeType = toStr(mimeValue).trim();
      if (mimeType && !mimeType.startsWith('data:')) {
        mimeType = 'data:' + mimeType;
      }
      if (mimeType && !mimeType.includes('base64')) {
        mimeType = mimeType + ';base64';
      }

      if (image.startsWith('data:')) {
        const commaIdx = image.indexOf(',');
        if (commaIdx > -1) {
          mimeType = image.substring(0, commaIdx);
          image = image.substring(commaIdx + 1);
        }
      }

      image = image.replace(/\s+/g, '');
      return { base64: image, mimeType };
    };

    return new Observable<Pick<PersonData, 'photoBase64' | 'photoMimeType'>>((observer) => {
      this.http.post<Linkage2CenterResponseBody>(this.LINKAGE2_URL, payload).subscribe({
        next: (resp) => {
          const items = Array.isArray(resp?.data) ? resp.data : [];
          const s21 = items.find(it => it?.serviceID === 21);
          const d21 = s21?.responseData || {};

          const photoVal = d21.image;
          const mimeVal = d21.mineType ?? d21.mimeType ?? d21.photoMimeType ?? d21.contentType;
          const norm = normalizePhoto(photoVal, mimeVal);

          observer.next({ photoBase64: norm.base64, photoMimeType: norm.mimeType });
          observer.complete();
        },
        error: (err) => observer.error(err)
      });
    });
  }

  // บันทึกข้อมูลผู้สมัคร (New / Edit / ChangeSchl)
  saveStudent(
    data: StudentFormData,
    schoolId: string,
    year: string,
    photo?: { photoBase64?: string; photoMimeType?: string },
    titleDesc?: string
  ): Observable<any> {
    return this.http.post(`${this.API_URL}/student/save`, {
      ...data,
      schoolId,
      year,
      titleDesc,
      photoBase64: photo?.photoBase64,
      photoMimeType: photo?.photoMimeType
    });
  }

  // ลบข้อมูลผู้สมัคร
  deleteStudent(pid: string): Observable<any> {
    return this.http.delete(`${this.API_URL}/student/delete/${pid}`);
  }

  // ดึงข้อมูล dropdown
  getNatList(): Observable<LookupItem[]> {
    return this.http.get<LookupItem[]>(`${this.API_URL}/lookup/nat`);
  }

  getRelegList(): Observable<LookupItem[]> {
    return this.http.get<LookupItem[]>(`${this.API_URL}/lookup/releg`);
  }

  getEmploymentList(): Observable<LookupItem[]> {
    return this.http.get<LookupItem[]>(`${this.API_URL}/lookup/employment`);
  }

  getProvinceList(): Observable<LookupItem[]> {
    return this.http.get<LookupItem[]>(`${this.API_URL}/lookup/province`);
  }
}
