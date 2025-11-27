import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { IaraConfig } from './iara.config';

/**
 * IARA Core Service - Inteligência Artificial Conversacional
 * 
 * Responsabilidades:
 * - Processar mensagens de leads via WhatsApp
 * - Qualificar leads automaticamente
 * - Agendar consultas
 * - Responder dúvidas frequentes
 * - Escalar para humano quando necessário
 * 
 * Tecnologias:
 * - OpenAI GPT-4 para conversação
 * - Memória de conversa em memória (pode migrar para Redis)
 * - Detecção de intenção via palavras-chave
 * 
 * Custo estimado:
 * - GPT-4: ~$0.03 por conversa (10 mensagens)
 * - GPT-3.5: ~$0.003 por conversa (10 mensagens)
 */
@Injectable()
export class IaraCoreService {
  private readonly logger = new Logger(IaraCoreService.name);
  private readonly openai: OpenAI;
  
  // Memória de conversas (em produção, use Redis)
  private conversations: Map<string, Array<{ role: string; content: string }>> = new Map();

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get('OPENAI_API_KEY');
    
    if (!apiKey) {
      this.logger.warn('⚠️  OPENAI_API_KEY não configurada. IARA não funcionará.');
    }

    this.openai = new OpenAI({
      apiKey: apiKey || 'sk-mock',
    });

