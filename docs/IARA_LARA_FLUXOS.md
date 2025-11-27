# 🤖 IARA & LARA - FLUXOS EXECUTÁVEIS E TEMPLATES

**Arquiteto:** Manus AI  
**Data:** 24/11/2025  
**Versão:** 1.0 - Fluxos Prontos para Integração  
**Status:** ✅ Pronto para Implementação

---

## 1. IARA - FLUXO DE QUALIFICAÇÃO DE LEADS

### 1.1 Fluxo Executável (JSON)

```json
{
  "id": "iara-lead-qualification-v1",
  "name": "IARA - Qualificação de Leads",
  "description": "Fluxo automático de qualificação de leads via WhatsApp",
  "version": "1.0",
  "trigger": "new_lead_received",
  "steps": [
    {
      "id": "step-1",
      "name": "Receber Lead",
      "type": "webhook",
      "action": "POST /webhooks/leads",
      "description": "Recebe novo lead via webhook (Make.com ou formulário web)",
      "output": {
        "leadId": "uuid",
        "nome": "string",
        "telefone": "string",
        "email": "string",
        "interesse": "string",
        "origem": "string"
      }
    },
    {
      "id": "step-2",
      "name": "Validar Dados",
      "type": "validation",
      "rules": [
        {
          "field": "telefone",
          "type": "phone",
          "country": "BR",
          "required": true
        },
        {
          "field": "nome",
          "type": "string",
          "minLength": 3,
          "maxLength": 100,
          "required": true
        },
        {
          "field": "email",
          "type": "email",
          "required": false
        }
      ],
      "onError": {
        "action": "send_message",
        "template": "validation_error"
      }
    },
    {
      "id": "step-3",
      "name": "Calcular Score Inicial",
      "type": "scoring",
      "rules": [
        {
          "field": "origem",
          "values": {
            "google": 30,
            "facebook": 25,
            "instagram": 20,
            "indicacao": 40,
            "website": 35,
            "whatsapp": 15
          }
        },
        {
          "field": "interesse",
          "values": {
            "depilacao_laser": 50,
            "botox": 45,
            "preenchimento": 40,
            "limpeza_pele": 30,
            "outros": 20
          }
        },
        {
          "field": "email_provided",
          "condition": "email != null",
          "points": 10
        }
      ],
      "output": {
        "score": "number",
        "scoreBreakdown": "object"
      }
    },
    {
      "id": "step-4",
      "name": "Gerar Tags Automáticas",
      "type": "tagging",
      "rules": [
        {
          "condition": "score >= 40",
          "tags": ["hot_lead"]
        },
        {
          "condition": "score >= 25 && score < 40",
          "tags": ["warm_lead"]
        },
        {
          "condition": "score < 25",
          "tags": ["cold_lead"]
        },
        {
          "condition": "interesse.includes('depilacao_laser')",
          "tags": ["depilacao"]
        },
        {
          "condition": "interesse.includes('botox')",
          "tags": ["botox"]
        },
        {
          "condition": "origem == 'indicacao'",
          "tags": ["vip"]
        }
      ]
    },
    {
      "id": "step-5",
      "name": "Enviar Mensagem de Boas-vindas",
      "type": "send_message",
      "channel": "whatsapp",
      "template": "welcome_message",
      "variables": {
        "nome": "lead.nome",
        "clinicName": "clinic.nome",
        "clinicPhone": "clinic.telefone"
      },
      "delay": 0
    },
    {
      "id": "step-6",
      "name": "Agendar Follow-up Automático",
      "type": "schedule_message",
      "condition": "score < 40",
      "template": "follow_up_message",
      "delay": 3600000,
      "description": "Enviar follow-up após 1 hora se score < 40"
    },
    {
      "id": "step-7",
      "name": "Registrar no Banco de Dados",
      "type": "database",
      "action": "INSERT",
      "table": "leads",
      "data": {
        "clinicId": "clinic.id",
        "nome": "lead.nome",
        "telefone": "lead.telefone",
        "email": "lead.email",
        "interesse": "lead.interesse",
        "origem": "lead.origem",
        "score": "step-3.score",
        "stage": "cold",
        "tags": "step-4.tags",
        "createdAt": "NOW()"
      }
    },
    {
      "id": "step-8",
      "name": "Notificar Clínica",
      "type": "send_message",
      "channel": "whatsapp",
      "recipient": "clinic.admin",
      "template": "new_lead_notification",
      "variables": {
        "leadName": "lead.nome",
        "score": "step-3.score",
        "tags": "step-4.tags"
      }
    }
  ],
  "errorHandling": {
    "retryPolicy": {
      "maxRetries": 3,
      "backoffMultiplier": 2,
      "initialDelay": 1000
    },
    "fallback": {
      "action": "send_to_queue",
      "queue": "failed_leads"
    }
  },
  "logging": {
    "level": "info",
    "logLeadData": true,
    "logScoring": true,
    "logMessages": true
  }
}
```

