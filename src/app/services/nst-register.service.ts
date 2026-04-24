import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface NstRegister {
  regPid: string;
  nstId: string;
  nstStatusId: string;
  nstRd25: string;
  regSchoolId: string;
  reqSchoolId: string;
  regTitle: string;
  regFname: string;
  regLname: string;
  regSex: string;
  regBirthday: string;
  nstAtClass: string;
  atYear: string;
  nstApproveDate: string;
  nstDoc: string;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class NstRegisterService {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getNstList(schoolId: string, year: string): Observable<NstRegister[]> {
    return this.http.get<NstRegister[]>(`${this.API_URL}/nst/list/${schoolId}/${year}`);
  }

  searchNst(schoolId: string, year: string, pid?: string, atClass?: string, sex?: string, nstId?: string, statusId?: string, psnStatus?: string): Observable<NstRegister[]> {
    let params = new HttpParams();
    if (pid) params = params.set('pid', pid);
    if (atClass) params = params.set('atClass', atClass);
    if (sex) params = params.set('sex', sex);
    if (nstId) params = params.set('nstId', nstId);
    if (statusId) params = params.set('statusId', statusId);
    if (psnStatus) params = params.set('psnStatus', psnStatus);
    return this.http.get<NstRegister[]>(`${this.API_URL}/nst/search/${schoolId}/${year}`, { params });
  }

  // รายชื่อ นศท. ระหว่างรายงานตัว (rs_req)
  searchReq(schoolId: string, year: string, atClass: string, sex: string, nstStatus: string): Observable<NstRegister[]> {
    let params = new HttpParams()
      .set('atClass', atClass)
      .set('sex', sex)
      .set('nstStatus', nstStatus);
    return this.http.get<NstRegister[]>(`${this.API_URL}/nst/req/${schoolId}/${year}`, { params });
  }

  // รายชื่อ นศท. ยังไม่ได้รายงานตัว (rs_nreq)
  searchNReq(schoolId: string, year: string, atClass: string, sex: string, nstStatus: string): Observable<NstRegister[]> {
    let params = new HttpParams()
      .set('atClass', atClass)
      .set('sex', sex)
      .set('nstStatus', nstStatus);
    return this.http.get<NstRegister[]>(`${this.API_URL}/nst/nreq/${schoolId}/${year}`, { params });
  }

  // นำ นศท. เข้ารายงานตัว (ย้ายจากซ้ายไปขวา)
  addToReq(pids: string[], nstStatus: string, atClass: string, sex: string): Observable<any> {
    return this.http.post(`${this.API_URL}/nst/req/add`, { pids, nstStatus, atClass, sex });
  }

  // นำ นศท. ออกจากรายงานตัว (ย้ายจากขวาไปซ้าย)
  // nstReqList = ["pid_statusId", ...] เหมือน NstReqList ของ JSP legacy
  removeFromReq(nstReqList: string[], atClass: string, sex: string): Observable<any> {
    return this.http.post(`${this.API_URL}/nst/req/remove`, { nstReqList, atClass, sex });
  }

  // ค้นหา นศท. โอนย้ายเข้า
  searchTransferNst(regId: string, schoolId: string, atClass: string, sex: string, nstStatus: string): Observable<any> {
    let params = new HttpParams()
      .set('regId', regId)
      .set('schoolId', schoolId)
      .set('atClass', atClass)
      .set('sex', sex)
      .set('nstStatus', nstStatus);
    return this.http.get<any>(`${this.API_URL}/nst/transfer/search`, { params });
  }

  // บันทึกโอนย้าย นศท.
  addTransferNst(data: any): Observable<any> {
    return this.http.post(`${this.API_URL}/nst/transfer/add`, data);
  }

  saveNst(nst: any): Observable<NstRegister> {
    return this.http.put<NstRegister>(`${this.API_URL}/nst/update`, nst);
  }

  // ค้นหาข้อมูล นศท. แบบละเอียด (จาก register_nst.jsp)
  // ไม่ใช้ schoolId เป็นเงื่อนไข (ตาม requirement)
  searchNstDetail(pid: string, nstId: string): Observable<NstDetailData> {
    let params = new HttpParams();
    if (pid) params = params.set('pid', pid);
    if (nstId) params = params.set('nstId', nstId);
    return this.http.get<NstDetailData>(`${this.API_URL}/nst/detail`, { params });
  }

  // บันทึกข้อมูล นศท. (register_nst_edit.jsp)
  saveNstDetail(data: NstDetailData): Observable<any> {
    return this.http.post(`${this.API_URL}/nst/detail/save`, data);
  }

  // ดึงรายการสถานะ นศท.
  getNstStatusList(): Observable<LookupItem[]> {
    return this.http.get<LookupItem[]>(`${this.API_URL}/lookup/nstStatus`);
  }

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

  getSchoolList(): Observable<SchoolOption[]> {
    return this.http.get<SchoolOption[]>(`${this.API_URL}/school/list`);
  }
}

export interface LookupItem {
  id: string;
  desc: string;
}

export interface SchoolOption {
  schoolId: string;
  schoolName: string;
  schoolShortName: string;
  provinceCid: string;
}

export interface NstStatusHistoryItem {
  runningNumber: number;
  atYear: string;
  nstAtClass: string;
  nstStatusDesc: string;
  schoolShortName: string;
  updateDateThai: string;
  note: string;
}

// ข้อมูล นศท. แบบละเอียด (จาก register_nst.jsp)
export interface NstDetailData {
  regMode: string;     // 'Edit' | 'View'
  infoMode: string;
  // ข้อมูลส่วนบุคคล
  regPid: string;
  nstId: string;
  regTitle: string;
  regFname: string;
  regLname: string;
  regSex: string;
  regBirthday: string;
  nstAtClass: string;
  regYear: string;
  atYear: string;
  nstStatusId: string;
  regNat: string;
  regNation: string;
  regReleg: string;
  schoolId: string;
  schoolName: string;
  // ที่อยู่ตามทะเบียนบ้าน
  regAddr: string;
  regMm: string;
  regThanon: string;
  regTrok: string;
  regSoi: string;
  regProvinceCid: string;
  regProvinceName: string;
  regAmphurId: string;
  regAmphurName: string;
  regDistricId: string;
  regDistricName: string;
  // ที่อยู่ที่สามารถติดต่อได้สะดวก
  regPresentAddr: string;
  regPresentMm: string;
  regPresentThanon: string;
  regPresentTrok: string;
  regPresentSoi: string;
  regPresentProvinceCid: string;
  regPresentProvinceName: string;
  regPresentAmphurId: string;
  regPresentAmphurName: string;
  regPresentDistricId: string;
  regPresentDistricName: string;
  // การติดต่อ
  regPhone: string;
  regEmail: string;
  // ภูมิลำเนาทหาร (readonly)
  sdMaddr: string;
  sdMvillage: string;
  sdMroad: string;
  sdMtrok: string;
  sdMsoi: string;
  sdProvinceMidName: string;
  sdMamphurName: string;
  sdMdistricName: string;
  // ข้อมูลบิดา
  regFaFname: string;
  regFaLname: string;
  regFaJob: string;
  regFaJobAddr: string;
  regFaJobProvinceId: string;
  regFaJobProvinceName: string;
  regFaJobAmphurId: string;
  regFaJobAmphurName: string;
  regFaJobDistricId: string;
  regFaJobDistricName: string;
  regFaAddr: string;
  regFaProvinceId: string;
  regFaProvinceName: string;
  regFaAmphurId: string;
  regFaAmphurName: string;
  regFaDistricId: string;
  regFaDistricName: string;
  regFaPhone: string;
  regFamaStatus: string;
  // ข้อมูลมารดา
  regMaFname: string;
  regMaLname: string;
  regMaJob: string;
  regMaJobAddr: string;
  regMaJobProvinceId: string;
  regMaJobProvinceName: string;
  regMaJobAmphurId: string;
  regMaJobAmphurName: string;
  regMaJobDistricId: string;
  regMaJobDistricName: string;
  regMaAddr: string;
  regMaProvinceId: string;
  regMaProvinceName: string;
  regMaAmphurId: string;
  regMaAmphurName: string;
  regMaDistricId: string;
  regMaDistricName: string;
  regMaPhone: string;
  statusHistory?: NstStatusHistoryItem[];
}
