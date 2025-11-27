# 🏗️ REESTRUTURAÇÃO ARQUITETURAL - ELEVARE v1.0

**Arquiteto:** Manus AI (Lead Software Architect)  
**Data:** 24/11/2025  
**Versão:** 1.0 - Arquitetura Profissional e Escalável  
**Status:** ✅ Pronto para Implementação

---

## RESUMO EXECUTIVO

A Plataforma Elevare v1.0 será uma aplicação SaaS multi-tenant, escalável e pronta para produção, focada em automação de CRM e agendamento para clínicas de estética via WhatsApp.

**Stack Tecnológico:**
- **Backend:** NestJS 10 + TypeORM + PostgreSQL 15 + Redis 7
- **Frontend:** Next.js 14 + React 19 + Tailwind CSS 4
- **Infraestrutura:** Docker + Kubernetes + AWS
- **CI/CD:** GitHub Actions
- **Monitoring:** Prometheus + Grafana + ELK Stack

**Tempo de Implementação:** 4-6 semanas com equipe de 3 devs  
**Custo de Infraestrutura:** ~$400/mês (AWS)  
**Margem Bruta Estimada:** ~70%

---

## 1. ARQUITETURA DE SISTEMA

### 1.1 Visão de Alto Nível

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTE (Browser)                        │
│                     Next.js Frontend (React 19)                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │   API Gateway   │
                    │  (Load Balancer)│
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
   ┌────▼────┐         ┌────▼────┐         ┌────▼────┐
   │ Backend  │         │ Backend  │         │ Backend  │
   │ Instance │         │ Instance │         │ Instance │
   │ (NestJS) │         │ (NestJS) │         │ (NestJS) │
   └────┬────┘         └────┬────┘         └────┬────┘
        │                    │                    │
        └────────────────────┼────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
   ┌────▼─────┐        ┌────▼─────┐        ┌────▼─────┐
   │PostgreSQL │        │  Redis   │        │   S3     │
   │ (Primary) │        │ (Cache)  │        │(Storage) │
   └──────────┘        └──────────┘        └──────────┘
        │
   ┌────▼─────┐
   │PostgreSQL │
   │(Replica)  │
   └──────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    INTEGRAÇÕES EXTERNAS                         │
│  WhatsApp API │ Make.com │ Google Calendar │ Supabase (IARA)   │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Componentes Principais

| Componente | Tecnologia | Responsabilidade |
|-----------|-----------|------------------|
| **Frontend** | Next.js 14 + React 19 | Interface de usuário, autenticação cliente |
| **Backend** | NestJS 10 + Express | Lógica de negócio, APIs, orquestração |
| **Database** | PostgreSQL 15 | Armazenamento relacional de dados |
| **Cache** | Redis 7 | Cache de dados quentes, fila de mensagens |
| **Storage** | AWS S3 | Armazenamento de arquivos (imagens, PDFs) |
| **Message Queue** | Bull (Redis) | Processamento assíncrono de tarefas |
| **Auth** | JWT + OAuth2 | Autenticação e autorização |
| **Monitoring** | Prometheus + Grafana | Observabilidade e alertas |
| **Logging** | ELK Stack | Centralização de logs |
| **CI/CD** | GitHub Actions | Automação de build, test, deploy |

---

## 2. ESTRUTURA DE PASTAS FINAL

### Backend (`backend/`)

