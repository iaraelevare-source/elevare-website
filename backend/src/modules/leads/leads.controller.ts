import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { LeadsService } from './leads.service';
import { CreateLeadDto, UpdateLeadDto, LeadResponseDto } from './dto/lead.dto';

/**
 * Controller de gerenciamento de leads
 * Todos os endpoints requerem autenticação JWT
 */
@ApiTags('Leads')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  /**
   * Cria um novo lead
   */
  @Post()
  @ApiOperation({ summary: 'Criar novo lead' })
  @ApiResponse({ status: 201, description: 'Lead criado com sucesso', type: LeadResponseDto })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async create(@Body() createLeadDto: CreateLeadDto, @Request() req) {
    return await this.leadsService.create(
      createLeadDto,
      req.user.id,
      req.user.clinicId,
    );
  }

  /**
   * Lista todos os leads da clínica
   */
  @Get()
  @ApiOperation({ summary: 'Listar todos os leads da clínica' })
  @ApiQuery({ name: 'status', required: false, description: 'Filtrar por status' })
  @ApiQuery({ name: 'minScore', required: false, description: 'Filtrar por score mínimo' })
  @ApiResponse({ status: 200, description: 'Lista de leads', type: [LeadResponseDto] })
  async findAll(
    @Request() req,
    @Query('status') status?: string,
    @Query('minScore') minScore?: number,
  ) {
    // Filtro por status
    if (status) {
      return await this.leadsService.findByStatus(status, req.user.clinicId);
    }

    // Filtro por score mínimo
    if (minScore) {
      return await this.leadsService.findByMinScore(Number(minScore), req.user.clinicId);
    }

    // Retorna todos os leads
    return await this.leadsService.findAll(req.user.clinicId);
  }

  /**
   * Busca um lead específico por ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Buscar lead por ID' })
  @ApiResponse({ status: 200, description: 'Lead encontrado', type: LeadResponseDto })
  @ApiResponse({ status: 404, description: 'Lead não encontrado' })
  async findOne(@Param('id') id: string, @Request() req) {
    return await this.leadsService.findOne(id, req.user.clinicId);
  }

  /**
   * Atualiza um lead existente
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar lead' })
  @ApiResponse({ status: 200, description: 'Lead atualizado com sucesso', type: LeadResponseDto })
  @ApiResponse({ status: 404, description: 'Lead não encontrado' })
  async update(
    @Param('id') id: string,
    @Body() updateLeadDto: UpdateLeadDto,
    @Request() req,
  ) {
    return await this.leadsService.update(id, updateLeadDto, req.user.clinicId);
  }

  /**
   * Remove um lead
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Remover lead' })
  @ApiResponse({ status: 200, description: 'Lead removido com sucesso' })
  @ApiResponse({ status: 404, description: 'Lead não encontrado' })
  async remove(@Param('id') id: string, @Request() req) {
    await this.leadsService.remove(id, req.user.clinicId);
    return { message: 'Lead removido com sucesso' };
  }
}
