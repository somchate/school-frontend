import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SMCData } from '../models/auth.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SmcService {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getVersion(): Observable<any> {
    return this.http.post(`${this.API_URL}/smc/version`, {});
  }

  getData(requestField: number): Observable<any> {
    return this.http.post(`${this.API_URL}/smc/data/${requestField}`, {});
  }

  getDataAll(): Observable<any> {
    return this.http.post(`${this.API_URL}/smc/data-all`, {});
  }

  getDataAllButPic(): Observable<any> {
    return this.http.post(`${this.API_URL}/smc/data-allbutpic`, {});
  }

  getPID(): Observable<any> {
    return this.http.post(`${this.API_URL}/smc/pid`, {});
  }

  getPicture(): Observable<any> {
    return this.http.post(`${this.API_URL}/smc/picture`, {});
  }

  getReqXXX(): Observable<any> {
    return this.http.post(`${this.API_URL}/smc/req-xxx`, {});
  }

  getRepXXX(returnXXX: string): Observable<any> {
    return this.http.post(`${this.API_URL}/smc/rep-xxx/${returnXXX}`, {});
  }

  performSMCLogin(): Observable<{ success: boolean; data?: SMCData; message?: string }> {
    return this.http.post<{ success: boolean; data?: SMCData; message?: string }>(
      `${this.API_URL}/smc/login`, 
      {}
    );
  }
}