```
backend/
├── src/
│   ├── app.module.ts                    # Módulo raiz
│   ├── main.ts                          # Bootstrap da aplicação
│   │
│   ├── common/                          # Código compartilhado
│   │   ├── decorators/
│   │   │   ├── clinic-id.decorator.ts   # Extrai clinic_id do JWT
│   │   │   ├── public.decorator.ts      # Marca rotas públicas
│   │   │   └── roles.decorator.ts       # Controle de roles
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts # Tratamento global de erros
│   │   ├── guards/
│   │   │   ├── auth.guard.ts            # Guard de autenticação JWT
│   │   │   ├── clinic.guard.ts          # Guard de isolamento multi-tenant
│   │   │   └── roles.guard.ts           # Guard de roles
│   │   ├── interceptors/
│   │   │   ├── logging.interceptor.ts   # Logging de requisições
│   │   │   ├── transform.interceptor.ts # Transformação de respostas
│   │   │   └── audit.interceptor.ts     # Audit log
│   │   ├── middleware/
│   │   │   ├── clinic-context.middleware.ts # Injeção de clinic_id
│   │   │   └── request-id.middleware.ts     # Rastreamento de requisições
│   │   ├── pipes/
│   │   │   └── validation.pipe.ts       # Validação de DTOs
│   │   └── utils/
│   │       ├── encryption.util.ts       # Criptografia de dados sensíveis
│   │       ├── phone.util.ts            # Formatação de telefones
│   │       └── date.util.ts             # Utilitários de data
│   │
│   ├── config/                          # Configuração da aplicação
│   │   ├── app.config.ts                # Configurações gerais
│   │   ├── database.config.ts           # Configurações do banco
│   │   ├── auth.config.ts               # Configurações de autenticação
│   │   ├── redis.config.ts              # Configurações do Redis
│   │   ├── whatsapp.config.ts           # Configurações do WhatsApp
│   │   └── validation.schema.ts         # Schema de validação de env vars
│   │
│   ├── database/                        # Camada de banco de dados
│   │   ├── entities/
│   │   │   ├── clinic.entity.ts
│   │   │   ├── user.entity.ts
│   │   │   ├── lead.entity.ts
│   │   │   ├── agendamento.entity.ts
│   │   │   ├── mensagem.entity.ts
│   │   │   ├── campanha.entity.ts
│   │   │   ├── fila.entity.ts
│   │   │   ├── evento.entity.ts
│   │   │   ├── audit-log.entity.ts
│   │   │   └── consent.entity.ts
│   │   ├── migrations/
│   │   │   ├── 1700000000000-initial-schema.ts
│   │   │   ├── 1700000001000-add-audit-logs.ts
│   │   │   └── ... (uma por mudança)
│   │   ├── seeders/
│   │   │   ├── clinic.seeder.ts
│   │   │   ├── user.seeder.ts
│   │   │   └── tags.seeder.ts
│   │   └── database.module.ts
│   │
│   ├── modules/                         # Módulos de negócio
│   │   ├── auth/
│   │   │   ├── auth.controller.ts       # Endpoints de auth
│   │   │   ├── auth.service.ts          # Lógica de autenticação
│   │   │   ├── jwt.strategy.ts          # Estratégia JWT Passport
│   │   │   ├── oauth.strategy.ts        # Estratégia OAuth2
│   │   │   ├── dto/
│   │   │   │   ├── login.dto.ts
│   │   │   │   ├── register.dto.ts
│   │   │   │   └── refresh-token.dto.ts
│   │   │   └── auth.module.ts
│   │   │
│   │   ├── users/
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-user.dto.ts
│   │   │   │   ├── update-user.dto.ts
│   │   │   │   └── user-response.dto.ts
│   │   │   └── users.module.ts
│   │   │
│   │   ├── clinics/
│   │   │   ├── clinics.controller.ts
│   │   │   ├── clinics.service.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-clinic.dto.ts
│   │   │   │   ├── update-clinic.dto.ts
│   │   │   │   └── clinic-response.dto.ts
│   │   │   └── clinics.module.ts
│   │   │
│   │   ├── leads/
│   │   │   ├── leads.controller.ts
│   │   │   ├── leads.service.ts
│   │   │   ├── leads-scoring.service.ts # Lógica de scoring
│   │   │   ├── leads-tagging.service.ts # Lógica de etiquetagem
│   │   │   ├── dto/
│   │   │   │   ├── create-lead.dto.ts
│   │   │   │   ├── update-lead.dto.ts
│   │   │   │   ├── lead-response.dto.ts
│   │   │   │   └── lead-filter.dto.ts
│   │   │   └── leads.module.ts
│   │   │
│   │   ├── agendamentos/
│   │   │   ├── agendamentos.controller.ts
│   │   │   ├── agendamentos.service.ts
│   │   │   ├── agendamentos-availability.service.ts # Cálculo de disponibilidade
│   │   │   ├── dto/
│   │   │   │   ├── create-agendamento.dto.ts
│   │   │   │   ├── update-agendamento.dto.ts
│   │   │   │   └── agendamento-response.dto.ts
│   │   │   └── agendamentos.module.ts
│   │   │
│   │   ├── mensagens/
│   │   │   ├── mensagens.controller.ts
│   │   │   ├── mensagens.service.ts
│   │   │   ├── mensagens-template.service.ts # Renderização de templates
│   │   │   ├── dto/
│   │   │   │   ├── create-mensagem.dto.ts
│   │   │   │   └── mensagem-response.dto.ts
│   │   │   └── mensagens.module.ts
│   │   │
│   │   ├── campanhas/
│   │   │   ├── campanhas.controller.ts
│   │   │   ├── campanhas.service.ts
│   │   │   ├── campanhas-scheduler.service.ts # Agendamento de campanhas
│   │   │   ├── dto/
│   │   │   │   ├── create-campanha.dto.ts
│   │   │   │   ├── update-campanha.dto.ts
│   │   │   │   └── campanha-response.dto.ts
│   │   │   └── campanhas.module.ts
│   │   │
│   │   ├── fila/
│   │   │   ├── fila.service.ts          # Processamento de fila
│   │   │   ├── fila.processor.ts        # Processador de jobs (Bull)
│   │   │   ├── fila.module.ts
│   │   │   └── jobs/
│   │   │       ├── send-message.job.ts
│   │   │       ├── send-email.job.ts
│   │   │       └── webhook.job.ts
│   │   │
│   │   ├── webhooks/
│   │   │   ├── webhooks.controller.ts
│   │   │   ├── webhooks.service.ts
│   │   │   ├── handlers/
│   │   │   │   ├── whatsapp-webhook.handler.ts
│   │   │   │   └── make-webhook.handler.ts
│   │   │   └── webhooks.module.ts
│   │   │
│   │   ├── relatorios/
│   │   │   ├── relatorios.controller.ts
│   │   │   ├── relatorios.service.ts
│   │   │   ├── dto/
│   │   │   │   ├── report-filter.dto.ts
│   │   │   │   └── report-response.dto.ts
│   │   │   └── relatorios.module.ts
│   │   │
│   │   └── health/
│   │       ├── health.controller.ts     # Healthcheck endpoints
│   │       └── health.module.ts
│   │
│   └── shared/                          # Código compartilhado
│       ├── constants/
│       │   ├── app.constants.ts
│       │   ├── error.constants.ts
│       │   └── business.constants.ts
│       ├── dtos/
│       │   ├── pagination.dto.ts
│       │   ├── response.dto.ts
│       │   └── error.dto.ts
│       ├── interfaces/
│       │   ├── clinic-context.interface.ts
│       │   ├── auth-user.interface.ts
│       │   └── api-response.interface.ts
│       └── types/
│           ├── clinic.types.ts
│           ├── lead.types.ts
│           └── agendamento.types.ts
│
├── test/
│   ├── unit/
│   │   ├── leads.service.spec.ts
│   │   ├── auth.service.spec.ts
│   │   └── ... (um spec por service)
│   ├── e2e/
│   │   ├── auth.e2e.spec.ts
│   │   ├── leads.e2e.spec.ts
│   │   └── ... (um spec por módulo)
│   └── fixtures/
│       ├── clinic.fixture.ts
│       ├── user.fixture.ts
│       └── lead.fixture.ts
│
├── Dockerfile
├── docker-compose.yml
├── .env.example
├── .env.test
├── package.json
├── tsconfig.json
├── jest.config.js
└── README.md
```

