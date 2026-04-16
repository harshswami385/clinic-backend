import { Injectable } from '@nestjs/common';
import * as dotenv from 'dotenv';

@Injectable()
export class ConfigService {
  constructor() {
    dotenv.config();
  }

  get databaseUrl(): string {
    return process.env.DATABASE_URL;
  }

  get firebaseProjectId(): string {
    return process.env.FIREBASE_PROJECT_ID;
  }

  get firebasePrivateKey(): string {
    return process.env.FIREBASE_PRIVATE_KEY;
  }

  get firebaseClientEmail(): string {
    return process.env.FIREBASE_CLIENT_EMAIL;
  }
}