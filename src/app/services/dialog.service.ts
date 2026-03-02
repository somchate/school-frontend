import { Injectable } from '@angular/core';
import { Dialog } from '@angular/cdk/dialog';
import { firstValueFrom } from 'rxjs';
import { SharedDialogComponent, SharedDialogData } from '../components/shared-dialog/shared-dialog.component';

@Injectable({
  providedIn: 'root'
})
export class DialogService {

  constructor(private dialog: Dialog) {}

  /** แสดง alert dialog (แทน window.alert) — คืน Promise<void> */
  async alert(message: string, title?: string): Promise<void> {
    const dialogRef = this.dialog.open<boolean>(SharedDialogComponent, {
      data: { message, title, type: 'alert' } as SharedDialogData,
      hasBackdrop: false
    });
    await firstValueFrom(dialogRef.closed);
  }

  /** แสดง confirm dialog (แทน window.confirm) — คืน Promise<boolean> */
  async confirm(message: string, title?: string): Promise<boolean> {
    const dialogRef = this.dialog.open<boolean>(SharedDialogComponent, {
      data: { message, title, type: 'confirm', confirmText: 'ตกลง', cancelText: 'ยกเลิก' } as SharedDialogData,
      hasBackdrop: false
    });
    const result = await firstValueFrom(dialogRef.closed);
    return result === true;
  }
}
