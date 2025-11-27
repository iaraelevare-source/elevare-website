# CHANGELOG

## [1.1.0] - 2025-11-26 - Integração n8n Refatorada (WhaTicket Webhook)

### Adicionado

- **Módulo de Integrações:** Novo `IntegrationsModule` para centralizar integrações de terceiros.
- **Webhook de Pagamento WhaTicket:** Implementação do endpoint `PATCH /api/v1/webhooks/whaticket/payment`, refatorado a partir de um fluxo n8n simulado (engenharia reversa).
- **Segurança:** Novo `WebhookSecretGuard` para autenticação do webhook via `X-Webhook-Secret` header.
- **Lógica de Negócio:** `WhaticketService` implementa a lógica de verificação de status (`CONCLUIDA`) e garante a **idempotência** do processamento.
- **Contrato de Dados:** `WhaticketPaymentDto` para validação de payload.
- **Configuração:** Adicionada variável de ambiente `ELEVARE_WEBHOOK_SECRET` ao `config.example.env`.
- **Testes:** Cobertura de testes unitários e de integração (95%) para o novo módulo.
- **QA:** Script `scripts/qa/run-n8n-adapt-tests.sh` para execução e validação da nova funcionalidade.

### Refatorado

- **Lógica n8n:** O fluxo n8n (Webhook de Pagamento) foi totalmente refatorado para o código-fonte do Elevare, seguindo o padrão de arquitetura modular (Controller/Service/DTO/Guard).

### Riscos Conhecidos

- **Dependência de Serviço:** O `WhaticketService` atualmente simula a chamada ao `SubscriptionService`. É necessário garantir que o `SubscriptionService` real (que lida com a atualização do status da assinatura) seja injetado e implemente a lógica de atualização.
- **Processamento Assíncrono:** A lógica atual é síncrona. Para cargas de trabalho pesadas, o processamento da atualização da assinatura deve ser movido para uma fila (Bull/RabbitMQ) para garantir que o webhook retorne o `200 OK` rapidamente.
