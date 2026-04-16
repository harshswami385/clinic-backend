// create-appointment.dto.ts
import {
  IsString,
  IsUUID,
  IsDateString,
  IsOptional,
  ValidateNested,
  IsIn,
  IsNotEmpty
} from 'class-validator';
import { Type } from 'class-transformer';

class NewMemberDto {
  @IsString()    @IsNotEmpty() name: string;
  @IsString()    @IsNotEmpty() gender: string;
  @IsDateString()@IsNotEmpty() dob: string;
  @IsString()    @IsNotEmpty() relation: string;
}

export class CreateAppointmentDto {
  @IsOptional() @IsString()
  patientId?: string;

  @IsOptional() @IsUUID()
  familyMemberId?: string;

  @IsOptional() @ValidateNested() @Type(() => NewMemberDto)
  newMember?: NewMemberDto;

  @IsUUID()
  scheduleId: string;

  @IsDateString()
  date: string;

  @IsOptional() @IsIn(['mobile','web'])
  source?: string;
}