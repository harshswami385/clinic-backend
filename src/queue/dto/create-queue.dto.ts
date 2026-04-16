// src/queue/dto/create-queue.dto.ts
import { IsUUID, IsNotEmpty, IsIn } from 'class-validator';

export class CreateQueueDto {
  @IsUUID()
  @IsNotEmpty()
  patientId: string;

  @IsUUID()
  @IsNotEmpty()
  scheduleId: string;

  @IsIn(['web','mobile'])
  source: 'web' | 'mobile';
}
