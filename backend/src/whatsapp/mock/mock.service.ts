import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

/**
 * WhatsApp Mock Service - Alternativa gratuita à Meta API
 * 
 * **Por que usar Mock?**
 * - Meta API custa ~R$ 100/mês + taxas por mensagem
 * - Para MVP, isso é inviável antes de validar o negócio
 * - Mock usa mesma interface, facilitando migração futura
 * 
 * **Como funciona?**
 * - Usa Evolution API (ou WhatsApp Web.js) gratuitamente
 * - Mantém mesma interface do WhatsAppMetaService
 * - Quando tiver tráfego, muda 1 linha no module
 * 
 * **Migração para Meta:**
 * ```typescript
 * // whatsapp.module.ts
 * - providers: [WhatsAppMockService]
 * + providers: [WhatsAppMetaService]
 * ```
 * 
 * **APIs não oficiais compatíveis:**
 * - Evolution API (recomendado) - Docker, webhook completo
 * - WhatsApp Web.js - Node.js direto
 * - WPPConnect - Mais simples
 * - Baileys - Mais leve
 */
@Injectable()
export class WhatsAppMockService {
  private readonly logger = new Logger(WhatsAppMockService.name);
  private readonly mockUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.mockUrl =
      this.configService.get('WHATSAPP_MOCK_URL') || 'http://localhost:3002';

    this.logger.warn(
      '⚠️  Usando WhatsApp MOCK (grátis). Para produção, mude para WhatsAppMetaService',
    );
  }

  /**
   * Envia mensagem via API não oficial
   * 
   * Mantém mesma assinatura do WhatsAppMetaService para facilitar migração
   * 
   * @param to - Número do destinatário (formato: 5511999999999)
   * @param templateName - Nome do template (será renderizado localmente)
   * @param components - Componentes do template (variáveis)
   */
  async sendMessage(
    to: string,
    templateName: string,
    components: any[] = [],
  ): Promise<any> {
    const startTime = Date.now();

    try {
      // Renderizar template localmente (Meta renderiza no servidor deles)
      const message = this.renderTemplate(templateName, components);

      this.logger.debug(
        `Enviando WhatsApp (MOCK) para ${to}: ${message.substring(0, 50)}...`,
      );

      // Enviar para Evolution API (ou outra API não oficial)
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.mockUrl}/message/sendText`,
          {
            number: to,
            text: message,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              apikey: this.configService.get('WHATSAPP_MOCK_API_KEY') || 'mock',
            },
            timeout: 10000,
          },
        ),
      );

      const duration = (Date.now() - startTime) / 1000;

      this.logger.log(
        `✅ WhatsApp (MOCK) enviado para ${to} (${duration.toFixed(2)}s)`,
      );

      // Retornar formato similar à Meta API
      return {
        messaging_product: 'whatsapp',
        contacts: [{ input: to, wa_id: to }],
        messages: [{ id: response.data.key?.id || 'mock_' + Date.now() }],
      };
    } catch (error) {
      this.logger.error(
        `❌ WhatsApp mock falhou para ${to}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Envia mensagem de texto simples
   * 
   * @param to - Número do destinatário
   * @param text - Texto da mensagem
   */
  async sendTextMessage(to: string, text: string): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.mockUrl}/message/sendText`,
          {
            number: to,
            text,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              apikey: this.configService.get('WHATSAPP_MOCK_API_KEY') || 'mock',
            },
          },
        ),
      );

      this.logger.log(`✅ Mensagem de texto (MOCK) enviada para ${to}`);

      return {
        messaging_product: 'whatsapp',
        contacts: [{ input: to, wa_id: to }],
        messages: [{ id: response.data.key?.id || 'mock_' + Date.now() }],
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao enviar texto mock: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtém perfil da conta business (mock)
   */
  async getBusinessProfile(): Promise<any> {
    // Retorna dados mockados para desenvolvimento
    return {
      data: [
        {
          about: 'Elevare - Clínica de Estética',
          address: 'Rua Exemplo, 123 - São Paulo, SP',
          description: 'Sua beleza, nossa prioridade',
          email: 'contato@elevare.com.br',
          profile_picture_url: 'https://elevare.com.br/logo.png',
          websites: ['https://elevare.com.br'],
        },
      ],
    };
  }

  /**
   * Marca mensagem como lida (mock)
   * 
   * @param messageId - ID da mensagem
   */
  async markAsRead(messageId: string): Promise<void> {
    this.logger.debug(`Mensagem ${messageId} marcada como lida (MOCK)`);
    // Evolution API não precisa marcar como lida (automático)
  }

  /**
   * Renderiza template localmente
   * 
   * Meta API renderiza templates no servidor deles.
   * No mock, renderizamos localmente para economizar.
   * 
   * @param templateName - Nome do template
   * @param components - Variáveis do template
   */
  private renderTemplate(templateName: string, components: any[]): string {
    // Templates pré-definidos (mesmos que seriam aprovados na Meta)
    const templates: Record<string, string> = {
      // Template de boas-vindas
      hello_world: 'Olá! 👋\n\nComo posso ajudar você hoje?',

      // Template de boas-vindas personalizado
      elevare_welcome: `Olá {{1}}! 👋

Bem-vindo(a) à *Elevare*!

Estou aqui para ajudar você a agendar seus procedimentos estéticos.

Como posso te ajudar hoje?`,

      // Template de confirmação de agendamento
      elevare_appointment_confirmation: `✅ *Agendamento Confirmado*

Olá {{1}}!

Seu agendamento foi confirmado:
📅 Data: {{2}}
🕐 Horário: {{3}}
📍 Local: {{4}}

Nos vemos em breve!`,

      // Template de lembrete
      elevare_appointment_reminder: `⏰ *Lembrete de Agendamento*

Olá {{1}}!

Lembramos que você tem um agendamento:
📅 Amanhã, {{2}}
🕐 Horário: {{3}}

Confirme sua presença respondendo SIM.`,

      // Template de follow-up
      elevare_followup: `Olá {{1}}! 😊

Como você está se sentindo após o procedimento?

Sua opinião é muito importante para nós!`,

      // Template de promoção
      elevare_promotion: `🎉 *Promoção Especial*

Olá {{1}}!

Aproveite nossa promoção:
{{2}}

Válido até {{3}}.

Agende já!`,
    };

    let message = templates[templateName] || `Mensagem do Elevare (template: ${templateName})`;

    // Substituir variáveis {{1}}, {{2}}, etc
    if (components && components.length > 0) {
      components.forEach((component, index) => {
        if (component.type === 'body' && component.parameters) {
          component.parameters.forEach((param: any, paramIndex: number) => {
            if (param.type === 'text') {
              message = message.replace(`{{${paramIndex + 1}}}`, param.text);
            }
          });
        }
      });
    }

    return message;
  }
}
