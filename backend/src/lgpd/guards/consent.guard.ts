import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { LgpdService } from '../lgpd.service';
import { CONSENT_KEY } from '../decorators/require-consent.decorator';

/**
 * Guard de Consentimento LGPD
 * 
 * Verifica se o usuário possui consentimento ativo antes de executar a ação.
 * Usado em conjunto com o decorator @RequireConsent()
 * 
 * Exemplo de uso:
 * ```typescript
 * @UseGuards(JwtAuthGuard, ConsentGuard)
 * @RequireConsent('whatsapp')
 * async sendMessage() {
 *   // Só executa se tiver consentimento
 * }
 * ```
 */
@Injectable()
export class ConsentGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private lgpdService: LgpdService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Obter tipo de consentimento requerido do decorator
    const requiredConsent = this.reflector.getAllAndOverride<string>(
      CONSENT_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Se não há decorator, permitir acesso
    if (!requiredConsent) {
      return true;
    }

    // Obter usuário da requisição
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Se não há usuário autenticado, negar acesso
    if (!user || !user.id) {
      throw new ForbiddenException(
        'Usuário não autenticado. Faça login para continuar.',
      );
    }

    // Verificar se usuário possui consentimento ativo
    const hasConsent = await this.lgpdService.checkConsent(
      user.id,
      requiredConsent as any,
    );

    if (!hasConsent) {
      throw new ForbiddenException(
        `Consentimento não fornecido para: ${requiredConsent}. ` +
        `Acesse /lgpd/consent para fornecer consentimento.`,
      );
    }

    return true;
  }
}
