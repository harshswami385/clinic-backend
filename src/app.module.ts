import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppGateway } from './app.gateway';
import { ClinicsModule } from './clinics/clinics.module';
import { AuthModule } from './auth/auth.module';
import { PatientsModule } from './patients/patients.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { QueueModule } from './queue/queue.module';
import { DoctorsModule } from './doctors/doctors.module';
import { Clinic } from './entities/clinic.entity';
import { Doctor } from './entities/doctor.entity';
import { DoctorSchedule } from './entities/doctor-schedule.entity';
import { Patient } from './entities/patient.entity';
import { Appointment } from './entities/appointment.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      useFactory: (cfg: ConfigService) => ({
        type: 'postgres',
        url: cfg.get('DATABASE_URL'),
        entities: [
          Clinic,
          Doctor,
          DoctorSchedule,
          Patient,
          Appointment,
        ],
        autoLoadEntities: true,
        synchronize: true,
        ssl: { rejectUnauthorized: false },
        extra: {
          max: 20,
          connectionTimeoutMillis: 10000,
          query_timeout: 10000,
          statement_timeout: 10000,
        },
        retryAttempts: 10,
        retryDelay: 10000,
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([
      Doctor,
      DoctorSchedule,
      Clinic,
      Patient,
      Appointment,
    ]),
    AuthModule,
    ClinicsModule,
    PatientsModule,
    AppointmentsModule,
    QueueModule,
    DoctorsModule,
  ],
  controllers: [ ],
  providers: [AppGateway],
})
export class AppModule {}