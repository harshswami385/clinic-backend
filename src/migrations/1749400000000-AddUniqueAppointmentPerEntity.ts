import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUniqueAppointmentPerEntity1749400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // remove exact duplicates, keeping only the row with the smallest UUID
    await queryRunner.query(`
      DELETE FROM appointments a
      USING appointments b
      WHERE a.id < b.id
        AND a.schedule_id = b.schedule_id
        AND a.date        = b.date
        AND COALESCE(a.patient_id, a.family_member_id::varchar)
          = COALESCE(b.patient_id, b.family_member_id::varchar);
    `);

    // now create the unique index
    await queryRunner.query(`
      CREATE UNIQUE INDEX ux_appointments_one_per_entity
        ON appointments (
          schedule_id,
          date,
          COALESCE(patient_id, family_member_id::varchar)
        );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX ux_appointments_one_per_entity`);
  }
}
