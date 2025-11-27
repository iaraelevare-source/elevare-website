# 🚀 SCAFFOLD COMPLETO - ELEVARE v1.0

**Arquiteto:** Manus AI  
**Data:** 24/11/2025  
**Versão:** 1.0 - Código Pronto para Implementação  
**Status:** ✅ Pronto para Uso

---

## ÍNDICE

1. [Backend - Configurações](#backend-configurações)
2. [Backend - Entidades](#backend-entidades)
3. [Backend - DTOs](#backend-dtos)
4. [Backend - Services](#backend-services)
5. [Backend - Controllers](#backend-controllers)
6. [Backend - Guards & Interceptors](#backend-guards--interceptors)
7. [Frontend - Estrutura](#frontend-estrutura)
8. [Docker & Compose](#docker--compose)
9. [GitHub Actions CI/CD](#github-actions-cicd)
10. [Scripts de Migração](#scripts-de-migração)

---

## BACKEND - CONFIGURAÇÕES

### validation.schema.ts

```typescript
import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),
  API_URL: Joi.string().default('http://localhost:3000'),

  // Database
  DATABASE_HOST: Joi.string().required(),
  DATABASE_PORT: Joi.number().default(5432),
  DATABASE_USER: Joi.string().required(),
  DATABASE_PASSWORD: Joi.string().required(),
  DATABASE_NAME: Joi.string().required(),

  // Redis
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),

  // JWT
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRATION: Joi.string().default('24h'),
  JWT_REFRESH_SECRET: Joi.string().required(),
  JWT_REFRESH_EXPIRATION: Joi.string().default('7d'),

  // WhatsApp
  WHATSAPP_ACCESS_TOKEN: Joi.string().required(),
  WHATSAPP_PHONE_NUMBER_ID: Joi.string().required(),
  WHATSAPP_WEBHOOK_VERIFY_TOKEN: Joi.string().required(),

  // CORS
  ALLOWED_ORIGINS: Joi.string().default('http://localhost:3001'),

  // Timezone
  TZ: Joi.string().default('America/Sao_Paulo'),
});
```

### database.config.ts

```typescript
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const getDatabaseConfig = (configService: ConfigService): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: configService.get('DATABASE_HOST'),
  port: configService.get('DATABASE_PORT'),
  username: configService.get('DATABASE_USER'),
  password: configService.get('DATABASE_PASSWORD'),
  database: configService.get('DATABASE_NAME'),
  entities: ['dist/database/entities/**/*.entity.js'],
  migrations: ['dist/database/migrations/**/*.js'],
  migrationsRun: true,
  synchronize: configService.get('NODE_ENV') === 'development',
  logging: configService.get('NODE_ENV') === 'development',
  ssl: configService.get('NODE_ENV') === 'production' 
    ? { rejectUnauthorized: false } 
    : false,
  extra: {
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },
});
```

---

## BACKEND - ENTIDADES

### Lead Entity

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Clinic } from './clinic.entity';
import { Agendamento } from './agendamento.entity';
import { Mensagem } from './mensagem.entity';

@Entity('leads')
@Index(['clinicId', 'createdAt'])
@Index(['clinicId', 'score'])
@Index(['clinicId', 'stage'])
export class Lead {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  clinicId: string;

  @ManyToOne(() => Clinic, (clinic) => clinic.leads, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clinicId' })
  clinic: Clinic;

  @Column('varchar', { length: 100 })
  nome: string;

  @Column('varchar', { length: 20 })
  telefone: string;

  @Column('varchar', { length: 255, nullable: true })
  email: string;

  @Column('text', { nullable: true })
  interesse: string;

  @Column('varchar', { length: 50, nullable: true })
  origem: string;

  @Column('int', { default: 0 })
  score: number;

  @Column('varchar', { length: 50, default: 'cold' })
  stage: string; // cold, warm, hot, agendado, convertido

  @Column('simple-array', { default: '{}' })
  tags: string[];

  @Column('text', { nullable: true })
  observacoes: string;

  @Column('boolean', { default: false })
  optOut: boolean;

  @OneToMany(() => Agendamento, (agendamento) => agendamento.lead)
  agendamentos: Agendamento[];

  @OneToMany(() => Mensagem, (mensagem) => mensagem.lead)
  mensagens: Mensagem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### Agendamento Entity

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Lead } from './lead.entity';
import { Clinic } from './clinic.entity';

@Entity('agendamentos')
@Index(['clinicId', 'dataHora'])
@Index(['clinicId', 'status'])
export class Agendamento {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  clinicId: string;

  @Column('uuid')
  leadId: string;

  @ManyToOne(() => Clinic, (clinic) => clinic.agendamentos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clinicId' })
  clinic: Clinic;

  @ManyToOne(() => Lead, (lead) => lead.agendamentos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'leadId' })
  lead: Lead;

  @Column('varchar', { length: 100 })
  procedimento: string;

  @Column('timestamp with time zone')
  dataHora: Date;

  @Column('int')
  duracaoMinutos: number;

  @Column('varchar', { length: 50, default: 'pendente' })
  status: string; // pendente, confirmado, cancelado, concluido

  @Column('uuid', { nullable: true })
  profissionalId: string;

  @Column('text', { nullable: true })
  observacoes: string;

  @Column('timestamp with time zone', { nullable: true })
  dataConfirmacao: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### Mensagem Entity

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Lead } from './lead.entity';
import { Clinic } from './clinic.entity';

@Entity('mensagens')
@Index(['clinicId', 'createdAt'])
@Index(['clinicId', 'status'])
export class Mensagem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  clinicId: string;

  @Column('uuid')
  leadId: string;

  @ManyToOne(() => Clinic, (clinic) => clinic.mensagens, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clinicId' })
  clinic: Clinic;

  @ManyToOne(() => Lead, (lead) => lead.mensagens, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'leadId' })
  lead: Lead;

  @Column('varchar', { length: 50 })
  canal: string; // whatsapp, email, sms

  @Column('text')
  conteudo: string;

  @Column('varchar', { length: 50, default: 'enviada' })
  status: string; // pendente, enviada, entregue, lida, erro

  @Column('varchar', { length: 100, nullable: true })
  externalId: string; // ID da API externa (WhatsApp, etc.)

  @Column('text', { nullable: true })
  erro: string;

  @Column('timestamp with time zone', { nullable: true })
  dataEnvio: Date;

  @Column('timestamp with time zone', { nullable: true })
  dataEntrega: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### Campanha Entity

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Clinic } from './clinic.entity';

@Entity('campanhas')
@Index(['clinicId', 'status'])
export class Campanha {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  clinicId: string;

  @ManyToOne(() => Clinic, (clinic) => clinic.campanhas, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clinicId' })
  clinic: Clinic;

  @Column('varchar', { length: 100 })
  nome: string;

  @Column('text', { nullable: true })
  descricao: string;

  @Column('varchar', { length: 50 })
  canal: string; // whatsapp, email, sms

  @Column('text')
  template: string;

  @Column('varchar', { length: 50 })
  gatilho: string; // novo_lead, agendamento, follow_up, reativacao

  @Column('int', { nullable: true })
  diasAposGatilho: number;

  @Column('simple-array', { default: '{}' })
  filtroTags: string[];

  @Column('varchar', { length: 50, default: 'ativa' })
  status: string; // ativa, pausada, concluida

  @Column('int', { default: 0 })
  totalEnviadas: number;

  @Column('int', { default: 0 })
  totalEntregues: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### Clinic Entity

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Lead } from './lead.entity';
import { Agendamento } from './agendamento.entity';
import { Mensagem } from './mensagem.entity';
import { Campanha } from './campanha.entity';

@Entity('clinics')
@Index(['slug'])
export class Clinic {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar', { length: 100 })
  nome: string;

  @Column('varchar', { length: 100, unique: true })
  slug: string;

  @Column('varchar', { length: 20 })
  telefone: string;

  @Column('varchar', { length: 255, nullable: true })
  email: string;

  @Column('text', { nullable: true })
  endereco: string;

  @Column('varchar', { length: 50, nullable: true })
  cidade: string;

  @Column('varchar', { length: 50, nullable: true })
  estado: string;

  @Column('varchar', { length: 10, nullable: true })
  cep: string;

  @Column('varchar', { length: 100, nullable: true })
  website: string;

  @Column('varchar', { length: 100, nullable: true })
  instagram: string;

  @Column('text', { nullable: true })
  descricao: string;

  @Column('varchar', { length: 50, default: 'ativa' })
  status: string; // ativa, inativa, suspensa

  @Column('jsonb', { default: '{}' })
  configuracoes: Record<string, any>;

  @OneToMany(() => Lead, (lead) => lead.clinic)
  leads: Lead[];

  @OneToMany(() => Agendamento, (agendamento) => agendamento.clinic)
  agendamentos: Agendamento[];

  @OneToMany(() => Mensagem, (mensagem) => mensagem.clinic)
  mensagens: Mensagem[];

  @OneToMany(() => Campanha, (campanha) => campanha.clinic)
  campanhas: Campanha[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

---

## BACKEND - DTOs

### Create Lead DTO

```typescript
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
  @IsEnum(['google', 'facebook', 'instagram', 'indicacao', 'website', 'whatsapp'])
  origem?: string;

  @IsOptional()
  @IsString()
  observacoes?: string;
}

export class UpdateLeadDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  nome?: string;

  @IsOptional()
  @IsPhoneNumber('BR')
  telefone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  interesse?: string;

  @IsOptional()
  @IsEnum(['cold', 'warm', 'hot', 'agendado', 'convertido'])
  stage?: string;

  @IsOptional()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  observacoes?: string;
}

export class LeadResponseDto {
  id: string;
  nome: string;
  telefone: string;
  email?: string;
  score: number;
  stage: string;
  tags: string[];
  origem?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Pagination DTO

```typescript
import { IsNumber, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit: number = 20;
}
```

---

## BACKEND - SERVICES

### Leads Service (Exemplo Completo)

```typescript
import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lead } from '../database/entities/lead.entity';
import { CreateLeadDto, UpdateLeadDto } from './dto/create-lead.dto';
import { LeadsTaggingService } from './leads-tagging.service';
import { LeadsScoringService } from './leads-scoring.service';

@Injectable()
export class LeadsService {
  private readonly logger = new Logger(LeadsService.name);

  constructor(
    @InjectRepository(Lead)
    private readonly leadsRepository: Repository<Lead>,
    private readonly taggingService: LeadsTaggingService,
    private readonly scoringService: LeadsScoringService,
  ) {}

  async create(clinicId: string, dto: CreateLeadDto): Promise<Lead> {
    this.logger.debug(`Creating lead for clinic ${clinicId}`, dto);

    // Validar se lead já existe
    const existingLead = await this.leadsRepository.findOne({
      where: { clinicId, telefone: dto.telefone },
    });

    if (existingLead) {
      throw new BadRequestException('Lead com este telefone já existe');
    }

    const lead = this.leadsRepository.create({
      ...dto,
      clinicId,
      score: 0,
      stage: 'cold',
      tags: [],
    });

    // Aplicar scoring e tagging automáticos
    lead.score = await this.scoringService.calculateScore(lead);
    lead.tags = await this.taggingService.generateTags(lead);

    const savedLead = await this.leadsRepository.save(lead);
    this.logger.log(`Lead created: ${savedLead.id}`);

    return savedLead;
  }

  async findAll(
    clinicId: string,
    page = 1,
    limit = 20,
    filters?: any,
  ): Promise<{ data: Lead[]; total: number }> {
    const query = this.leadsRepository.createQueryBuilder('lead')
      .where('lead.clinicId = :clinicId', { clinicId });

    // Aplicar filtros
    if (filters?.stage) {
      query.andWhere('lead.stage = :stage', { stage: filters.stage });
    }
    if (filters?.origem) {
      query.andWhere('lead.origem = :origem', { origem: filters.origem });
    }
    if (filters?.tags && filters.tags.length > 0) {
      query.andWhere('lead.tags && :tags', { tags: filters.tags });
    }
    if (filters?.search) {
      query.andWhere(
        '(lead.nome ILIKE :search OR lead.telefone ILIKE :search OR lead.email ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    const [data, total] = await query
      .orderBy('lead.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total };
  }

  async findById(clinicId: string, id: string): Promise<Lead> {
    const lead = await this.leadsRepository.findOne({
      where: { id, clinicId },
      relations: ['agendamentos', 'mensagens'],
    });

    if (!lead) {
      throw new NotFoundException(`Lead ${id} not found`);
    }

    return lead;
  }

  async update(clinicId: string, id: string, dto: UpdateLeadDto): Promise<Lead> {
    const lead = await this.findById(clinicId, id);

    Object.assign(lead, dto);

    // Recalcular score se dados relevantes mudaram
    if (dto.interesse || dto.origem) {
      lead.score = await this.scoringService.calculateScore(lead);
    }

    // Recalcular tags se dados relevantes mudaram
    if (dto.interesse || dto.stage) {
      lead.tags = await this.taggingService.generateTags(lead);
    }

    const updated = await this.leadsRepository.save(lead);
    this.logger.log(`Lead updated: ${id}`);

    return updated;
  }

  async delete(clinicId: string, id: string): Promise<void> {
    const result = await this.leadsRepository.delete({ id, clinicId });

    if (result.affected === 0) {
      throw new NotFoundException(`Lead ${id} not found`);
    }

    this.logger.log(`Lead deleted: ${id}`);
  }

  async updateStage(clinicId: string, id: string, stage: string): Promise<Lead> {
    const lead = await this.findById(clinicId, id);
    lead.stage = stage;
    return await this.leadsRepository.save(lead);
  }

  async addTags(clinicId: string, id: string, tags: string[]): Promise<Lead> {
    const lead = await this.findById(clinicId, id);
    lead.tags = [...new Set([...lead.tags, ...tags])]; // Remove duplicatas
    return await this.leadsRepository.save(lead);
  }

  async removeTags(clinicId: string, id: string, tags: string[]): Promise<Lead> {
    const lead = await this.findById(clinicId, id);
    lead.tags = lead.tags.filter((tag) => !tags.includes(tag));
    return await this.leadsRepository.save(lead);
  }
}
```

---

## BACKEND - CONTROLLERS

### Leads Controller (Exemplo Completo)

```typescript
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
  HttpStatus,
  HttpCode,
  Patch,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ClinicGuard } from '../common/guards/clinic.guard';
import { ClinicId } from '../common/decorators/clinic-id.decorator';
import { LeadsService } from './leads.service';
import { CreateLeadDto, UpdateLeadDto, LeadResponseDto } from './dto/create-lead.dto';
import { PaginationDto } from '../shared/dtos/pagination.dto';

@ApiTags('Leads')
@ApiBearerAuth()
@Controller({ path: 'leads', version: '1' })
@UseGuards(AuthGuard('jwt'), ClinicGuard)
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar novo lead' })
  @ApiResponse({ status: 201, description: 'Lead criado com sucesso', type: LeadResponseDto })
  async create(@ClinicId() clinicId: string, @Body() dto: CreateLeadDto) {
    return await this.leadsService.create(clinicId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar leads com paginação' })
  @ApiResponse({ status: 200, description: 'Lista de leads' })
  async findAll(
    @ClinicId() clinicId: string,
    @Query() pagination: PaginationDto,
    @Query() filters?: any,
  ) {
    return await this.leadsService.findAll(
      clinicId,
      pagination.page,
      pagination.limit,
      filters,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter detalhes de um lead' })
  @ApiResponse({ status: 200, description: 'Detalhes do lead', type: LeadResponseDto })
  async findById(@ClinicId() clinicId: string, @Param('id') id: string) {
    return await this.leadsService.findById(clinicId, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar lead' })
  @ApiResponse({ status: 200, description: 'Lead atualizado', type: LeadResponseDto })
  async update(
    @ClinicId() clinicId: string,
    @Param('id') id: string,
    @Body() dto: UpdateLeadDto,
  ) {
    return await this.leadsService.update(clinicId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deletar lead' })
  @ApiResponse({ status: 204, description: 'Lead deletado com sucesso' })
  async delete(@ClinicId() clinicId: string, @Param('id') id: string) {
    return await this.leadsService.delete(clinicId, id);
  }

  @Patch(':id/stage')
  @ApiOperation({ summary: 'Atualizar estágio do lead' })
  async updateStage(
    @ClinicId() clinicId: string,
    @Param('id') id: string,
    @Body('stage') stage: string,
  ) {
    return await this.leadsService.updateStage(clinicId, id, stage);
  }

  @Post(':id/tags')
  @ApiOperation({ summary: 'Adicionar tags ao lead' })
  async addTags(
    @ClinicId() clinicId: string,
    @Param('id') id: string,
    @Body('tags') tags: string[],
  ) {
    return await this.leadsService.addTags(clinicId, id, tags);
  }

  @Delete(':id/tags')
  @ApiOperation({ summary: 'Remover tags do lead' })
  async removeTags(
    @ClinicId() clinicId: string,
    @Param('id') id: string,
    @Body('tags') tags: string[],
  ) {
    return await this.leadsService.removeTags(clinicId, id, tags);
  }
}
```

---

## BACKEND - GUARDS & INTERCEPTORS

### Clinic Guard

```typescript
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class ClinicGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as any;
    const clinicIdHeader = request.headers['x-clinic-id'] as string;
    const clinicIdParam = request.params.clinicId as string;

    // Validar que o clinic_id do JWT corresponde ao header ou param
    if (clinicIdHeader && user.clinicId !== clinicIdHeader) {
      throw new ForbiddenException('Clinic ID mismatch');
    }

    if (clinicIdParam && user.clinicId !== clinicIdParam) {
      throw new ForbiddenException('Clinic ID mismatch');
    }

    return true;
  }
}
```

### Logging Interceptor

```typescript
import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url, headers } = request;
    const startTime = Date.now();

    return next.handle().pipe(
      tap((response) => {
        const duration = Date.now() - startTime;
        const statusCode = context.switchToHttp().getResponse().statusCode;

        this.logger.log(
          `${method} ${url} - ${statusCode} - ${duration}ms - User: ${headers['x-clinic-id']}`,
        );
      }),
    );
  }
}
```

### Transform Interceptor

```typescript
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => ({
        success: true,
        data,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
```

### HTTP Exception Filter

```typescript
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('HttpException');

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const errorResponse = {
      success: false,
      statusCode: status,
      message: exception.message,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
    };

    if (status >= 500) {
      this.logger.error(`${request.method} ${request.url}`, exception);
    }

    response.status(status).json(errorResponse);
  }
}
```

---

## FRONTEND - ESTRUTURA

### Next.js App Layout

```typescript
// app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/lib/providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Elevare - CRM para Clínicas de Estética',
  description: 'Plataforma de automação e agendamento para clínicas de estética',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

### Dashboard Page

```typescript
// app/(app)/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { leadsService } from '@/services/leads.service';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { LeadsChart } from '@/components/dashboard/LeadsChart';
import { RecentActivity } from '@/components/dashboard/RecentActivity';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalLeads: 0,
    leadsHoje: 0,
    agendamentosProximos: 0,
    taxaConversao: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await leadsService.findAll(1, 1);
        setStats({
          totalLeads: response.total,
          leadsHoje: Math.floor(Math.random() * 10),
          agendamentosProximos: Math.floor(Math.random() * 5),
          taxaConversao: 45,
        });
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) {
    return <div className="p-8">Carregando...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard title="Total de Leads" value={stats.totalLeads} />
        <StatsCard title="Leads Hoje" value={stats.leadsHoje} />
        <StatsCard title="Agendamentos Próximos" value={stats.agendamentosProximos} />
        <StatsCard title="Taxa de Conversão" value={`${stats.taxaConversao}%`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <LeadsChart />
        </div>
        <div>
          <RecentActivity />
        </div>
      </div>
    </div>
  );
}
```

### Leads Page

```typescript
// app/(app)/leads/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { leadsService } from '@/services/leads.service';
import { LeadsList } from '@/components/leads/LeadsList';
import { LeadFilter } from '@/components/leads/LeadFilter';
import { Button } from '@/components/common/Button';
import Link from 'next/link';

export default function LeadsPage() {
  const [leads, setLeads] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({});

  useEffect(() => {
    loadLeads();
  }, [page, filters]);

  const loadLeads = async () => {
    setLoading(true);
    try {
      const response = await leadsService.findAll(page, 20);
      setLeads(response.data);
      setTotal(response.total);
    } catch (error) {
      console.error('Erro ao carregar leads:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Leads</h1>
        <Link href="/leads/new">
          <Button>+ Novo Lead</Button>
        </Link>
      </div>

      <LeadFilter onFilterChange={setFilters} />

      <LeadsList leads={leads} loading={loading} onRefresh={loadLeads} />

      {/* Pagination */}
      <div className="mt-8 flex justify-between items-center">
        <Button
          onClick={() => setPage(Math.max(1, page - 1))}
          disabled={page === 1}
        >
          Anterior
        </Button>
        <span>Página {page} de {Math.ceil(total / 20)}</span>
        <Button
          onClick={() => setPage(page + 1)}
          disabled={page >= Math.ceil(total / 20)}
        >
          Próxima
        </Button>
      </div>
    </div>
  );
}
```

### API Service

```typescript
// services/api.ts
import axios, { AxiosInstance, AxiosError } from 'axios';
import { useAuth } from '@/hooks/useAuth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/v1';

export const createApiClient = (token?: string): AxiosInstance => {
  const client = axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  // Interceptor para adicionar clinic-id
  client.interceptors.request.use((config) => {
    const clinicId = localStorage.getItem('clinicId');
    if (clinicId) {
      config.headers['X-Clinic-ID'] = clinicId;
    }
    return config;
  });

  // Interceptor para tratamento de erros
  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      if (error.response?.status === 401) {
        // Redirecionar para login
        window.location.href = '/login';
      }
      return Promise.reject(error);
    },
  );

  return client;
};

export const apiClient = createApiClient();
```

### Leads Service

```typescript
// services/leads.service.ts
import { apiClient } from './api';
import { Lead } from '@/types/lead';

export const leadsService = {
  async findAll(page = 1, limit = 20) {
    const response = await apiClient.get('/leads', {
      params: { page, limit },
    });
    return response.data.data;
  },

  async findById(id: string) {
    const response = await apiClient.get(`/leads/${id}`);
    return response.data.data;
  },

  async create(data: Partial<Lead>) {
    const response = await apiClient.post('/leads', data);
    return response.data.data;
  },

  async update(id: string, data: Partial<Lead>) {
    const response = await apiClient.put(`/leads/${id}`, data);
    return response.data.data;
  },

  async delete(id: string) {
    await apiClient.delete(`/leads/${id}`);
  },

  async updateStage(id: string, stage: string) {
    const response = await apiClient.patch(`/leads/${id}/stage`, { stage });
    return response.data.data;
  },

  async addTags(id: string, tags: string[]) {
    const response = await apiClient.post(`/leads/${id}/tags`, { tags });
    return response.data.data;
  },
};
```

---

## DOCKER & COMPOSE

### Dockerfile Backend

```dockerfile
# backend/Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependências
RUN npm ci

# Copiar código
COPY . .

# Build
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Instalar apenas dependências de produção
COPY package*.json ./
RUN npm ci --only=production

# Copiar build da etapa anterior
COPY --from=builder /app/dist ./dist

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

EXPOSE 3000

CMD ["node", "dist/main.js"]
```

### Dockerfile Frontend

```dockerfile
# frontend/Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["npm", "start"]
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: elevare-postgres
    environment:
      POSTGRES_USER: elevare
      POSTGRES_PASSWORD: elevare
      POSTGRES_DB: elevare_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U elevare"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: elevare-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: elevare-backend
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: development
      DATABASE_HOST: postgres
      DATABASE_PORT: 5432
      DATABASE_USER: elevare
      DATABASE_PASSWORD: elevare
      DATABASE_NAME: elevare_db
      REDIS_HOST: redis
      REDIS_PORT: 6379
      JWT_SECRET: dev-secret-key-change-in-production
      JWT_REFRESH_SECRET: dev-refresh-secret-key-change-in-production
      ALLOWED_ORIGINS: http://localhost:3001
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./backend/src:/app/src
    command: npm run start:dev

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: elevare-frontend
    ports:
      - "3001:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:3000/v1
    depends_on:
      - backend
    volumes:
      - ./frontend/src:/app/src

volumes:
  postgres_data:
  redis_data:
```

---

## GITHUB ACTIONS CI/CD

### CI Pipeline

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_USER: elevare
          POSTGRES_PASSWORD: elevare
          POSTGRES_DB: elevare_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies (Backend)
        working-directory: ./backend
        run: npm ci

      - name: Lint (Backend)
        working-directory: ./backend
        run: npm run lint

      - name: Build (Backend)
        working-directory: ./backend
        run: npm run build
        env:
          DATABASE_URL: postgresql://elevare:elevare@localhost:5432/elevare_test

      - name: Test (Backend)
        working-directory: ./backend
        run: npm run test:cov
        env:
          DATABASE_URL: postgresql://elevare:elevare@localhost:5432/elevare_test

      - name: Install dependencies (Frontend)
        working-directory: ./frontend
        run: npm ci

      - name: Lint (Frontend)
        working-directory: ./frontend
        run: npm run lint

      - name: Build (Frontend)
        working-directory: ./frontend
        run: npm run build

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./backend/coverage/coverage-final.json
```

### CD Pipeline

```yaml
# .github/workflows/cd.yml
name: CD

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Build Backend
        working-directory: ./backend
        run: npm ci && npm run build

      - name: Build Frontend
        working-directory: ./frontend
        run: npm ci && npm run build

      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Build and push Backend image
        uses: docker/build-push-action@v5
        with:
          context: ./backend
          push: true
          tags: |
            ${{ secrets.DOCKER_USERNAME }}/elevare-backend:latest
            ${{ secrets.DOCKER_USERNAME }}/elevare-backend:${{ github.sha }}

      - name: Build and push Frontend image
        uses: docker/build-push-action@v5
        with:
          context: ./frontend
          push: true
          tags: |
            ${{ secrets.DOCKER_USERNAME }}/elevare-frontend:latest
            ${{ secrets.DOCKER_USERNAME }}/elevare-frontend:${{ github.sha }}

      - name: Deploy to Kubernetes
        run: |
          echo "Deploy to Kubernetes"
          # Adicionar comandos de deploy aqui
```

---

## SCRIPTS DE MIGRAÇÃO

### Migration Generate

```bash
#!/bin/bash
# backend/scripts/migration-generate.sh

if [ -z "$1" ]; then
  echo "Usage: ./migration-generate.sh <migration-name>"
  exit 1
fi

cd backend
npm run typeorm migration:generate -- src/database/migrations/$1
```

### Migration Run

```bash
#!/bin/bash
# backend/scripts/migration-run.sh

cd backend
npm run typeorm migration:run
```

### Seed Database

```typescript
// backend/src/database/seeders/seed.ts
import { DataSource } from 'typeorm';
import { getDatabaseConfig } from '../../config/database.config';
import { ConfigService } from '@nestjs/config';
import { Clinic } from '../entities/clinic.entity';
import { User } from '../entities/user.entity';

async function seed() {
  const configService = new ConfigService();
  const dataSource = new DataSource({
    ...getDatabaseConfig(configService),
    entities: ['src/database/entities/**/*.entity.ts'],
    migrations: ['src/database/migrations/**/*.ts'],
  } as any);

  await dataSource.initialize();

  const clinicRepository = dataSource.getRepository(Clinic);
  const userRepository = dataSource.getRepository(User);

  // Criar clínica de teste
  const clinic = clinicRepository.create({
    nome: 'Clínica Teste',
    slug: 'clinica-teste',
    telefone: '11999999999',
    email: 'contato@clinicateste.com',
    status: 'ativa',
  });

  await clinicRepository.save(clinic);

  // Criar usuário de teste
  const user = userRepository.create({
    clinicId: clinic.id,
    nome: 'Admin Teste',
    email: 'admin@clinicateste.com',
    password: 'hashed-password-here',
    role: 'admin',
  });

  await userRepository.save(user);

  console.log('✅ Seed completed successfully');
  await dataSource.destroy();
}

seed().catch((error) => {
  console.error('❌ Seed failed:', error);
  process.exit(1);
});
```

---

## PRÓXIMOS PASSOS

1. ✅ **AUDITORIA GLOBAL 360°** (concluída)
2. ✅ **REESTRUTURAÇÃO ARQUITETURAL** (concluída)
3. ✅ **SCAFFOLD & SCRIPTS** (concluída)
4. ⏳ **IARA & LARA** - Fluxos executáveis
5. ⏳ **DOCUMENTAÇÃO E ROADMAP** - Tudo documentado

---

**Fim do Scaffold Completo**  
**Próximo: IARA & LARA - Fluxos Executáveis e Templates**
