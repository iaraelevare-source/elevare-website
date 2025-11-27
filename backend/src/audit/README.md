# 📝 Módulo de Audit Logs - Elevare

Sistema completo de auditoria para compliance LGPD e rastreabilidade de ações.

## 🎯 Objetivo

O módulo de Audit Logs registra automaticamente todas as ações realizadas no sistema, fornecendo rastreabilidade completa para compliance legal, investigação de incidentes e análise de segurança.

## 📋 Compliance Legal

### LGPD (Lei 13.709/2018)

O módulo implementa os seguintes requisitos da LGPD:

- **Art. 48** - Comunicação de incidentes de segurança
- **Art. 50** - Boas práticas de governança
- **Resolução CD/ANPD nº 2/2022** - Agentes de tratamento de pequeno porte

### Dados Registrados

Cada audit log contém as seguintes informações:

| Campo | Descrição | Uso |
|-------|-----------|-----|
| `action` | Ação realizada (CREATE_LEAD, LOGIN, etc) | Identificação da operação |
| `entity` | Entidade afetada (Lead, User, etc) | Contexto da ação |
| `entityId` | ID do registro afetado | Rastreamento específico |
| `userId` | Usuário que realizou a ação | Responsabilização |
| `ipAddress` | IP do cliente | Investigação de acessos |
| `before` | Snapshot antes da mudança | Auditoria de alterações |
| `after` | Snapshot depois da mudança | Auditoria de alterações |
| `error` | Mensagem de erro (se houver) | Investigação de falhas |
| `source` | Origem (web, api, webhook, system) | Contexto da requisição |
| `userAgent` | User-Agent do navegador | Identificação de dispositivos |
| `duration` | Duração da operação (ms) | Performance |
| `createdAt` | Data e hora da ação | Timeline |

---

## 🚀 Uso

### 1. Decorator @Audit()

A forma mais simples de auditar ações é usando o decorator `@Audit()`:

```typescript
import { Injectable } from '@nestjs/common';
import { Audit } from '../../audit/decorators/audit.decorator';

@Injectable()
export class LeadsService {
  
  @Audit({ action: 'CREATE_LEAD', entity: 'Lead' })
  async createLead(data: CreateLeadDto) {
    // Seu código normal
    const lead = await this.leadRepository.save(data);
    return lead;
  }

  @Audit({ 
    action: 'UPDATE_LEAD', 
    entity: 'Lead',
    ignoreFields: ['password', 'token'] // Campos sensíveis
  })
  async updateLead(id: string, data: UpdateLeadDto) {
    // Automaticamente auditado
    return await this.leadRepository.update(id, data);
  }
}
```

**O interceptor captura automaticamente:**
- IP do cliente
- User-Agent
- Usuário autenticado (via JwtAuthGuard)
- Snapshot antes/depois
- Duração da operação
- Erros (se houver)

### 2. Registro Manual

Para casos especiais, use o `AuditService` diretamente:

```typescript
import { Injectable } from '@nestjs/common';
import { AuditService } from '../../audit/services/audit.service';

@Injectable()
export class CustomService {
  constructor(private readonly auditService: AuditService) {}

  async customAction() {
    // Sua lógica
    
    // Registrar manualmente
    await this.auditService.log({
      action: 'CUSTOM_ACTION',
      entity: 'CustomEntity',
      entityId: 'abc123',
      userId: 'user-id',
      ipAddress: '192.168.1.1',
      after: { result: 'success' },
    });
  }
}
```

---

## 📊 Consultas

### Histórico de uma Entidade

```typescript
// Buscar todas as ações realizadas em um lead específico
const history = await this.auditService.getEntityHistory('Lead', leadId);

// Resultado:
[
  {
    action: 'CREATE_LEAD',
    userId: 'user-123',
    createdAt: '2024-01-15T10:00:00Z',
    after: { name: 'João Silva', email: 'joao@example.com' }
  },
  {
    action: 'UPDATE_LEAD',
    userId: 'user-456',
    createdAt: '2024-01-16T14:30:00Z',
    before: { status: 'novo' },
    after: { status: 'qualificado' }
  }
]
```

