import { IsEmail, IsNotEmpty ,IsString } from 'class-validator';

export class LoginClinicDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}