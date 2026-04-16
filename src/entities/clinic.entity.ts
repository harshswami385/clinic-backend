import { Entity, Column, OneToMany, CreateDateColumn, PrimaryColumn } from 'typeorm';
import { Doctor } from './doctor.entity';

@Entity('clinics')
export class Clinic {
  @PrimaryColumn()
  id: string;

  @Column()
  name: string;

  @Column()
  address: string;

  @Column()
  phone: string;

  @Column({ unique: true })
  email: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @OneToMany(() => Doctor, (doctor) => doctor.clinic)
  doctors: Doctor[];
}