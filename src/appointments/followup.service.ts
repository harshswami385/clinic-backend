import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FollowUp } from './entities/followup.entity';
import { CreateFollowUpDto } from './dto/create-followup.dto';

@Injectable()
export class FollowUpService {
  constructor(
    @InjectRepository(FollowUp)
    private followUpRepository: Repository<FollowUp>,
  ) {}

  async create(createFollowUpDto: CreateFollowUpDto): Promise<FollowUp> {
    const followUp = this.followUpRepository.create(createFollowUpDto);
    return this.followUpRepository.save(followUp);
  }

  async findAll(): Promise<FollowUp[]> {
    return this.followUpRepository.find();
  }

  async findByPatient(patientId: string): Promise<FollowUp[]> {
    return this.followUpRepository.find({ where: { patientId } });
  }
}
