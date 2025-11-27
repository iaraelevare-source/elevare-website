import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { Lead } from './lead.entity';
import { Agendamento } from './agendamento.entity';

/**
 * Entidade Clinic - Representa as clínicas de estética cadastradas no sistema
 * Cada clínica pode ter múltiplos usuários, leads e agendamentos
 */
@Entity('clinics')
export class Clinic {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  nome: string;

  @Column({ unique: true })
  cnpj: string;

  @Column({ nullable: true })
  telefone: string;

  @Column({ nullable: true })
  endereco: string;

  @Column({ nullable: true })
  cidade: string;

  @Column({ nullable: true })
  estado: string;

  @Column({ nullable: true })
  cep: string;

  @Column({ default: true })
  ativo: boolean;

  // Plano da clínica (para futuras implementações de billing)
  @Column({ type: 'enum', enum: ['basico', 'profissional', 'enterprise'], default: 'basico' })
  plano: string;

  // Relacionamento: uma clínica tem vários usuários
  @OneToMany(() => User, (user) => user.clinic)
  users: User[];

  // Relacionamento: uma clínica tem vários leads
  @OneToMany(() => Lead, (lead) => lead.clinic)
  leads: Lead[];

  // Relacionamento: uma clínica tem vários agendamentos
  @OneToMany(() => Agendamento, (agendamento) => agendamento.clinic)
  agendamentos: Agendamento[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
