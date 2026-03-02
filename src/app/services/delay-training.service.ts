import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface DelayTraining {
  id: string;
  trainNo: string;
  atClass: string;
  regSex: string;
}

export interface DelayTrainingNst {
  nstId: string;
  regTitle: string;
  regFname: string;
  regLname: string;
  regPid: string;
  nstAtClass: string;
}

// ข้อมูลรายละเอียดผลัดฝึก (จาก add_list_nst.jsp - MIA_GROUND)
export interface GroundDetail {
  id: string;
  regYear: string;
  atClass: string;
  regSex: string;
  trainType: string;    // '1' = ผลัดฝึกปกติ, '2' = ผลัดฝึกพาราเซล
  trainNo: string;
  unitNo: string;
  dateStart: string;
  dateEnd: string;
  remarks: string;      // หน่วยฝึก
}

@Injectable({
  providedIn: 'root'
})
export class DelayTrainingService {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getDelayList(schoolId: string, year: string): Observable<DelayTraining[]> {
    return this.http.get<DelayTraining[]>(`${this.API_URL}/delay-training/list/${schoolId}/${year}`);
  }

  getDelayNstList(groundId: string): Observable<DelayTrainingNst[]> {
    return this.http.get<DelayTrainingNst[]>(`${this.API_URL}/delay-training/nst-list/${groundId}`);
  }

  // ดึงข้อมูลรายละเอียดผลัดฝึก (จาก add_list_nst.jsp)
  getGroundDetail(groundId: string): Observable<GroundDetail> {
    return this.http.get<GroundDetail>(`${this.API_URL}/delay-training/ground/${groundId}`);
  }
}
