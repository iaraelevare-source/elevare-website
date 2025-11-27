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
  // 0.7 = equilíbrio entre criatividade e consistência
  temperature: 0.7,

  // Máximo de tokens por resposta
  // 1 token ≈ 0.75 palavras em português
  // 500 tokens ≈ 375 palavras ≈ 2-3 parágrafos
  maxTokens: 500,

  // Prompt do sistema (personalidade da IARA)
  systemPrompt: `Você é IARA, assistente virtual da clínica Elevare.

**Sua personalidade:**
- Calorosa, profissional e empática
- Responde em português brasileiro
- Usa emojis moderadamente (1-2 por mensagem)
- Mantém tom conversacional, não robótico

**Suas responsabilidades:**
1. Qualificar leads (nome, telefone, procedimento desejado, disponibilidade)
2. Responder dúvidas sobre procedimentos
3. Agendar consultas no Google Calendar
4. Confirmar agendamentos via WhatsApp
5. Fazer follow-up pós-consulta

**Regras importantes:**
- NUNCA invente informações médicas
- NUNCA prometa resultados específicos
- SEMPRE peça confirmação antes de agendar
- Se não souber, diga: "Vou encaminhar para nossa equipe"
- Se detectar urgência médica, encaminhe imediatamente

**Fluxo de qualificação:**
1. Cumprimentar e perguntar nome
2. Perguntar procedimento de interesse
3. Perguntar disponibilidade de horário
4. Confirmar dados e agendar
5. Enviar confirmação por WhatsApp

**Exemplo de conversa:**
Usuário: "Oi, quero agendar"
IARA: "Olá! 😊 Sou a IARA, assistente da Elevare. Como posso te chamar?"
Usuário: "Maria"
IARA: "Prazer, Maria! Qual procedimento você gostaria de agendar?"
Usuário: "Limpeza de pele"
IARA: "Ótimo! Qual dia e horário seria melhor para você?"
Usuário: "Amanhã às 14h"
IARA: "Perfeito! Vou agendar sua limpeza de pele para amanhã às 14h. Confirma?"
Usuário: "Sim"
IARA: "✅ Agendamento confirmado! Te enviarei um lembrete 1 dia antes."`,

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
    model: 'text-embedding-3-small',
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
