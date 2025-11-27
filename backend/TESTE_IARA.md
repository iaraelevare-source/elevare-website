# 🤖 Guia de Teste da IARA

## O que é a IARA?

**IARA** = Inteligência Artificial para Relacionamento e Agendamento

É a assistente virtual que conversa com seus clientes via WhatsApp, qualifica leads e agenda consultas automaticamente.

---

## ✅ Pré-requisitos

1. **OpenAI API Key** (obrigatório)
   - Crie conta em: https://platform.openai.com
   - Gere API key em: https://platform.openai.com/api-keys
   - Custo: ~$0.03 por conversa (10 mensagens)

2. **WhatsApp configurado** (obrigatório)
   - Siga guia: `TESTE_WHATSAPP.md`
   - Pode usar Mock (grátis) ou Meta API (pago)

3. **Backend rodando** (obrigatório)
   ```bash
   cd backend
   npm run start:dev
   ```

---

## 🔧 Configuração (2 minutos)

### 1. Adicionar OpenAI API Key no `.env`

```bash
cd backend
cat >> .env << 'EOF'

# IARA - IA Conversacional
OPENAI_API_KEY=sk-proj-...  # Sua chave da OpenAI

EOF
```

### 2. Reiniciar backend

```bash
npm run start:dev
```

Você verá no log:
```
✅ IARA Core Service inicializado
```

---

## 🧪 Teste 1: Conversa Simples (1 minuto)

### Via WhatsApp Mock

1. **Envie mensagem para o número do WhatsApp Mock:**
   ```
   Oi, quero agendar consulta
   ```

2. **IARA deve responder algo como:**
   ```
   Olá! 😊 Sou a IARA, assistente da Elevare. Como posso te chamar?
   ```

3. **Continue a conversa:**
   ```
   Você: Maria
   IARA: Prazer, Maria! Qual procedimento você gostaria de agendar?
   
   Você: Limpeza de pele
   IARA: Ótimo! Qual dia e horário seria melhor para você?
   
   Você: Amanhã às 14h
   IARA: Perfeito! Vou agendar sua limpeza de pele para amanhã às 14h. Confirma?
   
   Você: Sim
   IARA: ✅ Agendamento confirmado! Te enviarei um lembrete 1 dia antes.
   ```

---

## 🧪 Teste 2: Detecção de Intenção (2 minutos)

### Teste diferentes intenções:

**Saudação:**
```
Você: Oi
IARA: Olá! 😊 Sou a IARA...
```

**Agendamento:**
```
Você: Quero marcar horário
IARA: Claro! Qual procedimento...
```

**Informação:**
```
Você: Quanto custa botox?
IARA: Os valores variam conforme...
```

**Urgência:**
```
Você: Estou com dor urgente
IARA: Entendo sua urgência. Vou encaminhar...
```

**Cancelamento:**
```
Você: Preciso cancelar
IARA: Sem problemas! Qual agendamento...
```

---

## 🧪 Teste 3: Memória de Conversa (1 minuto)

A IARA lembra das últimas 10 trocas de mensagens:

```
Você: Oi, sou Maria
IARA: Olá, Maria! Como posso ajudar?

Você: Qual meu nome?
IARA: Seu nome é Maria! 😊
```

---

## 🧪 Teste 4: Fallback de Erro (1 minuto)

Se a OpenAI falhar, IARA responde:

```
Você: Qualquer mensagem
IARA: Desculpe, ocorreu um erro. Um atendente entrará em contato em breve. 😊
```

---

## 📊 Monitoramento (Opcional)

### Ver logs em tempo real:

```bash
cd backend
npm run start:dev | grep IARA
```

Você verá:
```
✅ IARA Core Service inicializado
📨 Processando mensagem do lead 5511999999999: "Oi, quero agendar..."
🎯 Intenção detectada: scheduling
✅ Resposta gerada em 1234ms
✅ IARA respondeu para 5511999999999
```

### Ver estatísticas:

```bash
curl http://localhost:3000/iara/stats
```

Resposta:
```json
{
  "activeConversations": 5,
  "totalMessages": 120
}
```

---

## 🎛️ Personalização (Opcional)

### Mudar personalidade da IARA:

Edite: `backend/src/iara/core/iara.config.ts`

```typescript
systemPrompt: `Você é IARA, assistente virtual da clínica Elevare.

**Sua personalidade:**
- Calorosa, profissional e empática  // ✏️ MUDE AQUI
- Responde em português brasileiro
- Usa emojis moderadamente (1-2 por mensagem)
- Mantém tom conversacional, não robótico
...
```

### Mudar modelo GPT:

```typescript
model: 'gpt-4-turbo-preview',  // Mais inteligente, mais caro
// model: 'gpt-3.5-turbo',      // Mais rápido, mais barato
```

### Mudar temperatura (criatividade):

```typescript
temperature: 0.7,  // 0 = robótico, 1 = criativo
```

---

## 💰 Custos Estimados

### GPT-4 Turbo (recomendado):
- **Input:** $0.01 por 1K tokens
- **Output:** $0.03 por 1K tokens
- **Conversa típica (10 msgs):** ~$0.03 (R$ 0,15)
- **100 conversas/dia:** ~$3/dia (R$ 15/dia)
- **Mensal:** ~$90 (R$ 450)

### GPT-3.5 Turbo (economia):
- **Input:** $0.0005 por 1K tokens
- **Output:** $0.0015 por 1K tokens
- **Conversa típica (10 msgs):** ~$0.003 (R$ 0,02)
- **100 conversas/dia:** ~$0.30/dia (R$ 1.50/dia)
- **Mensal:** ~$9 (R$ 45)

**Recomendação:** Use GPT-4 para qualidade, GPT-3.5 para economia.

---

## 🐛 Troubleshooting

### Erro: "OPENAI_API_KEY não configurada"

**Solução:**
```bash
cd backend
echo 'OPENAI_API_KEY=sk-proj-...' >> .env
npm run start:dev
```

### IARA não responde

**Verifique:**
1. Backend está rodando? `curl http://localhost:3000/health`
2. WhatsApp está configurado? Veja `TESTE_WHATSAPP.md`
3. OpenAI API Key é válida? Teste em: https://platform.openai.com/playground

### Resposta muito lenta (> 5 segundos)

**Causas:**
- OpenAI sobrecarregado (horário de pico)
- Internet lenta
- Modelo GPT-4 (mais lento que GPT-3.5)

**Solução:**
- Mude para GPT-3.5 em `iara.config.ts`

### Resposta genérica/ruim

**Causas:**
- Temperatura muito alta (> 0.8)
- Prompt do sistema mal escrito

**Solução:**
- Reduza temperatura para 0.5-0.7
- Melhore prompt em `iara.config.ts`

---

## 🎯 Próximos Passos

1. ✅ **Testar IARA** (você está aqui)
2. 🔄 **Integrar com Google Calendar** (agendamento real)
3. 🔄 **Adicionar base de conhecimento** (embeddings)
4. 🔄 **Treinar com conversas reais** (fine-tuning)
5. 🔄 **Adicionar voz** (Whisper + TTS)

---

## 📞 Suporte

**Dúvidas?**
- GitHub Issues: https://github.com/iaraelevare-source/elevare-website/issues
- Email: contato@elevare.com.br

---

**✅ IARA está pronta para conversar com seus clientes!**
