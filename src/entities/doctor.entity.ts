import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, JoinColumn } from 'typeorm';
import { Clinic } from './clinic.entity';
import { DoctorSchedule } from './doctor-schedule.entity';

@Entity('doctors')
export class Doctor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  clinic_id: string;

  @Column()
  name: string;

  @Column()
  gender: string;

  @Column()
  specialty: string;

  @Column({ nullable: true })
  qualification: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ type: 'date', nullable: true })
  date_of_birth: Date;

  @Column({ nullable: true })
  experience_years: number;

  @Column({ nullable: true })
  avatar_url: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @ManyToOne(() => Clinic, (clinic) => clinic.doctors)
  @JoinColumn({ name: 'clinic_id' })
  clinic: Clinic;

  @OneToMany(() => DoctorSchedule, (schedule) => schedule.doctor, { eager: true })
  schedules: DoctorSchedule[];
}