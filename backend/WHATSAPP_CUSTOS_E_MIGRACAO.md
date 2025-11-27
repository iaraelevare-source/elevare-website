# 💰 WhatsApp: Custos Reais e Estratégia de Migração

## 📊 Modelo de Preços Meta (2025)

Desde **1º de julho de 2025**, a Meta mudou para **preço por mensagem** (per-message pricing).

### Categorias de Mensagens (Brasil/LATAM)

| Categoria | Custo por mensagem | Quando usar? |
|-----------|-------------------|--------------|
| **Marketing** | ~$0,03 - $0,05 | Promoções, ofertas, notícias |
| **Utility** | ~$0,01 - $0,02 | Confirmações, updates de pedido |
| **Authentication** | ~$0,01 - $0,02 | OTP, códigos de login |
| **Service** | **GRÁTIS** | Respostas dentro de 24h ao usuário |

**Fonte:** [Meta Pricing](https://developers.facebook.com/docs/whatsapp/pricing)

---

## 🆓 Janelas Gratuitas (Economia Real)

### 1. Service Window (24h)
Quando o usuário te envia mensagem, você tem **24h para responder de graça** (qualquer tipo de mensagem).

**Economia:** Se 80% dos seus leads iniciarem a conversa, você paga zero em 80% das mensagens.

### 2. Click-to-WhatsApp (72h)
Conversas iniciadas por anúncios no Facebook/Instagram têm **72h grátis**.

**Economia:** Campanhas pagas no Meta Ads = mensagens grátis por 3 dias.

### 3. Free Tier
**1.000 conversas de serviço grátis/mês** em alguns países (incluindo Brasil).

**Economia:** Até 1.000 leads/mês = custo zero.

---

## 💸 Taxas do Provedor (BSP)

Você **NÃO conecta direto à Meta**. Precisa de um **Business Solution Provider** (BSP).

| BSP | Taxa fixa mensal | Taxa por mensagem | Total estimado |
|-----|------------------|-------------------|----------------|
| **Twilio** | $0 | + $0,005/msg | R$ 0,10 por bloco de 20 msg |
| **360dialog** | €49/mês (~R$ 280) | Meta rate + $0 | R$ 280 + consumo Meta |
| **Wati** | $49/mês (~R$ 250) | Meta rate + $0 | R$ 250 + consumo Meta |
| **Evolution API** | **GRÁTIS** (self-hosted) | $0 | **R$ 0** (API não oficial) |

**Fonte:** [Twilio Pricing](https://www.twilio.com/whatsapp/pricing), [Wati Plans](https://www.wati.io/pricing)

---

## 💡 Exemplo de Cálculo Real para MVP

### Cenário: 100 leads/mês

**Sem otimização:**
- 90 mensagens de Utility (confirmações): `90 × $0,02 = $1,80`
- 10 mensagens de Marketing (follow-up): `10 × $0,04 = $0,40`
- Taxa Twilio: `100 × $0,005 = $0,50`
- **Total: ~$2,70/mês (R$ 15,00)**

**Com janelas gratuitas:**
- Se você responder todos dentro de 24h: **R$ 0,00**
- Se 80% iniciarem conversa: **R$ 3,00**

---

## 🎯 Recomendação para Seu MVP

### ✅ Opção 1: Mock Service (R$ 0/mês) - **RECOMENDADA**

**Vantagens:**
- ✅ Custo zero
- ✅ Mesma interface da Meta
- ✅ Migração em 1 linha de código
- ✅ Perfeito para validar fluxo

**Desvantagens:**
- ⚠️ API não oficial (risco de bloqueio)
- ⚠️ Requer self-hosting (Docker)

**Quando usar:** MVP até 100 leads/mês

---

### 🔄 Opção 2: Twilio Pay-as-you-go (R$ 15-30/mês)

**Vantagens:**
- ✅ Sem mensalidade fixa
- ✅ Paga apenas o que usar
- ✅ API oficial Meta
- ✅ Suporte Twilio

**Desvantagens:**
- ⚠️ Custo por mensagem
- ⚠️ Configuração mais complexa

**Quando usar:** 100-1.000 leads/mês

---

### 💰 Opção 3: Meta direto via BSP (R$ 100-300/mês)

**Vantagens:**
- ✅ API oficial
- ✅ Suporte Meta
- ✅ Escalável
- ✅ Confiável

**Desvantagens:**
- ⚠️ Taxa fixa mensal
- ⚠️ Custo por mensagem
- ⚠️ Inviável para MVP

**Quando usar:** +1.000 leads/mês

---

## 📉 Como Reduzir Custos em 90%

### 1. Sempre responda dentro de 24h
→ Mensagens de serviço **grátis**

### 2. Use templates Utility
→ 50% mais barato que Marketing

### 3. Incentive usuário iniciar
→ Janela de 72h grátis (Click-to-WhatsApp)

### 4. Monitore volume
→ Descontos até 20% em alta escala

---

## 🚀 Estratégia de Migração (3 Fases)

### Fase 1: MVP (0-100 leads/mês) - **MOCK**
```bash
# Use Evolution API (grátis)
WHATSAPP_PROVIDER=mock
WHATSAPP_MOCK_URL=http://localhost:3002
```

**Custo:** R$ 0/mês  
**Tempo:** Até validar negócio

---

### Fase 2: Crescimento (100-1.000 leads/mês) - **TWILIO**
```bash
# Mude para Twilio
WHATSAPP_PROVIDER=meta
WHATSAPP_PHONE_ID=...
WHATSAPP_TOKEN=... # Token do Twilio
```

**Custo:** R$ 15-50/mês  
**Tempo:** 3-6 meses

---

### Fase 3: Escala (+1.000 leads/mês) - **META DIRETO**
```bash
# Mude para BSP premium (360dialog, Wati)
WHATSAPP_PROVIDER=meta
WHATSAPP_PHONE_ID=...
WHATSAPP_TOKEN=... # Token do BSP
```

**Custo:** R$ 100-300/mês  
**Tempo:** Após validar ROI

---

## 🔄 Como Migrar (1 linha de código)

### Passo 1: Atualizar .env
```bash
# Antes (Mock)
WHATSAPP_PROVIDER=mock

# Depois (Meta)
WHATSAPP_PROVIDER=meta
WHATSAPP_PHONE_ID=seu_phone_id
WHATSAPP_TOKEN=seu_token
```

### Passo 2: Atualizar whatsapp.module.ts
```typescript
// Antes (Mock)
providers: [WhatsAppMockService]

// Depois (Meta)
providers: [WhatsAppMetaService]
```

### Passo 3: Reiniciar backend
```bash
npm run start:dev
```

**Pronto!** O resto do código continua igual.

---

## 📈 Projeção de Custos

| Leads/mês | Mensagens/mês | Custo Mock | Custo Twilio | Custo BSP Premium |
|-----------|---------------|------------|--------------|-------------------|
| 10 | 30 | R$ 0 | R$ 2 | R$ 100 |
| 50 | 150 | R$ 0 | R$ 8 | R$ 120 |
| 100 | 300 | R$ 0 | R$ 15 | R$ 150 |
| 500 | 1.500 | R$ 0 | R$ 75 | R$ 250 |
| 1.000 | 3.000 | R$ 0 | R$ 150 | R$ 350 |
| 5.000 | 15.000 | R$ 0 | R$ 750 | R$ 800 |

**Observação:** Custos com janelas gratuitas podem reduzir em até 80%.

---

## ✅ Próxima Ação

Execute este comando para garantir que está usando Mock (zero custo):

```bash
cd backend

# Configurar Mock
cat >> .env << 'EOF'
WHATSAPP_PROVIDER=mock
WHATSAPP_MOCK_URL=http://localhost:3002
WHATSAPP_MOCK_API_KEY=elevare_mock_key_123
EOF

# Subir Evolution API
docker-compose -f docker-compose.whatsapp-mock.yml up -d

# Criar instância
curl -X POST http://localhost:3002/instance/create \
  -H "apikey: elevare_mock_key_123" \
  -H "Content-Type: application/json" \
  -d '{"instanceName":"elevare","token":"elevare_token","qrcode":true}'

# Obter QR Code
curl http://localhost:3002/instance/connect/elevare \
  -H "apikey: elevare_mock_key_123"
```

**Escaneie o QR Code com seu WhatsApp e pronto!**

---

## 📚 Referências

- [Meta WhatsApp Pricing](https://developers.facebook.com/docs/whatsapp/pricing)
- [Twilio WhatsApp Pricing](https://www.twilio.com/whatsapp/pricing)
- [Evolution API Docs](https://doc.evolution-api.com)
- [360dialog Pricing](https://www.360dialog.com/pricing)
- [Wati Pricing](https://www.wati.io/pricing)