### Frontend (`frontend/`)

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx               # Layout raiz
│   │   ├── page.tsx                 # Home page
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   └── layout.tsx
│   │   ├── (app)/
│   │   │   ├── layout.tsx           # Layout autenticado
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── leads/
│   │   │   │   ├── page.tsx         # Lista de leads
│   │   │   │   ├── [id]/page.tsx    # Detalhe do lead
│   │   │   │   └── new/page.tsx     # Criar novo lead
│   │   │   ├── agendamentos/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── [id]/page.tsx
│   │   │   │   └── new/page.tsx
│   │   │   ├── campanhas/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── [id]/page.tsx
│   │   │   │   └── new/page.tsx
│   │   │   ├── mensagens/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── relatorios/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── leads/page.tsx
│   │   │   │   └── agendamentos/page.tsx
│   │   │   ├── configuracoes/
│   │   │   │   ├── page.tsx         # Configurações gerais
│   │   │   │   ├── clinica/page.tsx
│   │   │   │   ├── usuarios/page.tsx
│   │   │   │   └── integracao/page.tsx
│   │   │   └── perfil/page.tsx
│   │   └── api/
│   │       └── auth/
│   │           └── [...nextauth]/route.ts
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── LayoutWrapper.tsx
│   │   ├── common/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Table.tsx
│   │   │   ├── Pagination.tsx
│   │   │   ├── Loading.tsx
│   │   │   ├── Error.tsx
│   │   │   └── Toast.tsx
│   │   ├── forms/
│   │   │   ├── LeadForm.tsx
│   │   │   ├── AgendamentoForm.tsx
│   │   │   ├── CampanhaForm.tsx
│   │   │   └── ConfigForm.tsx
│   │   ├── dashboard/
│   │   │   ├── StatsCard.tsx
│   │   │   ├── LeadsChart.tsx
│   │   │   ├── AgendamentosChart.tsx
│   │   │   └── RecentActivity.tsx
│   │   └── leads/
│   │       ├── LeadsList.tsx
│   │       ├── LeadDetail.tsx
│   │       └── LeadFilter.tsx
│   │
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useClinic.ts
│   │   ├── useFetch.ts
│   │   ├── useForm.ts
│   │   └── useNotification.ts
│   │
│   ├── contexts/
│   │   ├── AuthContext.tsx
│   │   ├── ClinicContext.tsx
│   │   └── ThemeContext.tsx
│   │
│   ├── services/
│   │   ├── api.ts                   # Cliente HTTP configurado
│   │   ├── auth.service.ts
│   │   ├── leads.service.ts
│   │   ├── agendamentos.service.ts
│   │   ├── campanhas.service.ts
│   │   ├── mensagens.service.ts
│   │   └── relatorios.service.ts
│   │
│   ├── styles/
│   │   ├── globals.css
│   │   ├── variables.css
│   │   └── animations.css
│   │
│   ├── utils/
│   │   ├── format.ts
│   │   ├── validation.ts
│   │   ├── date.ts
│   │   └── storage.ts
│   │
│   ├── types/
│   │   ├── clinic.ts
│   │   ├── lead.ts
│   │   ├── agendamento.ts
│   │   ├── campanha.ts
│   │   └── api.ts
│   │
│   └── lib/
│       ├── axios.ts                 # Configuração do Axios
│       ├── react-query.ts           # Configuração do TanStack Query
│       └── zustand.ts               # Configuração do Zustand
│
├── public/
│   ├── logo.svg
│   ├── favicon.ico
│   └── images/
│
├── Dockerfile
├── docker-compose.yml
├── .env.example
├── .env.local
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.js
└── README.md
```

### Infraestrutura (`infra/`)

```
infra/
├── docker-compose.yml               # Dev environment
├── docker-compose.prod.yml          # Prod environment
├── k8s/
│   ├── namespace.yaml
│   ├── backend/
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   ├── configmap.yaml
│   │   ├── secret.yaml
│   │   └── hpa.yaml
│   ├── frontend/
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   └── ingress.yaml
│   ├── database/
│   │   ├── statefulset.yaml
│   │   ├── pvc.yaml
│   │   └── service.yaml
│   ├── redis/
│   │   ├── deployment.yaml
│   │   └── service.yaml
│   ├── monitoring/
│   │   ├── prometheus-config.yaml
│   │   ├── grafana-deployment.yaml
│   │   └── alertmanager.yaml
│   └── ingress.yaml
├── terraform/
│   ├── main.tf
│   ├── variables.tf
│   ├── outputs.tf
│   ├── vpc.tf
│   ├── rds.tf
│   ├── elasticache.tf
│   ├── eks.tf
│   ├── s3.tf
│   └── terraform.tfvars.example
└── scripts/
    ├── deploy.sh
    ├── rollback.sh
    ├── backup.sh
    └── migrate.sh
