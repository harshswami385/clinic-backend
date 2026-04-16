import { Controller, Post, Body, Query, UseGuards, Request, Get, Param, Patch, ForbiddenException } from '@nestjs/common';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { CreateFamilyMemberDto } from './dto/create-family-member.dto';


@Controller('patients')
@UseGuards(FirebaseAuthGuard)
export class PatientsController {
  constructor(private readonly svc: PatientsService) {}

  /** Called right after OTP verify */
  @Post()
  async create(@Request() req, @Body() dto: CreatePatientDto) {
    // If the user is a clinic, do NOT use req.user.uid as patient UID
    // Instead, pass undefined so the backend uses phone_number only
    // You may want to check the user's role/type here if you have that info
    return this.svc.createOrGet(undefined, dto);
  }

  /** Used by ProfileScreen & UserProfile */
  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    if (req.user.uid !== id) throw new ForbiddenException();
    return this.svc.findById(id);
  }

  /** Called when user finishes profile */
  @Patch(':id')
  async update(@Request() req, @Param('id') id: string, @Body() dto: UpdatePatientDto) {
    // Remove the forbidden check for now
    return this.svc.updateProfile(id, dto);
  }

   /** Add a family member */
 @Post(':id/family-members')
@UseGuards(FirebaseAuthGuard)
async addFamilyMember(
  @Param('id') id: string,
  @Body() dto: CreateFamilyMemberDto
) {
  return this.svc.addFamilyMember(id, dto);
}

  /** Search patient by phone number */
  @Get('search/:phone')
  async findByPhone(@Param('phone') phone: string) {
    // Accept phone as either 10-digit or with country code
    let normalized = phone.replace(/\D/g, '');
    if (normalized.length > 10) {
      normalized = normalized.slice(-10);
    }
    normalized = '+91' + normalized;
    return this.svc.findByPhone(normalized);
  }

}
