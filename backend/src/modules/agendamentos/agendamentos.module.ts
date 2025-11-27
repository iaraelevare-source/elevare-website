import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgendamentosService } from './agendamentos.service';
import { AgendamentosController } from './agendamentos.controller';
import { Agendamento } from '../../database/entities/agendamento.entity';

/**
 * Módulo de gerenciamento de agendamentos
 * Configura o CRUD de agendamentos com validação de conflitos
 */
@Module({
  imports: [TypeOrmModule.forFeature([Agendamento])],
  controllers: [AgendamentosController],
  providers: [AgendamentosService],
  exports: [AgendamentosService],
})
export class AgendamentosModule {}
