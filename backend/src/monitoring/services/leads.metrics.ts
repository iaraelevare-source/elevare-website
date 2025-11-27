import { Injectable } from '@nestjs/common';
import { Counter, Histogram, Gauge } from 'prom-client';
import { InjectMetric } from '@willsoto/nestjs-prometheus';

/**
 * Serviço de Métricas de Leads
 * 
 * Coleta métricas relacionadas ao ciclo de vida dos leads:
 * - Recebimento de novos leads
 * - Conversão para agendamentos
 * - Distribuição de scores
 * - Performance de qualificação
 */
@Injectable()
export class LeadsMetrics {
  constructor(
    @InjectMetric('leads_received_total')
    public readonly leadsReceived: Counter<string>,
    
    @InjectMetric('leads_converted_total')
    public readonly leadsConverted: Counter<string>,
    
    @InjectMetric('leads_score_distribution')
    public readonly scoreDistribution: Histogram<string>,
    
    @InjectMetric('leads_active_count')
    public readonly activeLeads: Gauge<string>,
    
    @InjectMetric('leads_scheduled_total')
    public readonly leadsScheduled: Counter<string>,
  ) {}

  /**
   * Registra recebimento de novo lead
   * @param origem - Origem do lead (whatsapp, instagram, site, etc)
   * @param clinicId - ID da clínica
   */
  recordLeadReceived(origem: string, clinicId: string) {
    this.leadsReceived.inc({
      origem,
      clinic_id: clinicId,
    });
  }

  /**
   * Registra conversão de lead
   * @param origem - Origem do lead
   * @param clinicId - ID da clínica
   */
  recordLeadConverted(origem: string, clinicId: string) {
    this.leadsConverted.inc({
      origem,
      clinic_id: clinicId,
    });
  }

  /**
   * Registra score de um lead
   * @param score - Score do lead (0-100)
   * @param clinicId - ID da clínica
   */
  recordLeadScore(score: number, clinicId: string) {
    this.scoreDistribution.observe(
      { clinic_id: clinicId },
      score,
    );
  }

  /**
   * Atualiza contagem de leads ativos
   * @param count - Número de leads ativos
   * @param clinicId - ID da clínica
   */
  updateActiveLeads(count: number, clinicId: string) {
    this.activeLeads.set({ clinic_id: clinicId }, count);
  }

  /**
   * Registra agendamento de lead
   * @param clinicId - ID da clínica
   * @param specialty - Especialidade do agendamento
   */
  recordLeadScheduled(clinicId: string, specialty: string) {
    this.leadsScheduled.inc({
      clinic_id: clinicId,
      specialty,
    });
  }
}
