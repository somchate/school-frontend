import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { AppComponent } from './app/app.component';
import { routes } from './app/app-routing.module';
import { BuddhistDateAdapter, BUDDHIST_DATE_FORMATS } from './app/shared/buddhist-date-adapter';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideAnimations(),
    provideHttpClient(),
    { provide: DateAdapter, useClass: BuddhistDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: BUDDHIST_DATE_FORMATS },
    { provide: MAT_DATE_LOCALE, useValue: 'th-TH' }
  ]
}).catch(err => console.error(err));
