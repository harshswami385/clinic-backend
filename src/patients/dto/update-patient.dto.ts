import { IsString, IsNotEmpty, IsDateString } from 'class-validator';

export class UpdatePatientDto {
  @IsString() @IsNotEmpty() fullName: string;
  @IsString() @IsNotEmpty() gender: string;
  @IsDateString() @IsNotEmpty() dob: string;  // YYYY-MM-DD
}