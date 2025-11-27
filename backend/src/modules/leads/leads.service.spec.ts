import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { Lead } from '../../database/entities/lead.entity';
import { CreateLeadDto, UpdateLeadDto } from './dto/lead.dto';

/**
 * Testes do LeadsService
 * Verifica se todas as operações de leads funcionam corretamente
 */
describe('LeadsService', () => {
  let service: LeadsService;
  let repository: Repository<Lead>;

  // Mock do repositório (simula o banco de dados)
  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  // Dados de teste
  const mockLead: Lead = {
    id: '123',
    nome: 'João Silva',
    email: 'joao@example.com',
    telefone: '27999999999',
    origem: 'site',
    status: 'novo',
    score: 75,
    procedimentoInteresse: 'Botox',
    observacoes: 'Lead qualificado',
    temWhatsapp: true,
    faixaEtaria: 30,
    jaRealizouProcedimento: false,
    clinicId: 'clinic-123',
    createdById: 'user-123',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: null,
    clinic: null,
    calcularScore: jest.fn(),
  };

  // Configuração antes de cada teste
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeadsService,
        {
          provide: getRepositoryToken(Lead),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<LeadsService>(LeadsService);
    repository = module.get<Repository<Lead>>(getRepositoryToken(Lead));
  });

  // Limpar mocks após cada teste
  afterEach(() => {
    jest.clearAllMocks();
  });

  // Teste: Service deve ser criado
  it('deve ser definido', () => {
    expect(service).toBeDefined();
  });

  // Testes de CREATE
  describe('create', () => {
    it('deve criar um novo lead com sucesso', async () => {
      const createLeadDto: CreateLeadDto = {
        nome: 'João Silva',
        email: 'joao@example.com',
        telefone: '27999999999',
        origem: 'site',
      };

      mockRepository.create.mockReturnValue(mockLead);
      mockRepository.save.mockResolvedValue(mockLead);

      const result = await service.create(createLeadDto, 'user-123', 'clinic-123');

      expect(result).toEqual(mockLead);
      expect(mockRepository.create).toHaveBeenCalledWith({
        ...createLeadDto,
        createdById: 'user-123',
        clinicId: 'clinic-123',
      });
      expect(mockRepository.save).toHaveBeenCalledWith(mockLead);
    });
  });

  // Testes de FIND ALL
  describe('findAll', () => {
    it('deve retornar todos os leads da clínica', async () => {
      const mockLeads = [mockLead];
      mockRepository.find.mockResolvedValue(mockLeads);

      const result = await service.findAll('clinic-123');

      expect(result).toEqual(mockLeads);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { clinicId: 'clinic-123' },
        relations: ['createdBy'],
        order: { score: 'DESC', createdAt: 'DESC' },
      });
    });

    it('deve retornar array vazio se não houver leads', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.findAll('clinic-123');

      expect(result).toEqual([]);
    });
  });

  // Testes de FIND ONE
  describe('findOne', () => {
    it('deve retornar um lead específico', async () => {
      mockRepository.findOne.mockResolvedValue(mockLead);

      const result = await service.findOne('123', 'clinic-123');

      expect(result).toEqual(mockLead);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: '123', clinicId: 'clinic-123' },
        relations: ['createdBy', 'clinic'],
      });
    });

    it('deve lançar NotFoundException se lead não existir', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('999', 'clinic-123')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // Testes de UPDATE
  describe('update', () => {
    it('deve atualizar um lead existente', async () => {
      const updateLeadDto: UpdateLeadDto = {
        nome: 'João Silva Atualizado',
        status: 'qualificado',
      };

      const updatedLead = { ...mockLead, ...updateLeadDto };
      mockRepository.findOne.mockResolvedValue(mockLead);
      mockRepository.save.mockResolvedValue(updatedLead);

      const result = await service.update('123', updateLeadDto, 'clinic-123');

      expect(result.nome).toEqual('João Silva Atualizado');
      expect(result.status).toEqual('qualificado');
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('deve lançar NotFoundException ao atualizar lead inexistente', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update('999', { nome: 'Teste' }, 'clinic-123'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // Testes de DELETE
  describe('remove', () => {
    it('deve remover um lead existente', async () => {
      mockRepository.findOne.mockResolvedValue(mockLead);
      mockRepository.remove.mockResolvedValue(mockLead);

      await service.remove('123', 'clinic-123');

      expect(mockRepository.remove).toHaveBeenCalledWith(mockLead);
    });

    it('deve lançar NotFoundException ao remover lead inexistente', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('999', 'clinic-123')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // Testes de FIND BY STATUS
  describe('findByStatus', () => {
    it('deve retornar leads por status', async () => {
      const mockLeads = [mockLead];
      mockRepository.find.mockResolvedValue(mockLeads);

      const result = await service.findByStatus('novo', 'clinic-123');

      expect(result).toEqual(mockLeads);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { status: 'novo', clinicId: 'clinic-123' },
        relations: ['createdBy'],
        order: { score: 'DESC', createdAt: 'DESC' },
      });
    });
  });

  // Testes de FIND BY MIN SCORE
  describe('findByMinScore', () => {
    it('deve retornar leads com score mínimo', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockLead]),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findByMinScore(70, 'clinic-123');

      expect(result).toEqual([mockLead]);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'lead.clinicId = :clinicId',
        { clinicId: 'clinic-123' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'lead.score >= :minScore',
        { minScore: 70 },
      );
    });
  });
});
