import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Clinic } from './clinic.entity';
import { User } from './user.entity';

/**
 * Entidade Agendamento - Representa os agendamentos de procedimentos nas clínicas
 * Gerencia data, horário, status e informações do cliente
 */
@Entity('agendamentos')
export class Agendamento {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  clienteNome: string;

  @Column()
  clienteEmail: string;

  @Column()
  clienteTelefone: string;

  @Column()
  procedimento: string;

  @Column({ type: 'timestamp' })
  dataHora: Date;

  @Column({ type: 'int', default: 60 })
  duracaoMinutos: number;

  @Column({ type: 'enum', enum: ['agendado', 'confirmado', 'realizado', 'cancelado', 'faltou'], default: 'agendado' })
  status: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  valor: number;

  @Column({ type: 'text', nullable: true })
  observacoes: string;

  // Confirmação de presença (para envio de lembretes)
  @Column({ type: 'boolean', default: false })
  confirmadoPeloCliente: boolean;

  @Column({ type: 'timestamp', nullable: true })
  dataConfirmacao: Date;

  // Relacionamento: um agendamento pertence a uma clínica
  @ManyToOne(() => Clinic, (clinic) => clinic.agendamentos)
  clinic: Clinic;

  @Column()
  clinicId: string;

  // Relacionamento: um agendamento é criado por um usuário
  @ManyToOne(() => User, (user) => user.agendamentos)
  createdBy: User;

  @Column()
  createdById: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
