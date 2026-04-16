// src/appointments/appointments.controller.ts
import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  BadRequestException,
  UseGuards,
  Req,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { GetByScheduleDto } from './dto/get-by-schedule.dto';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';

@Controller('appointments')
@UseGuards(FirebaseAuthGuard)
export class AppointmentsController {
  constructor(
    private readonly appointmentsService: AppointmentsService,
  ) {}

  /** Book an appointment (mobile) */
  @Post('book')
  async book(
    @Body() dto: CreateAppointmentDto,
    @Req() req: any,
  ) {
    if (!dto.patientId && !dto.familyMemberId && !dto.newMember) {
      throw new BadRequestException(
        'Must specify patientId (self), familyMemberId, or newMember data'
      );
    }
    const appointment = await this.appointmentsService.book(dto, req.user.uid);
    return { success: true, data: appointment };
  }

  /** List all appointments for a patient/family-member */
  @Get('patient/:id')
  async forPatient(@Param('id') id: string) {
    const list = await this.appointmentsService.findForPatient(id);
    return { success: true, data: list };
  }

  /** Get a schedule's queue status */
  @Get('schedule/:scheduleId/:date')
  async queue(
    @Param('scheduleId') scheduleId: string,
    @Param('date') date: string,
  ) {
    const status = await this.appointmentsService.findQueue(scheduleId, date);
    return { success: true, data: status };
  }

  /** Update an appointment's status (web) */
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: 'waiting'|'serving'|'completed',
  ) {
    return this.appointmentsService.updateStatus(id, status);
  }

  @Get()
  async findBySchedule(
    @Query(new ValidationPipe({ transform: true })) dto: GetByScheduleDto,
  ) {
    return this.appointmentsService.findBySchedule(
      dto.scheduleId,
      dto.date,
    );
  }

  /** Get all appointments for a clinic */
  @Get('clinic')
  async findByClinic(
    @Req() req: any,
    @Query('date') date?: string,
    @Query('doctorId') doctorId?: string,
  ) {
    return this.appointmentsService.findByClinic(
      req.user.uid,
      date,
      doctorId,
    );
  }
}