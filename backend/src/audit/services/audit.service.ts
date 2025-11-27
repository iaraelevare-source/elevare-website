import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { AuditLog } from '../entities/audit-log.entity';

/**
 * Serviço de Auditoria
 * 
 * Fornece métodos para:
 * - Registro manual de audit logs
 * - Consulta de histórico de ações
 * - Geração de relatórios LGPD
 * - Investigação de incidentes
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepository: Repository<AuditLog>,
  ) {}

  /**
   * Registra audit log manualmente
   * Usado para casos especiais que não passam pelo interceptor
   * 
   * @param options - Dados do audit log
   */
  async log(options: {
    action: string;
    entity: string;
    entityId: string;
    userId?: string;
    ipAddress?: string;
    before?: any;
    after?: any;
    error?: string;
    source?: 'web' | 'api' | 'webhook' | 'system';
    userAgent?: string;
    duration?: number;
  }): Promise<void> {
    try {
      await this.auditRepository.save({
        ...options,
        ipAddress: options.ipAddress || '0.0.0.0',
        source: options.source || 'system',
      });

      this.logger.log(`Audit log manual: ${options.action} - ${options.entity}`);
    } catch (error) {
      this.logger.error(`Erro ao salvar audit log: ${error.message}`);
    }
  }

  /**
   * Busca histórico de uma entidade específica
   * 
   * @param entity - Nome da entidade (ex: Lead, User)
   * @param entityId - ID do registro
   * @returns Lista de audit logs ordenada por data (mais recente primeiro)
   */
  async getEntityHistory(
    entity: string,
    entityId: string,
  ): Promise<AuditLog[]> {
    return this.auditRepository.find({
      where: { entity, entityId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Busca todas as ações de um usuário
   * 
   * @param userId - ID do usuário
   * @param limit - Número máximo de registros (padrão: 100)
   * @returns Lista de audit logs do usuário
   */
  async getUserActivity(
    userId: string,
    limit: number = 100,
  ): Promise<AuditLog[]> {
    return this.auditRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Gera relatório de acesso a dados pessoais (LGPD)
   * Implementa Art. 48 da LGPD (Comunicação de incidentes)
   * 
   * @param userId - ID do usuário titular dos dados
   * @returns Relatório completo de acessos
   */
  async generateAccessReport(userId: string): Promise<{
    userId: string;
    totalAccess: number;
    lastAccess: Date | null;
    accessHistory: Array<{
      date: Date;
      action: string;
      source: string;
      ip: string;
      userAgent?: string;
    }>;
  }> {
    const logs = await this.auditRepository.find({
      where: { entityId: userId },
      order: { createdAt: 'DESC' },
    });

    return {
      userId,
      totalAccess: logs.length,
      lastAccess: logs[0]?.createdAt || null,
      accessHistory: logs.map(log => ({
        date: log.createdAt,
        action: log.action,
        source: log.source,
        ip: log.ipAddress,
        userAgent: log.userAgent,
      })),
    };
  }

  /**
   * Busca ações suspeitas (múltiplos IPs, horários incomuns, etc)
   * 
   * @param userId - ID do usuário
   * @returns Lista de ações suspeitas
   */
  async findSuspiciousActivity(userId: string): Promise<{
    multipleIPs: string[];
    failedActions: AuditLog[];
    unusualHours: AuditLog[];
  }> {
    const logs = await this.getUserActivity(userId, 1000);

    // Detectar múltiplos IPs
    const ips = new Set(logs.map(log => log.ipAddress));
    const multipleIPs = ips.size > 3 ? Array.from(ips) : [];

    // Detectar ações falhadas
    const failedActions = logs.filter(log => log.error);

    // Detectar horários incomuns (00h-06h)
    const unusualHours = logs.filter(log => {
      const hour = new Date(log.createdAt).getHours();
      return hour >= 0 && hour < 6;
    });

    return {
      multipleIPs,
      failedActions,
      unusualHours,
    };
  }

  /**
   * Busca logs por período
   * 
   * @param startDate - Data inicial
   * @param endDate - Data final
   * @returns Lista de audit logs no período
   */
  async getLogsByPeriod(
    startDate: Date,
    endDate: Date,
  ): Promise<AuditLog[]> {
    return this.auditRepository.find({
      where: {
        createdAt: Between(startDate, endDate),
      },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Estatísticas de audit logs
   * Dashboard administrativo
   */
  async getStats(): Promise<{
    total: number;
    byAction: Record<string, number>;
    byEntity: Record<string, number>;
    bySource: Record<string, number>;
    errors: number;
    avgDuration: number;
  }> {
    const logs = await this.auditRepository.find();

    const stats = {
      total: logs.length,
      byAction: {} as Record<string, number>,
      byEntity: {} as Record<string, number>,
      bySource: {} as Record<string, number>,
      errors: logs.filter(log => log.error).length,
      avgDuration: 0,
    };

    // Contar por ação
    logs.forEach(log => {
      stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1;
      stats.byEntity[log.entity] = (stats.byEntity[log.entity] || 0) + 1;
      stats.bySource[log.source] = (stats.bySource[log.source] || 0) + 1;
    });

    // Calcular duração média
    const durationsSum = logs
      .filter(log => log.duration)
      .reduce((sum, log) => sum + (log.duration || 0), 0);
    
    stats.avgDuration = durationsSum / logs.filter(log => log.duration).length || 0;

    return stats;
  }

  /**
   * Limpa logs antigos (retenção de dados)
   * Executar via cron job
   * 
   * @param daysToKeep - Número de dias para manter (padrão: 365)
   */
  async cleanOldLogs(daysToKeep: number = 365): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.auditRepository
      .createQueryBuilder()
      .delete()
      .where('createdAt < :cutoffDate', { cutoffDate })
      .execute();

    this.logger.log(`Logs antigos removidos: ${result.affected} registros`);
    
    return result.affected || 0;
  }
}
