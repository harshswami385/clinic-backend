import { IsString, IsNotEmpty, IsDateString, IsOptional } from 'class-validator';

export class CreateFollowUpDto {
  @IsString()
  @IsNotEmpty()
  patientId: string;

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsString()
  @IsNotEmpty()
  appointmentType: string; // e.g., In-person, Online

  @IsDateString()
  @IsNotEmpty()
  date: string;

  @IsString()
  @IsNotEmpty()
  time: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
