import { Component, HostListener, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, MatSidenavModule, MatToolbarModule, MatIconModule, MatButtonModule],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss']
})
export class MainLayoutComponent {
  @ViewChild('drawer') drawer?: MatSidenav;

  isMobile: boolean = false;
  sidenavMode: 'side' | 'over' = 'side';
  sidenavOpened: boolean = true;

  constructor() {
    this.updateLayout();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.updateLayout();
  }

  private updateLayout(): void {
    const mobile = window.innerWidth <= 768;
    const modeChanged = mobile !== this.isMobile;
    this.isMobile = mobile;
    this.sidenavMode = mobile ? 'over' : 'side';
    if (modeChanged) {
      this.sidenavOpened = mobile ? false : true;
    }
  }

  toggleDrawer(): void {
    this.drawer?.toggle();
  }

  closeDrawer(): void {
    this.drawer?.close();
  }

  onSidebarItemSelected(): void {
    if (this.isMobile) {
      this.closeDrawer();
    }
  }
}
