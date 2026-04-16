import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository }       from '@nestjs/typeorm';
import { Repository }             from 'typeorm';
import { DoctorSchedule }         from '../entities/doctor-schedule.entity';
import { CreateDoctorScheduleDto } from './dto/create-doctor-schedule.dto';
import { UpdateDoctorScheduleDto } from './dto/update-doctor-schedule.dto';

@Injectable()
export class DoctorScheduleService {
  constructor(
    @InjectRepository(DoctorSchedule)
    private readonly repo: Repository<DoctorSchedule>
  ) {}

  create(dto: CreateDoctorScheduleDto) {
    const entity = this.repo.create({
      day_of_week: dto.dayOfWeek,
      start_time: `${dto.startTime}:00`,
      end_time:   `${dto.endTime}:00`,
      doctor_id:  dto.doctorId,
      ...(dto.maxQueue !== undefined ? { max_queue: dto.maxQueue } : {}),
    });
    return this.repo.save(entity);
  }

  findOne(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  update(id: string, dto: UpdateDoctorScheduleDto) {
    return this.repo.update(id, {
      ...(dto.dayOfWeek  && { day_of_week: dto.dayOfWeek }),
      ...(dto.startTime  && { start_time:  `${dto.startTime}:00` }),
      ...(dto.endTime    && { end_time:    `${dto.endTime}:00` }),
      ...(dto.maxQueue !== undefined ? { max_queue: dto.maxQueue } : {}),
    }).then(r => {
      if (r.affected === 0) throw new NotFoundException();
      return this.findOne(id);
    });
  }

  remove(id: string) {
    return this.repo.delete(id).then(r => {
      if (r.affected === 0) throw new NotFoundException();
      return { deleted: true };
    });
  }
}
