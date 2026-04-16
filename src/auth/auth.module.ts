import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { FirebaseStrategy } from './firebase.strategy';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'firebase' })],
  providers: [FirebaseStrategy],
  exports: [PassportModule],
})
export class AuthModule {}