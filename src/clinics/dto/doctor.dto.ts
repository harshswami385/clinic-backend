import { IsString, IsNotEmpty, IsEmail, IsEnum, ValidateNested, IsOptional, IsNumber, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { TimeSlotDto } from './time-slot.dto';

enum Gender { "male" = "male", "female" = "female", "other" = "other" }

export class DoctorScheduleDto {
  @ValidateNested({ each: true })
  @Type(() => TimeSlotDto)
  monday?: TimeSlotDto[];

  @ValidateNested({ each: true })
  @Type(() => TimeSlotDto)
  tuesday?: TimeSlotDto[];

  @ValidateNested({ each: true })
  @Type(() => TimeSlotDto)
  wednesday?: TimeSlotDto[];

  @ValidateNested({ each: true })
  @Type(() => TimeSlotDto)
  thursday?: TimeSlotDto[];

  @ValidateNested({ each: true })
  @Type(() => TimeSlotDto)
  friday?: TimeSlotDto[];

  @ValidateNested({ each: true })
  @Type(() => TimeSlotDto)
  saturday?: TimeSlotDto[];

  @ValidateNested({ each: true })
  @Type(() => TimeSlotDto)
  sunday?: TimeSlotDto[];
}

export class DoctorDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(Gender)
  @IsNotEmpty()
  gender: string;

  @IsString()
  @IsNotEmpty()
  specialty: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsOptional()
  @IsString()
  qualification?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  experienceYears?: number;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ValidateNested()
  @Type(() => DoctorScheduleDto)
  schedule: DoctorScheduleDto;
} 