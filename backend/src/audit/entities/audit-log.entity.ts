import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

/**
 * Entidade de Audit Log
 * 
 * Registra todas as ações realizadas no sistema para:
 * - Compliance LGPD (Art. 48 - Comunicação de incidentes)
 * - Investigação de bugs e vazamentos
 * - Rastreabilidade de ações
 * - Auditoria de segurança
 * 
 * Índices otimizados para consultas frequentes:
 * - (userId, entity, createdAt) - Histórico de ações do usuário
 * - (entity, entityId) - Histórico de um registro específico
 * - (ipAddress, source) - Investigação de acessos suspeitos
 */
@Entity('audit_logs')
@Index(['userId', 'entity', 'createdAt'])
@Index(['entity', 'entityId'])
@Index(['ipAddress', 'source'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Ação realizada
   * Exemplos: CREATE_LEAD, UPDATE_USER, DELETE_APPOINTMENT, LOGIN, LOGOUT
   */
  @Column({ length: 100 })
  action: string;

  /**
   * Entidade afetada
   * Exemplos: Lead, User, Appointment, Consent
   */
  @Column({ length: 100 })
  entity: string;

  /**
   * ID do registro afetado
   */
  @Column({ length: 100 })
  entityId: string;

  /**
   * ID do usuário que realizou a ação
   * Pode ser nulo para ações de leads não cadastrados
   */
  @Column({ nullable: true, length: 100 })
  userId?: string;

  /**
   * Endereço IP do cliente
   * Usado para investigação de acessos suspeitos
   */
  @Column({ length: 100 })
  ipAddress: string;

  /**
   * Snapshot do registro ANTES da mudança
   * Usado para UPDATE e DELETE
   * Permite reverter mudanças se necessário
   */
  @Column({ type: 'jsonb', nullable: true })
  before?: any;

  /**
   * Snapshot do registro DEPOIS da mudança
   * Usado para CREATE e UPDATE
   */
  @Column({ type: 'jsonb', nullable: true })
  after?: any;

  /**
   * Data e hora da ação
   */
  @CreateDateColumn()
  createdAt: Date;

  /**
   * Mensagem de erro (se a ação falhou)
   */
  @Column({ type: 'text', nullable: true })
  error?: string;

  /**
   * Origem da requisição
   * - web: Navegador (User-Agent contém Mozilla)
   * - api: Chamada de API externa
   * - webhook: Webhook (ex: n8n, WhatsApp)
   * - system: Ação automática do sistema (cron, etc)
   */
  @Column({ type: 'varchar', length: 50, default: 'system' })
  source: 'web' | 'api' | 'webhook' | 'system';

  /**
   * User-Agent do navegador/cliente
   * Usado para identificar dispositivos suspeitos
   */
  @Column({ type: 'varchar', length: 255, nullable: true })
  userAgent?: string;

  /**
   * Duração da operação em milissegundos
   * Usado para identificar operações lentas
   */
  @Column({ type: 'integer', nullable: true })
  duration?: number;
}
