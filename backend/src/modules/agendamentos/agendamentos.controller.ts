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
import { AgendamentosService } from './agendamentos.service';
import { CreateAgendamentoDto, UpdateAgendamentoDto, AgendamentoResponseDto } from './dto/agendamento.dto';

/**
 * Controller de gerenciamento de agendamentos
 * Todos os endpoints requerem autenticação JWT
 */
@ApiTags('Agendamentos')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('agendamentos')
export class AgendamentosController {
  constructor(private readonly agendamentosService: AgendamentosService) {}

  /**
   * Cria um novo agendamento
   */
  @Post()
  @ApiOperation({ summary: 'Criar novo agendamento' })
  @ApiResponse({ status: 201, description: 'Agendamento criado com sucesso', type: AgendamentoResponseDto })
  @ApiResponse({ status: 400, description: 'Conflito de horário' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async create(@Body() createAgendamentoDto: CreateAgendamentoDto, @Request() req) {
    return await this.agendamentosService.create(
      createAgendamentoDto,
      req.user.id,
      req.user.clinicId,
    );
  }

  /**
   * Lista todos os agendamentos da clínica
   */
  @Get()
  @ApiOperation({ summary: 'Listar todos os agendamentos da clínica' })
  @ApiQuery({ name: 'status', required: false, description: 'Filtrar por status' })
  @ApiQuery({ name: 'dataInicio', required: false, description: 'Data de início do período (ISO 8601)' })
  @ApiQuery({ name: 'dataFim', required: false, description: 'Data de fim do período (ISO 8601)' })
  @ApiResponse({ status: 200, description: 'Lista de agendamentos', type: [AgendamentoResponseDto] })
  async findAll(
    @Request() req,
    @Query('status') status?: string,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
  ) {
    // Filtro por status
    if (status) {
      return await this.agendamentosService.findByStatus(status, req.user.clinicId);
    }

    // Filtro por período
    if (dataInicio && dataFim) {
      return await this.agendamentosService.findByPeriodo(
        new Date(dataInicio),
        new Date(dataFim),
        req.user.clinicId,
      );
    }

    // Retorna todos os agendamentos
    return await this.agendamentosService.findAll(req.user.clinicId);
  }

  /**
   * Busca um agendamento específico por ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Buscar agendamento por ID' })
  @ApiResponse({ status: 200, description: 'Agendamento encontrado', type: AgendamentoResponseDto })
  @ApiResponse({ status: 404, description: 'Agendamento não encontrado' })
  async findOne(@Param('id') id: string, @Request() req) {
    return await this.agendamentosService.findOne(id, req.user.clinicId);
  }

  /**
   * Atualiza um agendamento existente
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar agendamento' })
  @ApiResponse({ status: 200, description: 'Agendamento atualizado com sucesso', type: AgendamentoResponseDto })
  @ApiResponse({ status: 404, description: 'Agendamento não encontrado' })
  async update(
    @Param('id') id: string,
    @Body() updateAgendamentoDto: UpdateAgendamentoDto,
    @Request() req,
  ) {
    return await this.agendamentosService.update(id, updateAgendamentoDto, req.user.clinicId);
  }

  /**
   * Remove um agendamento
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Remover agendamento' })
  @ApiResponse({ status: 200, description: 'Agendamento removido com sucesso' })
  @ApiResponse({ status: 404, description: 'Agendamento não encontrado' })
  async remove(@Param('id') id: string, @Request() req) {
    await this.agendamentosService.remove(id, req.user.clinicId);
    return { message: 'Agendamento removido com sucesso' };
  }
}