### 1.2 Fluxo de Agendamento

```json
{
  "id": "iara-scheduling-flow-v1",
  "name": "IARA - Fluxo de Agendamento",
  "description": "Fluxo automático de agendamento via WhatsApp",
  "version": "1.0",
  "trigger": "lead_ready_for_scheduling",
  "steps": [
    {
      "id": "step-1",
      "name": "Verificar Disponibilidade",
      "type": "check_availability",
      "action": "GET /agendamentos/available-slots",
      "parameters": {
        "clinicId": "lead.clinicId",
        "daysAhead": 14,
        "minSlots": 3
      }
    },
    {
      "id": "step-2",
      "name": "Enviar Opções de Agendamento",
      "type": "send_message",
      "channel": "whatsapp",
      "template": "scheduling_options",
      "variables": {
        "slots": "step-1.availableSlots",
        "procedimento": "lead.interesse"
      },
      "interactive": true,
      "buttons": [
        {
          "id": "slot-1",
          "label": "{{slot1.date}} às {{slot1.time}}"
        },
        {
          "id": "slot-2",
          "label": "{{slot2.date}} às {{slot2.time}}"
        },
        {
          "id": "slot-3",
          "label": "{{slot3.date}} às {{slot3.time}}"
        },
        {
          "id": "other",
          "label": "Outras opções"
        }
      ]
    },
    {
      "id": "step-3",
      "name": "Aguardar Resposta do Lead",
      "type": "wait_for_input",
      "timeout": 86400000,
      "description": "Aguardar resposta por até 24 horas",
      "onTimeout": {
        "action": "send_message",
        "template": "scheduling_reminder"
      }
    },
    {
      "id": "step-4",
      "name": "Processar Seleção",
      "type": "conditional",
      "conditions": [
        {
          "if": "userSelected == 'other'",
          "then": "step-5"
        },
        {
          "if": "userSelected in ['slot-1', 'slot-2', 'slot-3']",
          "then": "step-6"
        },
        {
          "if": "noResponse",
          "then": "step-9"
        }
      ]
    },
    {
      "id": "step-5",
      "name": "Coletar Data/Hora Customizada",
      "type": "collect_input",
      "prompt": "Qual data e horário você prefere?",
      "format": "date_time",
      "validation": {
        "minDate": "TODAY",
        "maxDate": "+30 days",
        "businessHoursOnly": true
      }
    },
    {
      "id": "step-6",
      "name": "Confirmar Agendamento",
      "type": "create_appointment",
      "action": "POST /agendamentos",
      "data": {
        "leadId": "lead.id",
        "clinicId": "lead.clinicId",
        "procedimento": "lead.interesse",
        "dataHora": "userSelection.dateTime",
        "duracaoMinutos": 60,
        "status": "confirmado"
      }
    },
    {
      "id": "step-7",
      "name": "Enviar Confirmação ao Lead",
      "type": "send_message",
      "channel": "whatsapp",
      "template": "appointment_confirmed",
      "variables": {
        "appointmentDate": "step-6.dataHora",
        "appointmentTime": "step-6.dataHora",
        "procedimento": "lead.interesse",
        "clinicAddress": "clinic.endereco",
        "clinicPhone": "clinic.telefone"
      }
    },
    {
      "id": "step-8",
      "name": "Agendar Lembretes",
      "type": "schedule_messages",
      "messages": [
        {
          "template": "appointment_reminder_24h",
          "delayBefore": 86400000,
          "description": "Lembrete 24h antes"
        },
        {
          "template": "appointment_reminder_1h",
          "delayBefore": 3600000,
          "description": "Lembrete 1h antes"
        }
      ]
    },
    {
      "id": "step-9",
      "name": "Registrar Falha de Agendamento",
      "type": "log_event",
      "event": "scheduling_failed",
      "reason": "no_response_or_cancellation"
    }
  ]
}
```

