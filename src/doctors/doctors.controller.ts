import { QueueService } from '../queue/queue.service';
import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { DoctorsService } from './doctors.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { CreateDoctorScheduleDto } from './dto/create-doctor-schedule.dto';
import { UpdateDoctorScheduleDto } from './dto/update-doctor-schedule.dto';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';

@Controller('doctors')
export class DoctorsController {
  constructor(
    private readonly doctorsService: DoctorsService,
    private readonly queueService: QueueService,
  ) {}

  //
  // ─── PUBLIC ───────────────────────────────────────────────────────────────────
  //
  /** GET /api/doctors/public  → returns all doctors (for your mobile "browse" screen) */
  @Get('public')
  async findAllPublic() {
    return this.doctorsService.findAllPublic();
  }

  @Get('queue')
  async getQueueOverview() {
    return this.doctorsService.getQueueStatus();
  }

  //
  // ─── PROTECTED (all write & clinic-scoped reads) ──────────────────────────────
  //

  /** POST /api/doctors  → Create a new doctor under the logged-in clinic */
  @Post()
  @UseGuards(FirebaseAuthGuard)
  async create(
    @Req() req: any,
    @Body() createDoctorDto: CreateDoctorDto,
  ) {
    const clinicId = req.user.uid;
    return this.doctorsService.create(clinicId, createDoctorDto);
  }

  /** GET /api/doctors  → List doctors *for this clinic* */
  @Get()
  @UseGuards(FirebaseAuthGuard)
  async findAllForClinic(@Req() req: any) {
    const clinicId = req.user.uid;
    return this.doctorsService.findAll(clinicId);
  }

  /** PATCH /api/doctors/:id  → Update a doctor's details */
  @Patch(':id')
  @UseGuards(FirebaseAuthGuard)
  async update(
    @Req() req: any,
    @Param('id') doctorId: string,
    @Body() updateDoctorDto: UpdateDoctorDto,
  ) {
    const clinicId = req.user.uid;
    const updated = await this.doctorsService.update(
      clinicId,
      doctorId,
      updateDoctorDto,
    );
    if (!updated) throw new NotFoundException('Doctor not found');
    return updated;
  }

  /** DELETE /api/doctors/:id  → Remove a doctor */
  @Delete(':id')
  @UseGuards(FirebaseAuthGuard)
  async remove(
    @Req() req: any,
    @Param('id') doctorId: string,
  ) {
    const clinicId = req.user.uid;
    await this.doctorsService.remove(clinicId, doctorId);
    return { success: true };
  }

  //
  // ─── SCHEDULE MANAGEMENT ───────────────────────────────────────────────────────
  //

  /** POST   /api/doctors/:id/schedules
   *   Add one availability slot for ":id" */
  @Post(':id/schedules')
  @UseGuards(FirebaseAuthGuard)
  async addSchedule(
    @Req() req: any,
    @Param('id') doctorId: string,
    @Body() dto: CreateDoctorScheduleDto,
  ) {
    const clinicId = req.user.uid;
    return this.doctorsService.addSchedule(clinicId, doctorId, dto);
  }

  /** PATCH  /api/doctors/:id/schedules/:scheduleId
   *   Edit an existing slot */
  @Patch(':id/schedules/:scheduleId')
  @UseGuards(FirebaseAuthGuard)
  async updateSchedule(
    @Req() req: any,
    @Param('id') doctorId: string,
    @Param('scheduleId') scheduleId: string,
    @Body() dto: UpdateDoctorScheduleDto,
  ) {
    const clinicId = req.user.uid;
    return this.doctorsService.updateSchedule(clinicId, scheduleId, dto);
  }

  /** DELETE /api/doctors/:id/schedules/:scheduleId
   *   Remove one availability slot */
  @Delete(':id/schedules/:scheduleId')
  @UseGuards(FirebaseAuthGuard)
  async removeSchedule(
    @Req() req: any,
    @Param('id') doctorId: string,
    @Param('scheduleId') scheduleId: string,
  ) {
    const clinicId = req.user.uid;
    await this.doctorsService.removeSchedule(clinicId, scheduleId);
    return { success: true };
  }

  //
  // ─── SINGLE DOCTOR PROFILE ────────────────────────────────────────────────────
  //

  /** GET /api/doctors/:id → doctor profile + all its slots */
  @Get(':id')
  async findOneProfile(@Param('id') id: string) {
    const data = await this.doctorsService.findOneProfile(id);
    if (!data) throw new NotFoundException('Doctor not found');
    return { success: true, data };
  }

  //
  // ─── QUEUE INTEGRATION ───────────────────────────────────────────────────────
  //

  /** GET /api/doctors/queue → List doctors with real-time queue info */
  @Get('clinic/queue')
  @UseGuards(FirebaseAuthGuard)
  async getDoctorsWithQueue(@Req() req: any) {
    const clinicId = req.user.uid;
    return this.queueService.getDoctorsQueue(clinicId);
  }
}