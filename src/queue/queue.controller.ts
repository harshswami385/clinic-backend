import { Controller, Get, UseGuards, Req, Post, Body } from '@nestjs/common';
import { QueueService } from './queue.service';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { CreateQueueDto }   from './dto/create-queue.dto';

// Add custom interface to extend Request with user property
interface AuthenticatedRequest extends Request {
  user: any;
}

@Controller('api/doctors/queue')
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Get()
  @UseGuards(AuthGuard('firebase'))
  async getQueue(@Req() req: AuthenticatedRequest) {
    const clinicId = req.user['clinic'].id as string;
    return this.queueService.getDoctorsQueue(clinicId);
  }

  @Post()
  @UseGuards(AuthGuard('firebase'))
  async addToQueue(
    @Body() dto: CreateQueueDto,
    @Req() req: AuthenticatedRequest,
  ) {
    // override clinicId from token (prevent malicious client override)
    // return full appointment record, including queue_number
    return this.queueService.create(dto);
  }
}