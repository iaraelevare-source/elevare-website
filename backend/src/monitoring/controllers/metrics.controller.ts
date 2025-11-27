import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

/**
 * Controller de Métricas
 * 
 * Expõe endpoints para visualização de métricas e health checks.
 * O endpoint /metrics é consumido automaticamente pelo Prometheus.
 */
@ApiTags('Monitoring')
@Controller()
export class MetricsController {
  /**
   * Health check do sistema
   * Retorna status da aplicação e timestamp
   */
  @Get('health')
  @ApiOperation({ summary: 'Health check da aplicação' })
  @ApiResponse({ status: 200, description: 'Aplicação saudável' })
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    };
  }

  /**
   * Informações do sistema
   * Retorna versão, memória, CPU, etc
   */
  @Get('info')
  @ApiOperation({ summary: 'Informações do sistema' })
  @ApiResponse({ status: 200, description: 'Informações do sistema' })
  getInfo() {
    return {
      version: process.env.npm_package_version || '1.0.0',
      node: process.version,
      platform: process.platform,
      arch: process.arch,
      memory: {
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
      },
      uptime: {
        seconds: Math.floor(process.uptime()),
        formatted: this.formatUptime(process.uptime()),
      },
    };
  }

  /**
   * Formata uptime em formato legível
   * @param seconds - Uptime em segundos
   */
  private formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    parts.push(`${secs}s`);

    return parts.join(' ');
  }
}
