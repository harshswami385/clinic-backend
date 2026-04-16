/* eslint-disable prettier/prettier */
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Doctor } from '../entities/doctor.entity';
import { DoctorSchedule } from '../entities/doctor-schedule.entity';
import { Clinic } from '../entities/clinic.entity';
import { Appointment } from '../entities/appointment.entity';

import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { CreateDoctorScheduleDto } from './dto/create-doctor-schedule.dto';
import { UpdateDoctorScheduleDto } from './dto/update-doctor-schedule.dto';

@Injectable()
export class DoctorsService {
  constructor(
    @InjectRepository(Doctor) private readonly doctorRepository: Repository<Doctor>,
    @InjectRepository(DoctorSchedule) private readonly scheduleRepository: Repository<DoctorSchedule>,
    @InjectRepository(Appointment) private readonly appointmentsRepository: Repository<Appointment>,
    @InjectRepository(Clinic) private readonly clinicsRepository: Repository<Clinic>,
  ) {}

  async create(clinicId: string, dto: CreateDoctorDto) {
    const clinic = await this.clinicsRepository.findOne({ where: { id: clinicId } });
    if (!clinic) throw new NotFoundException('Clinic not found');
    const doctor = this.doctorRepository.create({ ...dto, clinic });
    return this.doctorRepository.save(doctor);
  }

  async getQueueStatus() {
    const today = new Date().toISOString().slice(0, 10);
    const schedules = await this.scheduleRepository.find({ relations: ['doctor'] });

    return Promise.all(
      schedules.map(async (s) => {
        const total = await this.appointmentsRepository.count({
          where: { schedule: { id: s.id }, date: today },
        });
        const servingAppt = await this.appointmentsRepository.findOne({
          where: { schedule: { id: s.id }, date: today, status: 'serving' },
        });
        return {
          doctorId: s.doctor.id,
          doctorName: s.doctor.name,
          scheduleId: s.id,
          slot: { from: s.start_time, to: s.end_time },
          totalQueue: total,
          currentServing: servingAppt?.queue_number ?? 0,
        };
      }),
    );
  }

  async findAll(clinicId: string) {
    const doctors = await this.doctorRepository.find({
      where: { clinic: { id: clinicId } },
      relations: ['schedules'],
    });
    console.log('Doctors with schedules:', JSON.stringify(doctors, null, 2));
    return doctors;
  }

  async update(clinicId: string, doctorId: string, dto: UpdateDoctorDto) {
    const doctor = await this.doctorRepository.findOne({
      where: { id: doctorId },
      relations: ['clinic'],
    });
    if (!doctor) throw new NotFoundException('Doctor not found');
    if (doctor.clinic.id !== clinicId) throw new ForbiddenException('Not your doctor');
    Object.assign(doctor, dto);
    return this.doctorRepository.save(doctor);
  }

  async remove(clinicId: string, doctorId: string) {
    const doctor = await this.doctorRepository.findOne({
      where: { id: doctorId },
      relations: ['clinic'],
    });
    if (!doctor) throw new NotFoundException('Doctor not found');
    if (doctor.clinic.id !== clinicId) throw new ForbiddenException('Not your doctor');
    await this.doctorRepository.remove(doctor);
    return { success: true };
  }

  // --- Schedule Management ---
  async addSchedule(clinicId: string, doctorId: string, dto: CreateDoctorScheduleDto) {
    const doctor = await this.doctorRepository.findOne({
      where: { id: doctorId },
      relations: ['clinic'],
    });
    if (!doctor) throw new NotFoundException('Doctor not found');
    if (doctor.clinic.id !== clinicId) throw new ForbiddenException('Not your doctor');
    const schedule = this.scheduleRepository.create({
      day_of_week: dto.dayOfWeek,
      start_time: dto.startTime,
      end_time: dto.endTime,
      max_queue: dto.maxQueue ?? 5,
      doctor,
    });
    return this.scheduleRepository.save(schedule);
  }

  async updateSchedule(clinicId: string, scheduleId: string, dto: UpdateDoctorScheduleDto) {
    const schedule = await this.scheduleRepository.findOne({
      where: { id: scheduleId },
      relations: ['doctor', 'doctor.clinic'],
    });
    if (!schedule) throw new NotFoundException('Schedule not found');
    if (schedule.doctor.clinic.id !== clinicId) throw new ForbiddenException('Not your doctor');
    Object.assign(schedule, {
      day_of_week: dto.dayOfWeek ?? schedule.day_of_week,
      start_time: dto.startTime ?? schedule.start_time,
      end_time: dto.endTime ?? schedule.end_time,
      max_queue: dto.maxQueue !== undefined ? dto.maxQueue : schedule.max_queue,
    });
    return this.scheduleRepository.save(schedule);
  }

  async removeSchedule(clinicId: string, scheduleId: string) {
    const schedule = await this.scheduleRepository.findOne({
      where: { id: scheduleId },
      relations: ['doctor', 'doctor.clinic'],
    });
    if (!schedule) throw new NotFoundException('Schedule not found');
    if (schedule.doctor.clinic.id !== clinicId) throw new ForbiddenException('Not your doctor');
    await this.scheduleRepository.remove(schedule);
    return { success: true };
  }

  async findAllPublic(): Promise<Doctor[]> {
    return this.doctorRepository.find({ relations: ['schedules', 'clinic'] });
  }

  async findOneProfile(doctorId: string) {
    const doctor = await this.doctorRepository.findOne({
      where: { id: doctorId },
      relations: ['clinic', 'schedules'],
    });
    if (!doctor) throw new NotFoundException('Doctor not found');

    const now = new Date();
    const schedules = doctor.schedules.map((slot) => {
      const [sh, sm] = slot.start_time.split(':').map(Number);
      const [eh, em] = slot.end_time.split(':').map(Number);
      const startDt = new Date();
      startDt.setHours(sh, sm, 0, 0);
      const endDt = new Date();
      endDt.setHours(eh, em, 0, 0);

      return {
        id: slot.id,
        dayOfWeek: slot.day_of_week,
        from: slot.start_time,
        to: slot.end_time,
        max_queue: slot.max_queue,
        fees: Number(slot.fees),
        bookingStart: slot.start_time,
        bookingEnd: slot.end_time,
        bookingWindow: now >= startDt && now <= endDt,
        clinicName: doctor.clinic.name,
        clinicAddress: doctor.clinic.address,
      };
    });

    return {
      id: doctor.id,
      name: doctor.name,
      specialization: doctor.specialty,
      gender: doctor.gender,
      qualification: doctor.qualification,
      phone: doctor.phone,
      email: doctor.email,
      dateOfBirth: doctor.date_of_birth?.toISOString().slice(0, 10),
      experienceYears: doctor.experience_years,
      avatarUrl: doctor.avatar_url,
      clinic: {
        id: doctor.clinic.id,
        name: doctor.clinic.name,
        address: doctor.clinic.address,
        phone: doctor.clinic.phone,
        email: doctor.clinic.email,
      },
      schedules,
    };
  }
}
