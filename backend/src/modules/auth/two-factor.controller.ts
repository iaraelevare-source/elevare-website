import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { TwoFactorService } from './two-factor.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

/**
 * Controller de Autenticação de Dois Fatores (2FA)
 * 
 * Endpoints protegidos por JWT (usuário deve estar logado)
 * 
 * Fluxo completo:
 * 1. GET  /2fa/setup   → Gera QR Code
 * 2. POST /2fa/verify  → Testa token (opcional)
 * 3. POST /2fa/enable  → Ativa 2FA
 * 4. POST /2fa/disable → Desativa 2FA
 */
@ApiTags('2FA')
@Controller('2fa')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TwoFactorController {
  constructor(private readonly twoFactorService: TwoFactorService) {}

  /**
   * Gera QR Code para configuração inicial do 2FA
   * 
   * Usuário deve:
   * 1. Chamar este endpoint
   * 2. Escanear o QR Code com Google Authenticator
   * 3. Chamar /2fa/enable com o token gerado
   */
  @Get('setup')
  @ApiOperation({
    summary: 'Gerar QR Code para 2FA',
    description: 'Retorna QR Code em base64 e secret para backup manual',
  })
  @ApiResponse({
    status: 200,
    description: 'QR Code gerado com sucesso',
    schema: {
      example: {
        qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANS...',
        secret: 'JBSWY3DPEHPK3PXP',
      },
    },
  })
  async setup(@Request() req) {
    const { qrCode, secret } = await this.twoFactorService.generateSecret(
      req.user.userId,
    );

    return {
      qrCode,
      secret,
      message: 'Escaneie o QR Code com Google Authenticator e chame /2fa/enable',
    };
  }

  /**
   * Verifica se um token é válido (opcional, para testar)
   */
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verificar token 2FA',
    description: 'Testa se o token de 6 dígitos é válido (opcional)',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        token: {
          type: 'string',
          example: '123456',
          description: 'Token de 6 dígitos do Google Authenticator',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Token verificado',
    schema: {
      example: { valid: true },
    },
  })
  async verify(@Request() req, @Body('token') token: string) {
    if (!token || token.length !== 6) {
      throw new BadRequestException('Token deve ter 6 dígitos');
    }

    const isValid = await this.twoFactorService.verifyToken(
      req.user.userId,
      token,
    );

    return {
      valid: isValid,
      message: isValid
        ? 'Token válido! Você pode ativar o 2FA agora'
        : 'Token inválido. Verifique o código no Google Authenticator',
    };
  }

  /**
   * Ativa 2FA após verificação bem-sucedida
   */
  @Post('enable')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Ativar 2FA',
    description:
      'Ativa autenticação de dois fatores após verificar token válido',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        token: {
          type: 'string',
          example: '123456',
          description: 'Token de 6 dígitos do Google Authenticator',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: '2FA ativado com sucesso',
    schema: {
      example: {
        message: '2FA ativado com sucesso',
        tfaEnabled: true,
      },
    },
  })
  async enable(@Request() req, @Body('token') token: string) {
    if (!token || token.length !== 6) {
      throw new BadRequestException('Token deve ter 6 dígitos');
    }

    await this.twoFactorService.enable2FA(req.user.userId, token);

    return {
      message: '2FA ativado com sucesso',
      tfaEnabled: true,
    };
  }

  /**
   * Desativa 2FA (requer token válido)
   */
  @Post('disable')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Desativar 2FA',
    description:
      'Desativa autenticação de dois fatores (requer token válido para segurança)',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        token: {
          type: 'string',
          example: '123456',
          description: 'Token de 6 dígitos do Google Authenticator',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: '2FA desativado com sucesso',
    schema: {
      example: {
        message: '2FA desativado com sucesso',
        tfaEnabled: false,
      },
    },
  })
  async disable(@Request() req, @Body('token') token: string) {
    if (!token || token.length !== 6) {
      throw new BadRequestException('Token deve ter 6 dígitos');
    }

    await this.twoFactorService.disable2FA(req.user.userId, token);

    return {
      message: '2FA desativado com sucesso',
      tfaEnabled: false,
    };
  }

  /**
   * Verifica status do 2FA
   */
  @Get('status')
  @ApiOperation({
    summary: 'Verificar status do 2FA',
    description: 'Retorna se o usuário tem 2FA ativado',
  })
  @ApiResponse({
    status: 200,
    description: 'Status do 2FA',
    schema: {
      example: {
        tfaEnabled: true,
      },
    },
  })
  async status(@Request() req) {
    const tfaEnabled = await this.twoFactorService.is2FAEnabled(
      req.user.userId,
    );

    return {
      tfaEnabled,
    };
  }
}
