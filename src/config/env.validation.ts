import { Module } from '@nestjs/common';
import { ConfigService } from './config.service';

@Module({
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}

export function validate(env: NodeJS.ProcessEnv): void {
  const required = [
    'DATABASE_URL',
    'FIREBASE_PROJECT_ID',
    'FIREBASE_PRIVATE_KEY',
    'FIREBASE_CLIENT_EMAIL',
    // …add any others you care about
  ];
  const missing = required.filter((key) => !env[key]);
  if (missing.length) {
    throw new Error(
      `❌ Missing required environment variables: ${missing.join(', ')}`
    );
  }
}