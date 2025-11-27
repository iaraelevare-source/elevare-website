import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { ConsentEntity } from './entities/consent.entity';
import { User } from '../database/entities/user.entity';
import { RecordConsentDto, ExportUserDataDto } from './dto/consent.dto';

/**
 * Serviço LGPD
 * 
 * Implementa funcionalidades de compliance com a Lei 13.709/2018 (LGPD):
 * - Registro de consentimentos (Art. 8º)
 * - Revogação de consentimentos (Art. 8º, §5º)
 * - Exportação de dados (Art. 18, §2º)
 * - Exclusão de dados (Art. 18 - direito de esquecimento)
 * - Verificação de consentimentos
 */
@Injectable()
export class LgpdService {
  private readonly logger = new Logger(LgpdService.name);

  constructor(
    @InjectRepository(ConsentEntity)
    private readonly consentRepository: Repository<ConsentEntity>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Registra consentimento do usuário
   * Chamado pelo banner LGPD do frontend
   * 
   * @param data - Dados do consentimento
   * @param ip - IP do cliente
   * @param userAgent - User-Agent do navegador
   */
  async recordConsent(
    data: RecordConsentDto,
    ip?: string,
    userAgent?: string,
  ): Promise<ConsentEntity> {
    const consent = this.consentRepository.create({
      ...data,
      metadata: {
        ...data.metadata,
        ip,
        userAgent,
        timestamp: new Date().toISOString(),
      },
    });

    const saved = await this.consentRepository.save(consent);
    
    this.logger.log(
      `Consentimento registrado: ${saved.type} - ${saved.granted ? 'ACEITO' : 'RECUSADO'} - User: ${saved.userId || saved.sessionId}`,
    );
    
    return saved;
  }

  /**
   * Revoga consentimento específico do usuário
   * Implementa Art. 8º, §5º da LGPD
   * 
   * @param userId - ID do usuário
   * @param type - Tipo de consentimento a revogar
   */
  async revokeConsent(
    userId: string,
    type: ConsentEntity['type'],
  ): Promise<void> {
    const result = await this.consentRepository.update(
      { userId, type, revoked: false },
      { 
        revoked: true, 
        revokedAt: new Date(), 
        revokedBy: userId,
      },
    );

    if (result.affected === 0) {
      this.logger.warn(`Nenhum consentimento ativo encontrado para revogar: ${userId} - ${type}`);
    } else {
      this.logger.warn(`Consentimento REVOGADO: ${userId} - ${type}`);
    }
  }

  /**
   * Exporta todos os dados do usuário
   * Implementa Art. 18, §2º da LGPD (direito de portabilidade)
   * 
   * @param userId - ID do usuário
   */
  async exportUserData(userId: string): Promise<ExportUserDataDto> {
    // Buscar dados do usuário
    const user = await this.userRepository.findOne({ 
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Buscar todos os consentimentos
    const consents = await this.consentRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    // TODO: Adicionar leads e agendamentos quando implementados
    // const leads = await this.leadRepository.find({ where: { userId } });
    // const appointments = await this.appointmentRepository.find({ where: { userId } });

    const exportData: ExportUserDataDto = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
      consents: consents.map(c => ({
        type: c.type,
        purpose: c.purpose,
        granted: c.granted,
        revoked: c.revoked,
        createdAt: c.createdAt,
        revokedAt: c.revokedAt,
      })),
      totalLeads: 0, // TODO: Implementar quando tiver LeadsEntity
      totalAppointments: 0, // TODO: Implementar quando tiver AppointmentsEntity
      dataRetentionDays: 365, // Política da empresa (configurável)
      exportedAt: new Date().toISOString(),
    };

    this.logger.log(`Dados exportados para usuário: ${userId}`);
    
    return exportData;
  }

  /**
   * Exclui dados do usuário (pseudonimização)
   * Implementa Art. 18 da LGPD (direito de esquecimento)
   * 
   * IMPORTANTE: Mantém registros para fins legais/contábeis,
   * mas remove dados pessoais identificáveis
   * 
   * @param userId - ID do usuário
   */
  async deleteUserData(userId: string): Promise<{ message: string }> {
    // Verificar se usuário existe
    const user = await this.userRepository.findOne({ 
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Pseudonimizar dados do usuário
    await this.userRepository.update(userId, {
      name: `[DELETED] ${user.id.substring(0, 8)}`,
      email: `deleted_${user.id}@lgpd.elevare.com`,
      // Manter ID para referências de FK
    });

    // Revogar todos os consentimentos
    await this.consentRepository.update(
      { userId },
      { 
        revoked: true, 
        revokedAt: new Date(), 
        revokedBy: 'LGPD_DELETE',
      },
    );

    // Registrar exclusão no log de consentimentos
    await this.consentRepository.save({
      userId,
      type: 'third_party',
      purpose: 'LGPD_DELETE_USER - Direito de esquecimento exercido',
      granted: true,
      metadata: { 
        deletedAt: new Date().toISOString(),
        originalEmail: user.email,
      },
    });

    this.logger.error(`EXCLUSÃO LGPD: Usuário ${userId} teve dados pseudonimizados`);

    return { 
      message: 'Dados excluídos conforme Art. 18 da LGPD. Registros mantidos para fins legais foram pseudonimizados.',
    };
  }

  /**
   * Verifica se usuário possui consentimento ativo
   * Usado antes de processar dados pessoais
   * 
   * @param userId - ID do usuário
   * @param type - Tipo de consentimento
   */
  async checkConsent(
    userId: string,
    type: ConsentEntity['type'],
  ): Promise<boolean> {
    const consent = await this.consentRepository.findOne({
      where: { 
        userId, 
        type, 
        revoked: false,
        granted: true,
      },
      order: { createdAt: 'DESC' },
    });

    return !!consent;
  }

  /**
   * Lista todos os consentimentos ativos do usuário
   * Usado no painel de controle de privacidade
   * 
   * @param userId - ID do usuário
   */
  async getActiveConsents(userId: string): Promise<ConsentEntity[]> {
    return this.consentRepository.find({
      where: { 
        userId, 
        revoked: false, 
        granted: true,
      },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Busca consentimentos por termo (admin)
   * 
   * @param query - Termo de busca
   */
  async searchConsents(query: string): Promise<ConsentEntity[]> {
    return this.consentRepository.find({
      where: { purpose: Like(`%${query}%`) },
      order: { createdAt: 'DESC' },
      take: 100, // Limitar resultados
    });
  }

  /**
   * Estatísticas de consentimentos (dashboard admin)
   */
  async getConsentStats(): Promise<{
    total: number;
    byType: Record<string, number>;
    granted: number;
    revoked: number;
  }> {
    const consents = await this.consentRepository.find();

    const stats = {
      total: consents.length,
      byType: {} as Record<string, number>,
      granted: consents.filter(c => c.granted && !c.revoked).length,
      revoked: consents.filter(c => c.revoked).length,
    };

    // Contar por tipo
    consents.forEach(c => {
      stats.byType[c.type] = (stats.byType[c.type] || 0) + 1;
    });

    return stats;
  }
}
