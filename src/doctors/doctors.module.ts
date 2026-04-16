// src/doctors/doctors.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DoctorsService } from './doctors.service';
import { DoctorsController } from './doctors.controller';
import { DoctorScheduleService } from './doctor-schedule.service';
import { DoctorScheduleController } from './doctor-schedule.controller';
import { QueueModule }     from '../queue/queue.module';
import { Doctor }          from '../entities/doctor.entity';
import { DoctorSchedule }  from '../entities/doctor-schedule.entity';
import { Appointment }     from '../entities/appointment.entity';
import { Clinic }          from '../entities/clinic.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Doctor,
      DoctorSchedule,
      Appointment,
      Clinic,
    ]),
    QueueModule,
  ],
  controllers: [DoctorsController, DoctorScheduleController,],
  providers:   [DoctorsService, DoctorScheduleService,  ],
  exports:     [DoctorsService, DoctorScheduleService,],
})
export class DoctorsModule {}