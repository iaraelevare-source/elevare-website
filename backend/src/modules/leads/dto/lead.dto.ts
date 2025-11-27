import { IsEmail, IsNotEmpty, IsString, IsOptional, IsEnum, IsBoolean, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';

/**
 * DTO para criação de lead
 */
export class CreateLeadDto {
  @ApiProperty({ example: 'Maria Silva', description: 'Nome do lead' })
  @IsString()
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  nome: string;

  @ApiProperty({ example: 'maria@email.com', description: 'Email do lead' })
  @IsEmail({}, { message: 'Email inválido' })
  @IsNotEmpty({ message: 'Email é obrigatório' })
  email: string;

  @ApiProperty({ example: '11999999999', description: 'Telefone do lead' })
  @IsString()
  @IsNotEmpty({ message: 'Telefone é obrigatório' })
  telefone: string;

  @ApiProperty({ example: 'Botox', description: 'Procedimento de interesse', required: false })
  @IsString()
  @IsOptional()
  procedimentoInteresse?: string;

  @ApiProperty({ example: 'Cliente indicado por fulana', description: 'Observações', required: false })
  @IsString()
  @IsOptional()
  observacoes?: string;

  @ApiProperty({ example: 'instagram', enum: ['site', 'instagram', 'facebook', 'indicacao', 'google', 'outro'], description: 'Origem do lead' })
  @IsEnum(['site', 'instagram', 'facebook', 'indicacao', 'google', 'outro'])
  @IsNotEmpty({ message: 'Origem é obrigatória' })
  origem: string;

  @ApiProperty({ example: true, description: 'Possui WhatsApp', required: false })
  @IsBoolean()
  @IsOptional()
  temWhatsapp?: boolean;

  @ApiProperty({ example: 30, description: 'Faixa etária do lead', required: false })
  @IsInt()
  @Min(18)
  @Max(100)
  @IsOptional()
  faixaEtaria?: number;

  @ApiProperty({ example: false, description: 'Já realizou procedimento estético', required: false })
  @IsBoolean()
  @IsOptional()
  jaRealizouProcedimento?: boolean;
}

/**
 * DTO para atualização de lead
 */
export class UpdateLeadDto extends PartialType(CreateLeadDto) {
  @ApiProperty({ example: 'contatado', enum: ['novo', 'contatado', 'qualificado', 'convertido', 'perdido'], description: 'Status do lead', required: false })
  @IsEnum(['novo', 'contatado', 'qualificado', 'convertido', 'perdido'])
  @IsOptional()
  status?: string;
}

/**
 * DTO de resposta de lead
 */
export class LeadResponseDto {
  @ApiProperty({ description: 'ID do lead' })
  id: string;

  @ApiProperty({ description: 'Nome do lead' })
  nome: string;

  @ApiProperty({ description: 'Email do lead' })
  email: string;

  @ApiProperty({ description: 'Telefone do lead' })
  telefone: string;

  @ApiProperty({ description: 'Status do lead' })
  status: string;

  @ApiProperty({ description: 'Score do lead (0-100)' })
  score: number;

  @ApiProperty({ description: 'Origem do lead' })
  origem: string;

  @ApiProperty({ description: 'Data de criação' })
  createdAt: Date;
}
