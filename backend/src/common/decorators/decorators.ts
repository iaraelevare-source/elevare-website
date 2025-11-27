import { SetMetadata } from '@nestjs/common';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorator para marcar rotas como públicas (sem autenticação)
 * Uso: @Public()
 */
export const Public = () => SetMetadata('isPublic', true);

/**
 * Decorator para definir roles permitidos em uma rota
 * Uso: @Roles('admin', 'gerente')
 */
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

/**
 * Decorator para obter o usuário autenticado da requisição
 * Uso: @CurrentUser() user: User
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

/**
 * Decorator para obter o ID da clínica do usuário autenticado
 * Uso: @CurrentClinicId() clinicId: string
 */
export const CurrentClinicId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.clinicId;
  },
);
