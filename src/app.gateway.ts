// src/app.gateway.ts

import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
  } from '@nestjs/websockets';
  import { Server, Socket } from 'socket.io';
  import { AppointmentsService } from './appointments/appointments.service';
  import { Appointment } from './entities/appointment.entity';
  import { LessThan } from 'typeorm';
  
  @WebSocketGateway({
    namespace: '/',
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  })
  export class AppGateway {
    @WebSocketServer()
    server: Server;
  
    constructor(private readonly appointmentsService: AppointmentsService) {}
  
    @SubscribeMessage('schedule-queue-status')
    async onScheduleQueue(
      client: Socket,
      @MessageBody() payload: { scheduleId: string; date: string },
    ) {
      const { scheduleId, date } = payload;
      const total = await this.appointmentsService.countBySchedule(
        scheduleId,
        date,
      );
      const serving = await this.appointmentsService.getCurrentServing(
        scheduleId,
        date,
      );
      const room = `queue-updated-${scheduleId}-${date}`;
      this.server.emit(room, { totalQueue: total, currentServing: serving });
    }
  
    @SubscribeMessage('check-queue-status')
    async onCheckQueueStatus(
      client: Socket,
      @MessageBody() payload: { appointmentId: string },
    ) {
      const { appointmentId } = payload;
      const peopleAhead = await this.appointmentsService.getPeopleAhead(appointmentId);
      this.server.emit(`queue-position-updated-${appointmentId}`, {
        appointmentId,
        peopleAhead,
      });
    }
  }
  