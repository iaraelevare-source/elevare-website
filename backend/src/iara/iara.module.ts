import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { IaraCoreService } from './core/iara-core.service';

/**
 * Módulo IARA - Inteligência Artificial Conversacional
 * 
 * Funcionalidades:
 * - Conversa natural com leads via WhatsApp
 * - Qualificação automática de leads
 * - Agendamento inteligente
 * - Resposta a dúvidas frequentes
 * - Escalação para humano quando necessário
 * 
 * Dependências:
 * - OpenAI GPT-4 (requer OPENAI_API_KEY)
 * - ConfigModule (variáveis de ambiente)
 * 
 * Uso:
 * ```typescript
 * constructor(private iaraService: IaraCoreService) {}
 * 
 * const response = await this.iaraService.processMessage(
 *   leadId,
 *   'Quero agendar consulta',
 *   { name: 'Maria', score: 85 }
 * );
 * ```
 */
@Module({
  imports: [
    ConfigModule, // Para acessar OPENAI_API_KEY
  ],
  
  providers: [
    IaraCoreService, // Serviço principal
  ],
  
  exports: [
    IaraCoreService, // Exportar para uso em outros módulos
  ],
})
export class IaraModule {}