---

## 2. TEMPLATES DE MENSAGENS WHATSAPP

### 2.1 Template: Boas-vindas

```json
{
  "id": "welcome_message",
  "name": "Mensagem de Boas-vindas",
  "channel": "whatsapp",
  "language": "pt-BR",
  "content": {
    "text": "Olá {{nome}}! 👋\n\nBem-vindo(a) à {{clinicName}}! 🏥\n\nSomos especializados em procedimentos estéticos de alta qualidade. Estamos aqui para ajudar você a alcançar seus objetivos de beleza e bem-estar.\n\nPara agendar sua consulta, clique no botão abaixo ou envie uma mensagem com suas dúvidas.",
    "buttons": [
      {
        "type": "call",
        "text": "📞 Ligar",
        "phone": "{{clinicPhone}}"
      },
      {
        "type": "url",
        "text": "🌐 Visitar Site",
        "url": "{{clinicWebsite}}"
      }
    ]
  },
  "variables": ["nome", "clinicName", "clinicPhone", "clinicWebsite"],
  "tags": ["welcome", "first_contact"]
}
```

### 2.2 Template: Follow-up

```json
{
  "id": "follow_up_message",
  "name": "Mensagem de Follow-up",
  "channel": "whatsapp",
  "language": "pt-BR",
  "content": {
    "text": "Oi {{nome}}! 😊\n\nVimos que você tem interesse em {{interesse}}. Temos ótimas promoções especiais para você!\n\n✨ Depilação a Laser: 50% de desconto na primeira sessão\n✨ Botox: Consulta gratuita\n✨ Preenchimento: Pacote com 3 sessões com 30% de desconto\n\nGostaria de agendar uma consulta? Clique abaixo para escolher um horário.",
    "buttons": [
      {
        "type": "quick_reply",
        "text": "📅 Agendar Consulta",
        "payload": "schedule_appointment"
      },
      {
        "type": "quick_reply",
        "text": "❓ Tirar Dúvidas",
        "payload": "ask_questions"
      }
    ]
  },
  "variables": ["nome", "interesse"],
  "tags": ["follow_up", "engagement"]
}
```

### 2.3 Template: Confirmação de Agendamento

```json
{
  "id": "appointment_confirmed",
  "name": "Confirmação de Agendamento",
  "channel": "whatsapp",
  "language": "pt-BR",
  "content": {
    "text": "✅ Agendamento Confirmado!\n\nOlá {{nome}},\n\nSeu agendamento foi confirmado com sucesso! 🎉\n\n📅 Data: {{appointmentDate}}\n⏰ Horário: {{appointmentTime}}\n💆 Procedimento: {{procedimento}}\n\n📍 Local:\n{{clinicAddress}}\n\n📞 Telefone: {{clinicPhone}}\n\nPor favor, chegue 10 minutos antes. Qualquer dúvida, entre em contato conosco!\n\nAté logo! 💕",
    "buttons": [
      {
        "type": "call",
        "text": "📞 Confirmar Presença",
        "phone": "{{clinicPhone}}"
      },
      {
        "type": "url",
        "text": "🗺️ Ver Localização",
        "url": "{{clinicMapUrl}}"
      }
    ]
  },
  "variables": ["nome", "appointmentDate", "appointmentTime", "procedimento", "clinicAddress", "clinicPhone", "clinicMapUrl"],
  "tags": ["confirmation", "appointment"]
}
```

### 2.4 Template: Lembrete 24h antes

