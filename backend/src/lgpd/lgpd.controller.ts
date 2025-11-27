import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { LgpdService } from './lgpd.service';
import { RecordConsentDto, RevokeConsentDto, ExportUserDataDto } from './dto/consent.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

/**
 * Controller LGPD
 * 
 * Endpoints para compliance com Lei 13.709/2018 (LGPD):
 * - Registro de consentimentos
 * - Visualização de consentimentos
 * - Revogação de consentimentos
 * - Exportação de dados
 * - Exclusão de dados (direito de esquecimento)
 */
@ApiTags('LGPD')
@Controller('lgpd')
export class LgpdController {
  constructor(private readonly lgpdService: LgpdService) {}

  /**
   * Registra consentimento do usuário
   * Endpoint público chamado pelo banner LGPD do frontend
   * 
   * Art. 8º - Consentimento deve ser fornecido por escrito ou meio eletrônico
   */
  @Post('consent')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Registrar consentimento',
    description: 'Endpoint público para registrar consentimento do usuário (banner LGPD)',
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Consentimento registrado com sucesso',
  })
  async recordConsent(
    @Body() data: RecordConsentDto,
    @Req() req: Request,
  ) {
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    return this.lgpdService.recordConsent(data, ip, userAgent);
  }

  /**
   * Lista consentimentos ativos do usuário
   * Art. 9º - Direito de acesso aos dados
   */
  @UseGuards(JwtAuthGuard)
  @Get('my-consents')
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Listar meus consentimentos',
    description: 'Retorna todos os consentimentos ativos do usuário autenticado',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de consentimentos',
  })
  async getMyConsents(@Req() req: Request) {
    const userId = (req.user as any)?.id;
    return this.lgpdService.getActiveConsents(userId);
  }

  /**
   * Revoga consentimento específico
   * Art. 8º, §5º - Direito de revogar consentimento
   */
  @UseGuards(JwtAuthGuard)
  @Patch('revoke')
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Revogar consentimento',
    description: 'Revoga um consentimento específico do usuário',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Consentimento revogado com sucesso',
  })
  async revokeConsent(
    @Req() req: Request,
    @Body() dto: RevokeConsentDto,
  ) {
    const userId = (req.user as any)?.id;
    await this.lgpdService.revokeConsent(userId, dto.type);
    
    return { 
      message: `Consentimento de ${dto.type} revogado com sucesso`,
    };
  }

  /**
   * Exporta todos os dados do usuário
   * Art. 18, §2º - Direito de portabilidade dos dados
   */
  @UseGuards(JwtAuthGuard)
  @Get('export')
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Exportar meus dados',
    description: 'Exporta todos os dados do usuário em formato estruturado (portabilidade)',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Dados exportados',
    type: ExportUserDataDto,
  })
  async exportData(@Req() req: Request): Promise<ExportUserDataDto> {
    const userId = (req.user as any)?.id;
    return this.lgpdService.exportUserData(userId);
  }

  /**
   * Exclui dados do usuário (pseudonimização)
   * Art. 18 - Direito de esquecimento
   * 
   * IMPORTANTE: Esta operação é irreversível!
   */
  @UseGuards(JwtAuthGuard)
  @Delete('delete-account')
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Excluir minha conta',
    description: 'Exclui dados pessoais do usuário (direito de esquecimento). Operação irreversível!',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Dados excluídos com sucesso',
  })
  async deleteAccount(@Req() req: Request) {
    const userId = (req.user as any)?.id;
    return this.lgpdService.deleteUserData(userId);
  }

  /**
   * Busca consentimentos (admin)
   * Endpoint administrativo para auditoria
   */
  @UseGuards(JwtAuthGuard)
  @Post('admin/search')
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Buscar consentimentos (admin)',
    description: 'Busca consentimentos por termo (apenas administradores)',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Resultados da busca',
  })
  async adminSearch(@Body('query') query: string) {
    // TODO: Adicionar guard de admin (RolesGuard)
    return this.lgpdService.searchConsents(query);
  }

  /**
   * Estatísticas de consentimentos (admin)
   * Dashboard administrativo
   */
  @UseGuards(JwtAuthGuard)
  @Get('admin/stats')
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Estatísticas de consentimentos (admin)',
    description: 'Retorna estatísticas agregadas de consentimentos',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Estatísticas',
  })
  async getStats() {
    // TODO: Adicionar guard de admin (RolesGuard)
    return this.lgpdService.getConsentStats();
  }
}
