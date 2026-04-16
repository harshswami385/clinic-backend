import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Doctor } from './doctor.entity';
import { Appointment } from './appointment.entity';

@Entity('doctor_schedules')
export class DoctorSchedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Day of week slot applies to (e.g. 'Monday') */
  @Column({ type: 'varchar', name: 'day_of_week' })
  day_of_week: string;

  /** Slot start time (HH:MM:SS) */
  @Column({ type: 'time without time zone', name: 'start_time' })
  start_time: string;

  /** Slot end time (HH:MM:SS) */
  @Column({ type: 'time without time zone', name: 'end_time' })
  end_time: string;

  @Column({ type: 'uuid' })
  doctor_id: string;

  @Column({ type: 'numeric', default: 0 })
  fees: number;

  @Column({ type: 'time', default: '00:00:00' })
  booking_start: string;

  @Column({ type: 'time', default: '23:59:00' })
  booking_end: string;

  @Column({ type: 'boolean', default: true })
  booking_window: boolean;

  @Column({ type: 'int', default: 5 })
  max_queue: number;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @ManyToOne(() => Doctor, (doctor) => doctor.schedules)
  @JoinColumn({ name: 'doctor_id' })
  doctor: Doctor;

  @OneToMany(() => Appointment, (appt) => appt.schedule)
  appointments: Appointment[];
}