```json
{
  "id": "appointment_reminder_24h",
  "name": "Lembrete - 24h Antes",
  "channel": "whatsapp",
  "language": "pt-BR",
  "content": {
    "text": "⏰ Lembrete: Seu agendamento é amanhã!\n\nOlá {{nome}},\n\nNão esqueça do seu agendamento amanhã às {{appointmentTime}} para {{procedimento}}.\n\nEstamos ansiosos para recebê-lo(a)! 😊\n\nCaso precise cancelar ou remarcar, avise-nos com antecedência.",
    "buttons": [
      {
        "type": "quick_reply",
        "text": "✅ Confirmo Presença",
        "payload": "confirm_appointment"
      },
      {
        "type": "quick_reply",
        "text": "❌ Preciso Remarcar",
        "payload": "reschedule_appointment"
      }
    ]
  },
  "variables": ["nome", "appointmentTime", "procedimento"],
  "tags": ["reminder", "engagement"]
}
```

### 2.5 Template: Notificação de Novo Lead (para clínica)

```json
{
  "id": "new_lead_notification",
  "name": "Notificação de Novo Lead",
  "channel": "whatsapp",
  "language": "pt-BR",
  "content": {
    "text": "🔔 Novo Lead Recebido!\n\n👤 Nome: {{leadName}}\n📊 Score: {{score}}/100\n🏷️ Tags: {{tags}}\n\nAcesse o dashboard para mais detalhes e agende uma consulta.",
    "buttons": [
      {
        "type": "url",
        "text": "📊 Ver no Dashboard",
        "url": "{{dashboardUrl}}"
      }
    ]
  },
  "variables": ["leadName", "score", "tags", "dashboardUrl"],
  "tags": ["admin", "notification"]
}
```

---

## 3. LARA - PROMPTS PARA QUALIFICAÇÃO E AGENDAMENTO

### 3.1 Prompt: Qualificação de Lead

```yaml
id: lara-qualification-prompt-v1
name: "LARA - Qualificação de Lead"
description: "Prompt para LARA qualificar leads via conversa natural"
model: "gpt-4-turbo"
temperature: 0.7
max_tokens: 500

system_prompt: |
  Você é LARA, uma assistente de IA especializada em qualificação de leads para clínicas de estética.
  
  Seu objetivo é:
  1. Cumprimentar o lead de forma amigável
  2. Entender seu interesse específico em procedimentos estéticos
  3. Qualificar o lead com base em:
     - Nível de interesse (alto, médio, baixo)
     - Urgência (precisa agora, em breve, futuramente)
     - Orçamento (premium, padrão, econômico)
     - Tipo de procedimento (depilação, botox, preenchimento, limpeza, outros)
  4. Sugerir o próximo passo (agendamento, consulta, informações)
  
  Mantenha um tom profissional, amigável e empático.
  Faça perguntas abertas para entender melhor as necessidades.
  Não seja agressivo ou insistente.
  
  Ao final da conversa, forneça um JSON com os dados qualificados:
  {
    "interest_level": "high|medium|low",
    "urgency": "now|soon|later",
    "budget": "premium|standard|economic",
    "procedure_type": "depilation|botox|filling|cleaning|other",
    "recommendation": "schedule|consult|info",
    "score": 0-100
  }

conversation_flow:
  - step: 1
    trigger: "new_conversation"
    action: "greet_and_ask_interest"
    prompt: "Olá! Bem-vindo(a) à {{clinicName}}. Qual procedimento estético você tem interesse?"
    
  - step: 2
    trigger: "interest_provided"
    action: "ask_urgency"
    prompt: "Entendi! Você gostaria de fazer {{procedure}} em breve ou é algo para o futuro?"
    
  - step: 3
    trigger: "urgency_provided"
    action: "ask_expectations"
    prompt: "Qual é sua expectativa com este procedimento? O que você espera alcançar?"
    
  - step: 4
    trigger: "expectations_provided"
    action: "ask_budget"
    prompt: "Qual é seu orçamento aproximado para este procedimento?"
    
  - step: 5
    trigger: "budget_provided"
    action: "make_recommendation"
    prompt: "Perfeito! Com base no que você me contou, recomendo que você agende uma consulta com nossos especialistas. Eles poderão avaliar sua situação e propor o melhor tratamento. Deseja agendar agora?"

example_conversation: |
  LARA: Olá! Bem-vindo(a) à Clínica de Estética Premium. Qual procedimento estético você tem interesse?
  
  LEAD: Olá! Gostaria de fazer depilação a laser.
  
  LARA: Ótimo! Depilação a laser é um dos nossos procedimentos mais populares. Você gostaria de fazer em breve ou é algo para o futuro?
  
  LEAD: Gostaria de fazer logo, estou cansado(a) de me depilar.
  
  LARA: Entendo perfeitamente! Qual é sua expectativa com a depilação a laser? Você quer eliminar completamente os pelos ou apenas reduzir?
  
  LEAD: Quero eliminar completamente, se possível.
  
  LARA: Excelente! Isso é totalmente possível com nossos equipamentos de última geração. Qual é seu orçamento aproximado para este procedimento?
  
  LEAD: Tenho um orçamento de R$ 2.000 a R$ 3.000.
  
  LARA: Perfeito! Com este orçamento você consegue fazer um pacote completo de sessões. Recomendo que você agende uma consulta com nossos especialistas para avaliar sua pele e criar um plano de tratamento personalizado. Você gostaria de agendar agora?
  
  LEAD: Sim, gostaria!
  
  LARA: Ótimo! Vou conectá-lo(a) com nossa equipe de agendamento. Qual é a melhor data e horário para você?
  
  {
    "interest_level": "high",
    "urgency": "now",
    "budget": "premium",
    "procedure_type": "depilation",
    "recommendation": "schedule",
    "score": 85
  }
```

