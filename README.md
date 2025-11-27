# Elevare - Plataforma SaaS de Automação para Clínicas de Estética

![Status](https://img.shields.io/badge/Status-Em%20Desenvolvimento-yellow)
![Backend](https://img.shields.io/badge/Backend-NestJS%2010-green)
![Frontend](https://img.shields.io/badge/Frontend-Vanilla%20JS-blue)
![Database](https://img.shields.io/badge/Database-PostgreSQL%2015-blue)
![Score](https://img.shields.io/badge/Maturidade-2%2F10-red)

## 📋 Visão Geral

Plataforma SaaS multi-tenant para automação de clínicas de estética, com foco em gestão de leads, agendamentos e automação via WhatsApp através da assistente inteligente **IARA**.

### 🎯 Objetivos Principais

- **Automatizar atendimento** via WhatsApp com IA (IARA)
- **Qualificar leads** com scoring automático
- **Agendar procedimentos** com validação de conflitos
- **Integrar** Google Calendar, WhatsApp Meta API, Make.com
- **Escalar** para múltiplas clínicas (multi-tenant)

---

## 📊 Status do Projeto

### Score de Maturidade: **2/10** 🔴

| Componente | Status | Progresso |
|------------|--------|-----------|
| **Requisitos Funcionais** | ✅ Completo | 100% |
| **Arquitetura** | 🟠 Parcial | 40% |
| **Backend Implementado** | 🟢 MVP | 60% |
| **Frontend Implementado** | 🟢 MVP | 50% |
| **Banco de Dados** | 🟠 Schema | 30% |
| **Autenticação JWT** | ✅ Completo | 100% |
| **Testes** | 🔴 Ausente | 0% |
| **Segurança (LGPD)** | 🔴 Ausente | 0% |
| **CI/CD** | 🔴 Ausente | 0% |
| **Documentação Técnica** | 🟠 Parcial | 40% |

### ✅ O que está PRONTO

- ✅ Backend NestJS 10 com TypeORM
- ✅ Autenticação JWT (login/registro)
- ✅ CRUD de Leads com scoring automático
- ✅ CRUD de Agendamentos com validação de conflitos
- ✅ Frontend com modais de autenticação
- ✅ Dashboard com lista de leads
- ✅ Integração API REST completa
- ✅ Swagger documentado
- ✅ Docker + Docker Compose
- ✅ Seed com dados de teste

### 🟠 O que está PARCIAL

- 🟠 Migrations do banco de dados
- 🟠 Integrações externas (WhatsApp, Google Calendar)
- 🟠 Sistema de campanhas
- 🟠 Relatórios e BI
- 🟠 Gestão de mensagens

### 🔴 O que FALTA (Crítico)

- 🔴 Testes automatizados (Jest, E2E)
- 🔴 LGPD compliance (consentimento, anonimização)
- 🔴 CI/CD pipeline (GitHub Actions)
- 🔴 Monitoring e logging (Prometheus, ELK)
- 🔴 Rate limiting avançado
- 🔴 Backup e disaster recovery
- 🔴 Frontend Next.js (migração)
- 🔴 Webhooks (Make.com, WhatsApp)

---

## 🏗️ Arquitetura

### Stack Tecnológico

**Backend:**
- NestJS 10 (Node.js 22)
- TypeORM
- PostgreSQL 15
- Redis 7
- JWT Authentication
- Swagger/OpenAPI

**Frontend:**
- Vanilla JavaScript (MVP)
- Tailwind CSS
- Lucide Icons
- Fetch API

**DevOps:**
- Docker + Docker Compose
- GitHub (controle de versão)
- (Planejado) GitHub Actions CI/CD
- (Planejado) Kubernetes

**Integrações:**
- (Planejado) WhatsApp Meta API
- (Planejado) Google Calendar API
- (Planejado) Make.com Webhooks

### Estrutura de Pastas

```
elevare-website/
├── backend/                    # Backend NestJS
│   ├── src/
│   │   ├── config/            # Configurações
│   │   ├── database/          # Entidades e migrations
│   │   │   ├── entities/      # User, Clinic, Lead, Agendamento
│   │   │   ├── migrations/
│   │   │   └── seeders/
│   │   ├── modules/
│   │   │   ├── auth/          # Autenticação JWT
│   │   │   ├── leads/         # Gestão de leads
│   │   │   └── agendamentos/  # Gestão de agendamentos
│   │   ├── common/            # Guards, decorators
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── package.json
├── js/                         # Frontend JavaScript
│   ├── api.js                 # Cliente de API
│   ├── auth.js                # Autenticação
│   └── app.js                 # Inicialização
├── docs/                       # Documentação
│   ├── ARQUITETURA_V1.0.md
│   ├── AUDITORIA_GLOBAL_360.md
│   ├── DOCUMENTACAO_ROADMAP_120DIAS.md
│   ├── IARA_LARA_FLUXOS.md
│   ├── SCAFFOLD_COMPLETO.md
│   ├── CHANGELOG.md
│   └── todo.md
├── images/                     # Assets
├── index_new.html             # Homepage
├── dashboard.html             # Dashboard
└── README.md                  # Este arquivo
```

---

## 🚀 Instalação e Execução

### Pré-requisitos

- Node.js 22+
- PostgreSQL 15+
- Redis 7+
- Docker (opcional)

### 1. Instalação Local

```bash
# Clone o repositório
git clone https://github.com/iaraelevare-source/elevare-website.git
cd elevare-website

# Backend
cd backend
npm install
cp .env.example .env
# Editar .env com suas credenciais

# Executar migrations
npm run migration:run

# Executar seed (dados de teste)
npm run seed

# Iniciar backend
npm run start:dev
```

### 2. Instalação com Docker

```bash
cd backend
docker-compose up -d
```

### 3. Acessar Aplicação

- **Homepage:** http://localhost:8080/index_new.html
- **Dashboard:** http://localhost:8080/dashboard.html
- **API Backend:** http://localhost:3000/api
- **Swagger Docs:** http://localhost:3000/api/docs

### 4. Credenciais de Teste

```
Admin:
Email: admin@elevare.com
Senha: senha123

Atendente:
Email: atendente@elevare.com
Senha: senha123
```

---

## 📚 Documentação

### Documentos Principais

1. **[ARQUITETURA_V1.0.md](docs/ARQUITETURA_V1.0.md)** - Arquitetura completa do sistema
2. **[AUDITORIA_GLOBAL_360.md](docs/AUDITORIA_GLOBAL_360.md)** - Diagnóstico técnico e gaps
3. **[DOCUMENTACAO_ROADMAP_120DIAS.md](docs/DOCUMENTACAO_ROADMAP_120DIAS.md)** - Roadmap de 120 dias
4. **[IARA_LARA_FLUXOS.md](docs/IARA_LARA_FLUXOS.md)** - Fluxos de IA (IARA e LARA)
5. **[SCAFFOLD_COMPLETO.md](docs/SCAFFOLD_COMPLETO.md)** - Código scaffoldado
6. **[CHANGELOG.md](docs/CHANGELOG.md)** - Histórico de mudanças
7. **[todo.md](docs/todo.md)** - Plano de trabalho

### API Endpoints

#### Autenticação
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Registro

#### Leads
- `GET /api/leads` - Listar leads
- `GET /api/leads?status=novo` - Filtrar por status
- `GET /api/leads?minScore=70` - Filtrar por score mínimo
- `POST /api/leads` - Criar lead
- `PATCH /api/leads/:id` - Atualizar lead
- `DELETE /api/leads/:id` - Remover lead

#### Agendamentos
- `GET /api/agendamentos` - Listar agendamentos
- `GET /api/agendamentos?status=confirmado` - Filtrar por status
- `POST /api/agendamentos` - Criar agendamento
- `PATCH /api/agendamentos/:id` - Atualizar agendamento
- `DELETE /api/agendamentos/:id` - Remover agendamento

---

## 🎯 Roadmap 120 Dias

### Sprint 1-2: MVP Backend (✅ CONCLUÍDO)
- ✅ Autenticação JWT
- ✅ CRUD Leads com scoring
- ✅ CRUD Agendamentos
- ✅ Swagger documentado

### Sprint 3-4: Frontend MVP (✅ CONCLUÍDO)
- ✅ Homepage com modais de auth
- ✅ Dashboard com lista de leads
- ✅ Integração com API

### Sprint 5-6: Integrações (🔴 PENDENTE)
- 🔴 WhatsApp Meta API
- 🔴 Google Calendar API
- 🔴 Make.com Webhooks
- 🔴 IARA (assistente IA)

### Sprint 7-8: Segurança & Compliance (🔴 PENDENTE)
- 🔴 LGPD compliance
- 🔴 Rate limiting avançado
- 🔴 Audit logs
- 🔴 Backup automático

### Sprint 9-10: Testes & CI/CD (🔴 PENDENTE)
- 🔴 Testes unitários (Jest)
- 🔴 Testes E2E
- 🔴 GitHub Actions CI/CD
- 🔴 Deploy automatizado

### Sprint 11-12: Escalabilidade (🔴 PENDENTE)
- 🔴 Kubernetes
- 🔴 Monitoring (Prometheus)
- 🔴 Logging (ELK)
- 🔴 Performance optimization

---

## 🔐 Segurança

### Implementado ✅
- ✅ JWT Authentication
- ✅ Bcrypt password hashing
- ✅ CORS configurado
- ✅ Helmet (headers de segurança)
- ✅ Rate limiting básico

### Pendente 🔴
- 🔴 LGPD compliance (consentimento, anonimização)
- 🔴 2FA (autenticação de dois fatores)
- 🔴 OAuth2 (Google, Facebook)
- 🔴 Audit logs
- 🔴 Encryption at rest
- 🔴 WAF (Web Application Firewall)

---

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'feat: Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

---

## 📞 Suporte

- **Email:** contato@elevare.com.br
- **WhatsApp:** +55 27 99921-7624
- **GitHub Issues:** [Reportar problema](https://github.com/iaraelevare-source/elevare-website/issues)

---

## 📄 Licença

Este projeto é proprietário e confidencial. Todos os direitos reservados © 2024 Elevare.

---

## 🏆 Equipe

- **Arquiteto:** Manus AI (Lead Software Architect)
- **Product Owner:** Iara Elevare
- **Desenvolvimento:** Elevare Team

---

**Última atualização:** 27/11/2024  
**Versão:** 1.0.0-MVP
