import { IsString, IsNotEmpty, IsUUID, Matches, IsOptional, IsNumber } from 'class-validator';


export class CreateDoctorScheduleDto {
  @IsString()
  @IsNotEmpty()
  dayOfWeek: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'startTime must be HH:mm' })
  startTime: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'endTime must be HH:mm' })
  endTime: string;

  @IsUUID()
  @IsNotEmpty()
  doctorId: string;

  @IsOptional()
  @IsNumber()
  maxQueue?: number;
} 