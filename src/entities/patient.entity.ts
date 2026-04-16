import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { OneToMany } from 'typeorm';
import { FamilyMember } from './family-member.entity';
import { Appointment } from './appointment.entity';

@Entity('patients')
export class Patient {
  @PrimaryColumn()                   // VARCHAR PK
  id: string;

  @Column({ unique: true })          // VARCHAR NOT NULL UNIQUE
  phone_number: string;

  @Column({ name: 'full_name', nullable: true })
  fullName?: string;

  @Column({ nullable: true })
  gender?: string;

  @Column({ type: 'date', nullable: true })
  dob?: Date;

  @Column({ name: 'is_profile_complete', default: false })
  isProfileComplete: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
  
@OneToMany(() => FamilyMember, (fm) => fm.patient)
familyMembers: FamilyMember[];

   @OneToMany(() => Appointment, (appt) => appt.patient)
  appointments: Appointment[];

  /**
   * The Firebase UID for mobile-authenticated patients. Used to link mobile logins to web-created patients without changing the primary key.
   */
  @Column({ nullable: true, unique: true })
  firebaseUid: string;
}
