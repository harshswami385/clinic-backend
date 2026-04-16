import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPatientTable1749318664996 implements MigrationInterface {
  name = 'AddPatientTable1749318664996';

  public async up(q: QueryRunner): Promise<void> {
    // 1) phone → phone_number + unique
    await q.query(`ALTER TABLE "patients" RENAME COLUMN "phone" TO "phone_number"`);
    await q.query(`ALTER TABLE "patients" ADD CONSTRAINT "UQ_patients_phone_number" UNIQUE ("phone_number")`);

    // 2) add source
    await q.query(`ALTER TABLE "patients" ADD COLUMN "source" VARCHAR NOT NULL DEFAULT 'web'`);

    // 3a) drop the two FKs pointing at patients.id
    await q.query(`ALTER TABLE "family_members" DROP CONSTRAINT "family_members_patient_id_fkey"`);
    await q.query(`ALTER TABLE "appointments" DROP CONSTRAINT "appointments_patient_id_fkey"`);

    // 3b) change patients.id from UUID → VARCHAR
    await q.query(`ALTER TABLE "patients" ALTER COLUMN "id" DROP DEFAULT`);
    await q.query(`ALTER TABLE "patients" ALTER COLUMN "id" TYPE VARCHAR USING id::VARCHAR`);

    // 3c) re-create the FKs
    await q.query(`
      ALTER TABLE "family_members"
      ADD CONSTRAINT "family_members_patient_id_fkey"
        FOREIGN KEY ("patient_id") REFERENCES "patients"("id")
        ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
    await q.query(`
      ALTER TABLE "appointments"
      ADD CONSTRAINT "appointments_patient_id_fkey"
        FOREIGN KEY ("patient_id") REFERENCES "patients"("id")
        ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
  }

  public async down(q: QueryRunner): Promise<void> {
    // reverse in exact opposite order

    // a) drop those FKs again
    await q.query(`ALTER TABLE "appointments" DROP CONSTRAINT "appointments_patient_id_fkey"`);
    await q.query(`ALTER TABLE "family_members" DROP CONSTRAINT "family_members_patient_id_fkey"`);

    // b) back patients.id → UUID
    await q.query(`ALTER TABLE "patients" ALTER COLUMN "id" TYPE UUID USING id::UUID`);
    await q.query(`ALTER TABLE "patients" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`);

    // c) re-create the original FKs
    await q.query(`
      ALTER TABLE "family_members"
      ADD CONSTRAINT "family_members_patient_id_fkey"
        FOREIGN KEY ("patient_id") REFERENCES "patients"("id")
    `);
    await q.query(`
      ALTER TABLE "appointments"
      ADD CONSTRAINT "appointments_patient_id_fkey"
        FOREIGN KEY ("patient_id") REFERENCES "patients"("id")
    `);

    // d) drop source and unique, rename back phone_number
    await q.query(`ALTER TABLE "patients" DROP COLUMN "source"`);
    await q.query(`ALTER TABLE "patients" DROP CONSTRAINT "UQ_patients_phone_number"`);
    await q.query(`ALTER TABLE "patients" RENAME COLUMN "phone_number" TO "phone"`);
  }
}
