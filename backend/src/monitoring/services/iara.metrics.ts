import { Injectable } from '@nestjs/common';
import { Counter, Histogram, Gauge } from 'prom-client';
import { InjectMetric } from '@willsoto/nestjs-prometheus';

/**
 * Serviço de Métricas da IARA
 * 
 * Monitora performance da assistente inteligente:
 * - Processamento de mensagens
 * - Uso de tokens (GPT-4)
 * - Qualidade das respostas
 * - Cache de embeddings
 * - Duração de cada etapa do fluxo
 */
@Injectable()
export class IaraMetrics {
  constructor(
    @InjectMetric('iara_messages_processed_total')
    public readonly messagesProcessed: Counter<string>,
    
    @InjectMetric('iara_tokens_used_total')
    public readonly tokensUsed: Counter<string>,
    
    @InjectMetric('iara_response_quality_score')
    public readonly responseQualityScore: Histogram<string>,
    
    @InjectMetric('iara_embeddings_cache_hits_total')
    public readonly embeddingsCacheHits: Counter<string>,
    
    @InjectMetric('iara_embeddings_cache_misses_total')
    public readonly embeddingsCacheMisses: Counter<string>,
    
    @InjectMetric('iara_step_duration_seconds')
    public readonly iaraStepDuration: Histogram<string>,
    
    @InjectMetric('iara_active_conversations')
    public readonly activeConversations: Gauge<string>,
  ) {}

  /**
   * Registra mensagem processada pela IARA
   * @param intent - Intenção detectada (schedule, price_inquiry, general, etc)
   * @param clinicId - ID da clínica
   */
  recordMessageProcessed(intent: string, clinicId: string) {
    this.messagesProcessed.inc({
      intent,
      clinic_id: clinicId,
    });
  }

  /**
   * Registra uso de tokens do modelo de IA
   * @param model - Modelo usado (gpt-4-turbo, gpt-3.5-turbo, etc)
   * @param clinicId - ID da clínica
   * @param count - Número de tokens usados
   */
  recordTokensUsed(model: string, clinicId: string, count: number) {
    this.tokensUsed.inc(
      {
        model,
        clinic_id: clinicId,
      },
      count,
    );
  }

  /**
   * Registra qualidade da resposta gerada
   * @param flowType - Tipo de fluxo (conversation, qualification, scheduling)
   * @param score - Score de qualidade (0-1)
   */
  recordResponseQuality(flowType: string, score: number) {
    this.responseQualityScore.observe(
      { flow_type: flowType },
      score,
    );
  }

  /**
   * Registra hit no cache de embeddings
   */
  recordEmbeddingsCacheHit() {
    this.embeddingsCacheHits.inc();
  }

  /**
   * Registra miss no cache de embeddings
   */
  recordEmbeddingsCacheMiss() {
    this.embeddingsCacheMisses.inc();
  }

  /**
   * Registra duração de uma etapa do processamento
   * @param stepName - Nome da etapa (understand_intent, generate_response, etc)
   * @param flowType - Tipo de fluxo
   * @param durationSeconds - Duração em segundos
   */
  recordStepDuration(stepName: string, flowType: string, durationSeconds: number) {
    this.iaraStepDuration.observe(
      {
        step_name: stepName,
        flow_type: flowType,
      },
      durationSeconds,
    );
  }

  /**
   * Atualiza número de conversas ativas
   * @param count - Número de conversas ativas
   * @param clinicId - ID da clínica
   */
  updateActiveConversations(count: number, clinicId: string) {
    this.activeConversations.set({ clinic_id: clinicId }, count);
  }
}
