# 📱 Teste de WhatsApp Meta API

## Pré-requisitos

### 1. Criar Conta Meta Business
1. Acesse: https://business.facebook.com
2. Crie uma conta business
3. Adicione um método de pagamento

### 2. Criar App no Facebook Developers
1. Acesse: https://developers.facebook.com/apps
2. Clique em "Create App"
3. Escolha "Business" como tipo
4. Preencha nome do app: "Elevare"
5. Adicione produto: **WhatsApp**

### 3. Obter Credenciais
1. Acesse: WhatsApp > API Setup
2. Copie:
   - **Phone Number ID** → `WHATSAPP_PHONE_ID`
   - **WhatsApp Business Account ID** → `WHATSAPP_BUSINESS_ID`
3. Gere token permanente:
   - Clique em "Generate Token"
   - Selecione permissões: `whatsapp_business_messaging`, `whatsapp_business_management`
   - Copie o token → `WHATSAPP_TOKEN`

### 4. Configurar Variáveis de Ambiente
```bash
cd backend
cp .env.whatsapp .env

# Edite .env e preencha:
WHATSAPP_PHONE_ID=seu_phone_id_aqui
WHATSAPP_TOKEN=seu_token_aqui
WHATSAPP_BUSINESS_ID=seu_business_id_aqui
WHATSAPP_WEBHOOK_TOKEN=gere_um_token_secreto_aqui
```

---

## Passo 1: Testar Envio de Mensagem

### 1.1. Subir Backend
```bash
npm run start:dev
```

### 1.2. Enviar Mensagem de Teste
```bash
curl -X POST http://localhost:3000/whatsapp/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_JWT_TOKEN" \
  -d '{
    "to": "5511999999999",
    "template": "hello_world",
    "components": []
  }'
```

**Nota:** O número deve estar registrado no Facebook como número de teste.

### 1.3. Resposta Esperada
```json
{
  "messaging_product": "whatsapp",
  "contacts": [
    {
      "input": "5511999999999",
      "wa_id": "5511999999999"
    }
  ],
  "messages": [
    {
      "id": "wamid.HBgNNTUxMTk5OTk5OTk5ORUCABIYFjNFQjBDMEI3RjFFMTREMDhBMTREAA=="
    }
  ]
}
```

---

## Passo 2: Configurar Webhook

### 2.1. Expor Backend Publicamente
```bash
# Opção 1: ngrok (desenvolvimento)
ngrok http 3000

# Opção 2: Deploy em produção
# https://api.elevare.com.br
```

### 2.2. Configurar no Facebook
1. Acesse: WhatsApp > Configuration
2. Clique em "Edit" no Webhook
3. Preencha:
   - **Callback URL:** `https://seu-dominio.com/webhooks/whatsapp`
   - **Verify Token:** Mesmo valor de `WHATSAPP_WEBHOOK_TOKEN`
4. Clique em "Verify and Save"

### 2.3. Inscrever em Eventos
Marque as opções:
- ✅ **messages** (mensagens recebidas)
- ✅ **message_status** (status de entrega)

---

## Passo 3: Testar Webhook

### 3.1. Enviar Mensagem para o Número
1. Abra WhatsApp no celular
2. Envie mensagem para o número configurado
3. Verifique logs do backend:

```bash
# Deve aparecer:
📩 Webhook recebido
📨 Mensagem recebida de 5511999999999 (tipo: text)
💬 Conteúdo: Olá, teste!
```

### 3.2. Testar Webhook Manualmente
```bash
curl -X POST http://localhost:3000/webhooks/whatsapp \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "changes": [{
        "value": {
          "messaging_product": "whatsapp",
          "metadata": {
            "display_phone_number": "5511999999999",
            "phone_number_id": "SEU_PHONE_ID"
          },
          "messages": [{
            "from": "5511888888888",
            "id": "wamid.test123",
            "timestamp": "1234567890",
            "type": "text",
            "text": {
              "body": "Teste de webhook"
            }
          }]
        }
      }]
    }]
  }'
```

---

## Passo 4: Criar Templates

### 4.1. Acessar Message Templates
1. Acesse: WhatsApp > Message Templates
2. Clique em "Create Template"

### 4.2. Criar Template de Boas-Vindas
- **Name:** `elevare_welcome`
- **Category:** Utility
- **Language:** Portuguese (BR)
- **Header:** Nenhum
- **Body:**
  ```
  Olá {{1}}! 👋

  Bem-vindo(a) à *Elevare*!

  Estou aqui para ajudar você a agendar seus procedimentos estéticos.

  Como posso te ajudar hoje?
  ```
- **Footer:** Elevare - Sua clínica de estética
- **Buttons:** Nenhum

### 4.3. Aguardar Aprovação
Templates levam de 5 minutos a 24 horas para serem aprovados.

### 4.4. Testar Template Aprovado
```bash
curl -X POST http://localhost:3000/whatsapp/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_JWT_TOKEN" \
  -d '{
    "to": "5511999999999",
    "template": "elevare_welcome",
    "components": [
      {
        "type": "body",
        "parameters": [
          {
            "type": "text",
            "text": "Maria"
          }
        ]
      }
    ]
  }'
```

---

## Passo 5: Verificar Rate Limiting

### 5.1. Enviar 101 Mensagens Rapidamente
```bash
for i in {1..101}; do
  curl -X POST http://localhost:3000/whatsapp/send \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer SEU_JWT_TOKEN" \
    -d '{"to":"5511999999999","template":"hello_world","components":[]}'
  
  echo "Mensagem $i enviada"
done
```

### 5.2. Resposta Esperada (na 101ª requisição)
```json
{
  "statusCode": 403,
  "message": "Rate limit excedido. Aguarde 60 segundos."
}
```

---

## Passo 6: Verificar Perfil Business

```bash
curl -X GET http://localhost:3000/whatsapp/profile \
  -H "Authorization: Bearer SEU_JWT_TOKEN"
```

**Resposta esperada:**
```json
{
  "data": [
    {
      "about": "Elevare - Clínica de Estética",
      "address": "Rua Exemplo, 123",
      "description": "Sua beleza, nossa prioridade",
      "email": "contato@elevare.com.br",
      "profile_picture_url": "https://...",
      "websites": ["https://elevare.com.br"]
    }
  ]
}
```

---

## Troubleshooting

### Erro: "Invalid phone number"
- Verifique formato: `5511999999999` (código país + DDD + número)
- Número deve estar registrado como número de teste no Facebook

### Erro: "Message undeliverable"
- Usuário bloqueou o número
- Número não tem WhatsApp
- Fora da janela de 24h (use template)

### Erro: "Template not found"
- Template não foi criado
- Template não foi aprovado
- Nome do template está incorreto

### Erro: "Rate limit hit"
- Aguarde 1 minuto
- Reduza frequência de envio
- Considere usar fila (Bull/Redis)

### Webhook não recebe mensagens
- Verifique se URL está acessível publicamente
- Verifique se token de verificação está correto
- Verifique logs do backend
- Teste manualmente com curl

---

## Próximos Passos

1. ✅ Integrar com IARA (IA conversacional)
2. ✅ Salvar mensagens no banco de dados
3. ✅ Criar fila de envio (Bull + Redis)
4. ✅ Adicionar métricas no Grafana
5. ✅ Implementar retry automático
6. ✅ Criar dashboard de mensagens

---

## Documentação Oficial

- **WhatsApp Cloud API:** https://developers.facebook.com/docs/whatsapp/cloud-api
- **Webhooks:** https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks
- **Message Templates:** https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates
- **Error Codes:** https://developers.facebook.com/docs/whatsapp/cloud-api/support/error-codes
