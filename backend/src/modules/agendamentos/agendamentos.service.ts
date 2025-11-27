import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Agendamento } from '../../database/entities/agendamento.entity';
import { CreateAgendamentoDto, UpdateAgendamentoDto } from './dto/agendamento.dto';

/**
 * Service de gerenciamento de agendamentos
 * Implementa CRUD completo com validações de conflitos de horário
 */
@Injectable()
export class AgendamentosService {
  constructor(
    @InjectRepository(Agendamento)
    private agendamentoRepository: Repository<Agendamento>,
  ) {}

  /**
   * Cria um novo agendamento
   * Valida se não há conflito de horário antes de criar
   * @param createAgendamentoDto - Dados do agendamento a ser criado
   * @param userId - ID do usuário que está criando o agendamento
   * @param clinicId - ID da clínica do usuário
   * @returns Agendamento criado
   */
  async create(
    createAgendamentoDto: CreateAgendamentoDto,
    userId: string,
    clinicId: string,
  ): Promise<Agendamento> {
    const dataHora = new Date(createAgendamentoDto.dataHora);
    const duracaoMinutos = createAgendamentoDto.duracaoMinutos || 60;

    // Verifica conflito de horário
    await this.verificarConflitoHorario(dataHora, duracaoMinutos, clinicId);

    const agendamento = this.agendamentoRepository.create({
      ...createAgendamentoDto,
      dataHora,
      duracaoMinutos,
      createdById: userId,
      clinicId: clinicId,
    });

    return await this.agendamentoRepository.save(agendamento);
  }

  /**
   * Lista todos os agendamentos da clínica
   * @param clinicId - ID da clínica
   * @returns Lista de agendamentos
   */
  async findAll(clinicId: string): Promise<Agendamento[]> {
    return await this.agendamentoRepository.find({
      where: { clinicId },
      relations: ['createdBy'],
      order: { dataHora: 'ASC' },
    });
  }

  /**
   * Busca um agendamento específico por ID
   * @param id - ID do agendamento
   * @param clinicId - ID da clínica do usuário
   * @returns Agendamento encontrado
   */
  async findOne(id: string, clinicId: string): Promise<Agendamento> {
    const agendamento = await this.agendamentoRepository.findOne({
      where: { id, clinicId },
      relations: ['createdBy', 'clinic'],
    });

    if (!agendamento) {
      throw new NotFoundException('Agendamento não encontrado');
    }

    return agendamento;
  }

  /**
   * Atualiza um agendamento existente
   * @param id - ID do agendamento
   * @param updateAgendamentoDto - Dados a serem atualizados
   * @param clinicId - ID da clínica do usuário
   * @returns Agendamento atualizado
   */
  async update(
    id: string,
    updateAgendamentoDto: UpdateAgendamentoDto,
    clinicId: string,
  ): Promise<Agendamento> {
    const agendamento = await this.findOne(id, clinicId);

    // Se está alterando data/hora, verifica conflito
    if (updateAgendamentoDto.dataHora) {
      const novaDataHora = new Date(updateAgendamentoDto.dataHora);
      const duracao = updateAgendamentoDto.duracaoMinutos || agendamento.duracaoMinutos;
      await this.verificarConflitoHorario(novaDataHora, duracao, clinicId, id);
    }

    Object.assign(agendamento, updateAgendamentoDto);
    return await this.agendamentoRepository.save(agendamento);
  }

  /**
   * Remove um agendamento
   * @param id - ID do agendamento
   * @param clinicId - ID da clínica do usuário
   */
  async remove(id: string, clinicId: string): Promise<void> {
    const agendamento = await this.findOne(id, clinicId);
    await this.agendamentoRepository.remove(agendamento);
  }

  /**
   * Busca agendamentos por período
   * @param dataInicio - Data de início do período
   * @param dataFim - Data de fim do período
   * @param clinicId - ID da clínica
   * @returns Lista de agendamentos no período
   */
  async findByPeriodo(
    dataInicio: Date,
    dataFim: Date,
    clinicId: string,
  ): Promise<Agendamento[]> {
    return await this.agendamentoRepository.find({
      where: {
        clinicId,
        dataHora: Between(dataInicio, dataFim),
      },
      relations: ['createdBy'],
      order: { dataHora: 'ASC' },
    });
  }

  /**
   * Busca agendamentos por status
   * @param status - Status do agendamento
   * @param clinicId - ID da clínica
   * @returns Lista de agendamentos com o status especificado
   */
  async findByStatus(status: string, clinicId: string): Promise<Agendamento[]> {
    return await this.agendamentoRepository.find({
      where: { status, clinicId },
      relations: ['createdBy'],
      order: { dataHora: 'ASC' },
    });
  }

  /**
   * Verifica se há conflito de horário para um novo agendamento
   * @param dataHora - Data e hora do agendamento
   * @param duracaoMinutos - Duração do agendamento em minutos
   * @param clinicId - ID da clínica
   * @param agendamentoIdExcluir - ID do agendamento a excluir da verificação (para updates)
   * @throws BadRequestException se houver conflito
   */
  private async verificarConflitoHorario(
    dataHora: Date,
    duracaoMinutos: number,
    clinicId: string,
    agendamentoIdExcluir?: string,
  ): Promise<void> {
    const dataFim = new Date(dataHora.getTime() + duracaoMinutos * 60000);

    const queryBuilder = this.agendamentoRepository
      .createQueryBuilder('agendamento')
      .where('agendamento.clinicId = :clinicId', { clinicId })
      .andWhere('agendamento.status NOT IN (:...statusExcluidos)', {
        statusExcluidos: ['cancelado', 'faltou'],
      })
      .andWhere(
        '(agendamento.dataHora < :dataFim AND DATE_ADD(agendamento.dataHora, INTERVAL agendamento.duracaoMinutos MINUTE) > :dataHora)',
        { dataHora, dataFim },
      );

    if (agendamentoIdExcluir) {
      queryBuilder.andWhere('agendamento.id != :agendamentoIdExcluir', {
        agendamentoIdExcluir,
      });
    }

    const conflitos = await queryBuilder.getCount();

    if (conflitos > 0) {
      throw new BadRequestException('Já existe um agendamento neste horário');
    }
  }
}
