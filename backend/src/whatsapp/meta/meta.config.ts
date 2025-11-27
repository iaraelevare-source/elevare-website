/**
 * Configuração do WhatsApp Meta API (API oficial do Facebook)
 * 
 * Documentação: https://developers.facebook.com/docs/whatsapp/cloud-api
 * 
 * Pré-requisitos:
 * 1. Criar conta Meta Business
 * 2. Criar app no Facebook Developers
 * 3. Adicionar produto WhatsApp
 * 4. Obter Phone Number ID e Access Token
 * 
 * Variáveis de ambiente necessárias:
 * - WHATSAPP_PHONE_ID: ID do número de telefone
 * - WHATSAPP_TOKEN: Token de acesso permanente
 * - WHATSAPP_BUSINESS_ID: ID da conta business
 * - WHATSAPP_WEBHOOK_TOKEN: Token secreto para validar webhook
 */
export const WhatsAppMetaConfig = {
  // Versão da API (atualizar conforme Meta lança novas versões)
  apiVersion: 'v18.0',
  
  // URL base da Graph API
  baseUrl: 'https://graph.facebook.com',
  
  // Credenciais (preenchidas via environment)
  phoneId: process.env.WHATSAPP_PHONE_ID || '',
  token: process.env.WHATSAPP_TOKEN || '',
  businessId: process.env.WHATSAPP_BUSINESS_ID || '',
  webhookVerifyToken: process.env.WHATSAPP_WEBHOOK_TOKEN || '',
  
  // Rate limiting (Meta permite 100 req/min por padrão)
  rateLimit: {
    maxRequests: 100, // Máximo de requisições
    windowMs: 60 * 1000, // Janela de 1 minuto
  },
  
  // Timeout de requisições
  timeout: 10000, // 10 segundos
  
  // Retry policy
  retry: {
    maxAttempts: 3,
    backoffMs: 1000, // 1 segundo entre tentativas
  },
} as const;

/**
 * Templates de mensagens aprovados pela Meta
 * 
 * Nota: Templates devem ser criados no Facebook Business Manager
 * e aprovados antes de serem usados
 */
export const WhatsAppTemplates = {
  // Template de boas-vindas
  WELCOME: 'elevare_welcome',
  
  // Template de confirmação de agendamento
  APPOINTMENT_CONFIRMATION: 'elevare_appointment_confirmation',
  
  // Template de lembrete de agendamento
  APPOINTMENT_REMINDER: 'elevare_appointment_reminder',
  
  // Template de follow-up pós-atendimento
  FOLLOWUP: 'elevare_followup',
  
  // Template de promoção
  PROMOTION: 'elevare_promotion',
} as const;
