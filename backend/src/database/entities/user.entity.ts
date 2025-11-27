import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Clinic } from './clinic.entity';
import { Lead } from './lead.entity';
import { Agendamento } from './agendamento.entity';

/**
 * Entidade User - Representa os usuários do sistema (funcionários das clínicas)
 * Cada usuário pertence a uma clínica e pode gerenciar leads e agendamentos
 */
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude() // Exclui a senha das respostas da API
  password: string;

  @Column()
  nome: string;

  @Column({ type: 'enum', enum: ['admin', 'atendente', 'gerente'], default: 'atendente' })
  role: string;

  @Column({ default: true })
  ativo: boolean;

  // Relacionamento: um usuário pertence a uma clínica
  @ManyToOne(() => Clinic, (clinic) => clinic.users)
  clinic: Clinic;

  @Column()
  clinicId: string;

  // Relacionamento: um usuário pode criar vários leads
  @OneToMany(() => Lead, (lead) => lead.createdBy)
  leads: Lead[];

  // Relacionamento: um usuário pode criar vários agendamentos
  @OneToMany(() => Agendamento, (agendamento) => agendamento.createdBy)
  agendamentos: Agendamento[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
