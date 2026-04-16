import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FollowUp } from './entities/followup.entity';
// import { NotificationService } from '../notifications/notification.service';

@Injectable()
export class FollowUpReminderService {
  constructor(
    @InjectRepository(FollowUp)
    private followUpRepository: Repository<FollowUp>,
    // private notificationService: NotificationService,
  ) {}

  // Runs every day at 8am
  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async sendReminders() {
    const today = new Date().toISOString().slice(0, 10);
    const followUps = await this.followUpRepository.find({ where: { date: today } });
    for (const followUp of followUps) {
      // TODO: Fetch patient contact info and send notification
      // await this.notificationService.sendReminder(followUp.patientId, followUp);
      // For now, just log
      console.log(`Reminder: Follow-up for patient ${followUp.patientId} at ${followUp.time}`);
    }
  }
}
