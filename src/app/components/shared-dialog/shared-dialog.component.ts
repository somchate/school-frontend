import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';

export interface SharedDialogData {
  title?: string;
  message: string;
  type: 'alert' | 'confirm';
  confirmText?: string;
  cancelText?: string;
}

@Component({
  selector: 'app-shared-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dialog-overlay" (click)="onOverlayClick($event)">
      <div class="dialog-box">
        <div class="dialog-header" *ngIf="data.title">{{ data.title }}</div>
        <div class="dialog-body">
          <span [innerHTML]="formattedMessage"></span>
        </div>
        <div class="dialog-footer">
          <button class="btn btn-ok" (click)="onOk()">{{ data.confirmText || 'ตกลง' }}</button>
          <button class="btn btn-cancel" *ngIf="data.type === 'confirm'" (click)="onCancel()">{{ data.cancelText || 'ยกเลิก' }}</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dialog-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    }
    .dialog-box {
      background: #fff;
      border-radius: 6px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.18);
      min-width: 320px;
      max-width: 480px;
      padding: 0;
      animation: fadeIn 0.15s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
    .dialog-header {
      background-color: #6d7856;
      color: #fff;
      font-weight: bold;
      font-size: 14px;
      padding: 10px 16px;
      border-radius: 6px 6px 0 0;
    }
    .dialog-body {
      padding: 20px 16px;
      font-size: 13px;
      line-height: 1.6;
      color: #333;
      white-space: pre-line;
    }
    .dialog-footer {
      padding: 10px 16px 14px;
      text-align: center;
      border-top: 1px solid #eee;
    }
    .btn {
      padding: 6px 24px;
      font-size: 13px;
      border: 1px solid #aaa;
      border-radius: 3px;
      cursor: pointer;
      margin: 0 4px;
    }
    .btn-ok {
      background-color: #6d7856;
      color: #fff;
      border-color: #6d7856;
    }
    .btn-ok:hover {
      background-color: #5c6648;
    }
    .btn-cancel {
      background-color: #f5f5f5;
      color: #333;
    }
    .btn-cancel:hover {
      background-color: #e8e8e8;
    }
  `]
})
export class SharedDialogComponent {
  formattedMessage: string;

  constructor(
    public dialogRef: DialogRef<boolean>,
    @Inject(DIALOG_DATA) public data: SharedDialogData
  ) {
    this.formattedMessage = (data.message || '').replace(/\n/g, '<br>');
  }

  onOk(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.dialogRef.close(this.data.type === 'alert' ? true : false);
    }
  }
}
