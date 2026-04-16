// src/data-source.ts
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

// entities
import { Clinic } from './entities/clinic.entity';
import { Doctor } from './entities/doctor.entity';
import { DoctorSchedule } from './entities/doctor-schedule.entity';
import { Patient } from './entities/patient.entity';
import { FamilyMember } from './entities/family-member.entity';
import { Appointment } from './entities/appointment.entity';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  synchronize: false,
  logging: false,
  entities: [
    Clinic,
    Doctor,
    DoctorSchedule,
    Patient,
    FamilyMember,
    Appointment,
  ],
  migrations: [__dirname + '/migrations/*.{ts,js}'],
  subscribers: [],
});
