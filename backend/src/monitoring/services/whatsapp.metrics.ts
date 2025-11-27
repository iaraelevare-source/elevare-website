import { Injectable } from '@nestjs/common';
import { Counter, Histogram } from 'prom-client';
import { InjectMetric } from '@willsoto/nestjs-prometheus';

/**
 * Serviço de Métricas do WhatsApp
 * 
 * Monitora integração com WhatsApp Meta API:
 * - Mensagens enviadas e recebidas
 * - Falhas e erros
 * - Latência de API
 * - Rate limiting
 */
@Injectable()
export class WhatsAppMetrics {
  constructor(
    @InjectMetric('whatsapp_messages_sent_total')
    public readonly messagesSent: Counter<string>,
    
    @InjectMetric('whatsapp_messages_received_total')
    public readonly messagesReceived: Counter<string>,
    
    @InjectMetric('whatsapp_messages_failed_total')
    public readonly messagesFailed: Counter<string>,
    
    @InjectMetric('whatsapp_api_latency_seconds')
    public readonly apiLatency: Histogram<string>,
    
    @InjectMetric('whatsapp_api_requests_total')
    public readonly apiRequests: Counter<string>,
  ) {}

  /**
   * Registra mensagem enviada
   * @param template - Nome do template usado
   * @param status - Status do envio (sent, delivered, read, failed)
   * @param clinicId - ID da clínica
   */
  recordMessageSent(template: string, status: string, clinicId: string) {
    this.messagesSent.inc({
      template,
      status,
      clinic_id: clinicId,
    });
  }

  /**
   * Registra mensagem recebida
   * @param type - Tipo de mensagem (text, image, audio, etc)
   * @param clinicId - ID da clínica
   */
  recordMessageReceived(type: string, clinicId: string) {
    this.messagesReceived.inc({
      type,
      clinic_id: clinicId,
    });
  }

  /**
   * Registra falha no envio de mensagem
   * @param template - Nome do template
   * @param errorType - Tipo de erro (rate_limit, invalid_token, network, etc)
   * @param clinicId - ID da clínica
   */
  recordMessageFailed(template: string, errorType: string, clinicId: string) {
    this.messagesFailed.inc({
      template,
      error_type: errorType,
      clinic_id: clinicId,
    });
  }

  /**
   * Registra latência de chamada à API
   * @param endpoint - Endpoint chamado
   * @param durationSeconds - Duração em segundos
   */
  recordApiLatency(endpoint: string, durationSeconds: number) {
    this.apiLatency.observe(
      { endpoint },
      durationSeconds,
    );
  }

  /**
   * Registra requisição à API
   * @param status - Status HTTP da resposta
   * @param endpoint - Endpoint chamado
   */
  recordApiRequest(status: number, endpoint: string) {
    this.apiRequests.inc({
      status: status.toString(),
      endpoint,
    });
  }
}