### 3.2 Prompt: Agendamento

```yaml
id: lara-scheduling-prompt-v1
name: "LARA - Agendamento de Consulta"
description: "Prompt para LARA agendar consultas de forma natural"
model: "gpt-4-turbo"
temperature: 0.7
max_tokens: 300

system_prompt: |
  Você é LARA, assistente de agendamento para clínicas de estética.
  
  Seu objetivo é:
  1. Confirmar os dados do lead (nome, telefone, email)
  2. Apresentar opções de datas e horários disponíveis
  3. Confirmar a escolha do lead
  4. Enviar confirmação com todos os detalhes
  
  Mantenha um tom profissional, amigável e eficiente.
  Seja claro sobre os horários disponíveis.
  Confirme todos os detalhes antes de finalizar.

conversation_flow:
  - step: 1
    trigger: "scheduling_started"
    action: "confirm_contact_info"
    prompt: "Perfeito! Para agendar sua consulta, preciso confirmar seus dados. Qual é seu nome completo?"
    
  - step: 2
    trigger: "name_provided"
    action: "ask_phone"
    prompt: "Obrigado, {{name}}! Qual é seu telefone para contato?"
    
  - step: 3
    trigger: "phone_provided"
    action: "ask_email"
    prompt: "Ótimo! E qual é seu email?"
    
  - step: 4
    trigger: "email_provided"
    action: "show_available_slots"
    prompt: "Perfeito! Aqui estão os horários disponíveis para os próximos 7 dias:\n\n📅 {{slots}}\n\nQual você prefere?"
    
  - step: 5
    trigger: "slot_selected"
    action: "confirm_appointment"
    prompt: "Excelente! Sua consulta foi agendada para {{date}} às {{time}}. Você receberá um lembrete por WhatsApp 24h antes. Alguma dúvida?"
    
  - step: 6
    trigger: "confirmation_complete"
    action: "send_confirmation"
    prompt: "Obrigado por escolher nossa clínica! Estamos ansiosos para recebê-lo(a). Até breve! 😊"

example_conversation: |
  LARA: Perfeito! Para agendar sua consulta, preciso confirmar seus dados. Qual é seu nome completo?
  
  LEAD: Meu nome é Maria Silva.
  
  LARA: Obrigado, Maria! Qual é seu telefone para contato?
  
  LEAD: É (11) 99999-9999.
  
  LARA: Ótimo! E qual é seu email?
  
  LEAD: maria.silva@email.com
  
  LARA: Perfeito! Aqui estão os horários disponíveis para os próximos 7 dias:
  
  📅 Segunda-feira, 25/11 - 10:00, 14:00, 16:00
  📅 Terça-feira, 26/11 - 09:00, 13:00, 15:00
  📅 Quarta-feira, 27/11 - 10:00, 14:00, 17:00
  
  Qual você prefere?
  
  LEAD: Gostaria de segunda-feira às 14:00.
  
  LARA: Excelente! Sua consulta foi agendada para segunda-feira, 25 de novembro às 14:00. Você receberá um lembrete por WhatsApp 24h antes. Alguma dúvida?
  
  LEAD: Não, está tudo certo. Obrigada!
  
  LARA: Obrigado por escolher nossa clínica! Estamos ansiosos para recebê-lo(a). Até breve! 😊
```