```

### Documentação (`docs/`)

```
docs/
├── README.md                        # Visão geral do projeto
├── ARCHITECTURE.md                  # Arquitetura detalhada
├── API.md                           # Documentação de APIs
├── DATABASE.md                      # Schema do banco de dados
├── DEPLOYMENT.md                    # Guia de deploy
├── DEVELOPMENT.md                   # Guia de desenvolvimento
├── SECURITY.md                      # Guia de segurança e LGPD
├── TROUBLESHOOTING.md               # Resolução de problemas
├── ROADMAP.md                       # Roadmap de features
└── CHANGELOG.md                     # Histórico de mudanças
```

---

## 3. PADRÕES DE CÓDIGO

### 3.1 Estrutura de Serviço

```typescript
// leads.service.ts
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lead } from '../database/entities/lead.entity';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';

@Injectable()
export class LeadsService {
  private readonly logger = new Logger(LeadsService.name);

  constructor(
    @InjectRepository(Lead)
    private readonly leadsRepository: Repository<Lead>,
  ) {}

  async create(clinicId: string, dto: CreateLeadDto): Promise<Lead> {
    this.logger.debug(`Creating lead for clinic ${clinicId}`, dto);
    
    const lead = this.leadsRepository.create({
      ...dto,
      clinicId,
      score: 0,
      stage: 'cold',
    });

    return await this.leadsRepository.save(lead);
  }

