// src/appointments/appointments.module.ts
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppointmentsController } from './appointments.controller';
import { AppointmentsService }    from './appointments.service';
import { AppGateway } from '../app.gateway';

import { Appointment }     from '../entities/appointment.entity';
import { Patient }         from '../entities/patient.entity';
import { FamilyMember }    from '../entities/family-member.entity';
import { DoctorSchedule }  from '../entities/doctor-schedule.entity';

@Module({
  imports: [
    // ← here we register ALL four repositories
    TypeOrmModule.forFeature([
      Appointment,
      Patient,
      FamilyMember,
      DoctorSchedule,
    ]),
    forwardRef(() => AppointmentsModule),
  ],
  controllers: [AppointmentsController],
  providers:   [AppointmentsService, AppGateway],
  exports:     [AppointmentsService],  // if other modules need to inject it
})
export class AppointmentsModule {}
