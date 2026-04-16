import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
// If Patient entity import fails, comment out the relation and use string for now
// import { Patient } from '../../patients/entities/patient.entity';

@Entity('follow_ups')
export class FollowUp {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  patientId: string;

  // Uncomment and fix import if Patient entity is available
  // @ManyToOne(() => Patient, { onDelete: 'CASCADE' })
  // @JoinColumn({ name: 'patientId' })
  // patient: Patient;

  @Column()
  reason: string;

  @Column()
  appointmentType: string;

  @Column()
  date: string;

  @Column()
  time: string;

  @Column({ nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;
}
