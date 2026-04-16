import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QueueController } from './queue.controller';
import { QueueService } from './queue.service';
import { Doctor } from '../entities/doctor.entity';
import { Clinic } from '../entities/clinic.entity';
import { DoctorSchedule } from '../entities/doctor-schedule.entity';
import { Appointment }     from '../entities/appointment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Doctor, Clinic, DoctorSchedule, Appointment])
  ],
  controllers: [QueueController],
  providers: [QueueService],
  exports: [QueueService]
})
export class QueueModule {}