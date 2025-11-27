import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reflector } from '@nestjs/core';
import { AuditLog } from '../entities/audit-log.entity';
import { AUDIT_KEY, AuditOptions } from '../decorators/audit.decorator';

/**
 * Interceptor de Auditoria
 * 
 * Captura automaticamente todas as ações marcadas com @Audit()
 * e registra no banco de dados para compliance e rastreabilidade.
 * 
 * Funcionalidades:
 * - Registra IP, User-Agent e usuário autenticado
 * - Captura snapshot antes/depois da mudança
 * - Mede duração da operação
 * - Registra erros
 * - Remove campos sensíveis (senha, token, etc)
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    @InjectRepository(AuditLog)
    private readonly auditRepository: Repository<AuditLog>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const handler = context.getHandler();
    
    // Obter metadados do decorator @Audit()
    const auditMetadata = this.reflector.get<AuditOptions>(
      AUDIT_KEY,
      handler,
    );

    // Se não tem decorator @Audit(), pula
    if (!auditMetadata) {
      return next.handle();
    }

    const startTime = Date.now();
    const { action, entity, ignoreFields = ['password', 'senha', 'token', 'secret'] } = auditMetadata;
    
    // Extrair informações da requisição
    const userId = (request.user as any)?.id;
    const ipAddress = this.getIP(request);
    const userAgent = request.get('User-Agent');
    const source = this.getSource(request);
    
    // Snapshot antes da mudança (se houver ID no body)
    const beforeSnapshot = request.body?.id 
      ? { id: request.body.id } 
      : null;

    return next.handle().pipe(
      tap(async (result) => {
        const duration = Date.now() - startTime;
        
        this.logger.log(
          `[AUDIT] ${action} | Entity: ${entity} | User: ${userId || 'anonymous'} | IP: ${ipAddress} | Duration: ${duration}ms`,
        );

        // Limpar campos sensíveis do resultado
        const cleanAfter = this.sanitizeData(result, ignoreFields);

        // Salvar no banco de dados
        try {
          await this.auditRepository.save({
            action,
            entity,
            entityId: result?.id || 'N/A',
            userId,
            ipAddress,
            before: beforeSnapshot,
            after: cleanAfter,
            source,
            userAgent,
            duration,
          });
        } catch (error) {
          this.logger.error(`Erro ao salvar audit log: ${error.message}`);
        }
      }),
      catchError(async (error) => {
        const duration = Date.now() - startTime;
        
        this.logger.error(
          `[AUDIT ERROR] ${action} | Entity: ${entity} | User: ${userId || 'anonymous'} | Error: ${error.message}`,
        );

        // Registrar erro no audit log
        try {
          await this.auditRepository.save({
            action,
            entity,
            entityId: 'ERROR',
            userId,
            ipAddress,
            error: error.message,
            source,
            userAgent,
            duration,
          });
        } catch (auditError) {
          this.logger.error(`Erro ao salvar audit log de erro: ${auditError.message}`);
        }

        // Re-lançar erro para não quebrar o fluxo
        return throwError(() => error);
      }),
    );
  }

  /**
   * Remove campos sensíveis do objeto
   */
  private sanitizeData(data: any, ignoreFields: string[]): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    // Se for array, sanitizar cada item
    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeData(item, ignoreFields));
    }

    // Criar cópia e remover campos sensíveis
    const sanitized = { ...data };
    ignoreFields.forEach(field => {
      delete sanitized[field];
    });

    return sanitized;
  }

  /**
   * Extrai IP do cliente
   * Considera proxies (X-Forwarded-For)
   */
  private getIP(request: any): string {
    return (
      request.ip ||
      request.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      request.connection?.remoteAddress ||
      '0.0.0.0'
    );
  }

  /**
   * Determina origem da requisição
   */
  private getSource(request: any): 'web' | 'api' | 'webhook' | 'system' {
    const path = request.path || '';
    const userAgent = request.get('User-Agent') || '';

    if (path.startsWith('/webhook')) return 'webhook';
    if (userAgent.includes('Mozilla')) return 'web';
    if (userAgent.includes('PostmanRuntime') || userAgent.includes('curl')) return 'api';
    
    return 'system';
  }
}
