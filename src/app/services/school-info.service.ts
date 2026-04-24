import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface SchoolInfo {
  schoolId: string;
  schoolName: string;
  schoolShortName: string;
  schoolOpenDate: string;
  schoolAddr: string;
  usrInform: string;
  certifierFname?: string;
  certifierLname?: string;
  certifierPosition?: string;
}

export interface Inspector {
  inspectorId: string;
  titleName: string;
  firstName: string;
  lastName: string;
  inspectorType: string;
  orderCommand: string;
  loginDate: string;
  birthDate: string;
  schoolId: string;
}

@Injectable({
  providedIn: 'root'
})
export class SchoolInfoService {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getSchoolInfo(schoolId: string): Observable<SchoolInfo> {
    return this.http.get<SchoolInfo>(`${this.API_URL}/school/info/${schoolId}`);
  }

  updateInform(schoolId: string, inform: string): Observable<SchoolInfo> {
    return this.http.put<SchoolInfo>(`${this.API_URL}/school/inform/${schoolId}`, { inform });
  }

  updateCertifier(
    schoolId: string,
    certifierFname: string,
    certifierLname: string,
    certifierPosition: string
  ): Observable<SchoolInfo> {
    return this.http.put<SchoolInfo>(`${this.API_URL}/school/certifier/${schoolId}`, {
      certifierFname,
      certifierLname,
      certifierPosition
    });
  }

  getInspectors(schoolId: string): Observable<Inspector[]> {
    return this.http.get<Inspector[]>(`${this.API_URL}/school/inspectors/${schoolId}`);
  }
}
