# 📊 Monitoring Stack - Elevare

Stack completo de monitoramento com Prometheus e Grafana para o backend Elevare.

## 🚀 Início Rápido

### 1. Subir o Stack de Monitoring

```bash
# Na pasta backend/infra/
docker-compose -f docker-compose.monitoring.yml up -d
```

### 2. Aguardar Inicialização (30 segundos)

```bash
sleep 30
```

### 3. Verificar Status

```bash
# Prometheus (deve mostrar 6/6 targets UP)
curl http://localhost:9090/targets

# Grafana (deve retornar {"status":"ok"})
curl http://localhost:3001/api/health
```

### 4. Acessar Interfaces

- **Prometheus:** http://localhost:9090
- **Grafana:** http://localhost:3001
  - **Usuário:** admin
  - **Senha:** elevare123

---

## 📈 Métricas Disponíveis

### Leads
- `elevare_leads_received_total` - Total de leads recebidos
- `elevare_leads_converted_total` - Total de leads convertidos
- `elevare_leads_score_distribution` - Distribuição de scores
- `elevare_leads_active_count` - Leads ativos no momento
- `elevare_leads_scheduled_total` - Leads agendados

### WhatsApp
- `elevare_whatsapp_messages_sent_total` - Mensagens enviadas
- `elevare_whatsapp_messages_received_total` - Mensagens recebidas
- `elevare_whatsapp_messages_failed_total` - Falhas no envio
- `elevare_whatsapp_api_latency_seconds` - Latência da API
- `elevare_whatsapp_api_requests_total` - Requisições à API

### IARA (Assistente IA)
- `elevare_iara_messages_processed_total` - Mensagens processadas
- `elevare_iara_tokens_used_total` - Tokens usados (GPT-4)
- `elevare_iara_response_quality_score` - Qualidade das respostas
- `elevare_iara_embeddings_cache_hits_total` - Cache hits
- `elevare_iara_embeddings_cache_misses_total` - Cache misses
- `elevare_iara_step_duration_seconds` - Duração de cada etapa
- `elevare_iara_active_conversations` - Conversas ativas

### HTTP
- `elevare_http_requests_total` - Total de requisições HTTP
- `elevare_http_request_duration_seconds` - Duração das requisições

---

## 📊 Dashboards

### Elevare Overview
Dashboard principal com visão geral do sistema:
- Total de leads recebidos
- Taxa de conversão
- Mensagens WhatsApp enviadas
- Mensagens IARA processadas
- Leads por origem (gráfico pizza)
- Distribuição de score
- Latência de API WhatsApp
- Tokens IARA usados
- Taxa de erro HTTP
- Requisições por segundo

**Acesso:** Grafana > Dashboards > Elevare - Overview

---

## 🔧 Configuração

### Prometheus
Arquivo: `prometheus.yml`

Configuração de scraping:
- Backend NestJS: http://backend:3000/metrics (10s)
- Node Exporter: http://node-exporter:9100
- Postgres Exporter: http://postgres-exporter:9187
- Redis Exporter: http://redis-exporter:9121

### Grafana
Configuração automática via provisioning:
- Datasource: Prometheus (configurado automaticamente)
- Dashboards: Importados automaticamente

---

## 🛠️ Comandos Úteis

### Parar o Stack
```bash
docker-compose -f docker-compose.monitoring.yml down
```

### Ver Logs
```bash
# Prometheus
docker logs elevare-prometheus

# Grafana
docker logs elevare-grafana
```

### Reiniciar
```bash
docker-compose -f docker-compose.monitoring.yml restart
```

### Limpar Dados
```bash
docker-compose -f docker-compose.monitoring.yml down -v
```

---

## 📝 Integração no Código

### Exemplo: Registrar Métrica de Lead

```typescript
import { LeadsMetrics } from './monitoring/services/leads.metrics';

@Injectable()
export class LeadsService {
  constructor(
    private readonly leadsMetrics: LeadsMetrics,
  ) {}

  async createLead(data: CreateLeadDto) {
    const lead = await this.leadRepository.save(data);
    
    // Registrar métrica
    this.leadsMetrics.recordLeadReceived(
      data.origem,
      data.clinic_id,
    );
    
    return lead;
  }
}
```

---

## 🎯 Próximos Passos

1. ✅ Stack de monitoring funcionando
2. 🔄 Adicionar alertas no Prometheus
3. 🔄 Criar dashboard de IARA detalhado
4. 🔄 Configurar notificações (Slack/Email)
5. 🔄 Adicionar métricas de negócio (MRR, churn, etc)

---

## 📚 Documentação

- [Prometheus](https://prometheus.io/docs/)
- [Grafana](https://grafana.com/docs/)
- [NestJS Prometheus](https://github.com/willsoto/nestjs-prometheus)