---

## 4. INTEGRAÇÃO WHATSAPP META API

### 4.1 WhatsApp Service

```typescript
// backend/src/modules/whatsapp/whatsapp.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

interface WhatsAppMessage {
  to: string;
  type: 'text' | 'template' | 'interactive';
  text?: { body: string };
  template?: {
    name: string;
    language: { code: string };
    components?: any[];
  };
  interactive?: any;
}

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private readonly client: AxiosInstance;
  private readonly phoneNumberId: string;
  private readonly accessToken: string;

  constructor(private readonly configService: ConfigService) {
    this.phoneNumberId = configService.get('WHATSAPP_PHONE_NUMBER_ID');
    this.accessToken = configService.get('WHATSAPP_ACCESS_TOKEN');

    this.client = axios.create({
      baseURL: `https://graph.instagram.com/v18.0/${this.phoneNumberId}/messages`,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async sendTextMessage(to: string, text: string): Promise<string> {
    try {
      this.logger.debug(`Sending text message to ${to}`);

      const response = await this.client.post('', {
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: text },
      });

      const messageId = response.data.messages[0].id;
      this.logger.log(`Message sent successfully: ${messageId}`);

      return messageId;
    } catch (error) {
      this.logger.error(`Failed to send message to ${to}:`, error);
      throw error;
    }
  }

  async sendTemplateMessage(
    to: string,
    templateName: string,
    variables: Record<string, string>,
  ): Promise<string> {
    try {
      this.logger.debug(`Sending template message to ${to}: ${templateName}`);

      const components = [
        {
          type: 'body',
          parameters: Object.values(variables).map((value) => ({
            type: 'text',
            text: value,
          })),
        },
      ];

      const response = await this.client.post('', {
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: {
          name: templateName,
          language: { code: 'pt_BR' },
          components,
        },
      });

      const messageId = response.data.messages[0].id;
      this.logger.log(`Template message sent: ${messageId}`);

      return messageId;
    } catch (error) {
      this.logger.error(`Failed to send template message:`, error);
      throw error;
    }
  }

  async sendInteractiveMessage(
    to: string,
    headerText: string,
    bodyText: string,
    buttons: Array<{ id: string; title: string }>,
  ): Promise<string> {
    try {
      this.logger.debug(`Sending interactive message to ${to}`);

      const response = await this.client.post('', {
        messaging_product: 'whatsapp',
        to,
        type: 'interactive',
        interactive: {
          type: 'button',
          header: { type: 'text', text: headerText },
          body: { text: bodyText },
          action: {
            buttons: buttons.map((btn) => ({
              type: 'reply',
              reply: { id: btn.id, title: btn.title },
            })),
          },
        },
      });

      const messageId = response.data.messages[0].id;
      this.logger.log(`Interactive message sent: ${messageId}`);

      return messageId;
    } catch (error) {
      this.logger.error(`Failed to send interactive message:`, error);
      throw error;
    }
  }

  async markAsRead(messageId: string): Promise<void> {
    try {
      await this.client.post('', {
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId,
      });

      this.logger.debug(`Message marked as read: ${messageId}`);
    } catch (error) {
      this.logger.error(`Failed to mark message as read:`, error);
      throw error;
    }
  }
}
```

### 4.2 WhatsApp Webhook Handler

```typescript
// backend/src/modules/webhooks/handlers/whatsapp-webhook.handler.ts
import { Injectable, Logger } from '@nestjs/common';
import { LeadsService } from '../../leads/leads.service';
import { MensagensService } from '../../mensagens/mensagens.service';
import { WhatsAppService } from '../../whatsapp/whatsapp.service';

@Injectable()
export class WhatsAppWebhookHandler {
  private readonly logger = new Logger(WhatsAppWebhookHandler.name);

  constructor(
    private readonly leadsService: LeadsService,
    private readonly mensagensService: MensagensService,
    private readonly whatsappService: WhatsAppService,
  ) {}