  async findAll(clinicId: string, page = 1, limit = 20): Promise<{ data: Lead[]; total: number }> {
    const [data, total] = await this.leadsRepository.findAndCount({
      where: { clinicId },
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return { data, total };
  }

  async findById(clinicId: string, id: string): Promise<Lead> {
    const lead = await this.leadsRepository.findOne({
      where: { id, clinicId },
    });

    if (!lead) {
      throw new NotFoundException(`Lead ${id} not found`);
    }

    return lead;
  }

  async update(clinicId: string, id: string, dto: UpdateLeadDto): Promise<Lead> {
    const lead = await this.findById(clinicId, id);
    Object.assign(lead, dto);
    return await this.leadsRepository.save(lead);
  }

  async delete(clinicId: string, id: string): Promise<void> {
    const result = await this.leadsRepository.delete({ id, clinicId });
    if (result.affected === 0) {
      throw new NotFoundException(`Lead ${id} not found`);
    }
  }
}
```

### 3.2 Estrutura de Controller

```typescript
// leads.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ClinicGuard } from '../common/guards/clinic.guard';
import { ClinicId } from '../common/decorators/clinic-id.decorator';
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { PaginationDto } from '../shared/dtos/pagination.dto';

@Controller('leads')
@UseGuards(AuthGuard('jwt'), ClinicGuard)
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post()
  async create(@ClinicId() clinicId: string, @Body() dto: CreateLeadDto) {
    return await this.leadsService.create(clinicId, dto);
  }

  @Get()
  async findAll(
    @ClinicId() clinicId: string,
    @Query() pagination: PaginationDto,
  ) {
    return await this.leadsService.findAll(
      clinicId,
      pagination.page,
      pagination.limit,
    );
  }

  @Get(':id')
  async findById(@ClinicId() clinicId: string, @Param('id') id: string) {
    return await this.leadsService.findById(clinicId, id);
  }

  @Put(':id')
  async update(
    @ClinicId() clinicId: string,
    @Param('id') id: string,
    @Body() dto: UpdateLeadDto,
  ) {
    return await this.leadsService.update(clinicId, id, dto);
  }

  @Delete(':id')
  async delete(@ClinicId() clinicId: string, @Param('id') id: string) {
    return await this.leadsService.delete(clinicId, id);
  }
}
```

### 3.3 Estrutura de DTO

```typescript
// create-lead.dto.ts
import {
  IsString,
  IsEmail,
  IsOptional,
  MinLength,
  MaxLength,
  IsPhoneNumber,
  IsEnum,
} from 'class-validator';

export class CreateLeadDto {
  @IsString()
  @MinLength(3, { message: 'Nome deve ter no mínimo 3 caracteres' })
  @MaxLength(100, { message: 'Nome deve ter no máximo 100 caracteres' })
  nome: string;

