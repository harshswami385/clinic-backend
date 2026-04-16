// src/patients/patients.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PatientsService } from './patients.service';
import { PatientsController } from './patients.controller';
import { Patient } from '../entities/patient.entity';
import { AuthModule } from '../auth/auth.module';
import { FamilyMember } from '../entities/family-member.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Patient , FamilyMember]),
    AuthModule, 
  ],
  providers: [PatientsService],
  controllers: [PatientsController],
})
export class PatientsModule {}
