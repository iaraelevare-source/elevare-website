# 🔒 Módulo LGPD - Elevare

Implementação completa de compliance com a **Lei 13.709/2018 (Lei Geral de Proteção de Dados)**.

## 📋 Funcionalidades

### Conformidade Legal

O módulo implementa os seguintes artigos da LGPD:

- **Art. 7º** - Bases legais para tratamento de dados
- **Art. 8º** - Consentimento livre, informado e inequívoco
- **Art. 8º, §5º** - Direito de revogar consentimento
- **Art. 9º** - Direito de acesso aos dados
- **Art. 18** - Direitos do titular (portabilidade e esquecimento)
- **Art. 18, §2º** - Direito de portabilidade dos dados

### Endpoints Disponíveis

#### Endpoints Públicos

**POST `/lgpd/consent`**
Registra consentimento do usuário (chamado pelo banner LGPD do frontend).

```json
{
  "type": "whatsapp",
  "purpose": "Comunicação via WhatsApp para agendamentos",
  "granted": true,
  "sessionId": "abc123"
}
```

#### Endpoints Autenticados

**GET `/lgpd/my-consents`**
Lista todos os consentimentos ativos do usuário autenticado.

**PATCH `/lgpd/revoke`**
Revoga um consentimento específico.

```json
{
  "type": "whatsapp"
}
```

**GET `/lgpd/export`**
Exporta todos os dados do usuário em formato estruturado (portabilidade).

Resposta:
```json
{
  "user": { ... },
  "consents": [ ... ],
  "totalLeads": 0,
  "totalAppointments": 0,
  "dataRetentionDays": 365,
  "exportedAt": "2024-01-15T10:30:00Z"
}
```

**DELETE `/lgpd/delete-account`**
Exclui dados do usuário (pseudonimização). **Operação irreversível!**

#### Endpoints Administrativos

**POST `/lgpd/admin/search`**
Busca consentimentos por termo (auditoria).

**GET `/lgpd/admin/stats`**
Estatísticas agregadas de consentimentos.

---

## 🛡️ Uso do Guard de Consentimento

O módulo fornece um guard customizado para proteger rotas que processam dados pessoais.

### Exemplo de Uso

```typescript
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ConsentGuard } from '../lgpd/guards/consent.guard';
import { RequireConsent } from '../lgpd/decorators/require-consent.decorator';

@Controller('whatsapp')
export class WhatsAppController {
  
  @Post('send')
  @UseGuards(JwtAuthGuard, ConsentGuard)
  @RequireConsent('whatsapp')
  async sendMessage(@Body() data: SendMessageDto) {
    // Só executa se usuário tiver consentimento ativo para WhatsApp
    return this.whatsappService.sendMessage(data);
  }
}
```

### Tipos de Consentimento Disponíveis

- `cookie` - Cookies analíticos e funcionais
- `whatsapp` - Comunicação via WhatsApp
- `email` - Comunicação via email
- `phone` - Comunicação via telefone
- `third_party` - Compartilhamento com terceiros

---

## 🗄️ Estrutura do Banco de Dados

### Tabela: `lgpd_consents`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Identificador único |
| `userId` | String | ID do usuário (opcional) |
| `type` | Enum | Tipo de consentimento |
| `granted` | Boolean | Consentimento concedido? |
| `purpose` | String | Finalidade específica |
| `metadata` | JSONB | Metadados técnicos (IP, User-Agent) |
| `revoked` | Boolean | Consentimento revogado? |
| `createdAt` | Timestamp | Data de criação |
| `updatedAt` | Timestamp | Data de atualização |
| `revokedAt` | Timestamp | Data de revogação |
| `revokedBy` | String | Quem revogou |
| `sessionId` | String | Session ID para leads temporários |

### Índices

- `(userId, type)` - Busca rápida de consentimentos por usuário e tipo
- `(sessionId)` - Busca por sessão (leads não cadastrados)

---

## 🔄 Fluxo de Consentimento

### 1. Usuário Visita o Site

Frontend exibe banner LGPD solicitando consentimento.

### 2. Usuário Aceita/Recusa

Frontend envia `POST /lgpd/consent` com:
- Tipo de consentimento
- Finalidade
- Session ID (se não logado)

### 3. Backend Registra

Service salva consentimento com metadados (IP, User-Agent, timestamp).

### 4. Verificação em Ações

Antes de processar dados pessoais, guard verifica se há consentimento ativo.

### 5. Revogação

Usuário pode revogar a qualquer momento via `PATCH /lgpd/revoke`.

---

## 📊 Integração com Frontend

### Banner LGPD

```javascript
// js/lgpd.js
async function recordConsent(type, granted) {
  const response = await fetch('/lgpd/consent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type,
      purpose: `Comunicação via ${type}`,
      granted,
      sessionId: getSessionId(),
    }),
  });
  
  if (response.ok) {
    localStorage.setItem(`lgpd_${type}`, granted);
  }
}
```

### Painel de Controle de Privacidade

```javascript
// dashboard.html
async function loadMyConsents() {
  const response = await fetch('/lgpd/my-consents', {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  
  const consents = await response.json();
  renderConsents(consents);
}

async function revokeConsent(type) {
  await fetch('/lgpd/revoke', {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ type }),
  });
  
  alert('Consentimento revogado com sucesso');
  loadMyConsents();
}
```

---

## ⚠️ Considerações Importantes

### Retenção de Dados

A política padrão é de **365 dias** de retenção. Configure conforme necessário:

```typescript
// lgpd.service.ts
dataRetentionDays: 365, // Ajustar conforme política da empresa
```

### Pseudonimização vs Exclusão Total

O método `deleteUserData()` realiza **pseudonimização**, não exclusão total:

- Mantém registros para fins legais/contábeis
- Remove dados pessoais identificáveis
- Preserva IDs para integridade referencial

### Auditoria

Todos os consentimentos são registrados com metadados completos para auditoria:

- IP do cliente
- User-Agent
- Timestamp
- Página de origem

---

## 🧪 Testes

### Testar Registro de Consentimento

```bash
curl -X POST http://localhost:3000/lgpd/consent \
  -H "Content-Type: application/json" \
  -d '{
    "type": "whatsapp",
    "purpose": "Comunicação via WhatsApp",
    "granted": true
  }'
```

### Testar Exportação de Dados

```bash
curl -X GET http://localhost:3000/lgpd/export \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Testar Revogação

```bash
curl -X PATCH http://localhost:3000/lgpd/revoke \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type": "whatsapp"}'
```

---

## 📚 Referências

- [Lei 13.709/2018 (LGPD)](http://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)
- [ANPD - Autoridade Nacional de Proteção de Dados](https://www.gov.br/anpd/pt-br)
- [Guia de Boas Práticas LGPD](https://www.gov.br/anpd/pt-br/assuntos/noticias/guia-de-boas-praticas)

---

## 🎯 Próximos Passos

- [ ] Adicionar cron job para limpeza automática de dados expirados
- [ ] Implementar notificações de consentimento expirado
- [ ] Criar dashboard administrativo de compliance
- [ ] Adicionar relatórios de auditoria
- [ ] Implementar versionamento de políticas de privacidade