  @IsPhoneNumber('BR', { message: 'Telefone inválido' })
  telefone: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email inválido' })
  email?: string;

  @IsOptional()
  @IsString()
  interesse?: string;

  @IsOptional()
  @IsEnum(['google', 'facebook', 'instagram', 'indicacao', 'website'])
  origem?: string;

  @IsOptional()
  @IsString()
  observacoes?: string;
}
```

---

## 4. CONTRATOS DE API

### 4.1 Autenticação

```
POST /auth/login
Content-Type: application/json

{
  "email": "user@clinic.com",
  "password": "password123"
}

Response: 200 OK
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "user@clinic.com",
    "name": "João Silva",
    "role": "admin",
    "clinic_id": "uuid"
  }
}
```

### 4.2 Leads

```
GET /leads?page=1&limit=20
Authorization: Bearer <access_token>
X-Clinic-ID: <clinic_id>

Response: 200 OK
{
  "data": [
    {
      "id": "uuid",
      "nome": "Maria Silva",
      "telefone": "+5511999999999",
      "email": "maria@email.com",
      "score": 75,
      "stage": "warm",
      "tags": ["VIP", "Facial"],
      "origem": "google",
      "created_at": "2025-11-24T10:00:00Z",
      "updated_at": "2025-11-24T10:00:00Z"
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 20
}
```

```
POST /leads
Authorization: Bearer <access_token>
X-Clinic-ID: <clinic_id>
Content-Type: application/json

{
  "nome": "Maria Silva",
  "telefone": "+5511999999999",
  "email": "maria@email.com",
  "interesse": "depilação a laser",
  "origem": "google"
}

Response: 201 Created
{
  "id": "uuid",
  "nome": "Maria Silva",
  "telefone": "+5511999999999",
  "email": "maria@email.com",
  "score": 20,
  "stage": "cold",
  "tags": [],
  "origem": "google",
  "created_at": "2025-11-24T10:00:00Z"
}
```

### 4.3 Agendamentos

```
POST /agendamentos
Authorization: Bearer <access_token>
X-Clinic-ID: <clinic_id>
Content-Type: application/json

{
  "lead_id": "uuid",
  "procedimento": "depilação a laser",
  "data_hora": "2025-11-25T14:00:00Z",
  "duracao_minutos": 60,
  "profissional_id": "uuid"
}

Response: 201 Created
{
  "id": "uuid",
  "lead_id": "uuid",
  "procedimento": "depilação a laser",
  "data_hora": "2025-11-25T14:00:00Z",
  "duracao_minutos": 60,
  "status": "confirmado",
  "created_at": "2025-11-24T10:00:00Z"
}
```

---

## 5. DIAGRAMA DE DEPENDÊNCIAS

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Pages │ Components │ Hooks │ Services │ Contexts    │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │  API Client (Axios)          │
        │  - Interceptors              │
        │  - Error handling            │
        │  - Auth headers              │
        └──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend (NestJS)                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Controllers │ Services │ Guards │ Interceptors      │  │
│  └──────────────────────────────────────────────────────┘  │
│                       │                                     │
│  ┌────────────────────┼────────────────────┐               │
│  │                    │                    │               │
│  ▼                    ▼                    ▼               │
│ ┌──────────┐  ┌──────────────┐  ┌──────────────┐          │
│ │ Modules  │  │ Database     │  │ Cache/Queue  │          │
│ │ (Auth,   │  │ (TypeORM)    │  │ (Redis)      │          │
│ │ Leads,   │  │              │  │              │          │
│ │ etc.)    │  │              │  │              │          │
│ └──────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────┘
        │                    │                    │
        ▼                    ▼                    ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ PostgreSQL   │  │ Redis        │  │ S3 Storage   │
│ (Primary)    │  │ (Cache/Queue)│  │ (Files)      │
└──────────────┘  └──────────────┘  └──────────────┘
        │
        ▼
┌──────────────┐
│ PostgreSQL   │
│ (Replica)    │
└──────────────┘

Integrações Externas:
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ WhatsApp API │  │ Make.com     │  │ Google Cal.  │
│ (Meta)       │  │ (Webhooks)   │  │ (Calendar)   │
└──────────────┘  └──────────────┘  └──────────────┘
```

---

## 6. FLUXO DE AUTENTICAÇÃO MULTI-TENANT

```
1. Login
   ├─ POST /auth/login (email, password)
   ├─ Validar credenciais
   ├─ Gerar JWT com clinic_id no payload
   └─ Retornar access_token + refresh_token

2. Requisição Autenticada
   ├─ GET /leads (Header: Authorization: Bearer <token>)
   ├─ AuthGuard extrai clinic_id do JWT
   ├─ ClinicGuard valida se clinic_id é válido
   ├─ ClinicIdDecorator injeta clinic_id no handler
   └─ Service usa clinic_id para filtrar dados

3. Isolamento de Dados
   ├─ Toda query filtra por clinic_id
   ├─ Usuário de clinic A não vê dados de clinic B
   ├─ Audit log registra todas as operações
   └─ LGPD compliance garantido
```

---

## 7. STACK FINAL RESUMIDO

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| **Frontend** | Next.js | 14 |
| **Frontend** | React | 19 |
| **Frontend** | Tailwind CSS | 4 |
| **Frontend** | TanStack Query | 5 |
| **Frontend** | Zustand | 4 |
| **Frontend** | Axios | 1 |
| **Backend** | NestJS | 10 |
| **Backend** | Express | 4 |
| **Backend** | TypeORM | 0.3 |
| **Backend** | PostgreSQL | 15 |
| **Backend** | Redis | 7 |
| **Backend** | Bull | 4 |
| **Backend** | Passport | 0.7 |
| **Backend** | JWT | 9 |
| **Backend** | class-validator | 0.14 |
| **Backend** | Pino | 8 |
| **Testing** | Jest | 29 |
| **Testing** | Supertest | 6 |
| **Testing** | Vitest | 1 |
| **CI/CD** | GitHub Actions | - |
| **Container** | Docker | 24 |
| **Orquestração** | Kubernetes | 1.28 |
| **Cloud** | AWS | - |
| **Monitoring** | Prometheus | 2 |
| **Monitoring** | Grafana | 10 |
| **Logging** | ELK Stack | 8 |

---

## 8. PRÓXIMOS PASSOS

1. ✅ **AUDITORIA GLOBAL 360°** (concluída)
2. ✅ **REESTRUTURAÇÃO ARQUITETURAL** (concluída)
3. ⏳ **SCAFFOLD & SCRIPTS** - Gerar código
4. ⏳ **IARA & LARA** - Fluxos executáveis
5. ⏳ **DOCUMENTAÇÃO E ROADMAP** - Tudo documentado

**Tempo estimado para produção:** 4-6 semanas com equipe de 3 devs.

---

**Fim da Reestruturação Arquitetural v1.0**  
**Próximo: Scaffold & Scripts - Geração de Código**
