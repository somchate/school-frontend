import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// รายการ นศท. ขอรอรับสิทธิ (จาก nst_waiting_rights.jsp)
export interface WaitingRightsNst {
  nstId: string;
  regPid: string;
  regTitle: string;
  regFname: string;
  regLname: string;
  nstAtClass: string;
  atYear: string;
  nstStatusId: string;
  statusDesc: string;
  // สำหรับ UI: สามารถคลิก link ได้ (status 2*, 5*, E1, E2 ปีก่อน)
  canProcess: boolean;
  // สำหรับ UI: สามารถยกเลิกได้ (status D* ปีปัจจุบัน)
  canCancel: boolean;
}

// ข้อมูลสำหรับฟอร์มขอรอรับสิทธิ (จาก nst_waiting_rights_process.jsp)
export interface WaitingRightsProcessData {
  regPid: string;
  nstId: string;
  name: string;
  atClass: string;
  schoolId: string;
  atYear: string;
  waiting: boolean;
  remark: string;
  note: string;
}

@Injectable({
  providedIn: 'root'
})
export class WaitingRightsService {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ค้นหา (จาก nst_waiting_rights.jsp)
  searchWaitingRights(schoolId: string, pid?: string, fname?: string, lname?: string): Observable<WaitingRightsNst[]> {
    let params = new HttpParams();
    if (pid) params = params.set('pid', pid);
    if (fname) params = params.set('fname', fname);
    if (lname) params = params.set('lname', lname);
    return this.http.get<WaitingRightsNst[]>(`${this.API_URL}/waiting-rights/search/${schoolId}`, { params });
  }

  // ดึงข้อมูล นศท. สำหรับขอรอรับสิทธิ (จาก nst_waiting_rights_process.jsp)
  getProcessData(regPid: string): Observable<WaitingRightsProcessData> {
    return this.http.get<WaitingRightsProcessData>(`${this.API_URL}/waiting-rights/process/${regPid}`);
  }

  // บันทึกขอรอรับสิทธิ (จาก nst_waiting_rights_edit.jsp Mode=Process)
  saveProcess(data: WaitingRightsProcessData): Observable<any> {
    return this.http.post(`${this.API_URL}/waiting-rights/process/save`, data);
  }

  // ยกเลิกรายการขอรอรับสิทธิ (จาก nst_waiting_rights_edit.jsp Mode=Cancel)
  cancelWaitingRights(regPid: string): Observable<any> {
    return this.http.post(`${this.API_URL}/waiting-rights/cancel`, { regPid });
  }
}
