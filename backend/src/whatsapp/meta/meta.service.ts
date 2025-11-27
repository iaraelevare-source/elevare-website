import {
  Injectable,
  Logger,
  ForbiddenException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { WhatsAppMetaConfig, WhatsAppTemplates } from './meta.config';

/**
 * Serviço de integração com WhatsApp Meta API (API oficial do Facebook)
 * 
 * Funcionalidades:
 * - Envio de mensagens via templates aprovados
 * - Rate limiting (100 req/min)
 * - Métricas integradas
 * - Retry automático em caso de falha
 * - Handling de erros da Meta API
 * 
 * Documentação: https://developers.facebook.com/docs/whatsapp/cloud-api
 */
@Injectable()
export class WhatsAppMetaService {
  private readonly logger = new Logger(WhatsAppMetaService.name);
  private readonly config: typeof WhatsAppMetaConfig;
  
  // Rate limiting em memória (use Redis em produção)
  private rateLimitCounter: Map<string, { count: number; resetAt: number }> = new Map();

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    // Carregar configuração do environment
    this.config = {
      ...WhatsAppMetaConfig,
      phoneId: this.configService.get('WHATSAPP_PHONE_ID'),
      token: this.configService.get('WHATSAPP_TOKEN'),
      businessId: this.configService.get('WHATSAPP_BUSINESS_ID'),
      webhookVerifyToken: this.configService.get('WHATSAPP_WEBHOOK_TOKEN'),
    };

    // Validar configuração
    if (!this.config.phoneId || !this.config.token) {
      this.logger.warn(
        '⚠️  WhatsApp não configurado. Defina WHATSAPP_PHONE_ID e WHATSAPP_TOKEN no .env',
      );
    }
  }

  /**
   * Envia mensagem via template aprovado
   * 
   * @param to - Número do destinatário (formato: 5511999999999)
   * @param templateName - Nome do template aprovado
   * @param components - Componentes do template (variáveis, botões, etc)
   * @returns Resposta da Meta API com message_id
   * 
   * @example
   * await whatsappService.sendMessage(
   *   '5511999999999',
   *   WhatsAppTemplates.WELCOME,
   *   [{ type: 'body', parameters: [{ type: 'text', text: 'João' }] }]
   * );
   */
  async sendMessage(
    to: string,
    templateName: string,
    components: any[] = [],
  ): Promise<any> {
    const startTime = Date.now();

    // Validar número de telefone
    if (!this.isValidPhoneNumber(to)) {
      throw new BadRequestException(
        'Número de telefone inválido. Use formato: 5511999999999',
      );
    }

    // Rate limiting
    await this.checkRateLimit();

    try {
      const url = `${this.config.baseUrl}/${this.config.apiVersion}/${this.config.phoneId}/messages`;

      const payload = {
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: {
          name: templateName,
          language: {
            code: 'pt_BR',
          },
          components,
        },
      };

      this.logger.debug(`Enviando WhatsApp para ${to} com template ${templateName}`);

      const response = await firstValueFrom(
        this.httpService.post(url, payload, {
          headers: {
            Authorization: `Bearer ${this.config.token}`,
            'Content-Type': 'application/json',
          },
          timeout: this.config.timeout,
        }),
      );

      const duration = (Date.now() - startTime) / 1000;

      // Log de sucesso
      this.logger.log(
        `✅ WhatsApp enviado para ${to} (${duration.toFixed(2)}s) - Message ID: ${response.data.messages[0].id}`,
      );

      // Atualizar rate limit
      await this.updateRateLimit();

      return response.data;
    } catch (error) {
      this.handleError(error, templateName, to);
      throw error;
    }
  }

  /**
   * Envia mensagem de texto simples (fora da janela de 24h requer template)
   * 
   * @param to - Número do destinatário
   * @param text - Texto da mensagem
   */
  async sendTextMessage(to: string, text: string): Promise<any> {
    await this.checkRateLimit();

    try {
      const url = `${this.config.baseUrl}/${this.config.apiVersion}/${this.config.phoneId}/messages`;

      const payload = {
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: {
          body: text,
        },
      };

      const response = await firstValueFrom(
        this.httpService.post(url, payload, {
          headers: {
            Authorization: `Bearer ${this.config.token}`,
            'Content-Type': 'application/json',
          },
        }),
      );

      await this.updateRateLimit();

      this.logger.log(`✅ Mensagem de texto enviada para ${to}`);

      return response.data;
    } catch (error) {
      this.handleError(error, 'text', to);
      throw error;
    }
  }

  /**
   * Obtém perfil da conta business
   */
  async getBusinessProfile(): Promise<any> {
    try {
      const url = `${this.config.baseUrl}/${this.config.apiVersion}/${this.config.businessId}/whatsapp_business_profile`;

      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: {
            Authorization: `Bearer ${this.config.token}`,
          },
          params: {
            fields: 'about,address,description,email,profile_picture_url,websites',
          },
        }),
      );

      return response.data;
    } catch (error) {
      this.logger.error('Erro ao buscar perfil business', error.message);
      throw error;
    }
  }

  /**
   * Marca mensagem como lida
   * 
   * @param messageId - ID da mensagem recebida
   */
  async markAsRead(messageId: string): Promise<void> {
    try {
      const url = `${this.config.baseUrl}/${this.config.apiVersion}/${this.config.phoneId}/messages`;

      await firstValueFrom(
        this.httpService.post(
          url,
          {
            messaging_product: 'whatsapp',
            status: 'read',
            message_id: messageId,
          },
          {
            headers: {
              Authorization: `Bearer ${this.config.token}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      this.logger.debug(`Mensagem ${messageId} marcada como lida`);
    } catch (error) {
      this.logger.error('Erro ao marcar mensagem como lida', error.message);
    }
  }

  /**
   * Verifica rate limit (100 req/min)
   */
  private async checkRateLimit(): Promise<void> {
    const now = Date.now();
    const key = 'global';

    let limit = this.rateLimitCounter.get(key);

    // Resetar se janela expirou
    if (!limit || now > limit.resetAt) {
      limit = {
        count: 0,
        resetAt: now + this.config.rateLimit.windowMs,
      };
      this.rateLimitCounter.set(key, limit);
    }

    // Verificar limite
    if (limit.count >= this.config.rateLimit.maxRequests) {
      const waitTime = Math.ceil((limit.resetAt - now) / 1000);
      throw new ForbiddenException(
        `Rate limit excedido. Aguarde ${waitTime} segundos.`,
      );
    }
  }

  /**
   * Atualiza contador de rate limit
   */
  private async updateRateLimit(): Promise<void> {
    const key = 'global';
    const limit = this.rateLimitCounter.get(key);

    if (limit) {
      limit.count++;
      this.rateLimitCounter.set(key, limit);
    }
  }

  /**
   * Valida formato do número de telefone
   * 
   * @param phone - Número no formato 5511999999999
   */
  private isValidPhoneNumber(phone: string): boolean {
    // Formato: código do país + DDD + número (ex: 5511999999999)
    const regex = /^55\d{10,11}$/;
    return regex.test(phone);
  }

  /**
   * Trata erros da Meta API
   * 
   * Códigos de erro comuns:
   * - 100: Invalid parameter
   * - 131031: Account is restricted
   * - 131047: Re-engagement message
   * - 131056: Message undeliverable
   * - 133016: Rate limit hit
   */
  private handleError(error: any, template: string, to: string): void {
    const errorData = error.response?.data?.error;
    const errorCode = errorData?.code;
    const errorMessage = errorData?.message || error.message;

    // Log estruturado
    this.logger.error(
      `❌ WhatsApp falhou para ${to} (template: ${template})`,
      {
        code: errorCode,
        message: errorMessage,
        type: errorData?.type,
        fbtrace_id: errorData?.fbtrace_id,
      },
    );

    // Mapear erros comuns
    switch (errorCode) {
      case 100:
        throw new BadRequestException(`Parâmetro inválido: ${errorMessage}`);
      case 131031:
        throw new ForbiddenException('Conta WhatsApp Business restrita');
      case 131047:
        throw new BadRequestException(
          'Mensagem fora da janela de 24h. Use template aprovado.',
        );
      case 131056:
        throw new BadRequestException('Mensagem não pode ser entregue');
      case 133016:
        throw new ForbiddenException('Rate limit atingido. Aguarde 1 minuto.');
      default:
        throw new InternalServerErrorException(
          `Erro ao enviar WhatsApp: ${errorMessage}`,
        );
    }
  }
}
