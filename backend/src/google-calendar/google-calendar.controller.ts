import { Controller, Get, Query, Res, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { GoogleCalendarService } from './google-calendar.service';

/**
 * Controller para integração com Google Calendar
 */
@ApiTags('Google Calendar')
@Controller('google-calendar')
export class GoogleCalendarController {
  constructor(private readonly googleCalendarService: GoogleCalendarService) {}

  /**
   * Redireciona para página de autorização do Google
   */
  @Get('auth')
  @ApiOperation({ summary: 'Iniciar autorização OAuth2 do Google Calendar' })
  auth(@Res() res: Response) {
    const authUrl = this.googleCalendarService.getAuthUrl();
    return res.redirect(authUrl);
  }

  /**
   * Callback do OAuth2 do Google
   */
  @Get('callback')
  @ApiOperation({ summary: 'Callback OAuth2 do Google Calendar' })
  async callback(@Query('code') code: string, @Res() res: Response) {
    try {
      const tokens = await this.googleCalendarService.getTokensFromCode(code);
      
      // TODO: Salvar tokens no banco de dados associado ao usuário
      
      return res.status(HttpStatus.OK).json({
        message: 'Autorização concluída com sucesso',
        tokens,
      });
    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        message: 'Erro ao processar autorização',
        error: error.message,
      });
    }
  }

  /**
   * Retorna status da integração
   */
  @Get('status')
  @ApiOperation({ summary: 'Verificar status da integração com Google Calendar' })
  status() {
    return {
      status: 'configured',
      message: 'Google Calendar configurado. Use /auth para autorizar.',
    };
  }
}
