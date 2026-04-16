import { Injectable, ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Clinic } from '../entities/clinic.entity';
import { Doctor } from '../entities/doctor.entity';
import { DoctorSchedule } from '../entities/doctor-schedule.entity';
import { CreateClinicDto } from './dto/create-clinic.dto';
import { LoginClinicDto } from './dto/login-clinic.dto'; // Still imported but not used directly in login method
import { firebaseAdmin } from '../auth/firebase.config';

@Injectable()
export class ClinicsService {
  constructor(
    @InjectRepository(Clinic)
    private clinicsRepository: Repository<Clinic>,
    @InjectRepository(Doctor)
    private doctorsRepository: Repository<Doctor>,
    @InjectRepository(DoctorSchedule)
    private doctorSchedulesRepository: Repository<DoctorSchedule>,
  ) {}

  async createClinic(createClinicDto: CreateClinicDto): Promise<Clinic> {
    const { email, password, doctors, ...clinicData } = createClinicDto;

    // 1. Create user in Firebase Authentication
    let firebaseUser;
    try {
      firebaseUser = await firebaseAdmin.auth().createUser({
        email: email,
        password: password,
      });
    } catch (error: any) { // Explicitly type error as 'any' for Firebase errors
      if (error.code === 'auth/email-already-exists') {
        throw new ConflictException('Clinic with this email already exists in Firebase');
      }
      throw new Error(`Firebase user creation failed: ${error.message}`);
    }

    // 2. Check if clinic with this email already exists in Supabase (optional, Firebase handles uniqueness)
    const existingClinic = await this.clinicsRepository.findOne({
      where: { email: email }
    });

    if (existingClinic) {
      // If exists in Supabase but not in Firebase, this is an inconsistent state, handle it
      // For now, let's assume Firebase is the source of truth for email uniqueness
      // You might want to delete the Firebase user here if Supabase entry fails
      throw new ConflictException('Clinic with this email already exists in Supabase');
    }

    // 3. Create new clinic in Supabase, using Firebase UID as the clinic ID
    const clinic = this.clinicsRepository.create({
      ...clinicData,
      email: email,
      id: firebaseUser.uid
    });

    const savedClinic = await this.clinicsRepository.save(clinic);

    // 4. Create and save doctors and their schedules
    for (const doctorDto of doctors) {
      const doctor = this.doctorsRepository.create({
        name: doctorDto.name,
        gender: doctorDto.gender,
        specialty: doctorDto.specialty,
        email: doctorDto.email,
        qualification: doctorDto.qualification,
        phone: doctorDto.phone,
        date_of_birth: doctorDto.dateOfBirth,
        experience_years: doctorDto.experienceYears,
        avatar_url: doctorDto.avatarUrl,
        clinic: savedClinic,
      });
      const savedDoctor = await this.doctorsRepository.save(doctor);

      // Save doctor schedules
      for (const day of Object.keys(doctorDto.schedule)) {
        const timeSlots = doctorDto.schedule[day];
        if (Array.isArray(timeSlots)) {
          for (const slot of timeSlots) {
            const doctorSchedule = this.doctorSchedulesRepository.create({
              day_of_week: day,
              start_time: slot.startTime,
              end_time: slot.endTime,
              doctor: savedDoctor,
            });
            await this.doctorSchedulesRepository.save(doctorSchedule);
          }
        } else {
          console.warn(`Schedule for day '${day}' for doctor '${doctorDto.name}' is not an array. Skipping.`);
        }
      }
    }

    // 5. Fetch the saved clinic with its doctors and schedules to return in the response
    const clinicWithRelations = await this.clinicsRepository.findOne({
      where: { id: savedClinic.id },
      relations: ['doctors', 'doctors.schedules'],
    });

    if (!clinicWithRelations) {
      throw new NotFoundException('Newly created clinic not found after fetching relations.');
    }

    return clinicWithRelations;
  }

  async findClinicByEmail(email: string): Promise<Clinic> {
    const clinic = await this.clinicsRepository.findOne({
      where: { email }
    });

    if (!clinic) {
      throw new NotFoundException('Clinic not found');
    }

    return clinic;
  }

  async findClinicById(id: string): Promise<Clinic> {
    const clinic = await this.clinicsRepository.findOne({
      where: { id },
      relations: ['doctors', 'doctors.schedules'], // Fetch doctors and their schedules
    });

    if (!clinic) {
      throw new NotFoundException('Clinic not found');
    }

    return clinic;
  }

  async login(email: string, idToken: string): Promise<{ token: string; clinic: Clinic }> {
    try {
      // 1. Verify the Firebase ID token from the client
      const decodedToken = await firebaseAdmin.auth().verifyIdToken(idToken);
      const firebaseUid = decodedToken.uid;
      console.log("Backend: Firebase ID Token verified for UID:", firebaseUid);

      // 2. Ensure the email from the token matches the provided email (optional but good practice)
      // This helps prevent a valid token for one user being used to fetch another user's data if a misconfiguration occurs
      if (decodedToken.email !== email) {
        throw new UnauthorizedException('Email mismatch in token and request');
      }
      
      // 3. Get clinic data from your database using the verified Firebase UID
      const clinic = await this.findClinicById(firebaseUid);

      // For custom tokens or sessions, you might generate a session cookie here
      // For this setup, we simply return the ID token back (or a new session token if needed)
      return {
        token: idToken, // Returning the same ID token for frontend usage
        clinic
      };
    } catch (error: any) { // Explicitly type error as 'any' for Firebase Admin errors
      console.error("Backend Login Error (verifyIdToken):", error.message);
      if (error.code === 'auth/argument-error' || error.code === 'auth/invalid-credential' || error.code === 'auth/id-token-expired') {
        throw new UnauthorizedException('Invalid or expired authentication token');
      }
      // Catching specific Firebase Admin SDK errors related to token verification
      if (error.code && typeof error.code === 'string' && error.code.startsWith('auth/')) {
        throw new UnauthorizedException(`Firebase Auth error: ${error.message}`);
      }
      throw new UnauthorizedException('Login failed: Invalid credentials');
    }
  }

  async changePassword(firebaseUid: string, oldPassword: string, newPassword: string): Promise<void> {
    try {
      const user = await firebaseAdmin.auth().getUser(firebaseUid);
      // Removed the incorrect EmailAuthProvider.credential line
      
      // Update user's password directly using Firebase Admin SDK
      await firebaseAdmin.auth().updateUser(firebaseUid, { password: newPassword });

    } catch (error: any) { // Explicitly type error as 'any' for Firebase errors
      if (error.code === 'auth/wrong-password') {
        throw new UnauthorizedException('Incorrect old password');
      }
      if (error.code === 'auth/user-not-found') {
        throw new NotFoundException('User not found');
      }
      if (error.code && typeof error.code === 'string' && error.code.startsWith('auth/')) {
        throw new UnauthorizedException(`Firebase Auth error: ${error.message}`);
      }
      throw new UnauthorizedException(`Failed to change password: ${error.message}`);
    }
  }
}