    this.logger.log('✅ IARA Core Service inicializado');
  }

  /**
   * Processa mensagem do lead e retorna resposta da IARA
   * 
   * @param leadId - ID do lead
   * @param message - Mensagem enviada pelo lead
   * @param leadContext - Contexto adicional do lead (nome, score, etc)
   */
  async processMessage(
    leadId: string,
    message: string,
    leadContext?: any,
  ): Promise<string> {
    const startTime = Date.now();

    try {
      this.logger.log(`📨 Processando mensagem do lead ${leadId}: "${message.substring(0, 50)}..."`);

      // 1. Detectar intenção
      const intent = this.detectIntent(message);
      this.logger.debug(`🎯 Intenção detectada: ${intent}`);

      // 2. Obter histórico da conversa
      const history = this.getConversationHistory(leadId);

      // 3. Construir prompt com contexto
      const systemMessage = this.buildSystemMessage(leadContext);

      // 4. Chamar GPT-4
      const response = await this.callGPT4(systemMessage, history, message);

      // 5. Salvar na memória
      this.addToConversationHistory(leadId, 'user', message);
      this.addToConversationHistory(leadId, 'assistant', response);

      // 6. Verificar se deve agendar
      if (this.shouldSchedule(response)) {
        this.logger.log(`📅 Agendamento detectado para lead ${leadId}`);
        // TODO: Integrar com Google Calendar
      }

      const duration = Date.now() - startTime;
      this.logger.log(`✅ Resposta gerada em ${duration}ms`);

      return response;
    } catch (error) {
      this.logger.error(`❌ Erro ao processar mensagem: ${error.message}`);
      
      // Resposta de fallback
      return 'Desculpe, ocorreu um erro. Um atendente entrará em contato em breve. 😊';
    }
  }

  /**
   * Detecta intenção da mensagem usando palavras-chave
   * 
   * @param message - Mensagem do usuário
   */
  private detectIntent(message: string): string {
    const lowerMessage = message.toLowerCase();

    // Verificar urgência (prioridade máxima)
    if (IaraConfig.intents.urgency.some(keyword => lowerMessage.includes(keyword))) {
      return 'urgency';
    }

    // Verificar agendamento
    if (IaraConfig.intents.scheduling.some(keyword => lowerMessage.includes(keyword))) {
      return 'scheduling';
    }

    // Verificar cancelamento
    if (IaraConfig.intents.cancel.some(keyword => lowerMessage.includes(keyword))) {
      return 'cancel';
    }

    // Verificar informação
    if (IaraConfig.intents.info.some(keyword => lowerMessage.includes(keyword))) {
      return 'info';
    }

    // Verificar saudação
    if (IaraConfig.intents.greeting.some(keyword => lowerMessage.includes(keyword))) {
      return 'greeting';
    }

    // Verificar confirmação
    if (IaraConfig.intents.confirm.some(keyword => lowerMessage.includes(keyword))) {
      return 'confirm';
    }

    // Verificar negação
    if (IaraConfig.intents.deny.some(keyword => lowerMessage.includes(keyword))) {
      return 'deny';
    }

    return 'general';
  }

  /**
   * Constrói mensagem do sistema com contexto do lead
   * 
   * @param leadContext - Contexto do lead
   */
  private buildSystemMessage(leadContext?: any): string {
    let systemMessage = IaraConfig.systemPrompt;

    // Adicionar contexto da clínica
    systemMessage += `\n\n**Informações da clínica:**\n`;
    systemMessage += `- Nome: ${IaraConfig.clinicContext.name}\n`;
    systemMessage += `- Especialidade: ${IaraConfig.clinicContext.specialty}\n`;
    systemMessage += `- Serviços: ${IaraConfig.clinicContext.services.join(', ')}\n`;
    systemMessage += `- Horário: ${IaraConfig.clinicContext.workingHours.weekdays}\n`;
    systemMessage += `- Endereço: ${IaraConfig.clinicContext.address}\n`;

    // Adicionar contexto do lead (se disponível)
    if (leadContext) {
      systemMessage += `\n\n**Informações do lead:**\n`;
      if (leadContext.name) systemMessage += `- Nome: ${leadContext.name}\n`;
      if (leadContext.phone) systemMessage += `- Telefone: ${leadContext.phone}\n`;
      if (leadContext.score) systemMessage += `- Score: ${leadContext.score}/100\n`;
      if (leadContext.origem) systemMessage += `- Origem: ${leadContext.origem}\n`;
    }

    return systemMessage;
  }

  /**
   * Chama GPT-4 para gerar resposta
   * 
   * @param systemMessage - Mensagem do sistema (personalidade)
   * @param history - Histórico da conversa
   * @param userMessage - Mensagem atual do usuário
   */
  private async callGPT4(
    systemMessage: string,
    history: Array<{ role: string; content: string }>,
    userMessage: string,
  ): Promise<string> {
    try {
      const messages: any[] = [
        { role: 'system', content: systemMessage },
        ...history,
        { role: 'user', content: userMessage },
      ];

      const response = await this.openai.chat.completions.create({
        model: IaraConfig.model,
        messages,
        temperature: IaraConfig.temperature,
        max_tokens: IaraConfig.maxTokens,
      });

      const assistantMessage = response.choices[0]?.message?.content || '';

      // Validar qualidade da resposta
      if (assistantMessage.length < IaraConfig.quality.minResponseLength) {
        this.logger.warn('Resposta muito curta, regenerando...');
        return 'Desculpe, não entendi. Pode reformular?';
      }

      if (assistantMessage.length > IaraConfig.quality.maxResponseLength) {
        this.logger.warn('Resposta muito longa, truncando...');
        return assistantMessage.substring(0, IaraConfig.quality.maxResponseLength) + '...';
      }

      return assistantMessage;
    } catch (error) {
      this.logger.error(`Erro ao chamar GPT-4: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtém histórico da conversa
   * 
   * @param leadId - ID do lead
   */
  private getConversationHistory(leadId: string): Array<{ role: string; content: string }> {
    return this.conversations.get(leadId) || [];
  }

  /**
   * Adiciona mensagem ao histórico
   * 
   * @param leadId - ID do lead
   * @param role - Papel (user ou assistant)
   * @param content - Conteúdo da mensagem
   */
  private addToConversationHistory(leadId: string, role: string, content: string): void {
    const history = this.getConversationHistory(leadId);
    
    // Limitar histórico a 20 mensagens (10 trocas)
    if (history.length >= 20) {
      history.shift();
      history.shift();
    }

    history.push({ role, content });
    this.conversations.set(leadId, history);
  }

  /**
   * Verifica se a resposta indica agendamento
   * 
   * @param response - Resposta da IARA
   */
  private shouldSchedule(response: string): boolean {
    const schedulingKeywords = ['✅', 'agendado', 'confirmado', 'marcado'];
    return schedulingKeywords.some(keyword => response.toLowerCase().includes(keyword));
  }

  /**
   * Limpa histórico de conversa
   * 
   * @param leadId - ID do lead
   */
  clearConversation(leadId: string): void {
    this.conversations.delete(leadId);
    this.logger.log(`🗑️  Histórico limpo para lead ${leadId}`);
  }

  /**
   * Obtém estatísticas de uso
   */
  getStats(): any {
    return {
      activeConversations: this.conversations.size,
      totalMessages: Array.from(this.conversations.values()).reduce(
        (sum, history) => sum + history.length,
        0,
      ),
    };
  }
}
