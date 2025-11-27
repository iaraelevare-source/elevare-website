import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { Clinic } from './clinic.entity';
import { User } from './user.entity';

/**
 * Entidade Lead - Representa os leads (potenciais clientes) das clínicas
 * Inclui sistema de scoring automático baseado em critérios definidos
 */
@Entity('leads')
export class Lead {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nome: string;

  @Column()
  email: string;

  @Column()
  telefone: string;

  @Column({ type: 'enum', enum: ['novo', 'contatado', 'qualificado', 'convertido', 'perdido'], default: 'novo' })
  status: string;

  @Column({ nullable: true })
  procedimentoInteresse: string;

  @Column({ type: 'text', nullable: true })
  observacoes: string;

  // Scoring automático (0-100)
  @Column({ type: 'int', default: 0 })
  score: number;

  // Origem do lead (para análise de canais)
  @Column({ type: 'enum', enum: ['site', 'instagram', 'facebook', 'indicacao', 'google', 'outro'], default: 'site' })
  origem: string;

  // Dados para cálculo de scoring
  @Column({ type: 'boolean', default: false })
  temWhatsapp: boolean;

  @Column({ type: 'int', nullable: true })
  faixaEtaria: number; // 18-25, 26-35, 36-45, 46+

  @Column({ type: 'boolean', default: false })
  jaRealizouProcedimento: boolean;

  // Relacionamento: um lead pertence a uma clínica
  @ManyToOne(() => Clinic, (clinic) => clinic.leads)
  clinic: Clinic;

  @Column()
  clinicId: string;

  // Relacionamento: um lead é criado por um usuário
  @ManyToOne(() => User, (user) => user.leads)
  createdBy: User;

  @Column()
  createdById: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * Calcula o score do lead automaticamente antes de inserir ou atualizar
   * Critérios de scoring:
   * - Tem WhatsApp: +20 pontos
   * - Faixa etária ideal (26-45): +15 pontos
   * - Já realizou procedimento: +25 pontos
   * - Procedimento de interesse preenchido: +20 pontos
   * - Origem qualificada (indicação, google): +20 pontos
   */
  @BeforeInsert()
  @BeforeUpdate()
  calcularScore() {
    let score = 0;

    // Tem WhatsApp
    if (this.temWhatsapp) {
      score += 20;
    }

    // Faixa etária ideal
    if (this.faixaEtaria >= 26 && this.faixaEtaria <= 45) {
      score += 15;
    }

    // Já realizou procedimento
    if (this.jaRealizouProcedimento) {
      score += 25;
    }

    // Procedimento de interesse preenchido
    if (this.procedimentoInteresse && this.procedimentoInteresse.length > 0) {
      score += 20;
    }

    // Origem qualificada
    if (['indicacao', 'google'].includes(this.origem)) {
      score += 20;
    }

    this.score = Math.min(score, 100); // Máximo de 100 pontos
  }
}
