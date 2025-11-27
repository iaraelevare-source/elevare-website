import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuditLog } from './entities/audit-log.entity';
import { AuditService } from './services/audit.service';
import { AuditInterceptor } from './interceptors/audit.interceptor';

/**
 * Módulo de Auditoria
 * 
 * Registra automaticamente todas as ações marcadas com @Audit()
 * para compliance LGPD e rastreabilidade.
 * 
 * Funcionalidades:
 * - Registro automático via interceptor
 * - Consulta de histórico de ações
 * - Geração de relatórios LGPD
 * - Detecção de atividades suspeitas
 * - Limpeza automática de logs antigos
 * 
 * Uso:
 * 1. Importe AuditModule no AppModule
 * 2. Adicione @Audit() nos métodos que deseja auditar
 * 3. Acesse AuditService para consultas
 * 
 * Exemplo:
 * ```typescript
 * @Injectable()
 * export class LeadsService {
 *   @Audit({ action: 'CREATE_LEAD', entity: 'Lead' })
 *   async createLead(data: CreateLeadDto) {
 *     // Automaticamente auditado
 *   }
 * }
 * ```
 * 
 * @Global - Disponível em todos os módulos sem precisar importar
 */
@Global()
@Module({
  imports: [TypeOrmModule.forFeature([AuditLog])],
  providers: [
    AuditService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
  exports: [AuditService],
})
export class AuditModule {}
