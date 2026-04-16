import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Patient } from './patient.entity';
import { Appointment } from './appointment.entity';  // we’ll add this later

@Entity('family_members')
export class FamilyMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  patient_id: string;

  @Column()
  name: string;

  @Column()
  gender: string;

  @Column({ type: 'date' })
  dob: Date;

  @Column()
  relation: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

   @ManyToOne(() => Patient, (p) => p.familyMembers)
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  // will connect to your future Appointment entity
  @OneToMany(() => Appointment, (a) => a.familyMember)
  appointments: Appointment[];
}
