import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Patient } from './patient.entity';
import { FamilyMember } from './family-member.entity';
import { DoctorSchedule } from './doctor-schedule.entity';

export type AppointmentStatus =
  | 'waiting'
  | 'serving'
  | 'completed'
  | 'cancelled'
  | 'skipped';

@Entity('appointments')
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: true })
  patient_id: string | null;

  @Column({ type: 'varchar', nullable: true })
  family_member_id: string | null;

  @Column({ type: 'uuid' })
  schedule_id: string;

  @Column({ type: 'int', default: 0 })
  queue_number: number;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'text', default: 'waiting' })
  status: AppointmentStatus;

  @Column({ type: 'text', default: 'mobile' })
  source: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @ManyToOne(() => Patient, (p) => p.appointments, { nullable: true })
  @JoinColumn({ name: 'patient_id' })
  patient?: Patient;

  @ManyToOne(() => FamilyMember, (fm) => fm.appointments, { nullable: true })
  @JoinColumn({ name: 'family_member_id' })
  familyMember?: FamilyMember;

  @ManyToOne(() => DoctorSchedule, (ds) => ds.appointments)
  @JoinColumn({ name: 'schedule_id' })
  schedule: DoctorSchedule;
}