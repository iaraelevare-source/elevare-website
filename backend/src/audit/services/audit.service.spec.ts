import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditService } from './audit.service';
import { AuditLog } from '../entities/audit-log.entity';

/**
 * Testes do AuditService
 * Verifica rastreabilidade e compliance
 */
describe('AuditService', () => {
  let service: AuditService;
  let repository: Repository<AuditLog>;

  const mockRepository = {
    save: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockAuditLog: AuditLog = {
    id: 'audit-123',
    action: 'CREATE_LEAD',
    entity: 'Lead',
    entityId: 'lead-123',
    userId: 'user-123',
    ipAddress: '192.168.1.1',
    before: null,
    after: { name: 'João Silva' },
    error: null,
    createdAt: new Date(),
    source: 'web',
    userAgent: 'Mozilla/5.0',
    duration: 150,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: getRepositoryToken(AuditLog),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
    repository = module.get<Repository<AuditLog>>(getRepositoryToken(AuditLog));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('deve ser definido', () => {
    expect(service).toBeDefined();
  });

  // Testes de LOG
  describe('log', () => {
    it('deve registrar audit log manualmente', async () => {
      mockRepository.save.mockResolvedValue(mockAuditLog);

      await service.log({
        action: 'CREATE_LEAD',
        entity: 'Lead',
        entityId: 'lead-123',
        userId: 'user-123',
        ipAddress: '192.168.1.1',
      });

      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('deve usar valores padrão se não fornecidos', async () => {
      mockRepository.save.mockResolvedValue(mockAuditLog);

      await service.log({
        action: 'SYSTEM_ACTION',
        entity: 'System',
        entityId: 'system-123',
      });

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          ipAddress: '0.0.0.0',
          source: 'system',
        }),
      );
    });
  });

  // Testes de GET ENTITY HISTORY
  describe('getEntityHistory', () => {
    it('deve retornar histórico de uma entidade', async () => {
      const mockLogs = [mockAuditLog];
      mockRepository.find.mockResolvedValue(mockLogs);

      const result = await service.getEntityHistory('Lead', 'lead-123');

      expect(result).toEqual(mockLogs);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { entity: 'Lead', entityId: 'lead-123' },
        order: { createdAt: 'DESC' },
      });
    });
  });

  // Testes de GET USER ACTIVITY
  describe('getUserActivity', () => {
    it('deve retornar atividades do usuário', async () => {
      const mockLogs = [mockAuditLog];
      mockRepository.find.mockResolvedValue(mockLogs);

      const result = await service.getUserActivity('user-123');

      expect(result).toEqual(mockLogs);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        order: { createdAt: 'DESC' },
        take: 100,
      });
    });

    it('deve respeitar limite customizado', async () => {
      mockRepository.find.mockResolvedValue([]);

      await service.getUserActivity('user-123', 50);

      expect(mockRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({ take: 50 }),
      );
    });
  });

  // Testes de GENERATE ACCESS REPORT
  describe('generateAccessReport', () => {
    it('deve gerar relatório de acesso LGPD', async () => {
      const mockLogs = [mockAuditLog];
      mockRepository.find.mockResolvedValue(mockLogs);

      const result = await service.generateAccessReport('user-123');

      expect(result).toHaveProperty('userId', 'user-123');
      expect(result).toHaveProperty('totalAccess', 1);
      expect(result).toHaveProperty('lastAccess');
      expect(result).toHaveProperty('accessHistory');
      expect(result.accessHistory).toHaveLength(1);
    });

    it('deve retornar lastAccess null se não houver logs', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.generateAccessReport('user-123');

      expect(result.totalAccess).toBe(0);
      expect(result.lastAccess).toBeNull();
    });
  });

  // Testes de FIND SUSPICIOUS ACTIVITY
  describe('findSuspiciousActivity', () => {
    it('deve detectar múltiplos IPs', async () => {
      const logsWithDifferentIPs = [
        { ...mockAuditLog, ipAddress: '192.168.1.1' },
        { ...mockAuditLog, ipAddress: '10.0.0.1' },
        { ...mockAuditLog, ipAddress: '203.0.113.1' },
        { ...mockAuditLog, ipAddress: '198.51.100.1' },
      ];
      mockRepository.find.mockResolvedValue(logsWithDifferentIPs);

      const result = await service.findSuspiciousActivity('user-123');

      expect(result.multipleIPs.length).toBeGreaterThan(0);
    });

    it('deve detectar ações falhadas', async () => {
      const logsWithErrors = [
        { ...mockAuditLog, error: 'Erro de autenticação' },
      ];
      mockRepository.find.mockResolvedValue(logsWithErrors);

      const result = await service.findSuspiciousActivity('user-123');

      expect(result.failedActions).toHaveLength(1);
    });

    it('deve detectar horários incomuns (madrugada)', async () => {
      // Criar data com horário local (3h da manhã)
      const lateNightDate = new Date();
      lateNightDate.setHours(3, 0, 0, 0);
      
      const lateNightLog = {
        ...mockAuditLog,
        createdAt: lateNightDate,
      };
      mockRepository.find.mockResolvedValue([lateNightLog]);

      const result = await service.findSuspiciousActivity('user-123');

      expect(result.unusualHours).toHaveLength(1);
    });
  });

  // Testes de GET STATS
  describe('getStats', () => {
    it('deve retornar estatísticas agregadas', async () => {
      const mockLogs = [
        mockAuditLog,
        { ...mockAuditLog, action: 'UPDATE_LEAD', duration: 200 },
      ];
      mockRepository.find.mockResolvedValue(mockLogs);

      const result = await service.getStats();

      expect(result).toHaveProperty('total', 2);
      expect(result).toHaveProperty('byAction');
      expect(result).toHaveProperty('byEntity');
      expect(result).toHaveProperty('bySource');
      expect(result).toHaveProperty('avgDuration');
    });
  });

  // Testes de CLEAN OLD LOGS
  describe('cleanOldLogs', () => {
    it('deve remover logs antigos', async () => {
      const mockResult = { affected: 50 };
      const mockQueryBuilder = {
        delete: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(mockResult),
      };
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.cleanOldLogs(365);

      expect(result).toBe(50);
      expect(mockQueryBuilder.delete).toHaveBeenCalled();
    });
  });
});
