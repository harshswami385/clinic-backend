// src/appointments/dto/update-appointment.dto.ts
import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class UpdateAppointmentDto {
  @IsString()
  @IsIn(['waiting', 'completed', 'cancelled', 'skipped'])
  @IsNotEmpty()
  status: 'waiting' | 'completed' | 'cancelled' | 'skipped';
}
