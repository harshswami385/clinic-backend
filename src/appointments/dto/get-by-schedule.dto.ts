// src/appointments/dto/get-by-schedule.dto.ts
import { IsUUID, IsDateString } from 'class-validator';

export class GetByScheduleDto {
  @IsUUID()
  scheduleId: string;

  @IsDateString()
  date: string; // YYYY-MM-DD
}
