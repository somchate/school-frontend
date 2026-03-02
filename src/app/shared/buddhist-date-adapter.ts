import { Injectable } from '@angular/core';
import { NativeDateAdapter } from '@angular/material/core';

const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน',
  'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม',
  'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

const THAI_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.',
  'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.',
  'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

const THAI_DAYS_SHORT = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
const THAI_DAYS_NARROW = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

@Injectable()
export class BuddhistDateAdapter extends NativeDateAdapter {

  override getYear(date: Date): number {
    return date.getFullYear() + 543;
  }

  override getMonthNames(style: 'long' | 'short' | 'narrow'): string[] {
    return style === 'long' ? THAI_MONTHS : THAI_MONTHS_SHORT;
  }

  override getDayOfWeekNames(style: 'long' | 'short' | 'narrow'): string[] {
    return style === 'narrow' ? THAI_DAYS_NARROW : THAI_DAYS_SHORT;
  }

  override getDateNames(): string[] {
    return Array.from({ length: 31 }, (_, i) => String(i + 1));
  }

  override getYearName(date: Date): string {
    return (date.getFullYear() + 543).toString();
  }

  override getFirstDayOfWeek(): number {
    return 0;
  }

  override createDate(year: number, month: number, date: number): Date {
    // year coming in is Buddhist Era, convert to CE
    if (year > 2400) {
      year = year - 543;
    }
    return super.createDate(year, month, date);
  }

  override parse(value: any): Date | null {
    if (typeof value === 'string' && value) {
      // Try parsing dd/mm/yyyy (Thai format)
      const parts = value.split('/');
      if (parts.length === 3) {
        let day = parseInt(parts[0], 10);
        let month = parseInt(parts[1], 10) - 1;
        let year = parseInt(parts[2], 10);
        if (year > 2400) {
          year = year - 543;
        }
        return new Date(year, month, day);
      }
    }
    return super.parse(value);
  }

  override format(date: Date, displayFormat: Object): string {
    if (displayFormat === 'input') {
      const day = date.getDate();
      const month = THAI_MONTHS_SHORT[date.getMonth()];
      const year = date.getFullYear() + 543;
      return `${day} ${month} ${year}`;
    }
    if (displayFormat === 'monthYearLabel') {
      const month = THAI_MONTHS[date.getMonth()];
      const year = date.getFullYear() + 543;
      return `${month} ${year}`;
    }
    if (displayFormat === 'monthYearA11yLabel') {
      const month = THAI_MONTHS[date.getMonth()];
      const year = date.getFullYear() + 543;
      return `${month} ${year}`;
    }
    if (displayFormat === 'dateA11yLabel') {
      const day = date.getDate();
      const month = THAI_MONTHS[date.getMonth()];
      const year = date.getFullYear() + 543;
      return `${day} ${month} ${year}`;
    }
    const day = date.getDate();
    const month = THAI_MONTHS_SHORT[date.getMonth()];
    const year = date.getFullYear() + 543;
    return `${day} ${month} ${year}`;
  }
}

export const BUDDHIST_DATE_FORMATS = {
  parse: {
    dateInput: 'input'
  },
  display: {
    dateInput: 'input',
    monthYearLabel: 'monthYearLabel',
    dateA11yLabel: 'dateA11yLabel',
    monthYearA11yLabel: 'monthYearA11yLabel'
  }
};