  async handleIncomingMessage(payload: any): Promise<void> {
    try {
      const message = payload.entry[0].changes[0].value.messages[0];
      const contact = payload.entry[0].changes[0].value.contacts[0];

      this.logger.debug(`Incoming message from ${contact.wa_id}:`, message.text?.body);

      // Verificar se lead já existe
      let lead = await this.leadsService.findByPhone(contact.wa_id);

      if (!lead) {
        // Criar novo lead
        lead = await this.leadsService.create(process.env.DEFAULT_CLINIC, {
          nome: contact.profile.name,
          telefone: contact.wa_id,
          origem: 'whatsapp',
        });

        // Enviar mensagem de boas-vindas
        await this.whatsappService.sendTemplateMessage(
          contact.wa_id,
          'welcome_message',
          { nome: contact.profile.name, clinicName: 'Clínica Premium' },
        );
      }

      // Registrar mensagem
      await this.mensagensService.create({
        clinicId: lead.clinicId,
        leadId: lead.id,
        canal: 'whatsapp',
        conteudo: message.text?.body,
        status: 'recebida',
        externalId: message.id,
      });

      // Enviar resposta automática (se configurado)
      await this.sendAutoResponse(lead, message.text?.body);
    } catch (error) {
      this.logger.error('Error handling incoming message:', error);
      throw error;
    }
  }

  async handleMessageStatus(payload: any): Promise<void> {
    try {
      const status = payload.entry[0].changes[0].value.statuses[0];

      this.logger.debug(`Message status update: ${status.id} - ${status.status}`);

      // Atualizar status da mensagem no banco
      await this.mensagensService.updateByExternalId(status.id, {
        status: status.status,
        dataEntrega: status.timestamp ? new Date(status.timestamp * 1000) : null,
      });
    } catch (error) {
      this.logger.error('Error handling message status:', error);
      throw error;
    }
  }

  private async sendAutoResponse(lead: any, userMessage: string): Promise<void> {
    // Implementar lógica de resposta automática
    // Pode usar LARA para gerar respostas inteligentes
    const response = `Obrigado pela sua mensagem! Estamos processando sua solicitação. Um de nossos especialistas entrará em contato em breve.`;

    await this.whatsappService.sendTextMessage(lead.telefone, response);
  }
}
```

---

## 5. FLUXO DE INTEGRAÇÃO COMPLETO

```
┌─────────────────────────────────────────────────────────────┐
│                    NOVO LEAD (Origem: WhatsApp)             │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│            IARA - Fluxo de Qualificação (Step 1-8)          │
│  - Validar dados                                            │
│  - Calcular score                                           │
│  - Gerar tags                                               │
│  - Enviar boas-vindas                                       │
│  - Agendar follow-up                                        │
│  - Registrar no BD                                          │
│  - Notificar clínica                                        │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│         LARA - Conversa de Qualificação (24h)               │
│  - Entender interesse específico                            │
│  - Qualificar por urgência e orçamento                      │
│  - Sugerir próximo passo                                    │
│  - Atualizar score e tags                                   │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│         IARA - Fluxo de Agendamento                         │
│  - Verificar disponibilidade                                │
│  - Enviar opções de slots                                   │
│  - Aguardar seleção do lead                                 │
│  - Confirmar agendamento                                    │
│  - Agendar lembretes (24h, 1h antes)                        │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              AGENDAMENTO CONFIRMADO ✅                      │
│  - Lead convertido para "agendado"                          │
│  - Clínica notificada                                       │
│  - Lembretes automáticos agendados                          │
└─────────────────────────────────────────────────────────────┘
```

---

## PRÓXIMOS PASSOS

1. ✅ **AUDITORIA GLOBAL 360°** (concluída)
2. ✅ **REESTRUTURAÇÃO ARQUITETURAL** (concluída)
3. ✅ **SCAFFOLD & SCRIPTS** (concluída)
4. ✅ **IARA & LARA** (concluída)
5. ⏳ **DOCUMENTAÇÃO E ROADMAP** - Tudo documentado

---

**Fim de IARA & LARA - Fluxos Executáveis**  
**Próximo: DOCUMENTAÇÃO E ROADMAP - 120 dias**
