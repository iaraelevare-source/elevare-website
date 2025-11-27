import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { WhatsAppMetaService } from './meta/meta.service';
import { WhatsAppWebhookController } from './meta/webhook.controller';

/**
 * Módulo de integração com WhatsApp Meta API
 * 
 * Funcionalidades:
 * - Envio de mensagens via templates
 * - Recebimento de mensagens via webhook
 * - Rate limiting automático
 * - Handling de erros
 * 
 * Pré-requisitos:
 * 1. Criar conta Meta Business
 * 2. Configurar app no Facebook Developers
 * 3. Adicionar produto WhatsApp
 * 4. Configurar variáveis de ambiente (.env.whatsapp)
 * 5. Configurar webhook no Facebook
 * 
 * Uso:
 * ```typescript
 * constructor(private whatsappService: WhatsAppMetaService) {}
 * 
 * await this.whatsappService.sendMessage(
 *   '5511999999999',
 *   WhatsAppTemplates.WELCOME,
 *   [{ type: 'body', parameters: [{ type: 'text', text: 'João' }] }]
 * );
 * ```
 */
@Module({
  imports: [
    // HttpModule para fazer requisições à Meta API
    HttpModule.register({
      timeout: 10000, // 10 segundos
      maxRedirects: 5,
    }),
    
    // ConfigModule para acessar variáveis de ambiente
    ConfigModule,
  ],
  
  controllers: [
    WhatsAppWebhookController, // Webhook para receber mensagens
  ],
  
  providers: [
    WhatsAppMetaService, // Serviço principal
  ],
  
  exports: [
    WhatsAppMetaService, // Exportar para uso em outros módulos
  ],
})
export class WhatsAppModule {}
