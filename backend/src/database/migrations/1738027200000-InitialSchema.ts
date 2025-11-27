import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1738027200000 implements MigrationInterface {
  name = 'InitialSchema1738027200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar tabela users
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" SERIAL PRIMARY KEY,
        "email" VARCHAR(255) NOT NULL UNIQUE,
        "password" VARCHAR(255) NOT NULL,
        "name" VARCHAR(255) NOT NULL,
        "role" VARCHAR(50) NOT NULL DEFAULT 'atendente',
        "clinicId" INTEGER,
        "tfaSecret" VARCHAR(255),
        "tfaEnabled" BOOLEAN NOT NULL DEFAULT false,
        "lastLoginAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // Criar tabela clinics
    await queryRunner.query(`
      CREATE TABLE "clinics" (
        "id" SERIAL PRIMARY KEY,
        "name" VARCHAR(255) NOT NULL,
        "cnpj" VARCHAR(18) NOT NULL UNIQUE,
        "email" VARCHAR(255) NOT NULL,
        "phone" VARCHAR(20) NOT NULL,
        "address" TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // Criar tabela leads
    await queryRunner.query(`
      CREATE TABLE "leads" (
        "id" SERIAL PRIMARY KEY,
        "name" VARCHAR(255) NOT NULL,
        "email" VARCHAR(255),
        "phone" VARCHAR(20) NOT NULL,
        "origem" VARCHAR(50) NOT NULL,
        "status" VARCHAR(50) NOT NULL DEFAULT 'novo',
        "score" INTEGER NOT NULL DEFAULT 0,
        "procedimentoInteresse" VARCHAR(255),
        "observacoes" TEXT,
        "clinicId" INTEGER NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "FK_leads_clinic" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE CASCADE
      )
    `);

    // Criar índices para leads
    await queryRunner.query(`
      CREATE INDEX "IDX_leads_status" ON "leads" ("status")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_leads_score" ON "leads" ("score")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_leads_origem" ON "leads" ("origem")
    `);

    // Criar tabela agendamentos
    await queryRunner.query(`
      CREATE TABLE "agendamentos" (
        "id" SERIAL PRIMARY KEY,
        "leadId" INTEGER NOT NULL,
        "clinicId" INTEGER NOT NULL,
        "dataHora" TIMESTAMP NOT NULL,
        "procedimento" VARCHAR(255) NOT NULL,
        "status" VARCHAR(50) NOT NULL DEFAULT 'agendado',
        "observacoes" TEXT,
        "confirmado" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "FK_agendamentos_lead" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_agendamentos_clinic" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE CASCADE
      )
    `);

    // Criar índices para agendamentos
    await queryRunner.query(`
      CREATE INDEX "IDX_agendamentos_dataHora" ON "agendamentos" ("dataHora")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_agendamentos_status" ON "agendamentos" ("status")
    `);

    // Criar tabela lgpd_consents
    await queryRunner.query(`
      CREATE TABLE "lgpd_consents" (
        "id" SERIAL PRIMARY KEY,
        "userId" INTEGER,
        "sessionId" VARCHAR(255),
        "type" VARCHAR(50) NOT NULL,
        "purpose" TEXT NOT NULL,
        "granted" BOOLEAN NOT NULL DEFAULT false,
        "revokedAt" TIMESTAMP,
        "ipAddress" VARCHAR(45),
        "userAgent" TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "FK_lgpd_consents_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    // Criar índices para lgpd_consents
    await queryRunner.query(`
      CREATE INDEX "IDX_lgpd_consents_userId" ON "lgpd_consents" ("userId")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_lgpd_consents_type" ON "lgpd_consents" ("type")
    `);

    // Criar tabela audit_logs
    await queryRunner.query(`
      CREATE TABLE "audit_logs" (
        "id" SERIAL PRIMARY KEY,
        "userId" INTEGER,
        "action" VARCHAR(100) NOT NULL,
        "entity" VARCHAR(100) NOT NULL,
        "entityId" VARCHAR(100),
        "before" JSONB,
        "after" JSONB,
        "ipAddress" VARCHAR(45),
        "userAgent" TEXT,
        "duration" INTEGER,
        "success" BOOLEAN NOT NULL DEFAULT true,
        "errorMessage" TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "FK_audit_logs_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

    // Criar índices para audit_logs
    await queryRunner.query(`
      CREATE INDEX "IDX_audit_logs_userId" ON "audit_logs" ("userId")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_audit_logs_action" ON "audit_logs" ("action")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_audit_logs_entity" ON "audit_logs" ("entity")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_audit_logs_createdAt" ON "audit_logs" ("createdAt")
    `);

    // Adicionar foreign key de users para clinics
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD CONSTRAINT "FK_users_clinic" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE SET NULL
    `);

    // Inserir clínica de teste
    await queryRunner.query(`
      INSERT INTO "clinics" ("name", "cnpj", "email", "phone", "address")
      VALUES (
        'Clínica Elevare - Teste',
        '00.000.000/0001-00',
        'contato@elevare.com.br',
        '+55 27 99921-7624',
        'Rua Teste, 123 - Vitória/ES'
      )
    `);

    // Inserir usuário admin de teste
    await queryRunner.query(`
      INSERT INTO "users" ("email", "password", "name", "role", "clinicId")
      VALUES (
        'admin@elevare.com',
        '$2b$10$XqZ9Z9Z9Z9Z9Z9Z9Z9Z9ZuK8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8',
        'Administrador',
        'admin',
        1
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover foreign keys
    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_users_clinic"`);
    await queryRunner.query(`ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_audit_logs_user"`);
    await queryRunner.query(`ALTER TABLE "lgpd_consents" DROP CONSTRAINT "FK_lgpd_consents_user"`);
    await queryRunner.query(`ALTER TABLE "agendamentos" DROP CONSTRAINT "FK_agendamentos_clinic"`);
    await queryRunner.query(`ALTER TABLE "agendamentos" DROP CONSTRAINT "FK_agendamentos_lead"`);
    await queryRunner.query(`ALTER TABLE "leads" DROP CONSTRAINT "FK_leads_clinic"`);

    // Remover tabelas
    await queryRunner.query(`DROP TABLE "audit_logs"`);
    await queryRunner.query(`DROP TABLE "lgpd_consents"`);
    await queryRunner.query(`DROP TABLE "agendamentos"`);
    await queryRunner.query(`DROP TABLE "leads"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TABLE "clinics"`);
  }
}
