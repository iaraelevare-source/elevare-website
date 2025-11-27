# Elevare Backend - API para Automação de Clínicas de Estética

Backend completo em NestJS 10 para SaaS de automação de clínicas de estética, com autenticação JWT, gerenciamento de leads com scoring automático e sistema de agendamentos.

## 🚀 Tecnologias

- **NestJS 10** - Framework Node.js progressivo
- **TypeORM** - ORM para TypeScript e JavaScript
- **PostgreSQL** - Banco de dados relacional
- **Redis** - Cache e sessões
- **JWT** - Autenticação segura
- **Swagger** - Documentação automática da API
- **Docker** - Containerização

## 📋 Funcionalidades

### Autenticação
- ✅ Login com JWT
- ✅ Registro de usuários
- ✅ Proteção de rotas
- ✅ Roles (admin, gerente, atendente)

### Leads
- ✅ CRUD completo
- ✅ **Scoring automático** (0-100 pontos)
- ✅ Filtros por status e score
- ✅ Múltiplas origens (site, Instagram, Facebook, etc)

### Agendamentos
- ✅ CRUD completo
- ✅ Validação de conflitos de horário
- ✅ Filtros por período e status
- ✅ Confirmação de presença

### Segurança
- ✅ Rate limiting
- ✅ Validação de dados
- ✅ Hash de senhas (bcrypt)
- ✅ Guards customizados

## 🛠️ Instalação

### Pré-requisitos

- Node.js 22+
- PostgreSQL 15+
- Redis 7+
- Docker (opcional)

### Instalação Local

```bash
# Instalar dependências
npm install

# Copiar arquivo de ambiente
cp .env.example .env

# Editar .env com suas configurações
nano .env

# Executar migrations
npm run migration:run

# Executar seed (dados de teste)
npm run seed

# Iniciar em modo desenvolvimento
npm run start:dev
```

### Instalação com Docker

```bash
# Iniciar todos os serviços
docker-compose up -d

# Ver logs
docker-compose logs -f api

# Parar serviços
docker-compose down
```

## 📚 Documentação da API

Após iniciar o servidor, acesse:

- **Swagger UI**: http://localhost:3000/api/docs
- **API Base URL**: http://localhost:3000/api

## 🔑 Credenciais de Teste

Após executar o seed, você pode usar:

- **Admin**: `admin@elevare.com` / `senha123`
- **Atendente**: `atendente@elevare.com` / `senha123`

## 📊 Sistema de Scoring de Leads

O scoring é calculado automaticamente com base nos seguintes critérios:

| Critério | Pontos |
|----------|--------|
| Tem WhatsApp | +20 |
| Faixa etária ideal (26-45 anos) | +15 |
| Já realizou procedimento | +25 |
| Procedimento de interesse preenchido | +20 |
| Origem qualificada (indicação/Google) | +20 |

**Score máximo**: 100 pontos

## 🗂️ Estrutura do Projeto

```
backend/
├── src/
│   ├── app.module.ts          # Módulo principal
│   ├── main.ts                # Ponto de entrada
│   ├── config/                # Configurações
│   │   ├── database.config.ts
│   │   └── validation.schema.ts
│   ├── database/
│   │   ├── entities/          # Entidades TypeORM
│   │   ├── migrations/        # Migrations
│   │   └── seeders/           # Seeds
│   ├── modules/
│   │   ├── auth/              # Autenticação JWT
│   │   ├── leads/             # Gerenciamento de leads
│   │   └── agendamentos/      # Gerenciamento de agendamentos
│   └── common/
│       ├── guards/            # Guards customizados
│       └── decorators/        # Decorators customizados
├── Dockerfile
├── docker-compose.yml
└── package.json
```

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run start:dev          # Inicia em modo watch
npm run start:debug        # Inicia com debug

# Produção
npm run build              # Compila o projeto
npm run start:prod         # Inicia em produção

# Banco de dados
npm run migration:generate # Gera migration
npm run migration:run      # Executa migrations
npm run seed               # Popula banco com dados de teste

# Testes
npm run test               # Executa testes
npm run test:watch         # Testes em modo watch
npm run test:cov           # Cobertura de testes
```

## 🌐 Endpoints Principais

### Autenticação
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Registro

### Leads
- `GET /api/leads` - Listar leads
- `GET /api/leads?status=novo` - Filtrar por status
- `GET /api/leads?minScore=70` - Filtrar por score mínimo
- `POST /api/leads` - Criar lead
- `PATCH /api/leads/:id` - Atualizar lead
- `DELETE /api/leads/:id` - Remover lead

### Agendamentos
- `GET /api/agendamentos` - Listar agendamentos
- `GET /api/agendamentos?status=confirmado` - Filtrar por status
- `GET /api/agendamentos?dataInicio=2024-01-01&dataFim=2024-12-31` - Filtrar por período
- `POST /api/agendamentos` - Criar agendamento
- `PATCH /api/agendamentos/:id` - Atualizar agendamento
- `DELETE /api/agendamentos/:id` - Remover agendamento

## 📝 Variáveis de Ambiente

```env
NODE_ENV=development
PORT=3000

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=elevare_db

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=seu_secret_super_seguro_aqui
JWT_EXPIRATION=7d

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=10
```

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT.

## 👨‍💻 Autor

Desenvolvido por **Elevare Team**
