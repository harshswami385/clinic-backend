// src/patients/dto/create-family-member.dto.ts
import { IsString, IsNotEmpty, IsDateString } from 'class-validator';

export class CreateFamilyMemberDto {
  @IsString() @IsNotEmpty() name: string;
  @IsString() @IsNotEmpty() gender: string;
  @IsDateString() @IsNotEmpty() dob: string;
  @IsString() @IsNotEmpty() relation: string;
  @IsString() @IsNotEmpty() source: string;
}