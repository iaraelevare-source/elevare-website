import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Headers,
  Logger,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiExcludeEndpoint } from '@nestjs/swagger';
import { WhatsAppMetaService } from './meta.service';
import { IaraCoreService } from '../../iara/core/iara-core.service';

/**
 * Controller de Webhook do WhatsApp Meta API
 * 
 * Recebe notificações do Facebook quando:
 * - Mensagem é recebida
 * - Mensagem é entregue
 * - Mensagem é lida
 * - Status muda
 * 
 * Configuração no Facebook:
 * 1. Acesse: https://developers.facebook.com/apps
 * 2. Selecione seu app > WhatsApp > Configuration
 * 3. Configure Webhook URL: https://seu-dominio.com/webhooks/whatsapp
 * 4. Configure Verify Token: mesmo valor de WHATSAPP_WEBHOOK_TOKEN
 * 5. Inscreva-se em: messages, message_status
 * 
 * Documentação: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks
 */
@ApiTags('WhatsApp Webhook')
@Controller('webhooks/whatsapp')
export class WhatsAppWebhookController {
  private readonly logger = new Logger(WhatsAppWebhookController.name);

  constructor(
    private readonly whatsappService: WhatsAppMetaService,
    private readonly iaraService: IaraCoreService,
  ) {}

  /**
   * Verificação do webhook (GET)
   * 
   * Facebook envia uma requisição GET para verificar se o webhook é válido.
   * Você deve retornar o parâmetro 'hub.challenge' se o token for válido.
   * 
   * @param mode - Deve ser 'subscribe'
   * @param token - Deve corresponder ao WHATSAPP_WEBHOOK_TOKEN
   * @param challenge - String aleatória que deve ser retornada
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verificação do webhook (Facebook)',
    description: 'Endpoint usado pelo Facebook para verificar o webhook',
  })
  @ApiResponse({
    status: 200,
    description: 'Webhook verificado com sucesso',
    schema: {
      type: 'string',
      example: '1234567890',
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Token inválido',
  })
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
  ): string {
    this.logger.log('🔍 Verificação de webhook recebida');

    // Verificar se é uma requisição de subscrição
    if (mode !== 'subscribe') {
      this.logger.error('Modo inválido:', mode);
      throw new BadRequestException('Modo inválido');
    }

    // Verificar token
    const expectedToken = process.env.WHATSAPP_WEBHOOK_TOKEN;
    if (token !== expectedToken) {
      this.logger.error('Token inválido');
      throw new BadRequestException('Token inválido');
    }

    this.logger.log('✅ Webhook verificado com sucesso');

    // Retornar challenge para confirmar
    return challenge;
  }

  /**
   * Recebe notificações do WhatsApp (POST)
   * 
   * Facebook envia notificações quando eventos ocorrem:
   * - Mensagem recebida
   * - Status de mensagem atualizado (enviado, entregue, lido)
   * 
   * @param body - Payload do webhook
   * @param signature - Assinatura para validar autenticidade (opcional)
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint() // Não expor no Swagger (endpoint interno)
  async handleWebhook(
    @Body() body: any,
    @Headers('x-hub-signature-256') signature?: string,
  ): Promise<{ status: string }> {
    try {
      this.logger.debug('📩 Webhook recebido:', JSON.stringify(body, null, 2));

      // Validar estrutura do payload
      if (!body.object || body.object !== 'whatsapp_business_account') {
        this.logger.warn('Payload inválido:', body);
        return { status: 'ignored' };
      }

      // Processar cada entry
      for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
          const value = change.value;

          // Processar mensagens recebidas
          if (value.messages) {
            for (const message of value.messages) {
              await this.processIncomingMessage(message, value.metadata);
            }
          }

          // Processar status de mensagens
          if (value.statuses) {
            for (const status of value.statuses) {
              await this.processMessageStatus(status);
            }
          }
        }
      }

      return { status: 'ok' };
    } catch (error) {
      this.logger.error('Erro ao processar webhook:', error.message);
      
      // Retornar 200 mesmo com erro para evitar reenvios do Facebook
      return { status: 'error' };
    }
  }

  /**
   * Processa mensagem recebida
   * 
   * @param message - Dados da mensagem
   * @param metadata - Metadados (phone_number_id, display_phone_number)
   */
  private async processIncomingMessage(message: any, metadata: any): Promise<void> {
    const { from, id, type, timestamp } = message;

    this.logger.log(`📨 Mensagem recebida de ${from} (tipo: ${type})`);

    // Marcar como lida
    await this.whatsappService.markAsRead(id);

    // Extrair conteúdo baseado no tipo
    let content: string;

    switch (type) {
      case 'text':
        content = message.text?.body || '';
        break;
      case 'image':
        content = `[Imagem: ${message.image?.caption || 'sem legenda'}]`;
        break;
      case 'audio':
        content = '[Áudio]';
        break;
      case 'video':
        content = `[Vídeo: ${message.video?.caption || 'sem legenda'}]`;
        break;
      case 'document':
        content = `[Documento: ${message.document?.filename || 'sem nome'}]`;
        break;
      case 'location':
        content = `[Localização: ${message.location?.latitude}, ${message.location?.longitude}]`;
        break;
      case 'contacts':
        content = '[Contato]';
        break;
      case 'button':
        content = `[Botão: ${message.button?.text}]`;
        break;
      case 'interactive':
        content = `[Interativo: ${message.interactive?.type}]`;
        break;
      default:
        content = `[Tipo desconhecido: ${type}]`;
    }

    this.logger.log(`💬 Conteúdo: ${content}`);

    // Processar apenas mensagens de texto com IARA
    if (type === 'text' && content.trim()) {
      try {
        // Processar com IARA (IA conversacional)
        const response = await this.iaraService.processMessage(
          from, // Usar telefone como leadId temporário
          content,
          { phone: from }, // Contexto básico
        );

        // Enviar resposta via WhatsApp
        await this.whatsappService.sendTextMessage(from, response);

        this.logger.log(`✅ IARA respondeu para ${from}`);
      } catch (error) {
        this.logger.error(`❌ Erro ao processar com IARA: ${error.message}`);
        
        // Enviar mensagem de fallback
        await this.whatsappService.sendTextMessage(
          from,
          'Desculpe, ocorreu um erro. Um atendente entrará em contato em breve. 😊',
        );
      }
    } else {
      this.logger.log(`ℹ️  Tipo ${type} não suportado pela IARA, ignorando...`);
    }
  }

  /**
   * Processa status de mensagem
   * 
   * Status possíveis:
   * - sent: Mensagem enviada
   * - delivered: Mensagem entregue
   * - read: Mensagem lida
   * - failed: Mensagem falhou
   * 
   * @param status - Dados do status
   */
  private async processMessageStatus(status: any): Promise<void> {
    const { id, status: messageStatus, timestamp, recipient_id } = status;

    this.logger.log(
      `📊 Status atualizado: ${id} → ${messageStatus} (para: ${recipient_id})`,
    );

    // TODO: Atualizar status no banco de dados
    // await this.messageRepository.update(
    //   { externalId: id },
    //   { status: messageStatus, updatedAt: new Date(parseInt(timestamp) * 1000) },
    // );
  }
}
