import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface TransferNst {
  nstId: string;
  transferDate: string;
  nstAtClass: string;
  regTitle: string;
  regFname: string;
  regLname: string;
  fromSchoolName: string;
  toSchoolName: string;
  commandNo: string;
}

@Injectable({
  providedIn: 'root'
})
export class TransferService {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getTransferList(schoolId: string, year: string): Observable<TransferNst[]> {
    return this.http.get<TransferNst[]>(`${this.API_URL}/transfer/list/${schoolId}/${year}`);
  }

  getTransferDetail(nstId: string): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/transfer/detail/${nstId}`);
  }
}
