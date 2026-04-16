import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import * as dotenv from 'dotenv';
import * as admin from 'firebase-admin';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  // Load environment variables
  dotenv.config();

  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Add global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    })
  );

  // Initialize Firebase
  try {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: configService.get<string>('FIREBASE_PROJECT_ID'),
          privateKey: configService
            .get<string>('FIREBASE_PRIVATE_KEY')
            ?.replace(/\\n/g, '\n'),
          clientEmail: configService.get<string>('FIREBASE_CLIENT_EMAIL'),
        }),
      });
      console.log('Firebase initialized successfully');
    }
  } catch (err) {
    console.error('Firebase initialization error:', err);
  }

  // Enable CORS and set global prefix
  app.enableCors();
  app.setGlobalPrefix('api');

  const port = Number(configService.get<string>('PORT') ?? process.env.PORT ?? 3000);
  await app.listen(port, '0.0.0.0');
  console.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap();
