import { Injectable, NotFoundException, ConflictException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, getConnection, LessThan } from 'typeorm';
import { Appointment, AppointmentStatus } from '../entities/appointment.entity';
import { Patient } from '../entities/patient.entity';
import { FamilyMember } from '../entities/family-member.entity';
import { DoctorSchedule } from '../entities/doctor-schedule.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { AppointmentResponseDto } from './dto/appointment-response.dto';
import { AppGateway } from '../app.gateway';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentsRepository: Repository<Appointment>,
    @InjectRepository(Patient) private patientRepo: Repository<Patient>,
    @InjectRepository(FamilyMember) private famRepo: Repository<FamilyMember>,
    @InjectRepository(DoctorSchedule) private schedRepo: Repository<DoctorSchedule>,
    @Inject(forwardRef(() => AppGateway)) private readonly gateway: AppGateway,
  ) {}

  /** 1) Book an appointment */
  async book(
    dto: CreateAppointmentDto,
    patientUid: string,
  ): Promise<AppointmentResponseDto> {
    if (!dto.patientId) dto.patientId = patientUid;

    // Maybe create a new family member
    let fmId = dto.familyMemberId;
    if (dto.newMember) {
      const patient = await this.patientRepo.findOneBy({ id: dto.patientId });
      if (!patient) throw new NotFoundException('Patient not found');
      const member = this.famRepo.create({ ...dto.newMember, patient });
      const savedFm = await this.famRepo.save(member);
      fmId = savedFm.id;
    }

    // Prevent double-booking
    const where: any = { schedule_id: dto.scheduleId, date: dto.date };
    if (fmId) where.family_member_id = fmId;
    else where.patient_id = dto.patientId!;
    if (await this.appointmentsRepository.findOne({ where }))
      throw new ConflictException('You already have an appointment in this slot');

    // Load schedule for capacity + window checks
    const schedule = await this.schedRepo.findOneBy({ id: dto.scheduleId });
    if (!schedule) throw new NotFoundException('Schedule not found');

    // Transaction to ensure atomicity
    const saved = await this.appointmentsRepository.manager.transaction(async (manager) => {
      const { max } = (await manager
        .createQueryBuilder()
        .select('MAX(a.queue_number)', 'max')
        .from(Appointment, 'a')
        .where('a.schedule_id = :sid AND a.date = :d', {
          sid: dto.scheduleId,
          d: dto.date,
        })
        .getRawOne()) as { max: number };

      const nextQueue = (max ?? 0) + 1;

      // Only restrict for mobile bookings
      if ((dto.source === 'mobile' || !dto.source) && nextQueue > schedule.max_queue)
        throw new BadRequestException('This slot is fully booked');
      if (!schedule.booking_window)
        throw new BadRequestException('Booking for this slot is closed');

      // Create and save appointment
      const appt = this.appointmentsRepository.create();
      appt.schedule_id = dto.scheduleId;
      appt.date = dto.date;
      appt.queue_number = nextQueue;
      appt.status = 'waiting';
      appt.source = dto.source || 'mobile';
      appt.patient_id = fmId ? null : dto.patientId!;
      appt.family_member_id = fmId ?? null;

      return await manager.save(appt);
    });

    // Reload with relations for response
    const loaded = await this.appointmentsRepository.findOneOrFail({
      where: { id: saved.id },
      relations: ['schedule', 'schedule.doctor', 'schedule.doctor.clinic'],
    });

    // Also load patient and familyMember for the WebSocket event
    const fullAppointment = await this.appointmentsRepository.findOne({
      where: { id: saved.id },
      relations: ['patient', 'familyMember'],
    });
    if (fullAppointment) {
      console.log('Emitting status-update', fullAppointment);
      this.gateway.server.emit('status-update', fullAppointment);
      // Emit a test event after 5 seconds
      setTimeout(() => {
        this.gateway.server.emit('status-update', { test: true, time: Date.now() });
      }, 5000);
    }

    // Emit real-time queue update for the schedule/date
    const totalQueue = await this.countBySchedule(dto.scheduleId, dto.date);
    const currentServing = await this.getCurrentServing(dto.scheduleId, dto.date);
    this.gateway.server.emit(
      `queue-updated-${dto.scheduleId}-${dto.date}`,
      { totalQueue, currentServing }
    );

    return {
      id: loaded.id,
      date: loaded.date,
      queueNumber: loaded.queue_number,
      status: loaded.status,
      schedule: {
        id: loaded.schedule.id,
        from: loaded.schedule.start_time,
        to: loaded.schedule.end_time,
        clinicName: loaded.schedule.doctor.clinic.name,
        clinicAddress: loaded.schedule.doctor.clinic.address,
        fees: loaded.schedule.fees,
        doctor: {
          id: loaded.schedule.doctor.id,
          name: loaded.schedule.doctor.name,
          specialization: loaded.schedule.doctor.specialty,
        },
      },
    };
  }

  /** 2) List all appointments for a patient/family-member */
  async findForPatient(patientId: string): Promise<any[]> {
    const patient = await this.patientRepo.findOne({
      where: { id: patientId },
      relations: ['familyMembers'],
    });
    if (!patient) throw new NotFoundException('Patient not found');

    const qb = this.appointmentsRepository
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.schedule', 's')
      .leftJoinAndSelect('s.doctor', 'd')
      .leftJoinAndSelect('d.clinic', 'c')
      .where('a.patient_id = :pid', { pid: patientId });

    const fmIds = patient.familyMembers.map((m) => m.id);
    if (fmIds.length > 0) {
      qb.orWhere('a.family_member_id IN (:...fmIds)', { fmIds });
    }

    const appointments = await qb
      .orderBy('a.date', 'ASC')
      .addOrderBy('a.queue_number', 'ASC')
      .getMany();

    // Map to response structure with doctor specialization and clinic name
    return appointments.map(appt => ({
      id: appt.id,
      date: appt.date,
      queueNumber: appt.queue_number,
      status: appt.status,
      schedule: {
        id: appt.schedule?.id,
        from: appt.schedule?.start_time,
        to: appt.schedule?.end_time,
        clinicName: appt.schedule?.doctor?.clinic?.name ?? '',
        clinicAddress: appt.schedule?.doctor?.clinic?.address ?? '',
        fees: appt.schedule?.fees,
        doctor: {
          id: appt.schedule?.doctor?.id,
          name: appt.schedule?.doctor?.name,
          specialization: appt.schedule?.doctor?.specialty,
        },
      },
    }));
  }

  /** 3) Get a schedule's queue status (total + current) */
  async findQueue(
    scheduleId: string,
    date: string,
  ): Promise<{ totalQueue: number; currentQueue: number }> {
    const totalQueue = await this.appointmentsRepository.count({
      where: { schedule_id: scheduleId, date, status: 'waiting' },
    });

    const raw = await this.appointmentsRepository
      .createQueryBuilder('a')
      .select('MIN(a.queue_number)', 'current')
      .where('a.schedule_id = :sid', { sid: scheduleId })
      .andWhere('a.date = :d', { d: date })
      .andWhere('a.status = :st', { st: 'waiting' })
      .getRawOne<{ current: number | null }>();

    return {
      totalQueue,
      currentQueue: raw?.current ?? 0,
    };
  }

  async countBySchedule(scheduleId: string, date: string): Promise<number> {
    return this.appointmentsRepository.count({
      where: { schedule: { id: scheduleId }, date },
    });
  }

  async getCurrentServing(scheduleId: string, date: string): Promise<number> {
    const appt = await this.appointmentsRepository.findOne({
      where: { schedule: { id: scheduleId }, date, status: 'serving' },
    });
    return appt?.queue_number ?? 0;
  }

  async findBySchedule(scheduleId: string, date: string): Promise<Appointment[]> {
    return this.appointmentsRepository.find({
      where: { schedule: { id: scheduleId }, date },
      order: { queue_number: 'ASC' },
      relations: ['patient', 'familyMember'],
    });
  }

  /** Get all appointments for a clinic */
  async findByClinic(clinicId: string, date?: string, doctorId?: string): Promise<Appointment[]> {
    const queryBuilder = this.appointmentsRepository
      .createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.patient', 'patient')
      .leftJoinAndSelect('appointment.familyMember', 'familyMember')
      .leftJoinAndSelect('appointment.schedule', 'schedule')
      .leftJoinAndSelect('schedule.doctor', 'doctor')
      .leftJoinAndSelect('doctor.clinic', 'clinic')
      .where('clinic.id = :clinicId', { clinicId })
      .orderBy('appointment.date', 'DESC')
      .addOrderBy('appointment.queue_number', 'ASC');

    if (date) {
      queryBuilder.andWhere('appointment.date = :date', { date });
    }

    if (doctorId && doctorId !== 'all') {
      queryBuilder.andWhere('doctor.id = :doctorId', { doctorId });
    }

    return queryBuilder.getMany();
  }

  /** 4) (Optional) update an appointment's status */
  async updateStatus(
    id: string,
    status: AppointmentStatus,
  ): Promise<AppointmentResponseDto> {
    const appt = await this.appointmentsRepository.findOne({
      where: { id },
      relations: ['schedule', 'schedule.doctor', 'schedule.doctor.clinic'],
    });
    if (!appt) throw new NotFoundException('Appointment not found');

    appt.status = status;
    const saved = await this.appointmentsRepository.save(appt);

    // --- Real-time queue update logic ---
    const waitingAppointments = await this.appointmentsRepository.find({
      where: {
        schedule_id: saved.schedule.id,
        date: saved.date,
        status: 'waiting',
      },
    });

    for (const waiting of waitingAppointments) {
      const peopleAhead = await this.getPeopleAhead(waiting.id);
      this.gateway.server.emit(`queue-position-updated-${waiting.id}`, {
        appointmentId: waiting.id,
        peopleAhead,
      });
    }
    // --- End real-time queue update logic ---

    // Emit real-time queue update for the schedule/date
    const totalQueue = await this.countBySchedule(saved.schedule.id, saved.date);
    const currentServing = await this.getCurrentServing(saved.schedule.id, saved.date);
    this.gateway.server.emit(
      `queue-updated-${saved.schedule.id}-${saved.date}`,
      { totalQueue, currentServing }
    );

    return {
      id: saved.id,
      date: saved.date,
      queueNumber: saved.queue_number,
      status: saved.status,
      schedule: {
        id: saved.schedule.id,
        from: saved.schedule.start_time,
        to: saved.schedule.end_time,
        clinicName: saved.schedule.doctor.clinic.name,
        clinicAddress: saved.schedule.doctor.clinic.address,
        fees: saved.schedule.fees,
        doctor: {
          id: saved.schedule.doctor.id,
          name: saved.schedule.doctor.name,
          specialization: saved.schedule.doctor.specialty,
        },
      },
    };
  }

  async getPeopleAhead(appointmentId: string): Promise<number> {
    const appt = await this.appointmentsRepository.findOne({ where: { id: appointmentId } });
    if (!appt) return 0;
    return this.appointmentsRepository.count({
      where: {
        schedule_id: appt.schedule_id,
        date: appt.date,
        status: 'waiting',
        queue_number: LessThan(appt.queue_number),
      },
    });
  }
}
