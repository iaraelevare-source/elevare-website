import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { validationSchema } from './config/validation.schema';
import { typeOrmConfig } from './config/database.config';
import { AuthModule } from './modules/auth/auth.module';
import { LeadsModule } from './modules/leads/leads.module';
import { AgendamentosModule } from './modules/agendamentos/agendamentos.module';
import { MonitoringModule } from './monitoring/monitoring.module';
import { LgpdModule } from './lgpd/lgpd.module';
import { AuditModule } from './audit/audit.module';

/**
 * Módulo principal da aplicação
 * Configura todos os módulos, banco de dados e rate limiting
 */
@Module({
  imports: [
    // Configuração de variáveis de ambiente
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: validationSchema,
      envFilePath: '.env',
    }),

    // Configuração do banco de dados PostgreSQL
    TypeOrmModule.forRootAsync(typeOrmConfig),

    // Configuração de rate limiting (proteção contra abuso)
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.THROTTLE_TTL) || 60000, // Tempo em milissegundos
        limit: parseInt(process.env.THROTTLE_LIMIT) || 10, // Número máximo de requisições
      },
    ]),

    // Módulos da aplicação
    AuthModule,
    LeadsModule,
    AgendamentosModule,
    MonitoringModule,
    LgpdModule,
    AuditModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
