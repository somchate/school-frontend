import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { MainLayoutComponent } from './components/layout/main-layout/main-layout.component';
import { WelcomeComponent } from './pages/welcome/welcome.component';
import { SchoolInfoComponent } from './pages/school-info/school-info.component';
import { RegisterStudentComponent } from './pages/register-student/register-student.component';
import { RegisterNstInfoComponent } from './pages/register-nst-info/register-nst-info.component';
import { RegisterNstComponent } from './pages/register-nst/register-nst.component';
import { TransferNstComponent } from './pages/transfer-nst/transfer-nst.component';
import { DataDelayNstComponent } from './pages/data-delay-nst/data-delay-nst.component';
import { NstWaitingRightsComponent } from './pages/nst-waiting-rights/nst-waiting-rights.component';
import { ExceptionNstComponent } from './pages/exception-nst/exception-nst.component';
import { PrintRegisterComponent } from './pages/print-register/print-register.component';
import { ChangePasswordComponent } from './pages/change-password/change-password.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { 
    path: '', 
    component: MainLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: 'welcome', component: WelcomeComponent },
      { path: 'school-info', component: SchoolInfoComponent },
      { path: 'register-student', component: RegisterStudentComponent },
      { path: 'register-nst-info', component: RegisterNstInfoComponent },
      { path: 'register-nst', component: RegisterNstComponent },
      { path: 'transfer-nst', component: TransferNstComponent },
      { path: 'data-delay-nst', component: DataDelayNstComponent },
      { path: 'nst-waiting-rights', component: NstWaitingRightsComponent },
      { path: 'exception-nst', component: ExceptionNstComponent },
      { path: 'print-register', component: PrintRegisterComponent },
      { path: 'change-password', component: ChangePasswordComponent }
    ]
  },
  { path: '**', redirectTo: '/login' }
];
