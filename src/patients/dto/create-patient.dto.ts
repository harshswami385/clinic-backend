import { Transform } from 'class-transformer';
import { IsString, IsNotEmpty, IsOptional, IsDateString, Matches } from 'class-validator';

export class CreatePatientDto {
  @Transform(({ value }) =>
    typeof value === 'string'
      ? value.replace(/\s+/g, '')  // remove all whitespace
      : value,
  )
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+91\d{10}$/, { message: 'phone_number must be in the format +911234567890' })
  phone_number: string;

  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @IsNotEmpty()
  gender: string;

  @IsDateString()
  @IsNotEmpty()
  dob: string;
}