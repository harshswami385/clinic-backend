import { PartialType } from '@nestjs/mapped-types';
import { CreateDoctorScheduleDto } from './create-doctor-schedule.dto';
import { IsOptional, IsNumber } from 'class-validator';
 
export class UpdateDoctorScheduleDto extends PartialType(CreateDoctorScheduleDto) {
  @IsOptional()
  @IsNumber()
  maxQueue?: number;
} 