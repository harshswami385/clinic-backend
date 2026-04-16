import {
Injectable,
InternalServerErrorException,
 BadRequestException,
NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Doctor } from '../entities/doctor.entity';
import { Appointment }    from '../entities/appointment.entity';
import { DoctorSchedule } from '../entities/doctor-schedule.entity';
import { CreateQueueDto } from './dto/create-queue.dto';



@Injectable()
export class QueueService {
  constructor(
    @InjectRepository(Doctor)
    private readonly doctorRepository: Repository<Doctor>,
    @InjectRepository(Appointment)
    private readonly apptRepo: Repository<Appointment>,
    @InjectRepository(DoctorSchedule)
    private readonly schedRepo: Repository<DoctorSchedule>,
  ) {}

  async getDoctorsQueue(clinicId: string): Promise<Doctor[]> {
    console.log(`Fetching doctors for clinic: ${clinicId}`);
    try {
      // Optimized query with pagination and selective relations
      const doctors = await this.doctorRepository.find({
        where: { clinic: { id: clinicId } },
        relations: ['schedules'],
        take: 50, // Limit results to prevent overload
        skip: 0,
        order: { name: 'ASC' } // Use correct property name
      });

      console.log(`Found ${doctors.length} doctors for clinic ${clinicId}`);
      return doctors;
    } catch (error) {
      console.error('Error fetching doctors queue:', error);
      throw new InternalServerErrorException('Failed to fetch queue data');
    }
  }

  async create(dto: CreateQueueDto): Promise<Appointment> {
        // 1) ensure the schedule exists
        const sched = await this.schedRepo.findOne({ where: { id: dto.scheduleId } });
        if (!sched) throw new NotFoundException('Schedule not found');
    
        // 2) today's YYYY-MM-DD
        const today = new Date().toISOString().slice(0, 10);
    
        // 3) count how many already booked for this schedule/date
        const taken = await this.apptRepo.count({
          where: { schedule_id: dto.scheduleId, date: today },
        });
        // Only restrict for mobile bookings
        if (dto.source === 'mobile' && taken >= sched.max_queue) {
          throw new BadRequestException('This slot is fully booked');
        }
    
        // 4) create + save with next queue_number
        const appt = this.apptRepo.create({
          patient_id:   dto.patientId,
          schedule_id:  dto.scheduleId,
          source:       dto.source,
          date:         today,
          queue_number: taken + 1,
        });
    
        try {
          return await this.apptRepo.save(appt);
        } catch (err) {
          throw new InternalServerErrorException('Failed to add to queue');
        }
      }

}