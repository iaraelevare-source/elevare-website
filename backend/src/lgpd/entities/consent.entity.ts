import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * Entidade de Consentimento LGPD
 * 
 * Armazena todos os consentimentos de usuários conforme Lei 13.709/2018 (LGPD).
 * Mantém audit trail completo para compliance legal.
 * 
 * Artigos relacionados:
 * - Art. 7º - Bases legais para tratamento
 * - Art. 8º - Consentimento
 * - Art. 9º - Direito de acesso
 * - Art. 18 - Direitos do titular
 */
@Entity('lgpd_consents')
@Index(['userId', 'type'])
@Index(['sessionId'])
export class ConsentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * ID do usuário (opcional para leads não cadastrados)
   */
  @Column({ nullable: true })
  userId?: string;

  /**
   * Tipo de consentimento
   * - cookie: Cookies analíticos e funcionais
   * - whatsapp: Comunicação via WhatsApp
   * - email: Comunicação via email
   * - phone: Comunicação via telefone
   * - third_party: Compartilhamento com terceiros
   */
  @Column({ type: 'varchar', length: 100 })
  type: 'cookie' | 'whatsapp' | 'email' | 'phone' | 'third_party';

  /**
   * Consentimento foi concedido?
   */
  @Column({ type: 'boolean', default: true })
  granted: boolean;

  /**
   * Finalidade específica do tratamento (Art. 8º, §4º)
   * Exemplos:
   * - "Comunicação via WhatsApp para agendamentos"
   * - "Cookies analíticos para melhorar experiência"
   * - "Email marketing de promoções"
   */
  @Column({ type: 'varchar', length: 500 })
  purpose: string;

  /**
   * Metadados técnicos para auditoria
   * Inclui: IP, User-Agent, página de origem, etc
   */
  @Column({ type: 'jsonb', nullable: true })
  metadata?: {
    ip?: string;
    userAgent?: string;
    pageSource?: string;
    timestamp?: string;
    [key: string]: any;
  };

  /**
   * Consentimento foi revogado? (Art. 8º, §5º)
   */
  @Column({ type: 'boolean', default: false })
  revoked: boolean;

  /**
   * Data de criação do consentimento
   */
  @CreateDateColumn()
  createdAt: Date;

  /**
   * Data de última atualização
   */
  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * Data de revogação (se aplicável)
   */
  @Column({ type: 'timestamp', nullable: true })
  revokedAt?: Date;

  /**
   * Quem revogou (userId ou 'system')
   */
  @Column({ type: 'varchar', length: 255, nullable: true })
  revokedBy?: string;

  /**
   * Session ID para leads temporários (pré-cadastro)
   * Permite rastrear consentimentos antes do login
   */
  @Column({ type: 'varchar', length: 100, nullable: true })
  sessionId?: string;
}
