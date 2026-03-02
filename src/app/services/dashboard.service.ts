import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface DashboardStats {
  studentRegisterM: string;
  studentRegisterF: string;
  nst1Pass: string;
  nst1Fail: string;
  nst2Pass: string;
  nst2Fail: string;
  nst3Pass: string;
  nst3Fail: string;
  nst4Pass: string;
  nst4Fail: string;
  nst5Pass: string;
  nst5Fail: string;
  schoolName: string;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getStatistics(schoolId: string, year: string): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.API_URL}/dashboard/stats/${schoolId}/${year}`);
  }

  getYearEducate(): Observable<{ yearEducate: string }> {
    return this.http.get<{ yearEducate: string }>(`${this.API_URL}/dashboard/year-educate`);
  }

  getSchedules(schoolId: string, year: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/dashboard/schedules/${schoolId}/${year}`);
  }
}