### Atividade de um Usuário

```typescript
// Buscar todas as ações de um usuário
const activity = await this.auditService.getUserActivity(userId, 50);

// Resultado:
[
  { action: 'LOGIN', createdAt: '2024-01-15T09:00:00Z' },
  { action: 'CREATE_LEAD', createdAt: '2024-01-15T09:15:00Z' },
  { action: 'UPDATE_LEAD', createdAt: '2024-01-15T09:30:00Z' },
]
```

### Relatório LGPD

```typescript
// Gerar relatório de acesso a dados pessoais
const report = await this.auditService.generateAccessReport(userId);

// Resultado:
{
  userId: 'user-123',
  totalAccess: 45,
  lastAccess: '2024-01-20T15:30:00Z',
  accessHistory: [
    {
      date: '2024-01-20T15:30:00Z',
      action: 'VIEW_USER',
      source: 'web',
      ip: '192.168.1.100'
    },
    // ...
  ]
}
```

### Detecção de Atividades Suspeitas

```typescript
// Identificar comportamentos anormais
const suspicious = await this.auditService.findSuspiciousActivity(userId);

// Resultado:
{
  multipleIPs: ['192.168.1.1', '10.0.0.5', '203.0.113.42'], // 3+ IPs diferentes
  failedActions: [
    { action: 'LOGIN', error: 'Invalid credentials', createdAt: '...' }
  ],
  unusualHours: [
    { action: 'UPDATE_LEAD', createdAt: '2024-01-15T03:00:00Z' } // 3h da manhã
  ]
}
```

### Logs por Período

```typescript
// Buscar logs de um período específico
const logs = await this.auditService.getLogsByPeriod(
  new Date('2024-01-01'),
  new Date('2024-01-31')
);
```

### Estatísticas

```typescript
// Dashboard administrativo
const stats = await this.auditService.getStats();

// Resultado:
{
  total: 1523,
  byAction: {
    'CREATE_LEAD': 450,
    'UPDATE_LEAD': 320,
    'LOGIN': 280,
    'DELETE_LEAD': 15
  },
  byEntity: {
    'Lead': 785,
    'User': 420,
    'Appointment': 318
  },
  bySource: {
    'web': 1200,
    'api': 250,
    'webhook': 50,
    'system': 23
  },
  errors: 12,
  avgDuration: 145 // ms
}
```

---

## 🔧 Manutenção

### Limpeza Automática de Logs Antigos

Configure um cron job para limpar logs antigos:

```typescript
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AuditService } from './audit/services/audit.service';

@Injectable()
export class TasksService {
  constructor(private readonly auditService: AuditService) {}

  // Executar todo dia às 3h da manhã
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanOldAuditLogs() {
    const daysToKeep = 365; // 1 ano
    const removed = await this.auditService.cleanOldLogs(daysToKeep);
    console.log(`Audit logs removidos: ${removed}`);
  }
}
```

---

## 🗄️ Estrutura do Banco de Dados

### Tabela: `audit_logs`

```sql
CREATE TABLE "audit_logs" (
  "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "action" varchar(100) NOT NULL,
  "entity" varchar(100) NOT NULL,
  "entityId" varchar(100) NOT NULL,
  "userId" varchar(100),
  "ipAddress" varchar(100) NOT NULL,
  "before" jsonb,
  "after" jsonb,
  "error" text,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "source" varchar(50) NOT NULL DEFAULT 'system',
  "userAgent" varchar(255),
  "duration" integer
);

-- Índices para performance
CREATE INDEX "IDX_USER_ENTITY_DATE" ON "audit_logs" ("userId", "entity", "createdAt");
CREATE INDEX "IDX_ENTITY_HISTORY" ON "audit_logs" ("entity", "entityId");
CREATE INDEX "IDX_IP_SOURCE" ON "audit_logs" ("ipAddress", "source");
```

