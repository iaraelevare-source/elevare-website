import { SetMetadata } from '@nestjs/common';

/**
 * Chave de metadados para o decorator @Audit()
 */
export const AUDIT_KEY = 'audit_metadata';

/**
 * Opções do decorator @Audit()
 */
export interface AuditOptions {
  /**
   * Ação realizada (ex: CREATE_LEAD, UPDATE_USER)
   */
  action: string;

  /**
   * Entidade afetada (ex: Lead, User, Appointment)
   */
  entity: string;

  /**
   * Campos sensíveis que não devem ser logados
   * Padrão: ['password', 'senha', 'token', 'secret']
   */
  ignoreFields?: string[];
}

/**
 * Decorator para registrar ações no audit log
 * 
 * Uso:
 * ```typescript
 * @Injectable()
 * export class LeadsService {
 *   @Audit({ action: 'CREATE_LEAD', entity: 'Lead' })
 *   async createLead(data: CreateLeadDto) {
 *     // Seu código normal...
 *     return lead;
 *   }
 * }
 * ```
 * 
 * O interceptor AuditInterceptor captura automaticamente:
 * - IP do cliente
 * - User-Agent
 * - Usuário autenticado (se houver)
 * - Snapshot antes/depois da mudança
 * - Duração da operação
 * - Erros (se houver)
 */
export const Audit = (options: AuditOptions) =>
  SetMetadata(AUDIT_KEY, options);
