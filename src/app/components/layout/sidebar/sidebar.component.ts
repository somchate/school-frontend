import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../../services/auth.service';
import { DashboardService } from '../../../services/dashboard.service';
import { SchoolInfoService } from '../../../services/school-info.service';

interface MenuItem {
  label: string;
  route?: string;
  icon?: string;
  color?: string;
  minAccessLevel?: number;
  children?: MenuItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, MatListModule, MatIconModule, MatButtonModule, MatDividerModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
  @Output() itemSelected = new EventEmitter<void>();

  currentYear: string = '';
  menuItems: MenuItem[] = [];
  userAccessLevel: number = 0;
  schoolId: string = '';
  schoolName: string = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private dashboardService: DashboardService,
    private schoolInfoService: SchoolInfoService
  ) {}

  ngOnInit(): void {
    const now = new Date();
    let buddhistYear = now.getFullYear() + 543;
    if (now.getMonth() < 4) { buddhistYear--; }
    this.currentYear = buddhistYear.toString();

    this.authService.currentUser.subscribe(user => {
      if (user) {
        this.userAccessLevel = user.accessLevel || 0;
        this.schoolId = user.schoolId || '';
        this.schoolName = user.schoolName || '';

        if (this.schoolId && !this.schoolName) {
          this.schoolInfoService.getSchoolInfo(this.schoolId).subscribe({
            next: (info) => {
              this.schoolName = info.schoolName || this.schoolName;
            },
            error: () => {}
          });
        }
      }
      this.initializeMenu();
    });
  }

  // โครงสร้างเมนูตามปี 2568 (left.jsp) — flat list
  initializeMenu(): void {
    this.menuItems = [
      {
        label: 'ระบบการผลิตกำลังพลสำรอง',
        icon: 'fas fa-home',
        children: [
          {
            label: 'หน้าแรก',
            route: '/welcome',
            icon: 'fas fa-chevron-right'
          },
          {
            label: 'ข้อมูลสถานศึกษา ฯ',
            route: '/school-info',
            icon: 'fas fa-chevron-right',
            color: '#6600cc'
          },
          {
            label: 'สมัครเข้าเป็น นศท.',
            route: '/register-student',
            icon: 'fas fa-chevron-right',
            color: '#2222FF',
            minAccessLevel: 2
          },
          {
            label: 'รายงานตัว นศท.',
            route: '/register-nst-info',
            icon: 'fas fa-chevron-right',
            color: '#339966',
            minAccessLevel: 2
          },
          {
            label: 'ข้อมูล นศท.',
            route: '/register-nst',
            icon: 'fas fa-chevron-right',
            minAccessLevel: 2
          },
          {
            label: 'โอนย้ายสถานศึกษาฯ',
            route: '/transfer-nst',
            icon: 'fas fa-chevron-right',
            minAccessLevel: 2
          },
          {
            label: 'ข้อมูลการฝึก',
            route: '/data-delay-nst',
            icon: 'fas fa-chevron-right',
            minAccessLevel: 2
          },
          {
            label: 'ขอรอรับสิทธิ',
            route: '/nst-waiting-rights',
            icon: 'fas fa-chevron-right',
            minAccessLevel: 2
          },
          {
            label: 'ขอยกเว้นการตรวจเลือกฯ',
            route: '/exception-nst',
            icon: 'fas fa-chevron-right',
            minAccessLevel: 2
          },
          {
            label: 'พิมพ์บัญชี',
            route: '/print-register',
            icon: 'fas fa-chevron-right',
            color: '#ff0080'
          },
          {
            label: 'เปลี่ยนรหัสผ่าน',
            route: '/change-password',
            icon: 'fas fa-chevron-right'
          },
          {
            label: 'ออกจากระบบ',
            route: '/logout',
            icon: 'fas fa-chevron-right'
          }
        ]
      }
    ];
  }

  hasAccess(item: MenuItem): boolean {
    if (!item.minAccessLevel) {
      return true;
    }
    return this.userAccessLevel >= item.minAccessLevel;
  }

  navigate(route?: string): void {
    this.itemSelected.emit();
    if (route === '/logout') {
      this.authService.logout();
      this.router.navigate(['/login']);
    } else if (route) {
      this.router.navigate([route]);
    }
  }

  isActive(route?: string): boolean {
    if (!route) return false;
    return this.router.url === route;
  }
}
