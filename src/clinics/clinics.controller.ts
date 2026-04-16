import { Controller, Post, Body, UseGuards, Request, Get, Patch, Headers, UnauthorizedException } from '@nestjs/common';
import { ClinicsService } from './clinics.service';
import { CreateClinicDto } from './dto/create-clinic.dto';
import { LoginClinicDto } from './dto/login-clinic.dto'; // Note: LoginClinicDto is now largely unused for actual login but remains for DTO structure
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { ChangePasswordDto } from './dto/change-password.dto';

@Controller('clinics')
export class ClinicsController {
  constructor(private readonly clinicsService: ClinicsService) {}

  @Post('register')
  async register(
    @Body() createClinicDto: CreateClinicDto
  ) {
    const clinic = await this.clinicsService.createClinic(createClinicDto);
    return {
      success: true,
      data: clinic
    };
  }

  @Post('login')
  async login(
    @Headers('authorization') authorization: string, // Get Authorization header
    @Body('email') email: string, // Get email from body (for logging/matching, password not here)
  ) {
    // Extract the token (Bearer <token>)
    const idToken = authorization ? authorization.split(' ')[1] : null;
    if (!idToken) {
      throw new UnauthorizedException('Authorization token not provided');
    }
    
    // Pass the email (from body) and idToken (from header) to the service
    const { token, clinic } = await this.clinicsService.login(email, idToken);
    return {
      success: true,
      data: {
        token,
        clinic
      }
    };
  }

  @Get('profile')
  @UseGuards(FirebaseAuthGuard)
  async getProfile(@Request() req) {
    const firebaseUid = req.user.uid;
    const clinic = await this.clinicsService.findClinicById(firebaseUid);
    return {
      success: true,
      data: clinic
    };
  }

  @Patch('change-password')
  @UseGuards(FirebaseAuthGuard)
  async changePassword(
    @Request() req,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    const firebaseUid = req.user.uid;
    await this.clinicsService.changePassword(
      firebaseUid,
      changePasswordDto.oldPassword,
      changePasswordDto.newPassword,
    );
    return {
      success: true,
      message: 'Password changed successfully',
    };
  }
}