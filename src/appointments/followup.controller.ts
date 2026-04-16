import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { FollowUpService } from './followup.service';
import { CreateFollowUpDto } from './dto/create-followup.dto';
import { FollowUp } from './entities/followup.entity';

@Controller('follow-ups')
export class FollowUpController {
  constructor(private readonly followUpService: FollowUpService) {}

  @Post()
  async create(@Body() createFollowUpDto: CreateFollowUpDto): Promise<FollowUp> {
    return this.followUpService.create(createFollowUpDto);
  }

  @Get()
  async findAll(): Promise<FollowUp[]> {
    return this.followUpService.findAll();
  }

  @Get('patient/:patientId')
  async findByPatient(@Param('patientId') patientId: string): Promise<FollowUp[]> {
    return this.followUpService.findByPatient(patientId);
  }
}
