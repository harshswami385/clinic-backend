// src/appointments/dto/appointment-response.dto.ts
export class AppointmentResponseDto {
  id: string;
  date: string;               // ← add this
  queueNumber: number;
  status: string;
  schedule: {
    id: string;
    from: string;
    to: string;
    clinicName: string;
    clinicAddress: string;
    fees: number;
    doctor: { id: string; name: string; specialization: string };
  };
}
