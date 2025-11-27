import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lead } from '../../database/entities/lead.entity';
import { CreateLeadDto, UpdateLeadDto } from './dto/lead.dto';

/**
 * Service de gerenciamento de leads
 * Implementa CRUD completo com scoring automático
 */
@Injectable()
export class LeadsService {
  constructor(
    @InjectRepository(Lead)
    private leadRepository: Repository<Lead>,
  ) {}

  /**
   * Cria um novo lead
   * O score é calculado automaticamente pelo hook @BeforeInsert da entidade
   * @param createLeadDto - Dados do lead a ser criado
   * @param userId - ID do usuário que está criando o lead
   * @param clinicId - ID da clínica do usuário
   * @returns Lead criado
   */
  async create(createLeadDto: CreateLeadDto, userId: string, clinicId: string): Promise<Lead> {
    const lead = this.leadRepository.create({
      ...createLeadDto,
      createdById: userId,
      clinicId: clinicId,
    });

    return await this.leadRepository.save(lead);
  }

  /**
   * Lista todos os leads da clínica do usuário
   * @param clinicId - ID da clínica
   * @returns Lista de leads
   */
  async findAll(clinicId: string): Promise<Lead[]> {
    return await this.leadRepository.find({
      where: { clinicId },
      relations: ['createdBy'],
      order: { score: 'DESC', createdAt: 'DESC' }, // Ordena por score (maior primeiro)
    });
  }

  /**
   * Busca um lead específico por ID
   * @param id - ID do lead
   * @param clinicId - ID da clínica do usuário
   * @returns Lead encontrado
   */
  async findOne(id: string, clinicId: string): Promise<Lead> {
    const lead = await this.leadRepository.findOne({
      where: { id, clinicId },
      relations: ['createdBy', 'clinic'],
    });

    if (!lead) {
      throw new NotFoundException('Lead não encontrado');
    }

    return lead;
  }

  /**
   * Atualiza um lead existente
   * O score é recalculado automaticamente pelo hook @BeforeUpdate da entidade
   * @param id - ID do lead
   * @param updateLeadDto - Dados a serem atualizados
   * @param clinicId - ID da clínica do usuário
   * @returns Lead atualizado
   */
  async update(id: string, updateLeadDto: UpdateLeadDto, clinicId: string): Promise<Lead> {
    const lead = await this.findOne(id, clinicId);

    Object.assign(lead, updateLeadDto);
    return await this.leadRepository.save(lead);
  }

  /**
   * Remove um lead
   * @param id - ID do lead
   * @param clinicId - ID da clínica do usuário
   */
  async remove(id: string, clinicId: string): Promise<void> {
    const lead = await this.findOne(id, clinicId);
    await this.leadRepository.remove(lead);
  }

  /**
   * Busca leads por status
   * @param status - Status do lead
   * @param clinicId - ID da clínica
   * @returns Lista de leads com o status especificado
   */
  async findByStatus(status: string, clinicId: string): Promise<Lead[]> {
    return await this.leadRepository.find({
      where: { status, clinicId },
      relations: ['createdBy'],
      order: { score: 'DESC', createdAt: 'DESC' },
    });
  }

  /**
   * Busca leads com score acima de um valor mínimo
   * @param minScore - Score mínimo
   * @param clinicId - ID da clínica
   * @returns Lista de leads qualificados
   */
  async findByMinScore(minScore: number, clinicId: string): Promise<Lead[]> {
    return await this.leadRepository
      .createQueryBuilder('lead')
      .where('lead.clinicId = :clinicId', { clinicId })
      .andWhere('lead.score >= :minScore', { minScore })
      .orderBy('lead.score', 'DESC')
      .getMany();
  }
}
