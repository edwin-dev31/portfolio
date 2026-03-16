import { ApplicationConfig, ErrorHandler, provideBrowserGlobalErrorListeners } from '@angular/core';
import {
  provideRouter,
  withPreloading,
  PreloadAllModules,
  withInMemoryScrolling
} from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
// SE ELIMINÓ: provideAnimations
import { IMAGE_LOADER, ImageLoaderConfig } from '@angular/common';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirestore, getFirestore, initializeFirestore, persistentLocalCache } from '@angular/fire/firestore';
import { environment } from '../environments/environment';

import { routes } from './app.routes';
import { GlobalErrorHandler } from './core/handlers/global-error.handler';
import { errorInterceptor } from './core/interceptors/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    provideRouter(
      routes,
      withPreloading(PreloadAllModules),
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled' })
    ),
    provideHttpClient(withInterceptors([errorInterceptor])),
    { provide: IMAGE_LOADER, useValue: (config: ImageLoaderConfig) => config.src },
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => getAuth()),
    provideFirestore(() => {
      const app = initializeApp(environment.firebase);
      return initializeFirestore(app, {
        localCache: persistentLocalCache({})
      });
    })
  ]
};