import { Module } from '@nestjs/common';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { MetricsController } from './controllers/metrics.controller';
import { LeadsMetrics } from './services/leads.metrics';
import { WhatsAppMetrics } from './services/whatsapp.metrics';
import { IaraMetrics } from './services/iara.metrics';
import { MetricsInterceptor } from './interceptors/metrics.interceptor';

/**
 * Módulo de Monitoring
 * 
 * Responsável por coletar e expor métricas do sistema para Prometheus/Grafana.
 * Inclui métricas de:
 * - Leads (criação, conversão, scoring)
 * - WhatsApp (mensagens enviadas, falhas, latência)
 * - IARA (processamento de mensagens, tokens usados, qualidade)
 */
@Module({
  imports: [
    PrometheusModule.register({
      defaultMetrics: {
        enabled: true,
        config: {
          prefix: 'elevare_',
        },
      },
      path: '/metrics',
      defaultLabels: {
        app: 'elevare-backend',
        environment: process.env.NODE_ENV || 'development',
      },
    }),
  ],
  controllers: [MetricsController],
  providers: [
    LeadsMetrics,
    WhatsAppMetrics,
    IaraMetrics,
    MetricsInterceptor,
  ],
  exports: [
    LeadsMetrics,
    WhatsAppMetrics,
    IaraMetrics,
    MetricsInterceptor,
  ],
})
export class MonitoringModule {}
