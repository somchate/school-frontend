import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// รายการ นศท. ขอยกเว้นการตรวจเลือก (จาก exception_nst.jsp)
export interface ExceptionNst {
  nstId: string;
  regFname: string;     // title + fname (จาก JSP: REG_TITLE || ' ' || REG_FNAME)
  regLname: string;
  nstAtClass: string;
}

@Injectable({
  providedIn: 'root'
})
export class ExceptionService {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ค้นหาตามปีการศึกษา (จาก exception_nst.jsp)
  searchException(schoolId: string, regYear: string): Observable<ExceptionNst[]> {
    return this.http.get<ExceptionNst[]>(`${this.API_URL}/exception/search/${schoolId}/${regYear}`);
  }
}