### Retenção de Dados

A política padrão é de **365 dias** de retenção. Logs mais antigos são automaticamente removidos pelo cron job.

Para alterar, modifique o parâmetro `daysToKeep` no cron job.

---

## 🎯 Ações Recomendadas para Auditar

### Autenticação
- `LOGIN` - Login bem-sucedido
- `LOGOUT` - Logout
- `REGISTER` - Novo registro
- `PASSWORD_RESET` - Redefinição de senha
- `2FA_ENABLE` - Ativação de 2FA
- `2FA_DISABLE` - Desativação de 2FA

### Leads
- `CREATE_LEAD` - Criação de lead
- `UPDATE_LEAD` - Atualização de lead
- `DELETE_LEAD` - Exclusão de lead
- `CONVERT_LEAD` - Conversão de lead

### Usuários
- `CREATE_USER` - Criação de usuário
- `UPDATE_USER` - Atualização de usuário
- `DELETE_USER` - Exclusão de usuário
- `CHANGE_ROLE` - Mudança de permissões

### LGPD
- `CONSENT_GRANTED` - Consentimento concedido
- `CONSENT_REVOKED` - Consentimento revogado
- `DATA_EXPORT` - Exportação de dados
- `DATA_DELETE` - Exclusão de dados

### Agendamentos
- `CREATE_APPOINTMENT` - Criação de agendamento
- `UPDATE_APPOINTMENT` - Atualização de agendamento
- `CANCEL_APPOINTMENT` - Cancelamento
- `CONFIRM_APPOINTMENT` - Confirmação

---

## 🔍 Investigação de Incidentes

### Exemplo: Vazamento de Dados

```typescript
// 1. Identificar quem acessou dados sensíveis
const accessLogs = await this.auditService.getEntityHistory('User', victimUserId);

// 2. Verificar IPs suspeitos
const suspicious = await this.auditService.findSuspiciousActivity(victimUserId);

// 3. Gerar relatório completo
const report = await this.auditService.generateAccessReport(victimUserId);

// 4. Comunicar à ANPD (se necessário)
// Art. 48 da LGPD - Comunicação em até 72h
```

### Exemplo: Ação Não Autorizada

```typescript
// Buscar todas as ações de DELETE de um período
const deletions = await this.auditService.getLogsByPeriod(
  new Date('2024-01-15'),
  new Date('2024-01-16')
);

const suspectDeletions = deletions.filter(log => 
  log.action === 'DELETE_LEAD' && log.userId === suspectUserId
);

// Reverter ações se necessário usando snapshot "before"
```

---

## 📈 Métricas e Alertas

### Integração com Prometheus

O módulo expõe métricas para o Prometheus:

```typescript
// Contador de ações auditadas
audit_logs_total{action="CREATE_LEAD",entity="Lead",source="web"} 450

// Duração média das operações
audit_logs_duration_seconds{action="CREATE_LEAD"} 0.145

// Taxa de erros
audit_logs_errors_total{action="UPDATE_LEAD"} 12
```

### Alertas Recomendados

```yaml
# alert-rules.yml
- alert: HighAuditErrorRate
  expr: rate(audit_logs_errors_total[5m]) > 0.1
  for: 5m
  annotations:
    summary: "Taxa de erros de audit logs acima de 10%"

- alert: SuspiciousActivity
  expr: count(audit_logs_total{action="LOGIN",error!=""}) > 10
  for: 1m
  annotations:
    summary: "Múltiplas tentativas de login falhadas"
```

---

## 🎯 Próximos Passos

- [ ] Dashboard administrativo de audit logs
- [ ] Exportação de logs em CSV/PDF
- [ ] Alertas automáticos de atividades suspeitas
- [ ] Integração com SIEM (Security Information and Event Management)
- [ ] Relatórios periódicos automáticos
- [ ] Assinatura digital de logs (imutabilidade)
