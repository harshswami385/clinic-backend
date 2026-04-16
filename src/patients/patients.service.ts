import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from '../entities/patient.entity';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { FamilyMember } from '../entities/family-member.entity';
import { CreateFamilyMemberDto } from './dto/create-family-member.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PatientsService {
  constructor(
    @InjectRepository(Patient)
    private repo: Repository<Patient>,
    @InjectRepository(FamilyMember)
    private fmRepo: Repository<FamilyMember>,
  ) {}

  /** Sign-up or lookup with safe linking logic */
  async createOrGet(uid: string | undefined, dto: CreatePatientDto): Promise<{ patientId: string; status: 'NEW' | 'EXISTING' }> {
    console.log('createOrGet called with:', { uid, phone: dto.phone_number });
    if (uid) {
      // 1. Try to find by firebaseUid (mobile app flow)
      let patient = await this.repo.findOneBy({ firebaseUid: uid });
      if (patient) {
        return { patientId: patient.id, status: 'EXISTING' };
      }
      // 2. Try to find by phone number (web app-created patient)
      patient = await this.repo.findOneBy({ phone_number: dto.phone_number });
      if (patient && !patient.firebaseUid) {
        // Link: set firebaseUid, do NOT change id
        patient.firebaseUid = uid;
        await this.repo.save(patient);
        return { patientId: patient.id, status: 'EXISTING' };
      }
      // 3. No patient found, create new with firebaseUid
      const newId = uuidv4();
      patient = this.repo.create({
        id: newId,
        phone_number: dto.phone_number,
        fullName: dto.fullName,
        gender: dto.gender,
        dob: dto.dob,
        isProfileComplete: true,
        firebaseUid: uid,
      });
      await this.repo.save(patient);
      console.log('Incoming phone:', dto.phone_number);
      if (patient) {
        console.log('Returning existing patient:', patient.id, patient.phone_number);
      } else {
        console.log('Creating new patient:', newId, dto.phone_number);
      }
      return { patientId: newId, status: 'NEW' };
    } else {
      console.log('Incoming phone:', dto.phone_number);
      let patient = await this.repo.findOneBy({ phone_number: dto.phone_number });
      if (patient) {
        console.log('Returning existing patient:', patient.id, patient.phone_number);
        return { patientId: patient.id, status: 'EXISTING' };
      }
      const newId = uuidv4();
      console.log('Creating new patient:', newId, dto.phone_number);
      patient = this.repo.create({
        id: newId,
        phone_number: dto.phone_number,
        fullName: dto.fullName,
        gender: dto.gender,
        dob: dto.dob,
        isProfileComplete: true,
      });
      await this.repo.save(patient);
      return { patientId: newId, status: 'NEW' };
    }
  }

  /** Fetch profile */
  async findById(uid: string): Promise<Patient> {
    const patient = await this.repo.findOne({
      where: { id: uid },
      relations: ['familyMembers'],
    });
    if (!patient) throw new NotFoundException('Patient not found');
    return patient;
  }

    /** Add a new family member under this patient */
  async addFamilyMember(
    patientId: string,
    dto: CreateFamilyMemberDto
  ): Promise<FamilyMember> {
    const patient = await this.repo.findOneBy({ id: patientId });
    if (!patient) throw new NotFoundException('Patient not found');
    const fm = this.fmRepo.create({ ...dto, patient });
    return this.fmRepo.save(fm);
  }

  /** Complete profile */
  async updateProfile(uid: string, dto: UpdatePatientDto): Promise<Patient> {
    const patient = await this.findById(uid);
    patient.fullName = dto.fullName;
    patient.gender   = dto.gender;
    patient.dob      = new Date(dto.dob);
    patient.isProfileComplete = true;
    return this.repo.save(patient);
  }

  /** Find patient by phone number */
  async findByPhone(phone: string): Promise<Patient> {
    const patient = await this.repo.findOne({
      where: { phone_number: phone },
      relations: ['familyMembers'],
    });
    if (!patient) throw new NotFoundException('Patient not found');
    return patient;
  }
}
