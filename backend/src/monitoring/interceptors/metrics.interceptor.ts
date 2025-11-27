import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Counter, Histogram } from 'prom-client';
import { InjectMetric } from '@willsoto/nestjs-prometheus';

/**
 * Interceptor de Métricas HTTP
 * 
 * Captura automaticamente métricas de todas as requisições HTTP:
 * - Total de requisições por endpoint e método
 * - Duração das requisições
 * - Status HTTP das respostas
 */
@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(
    @InjectMetric('http_requests_total')
    private readonly httpRequestsTotal: Counter<string>,
    
    @InjectMetric('http_request_duration_seconds')
    private readonly httpRequestDuration: Histogram<string>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, route } = request;
    
    // Marca início da requisição
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          // Registra requisição bem-sucedida
          const response = context.switchToHttp().getResponse();
          const duration = (Date.now() - startTime) / 1000;

          this.httpRequestsTotal.inc({
            method,
            route: route?.path || 'unknown',
            status: response.statusCode.toString(),
          });

          this.httpRequestDuration.observe(
            {
              method,
              route: route?.path || 'unknown',
            },
            duration,
          );
        },
        error: (error) => {
          // Registra requisição com erro
          const duration = (Date.now() - startTime) / 1000;
          const status = error.status || 500;

          this.httpRequestsTotal.inc({
            method,
            route: route?.path || 'unknown',
            status: status.toString(),
          });

          this.httpRequestDuration.observe(
            {
              method,
              route: route?.path || 'unknown',
            },
            duration,
          );
        },
      }),
    );
  }
}
