/**
 * Configuração da IARA (IA Conversacional)
 * 
 * IARA = Inteligência Artificial para Relacionamento e Agendamento
 * 
 * Funcionalidades:
 * - Conversa natural com leads via WhatsApp
 * - Qualifica leads automaticamente
 * - Agenda consultas no Google Calendar
 * - Responde dúvidas frequentes
 * - Escala para humano quando necessário
 */

export const IaraConfig = {
  // Modelo GPT-3.5 Turbo (mais rápido, mais barato)
  // Alternativa: gpt-4-turbo-preview (mais inteligente, mais caro)
  model: 'gpt-3.5-turbo',

  // Temperatura (0-1): quanto maior, mais criativo
  // 0.3 = mais previsível e econômico (menos tokens desperdiçados)
  temperature: 0.3,

  // Máximo de tokens por resposta
  // 1 token ≈ 0.75 palavras em português
  // 500 tokens ≈ 375 palavras ≈ 2-3 parágrafos
  maxTokens: 500,

  // Configurações de economia
  costOptimizations: {
    maxRetries: 2, // Máximo de tentativas em caso de erro
    timeoutMs: 5000, // Timeout de 5 segundos (mais rápido)
    fallbackToGpt4: false, // NÃO usa GPT-4 como fallback
    cacheEnabled: true, // Cache agressivo de respostas
    cacheTTL: 3600 * 24, // 24 horas
  },

  // Prompt do sistema (personalidade da IARA)
  // OTIMIZADO: Prompt enxuto economiza tokens
  systemPrompt: `Você é IARA, assistente da Elevare. Seja DIRETA e OBJETIVA:

**Sua personalidade:**
- Calorosa, profissional e empática
- Responde em português brasileiro
- Usa emojis moderadamente (1-2 por mensagem)
- Mantém tom conversacional, não robótico

1. Colete: nome, telefone, procedimento, urgência
2. NUNCA invente informações médicas
3. Se não souber: "Vou transferir para especialista"
4. Responda em português simples
5. MÁXIMO 2-3 frases por resposta

Exemplo:
Usuário: "Quero agendar"
IARA: "Olá! Sou a IARA. Seu nome?"
Usuário: "Maria"
IARA: "Oi Maria! Qual procedimento?"
Usuário: "Limpeza de pele"
IARA: "Ótimo! Que dia e horário?"`,

  // Contexto adicional sobre a clínica
  clinicContext: {
    name: 'Elevare',
    specialty: 'Clínica de Estética',
    services: [
      'Limpeza de pele',
      'Peeling',
      'Botox',
      'Preenchimento',
      'Harmonização facial',
      'Depilação a laser',
      'Tratamento de acne',
      'Rejuvenescimento',
    ],
    workingHours: {
      weekdays: '08:00 - 18:00',
      saturday: '08:00 - 12:00',
      sunday: 'Fechado',
    },
    address: 'Rua Exemplo, 123 - São Paulo, SP',
    phone: '+55 11 99999-9999',
    website: 'https://elevare.com.br',
  },

  // Configurações de cache (Redis)
  cache: {
    enabled: true,
    ttl: 3600 * 24, // 24 horas
    namespace: 'iara',
  },

  // Configurações de embeddings (para busca semântica)
  embeddings: {
    enabled: false, // Desabilitado por enquanto (custo adicional)
    model: 'text-embedding-ada-002', // Modelo mais econômico
  },

  // Configurações de qualidade
  quality: {
    minResponseLength: 20, // Mínimo de caracteres
    maxResponseLength: 500, // Máximo de caracteres
    requireEmoji: false, // Exigir pelo menos 1 emoji
    requireQuestion: false, // Exigir pelo menos 1 pergunta
  },

  // Configurações de agendamento automático
  scheduling: {
    enabled: true,
    autoConfirm: false, // Sempre pedir confirmação antes de agendar
    sendReminder: true, // Enviar lembrete 1 dia antes
    reminderHours: 24, // Horas antes do agendamento
  },

  // Palavras-chave para detecção de intenção
  intents: {
    greeting: ['oi', 'olá', 'ola', 'bom dia', 'boa tarde', 'boa noite'],
    scheduling: ['agendar', 'marcar', 'consulta', 'horário', 'disponibilidade'],
    info: ['quanto custa', 'preço', 'valor', 'informação', 'dúvida'],
    urgency: ['urgente', 'emergência', 'dor', 'sangramento', 'grave'],
    cancel: ['cancelar', 'desmarcar', 'remarcar'],
    confirm: ['sim', 'confirmar', 'ok', 'pode ser', 'tudo bem'],
    deny: ['não', 'nao', 'negativo', 'depois'],
  },

  // Configurações de custo (OpenAI)
  costs: {
    'gpt-4-turbo-preview': {
      input: 0.01, // $0.01 por 1K tokens
      output: 0.03, // $0.03 por 1K tokens
    },
    'gpt-3.5-turbo': {
      input: 0.0005, // $0.0005 por 1K tokens
      output: 0.0015, // $0.0015 por 1K tokens
    },
  },
} as const;
