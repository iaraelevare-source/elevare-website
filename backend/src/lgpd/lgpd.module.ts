import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LgpdService } from './lgpd.service';
import { LgpdController } from './lgpd.controller';
import { ConsentEntity } from './entities/consent.entity';
import { User } from '../database/entities/user.entity';
import { ConsentGuard } from './guards/consent.guard';

/**
 * Módulo LGPD
 * 
 * Implementa compliance com Lei 13.709/2018 (LGPD).
 * 
 * Funcionalidades:
 * - Registro e gerenciamento de consentimentos
 * - Exportação de dados (portabilidade)
 * - Exclusão de dados (direito de esquecimento)
 * - Guards para verificação de consentimento
 * 
 * Endpoints:
 * - POST /lgpd/consent - Registrar consentimento
 * - GET /lgpd/my-consents - Listar consentimentos
 * - PATCH /lgpd/revoke - Revogar consentimento
 * - GET /lgpd/export - Exportar dados
 * - DELETE /lgpd/delete-account - Excluir conta
 * - POST /lgpd/admin/search - Buscar consentimentos (admin)
 * - GET /lgpd/admin/stats - Estatísticas (admin)
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([ConsentEntity, User]),
  ],
  providers: [LgpdService, ConsentGuard],
  controllers: [LgpdController],
  exports: [LgpdService, ConsentGuard],
})
export class LgpdModule {}
