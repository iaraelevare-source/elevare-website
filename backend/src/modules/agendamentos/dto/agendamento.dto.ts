import { IsEmail, IsNotEmpty, IsString, IsOptional, IsEnum, IsDateString, IsNumber, Min } from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';

/**
 * DTO para criação de agendamento
 */
export class CreateAgendamentoDto {
  @ApiProperty({ example: 'Maria Silva', description: 'Nome do cliente' })
  @IsString()
  @IsNotEmpty({ message: 'Nome do cliente é obrigatório' })
  clienteNome: string;

  @ApiProperty({ example: 'maria@email.com', description: 'Email do cliente' })
  @IsEmail({}, { message: 'Email inválido' })
  @IsNotEmpty({ message: 'Email é obrigatório' })
  clienteEmail: string;

  @ApiProperty({ example: '11999999999', description: 'Telefone do cliente' })
  @IsString()
  @IsNotEmpty({ message: 'Telefone é obrigatório' })
  clienteTelefone: string;

  @ApiProperty({ example: 'Botox', description: 'Procedimento a ser realizado' })
  @IsString()
  @IsNotEmpty({ message: 'Procedimento é obrigatório' })
  procedimento: string;

  @ApiProperty({ example: '2024-12-01T14:00:00Z', description: 'Data e hora do agendamento' })
  @IsDateString({}, { message: 'Data e hora inválidas' })
  @IsNotEmpty({ message: 'Data e hora são obrigatórias' })
  dataHora: string;

  @ApiProperty({ example: 60, description: 'Duração em minutos', required: false })
  @IsNumber()
  @Min(15, { message: 'Duração mínima é de 15 minutos' })
  @IsOptional()
  duracaoMinutos?: number;

  @ApiProperty({ example: 500.00, description: 'Valor do procedimento', required: false })
  @IsNumber()
  @IsOptional()
  valor?: number;

  @ApiProperty({ example: 'Cliente prefere atendimento pela manhã', description: 'Observações', required: false })
  @IsString()
  @IsOptional()
  observacoes?: string;
}

/**
 * DTO para atualização de agendamento
 */
export class UpdateAgendamentoDto extends PartialType(CreateAgendamentoDto) {
  @ApiProperty({ example: 'confirmado', enum: ['agendado', 'confirmado', 'realizado', 'cancelado', 'faltou'], description: 'Status do agendamento', required: false })
  @IsEnum(['agendado', 'confirmado', 'realizado', 'cancelado', 'faltou'])
  @IsOptional()
  status?: string;
}

/**
 * DTO de resposta de agendamento
 */
export class AgendamentoResponseDto {
  @ApiProperty({ description: 'ID do agendamento' })
  id: string;

  @ApiProperty({ description: 'Nome do cliente' })
  clienteNome: string;

  @ApiProperty({ description: 'Email do cliente' })
  clienteEmail: string;

  @ApiProperty({ description: 'Telefone do cliente' })
  clienteTelefone: string;

  @ApiProperty({ description: 'Procedimento' })
  procedimento: string;

  @ApiProperty({ description: 'Data e hora do agendamento' })
  dataHora: Date;

  @ApiProperty({ description: 'Status do agendamento' })
  status: string;

  @ApiProperty({ description: 'Valor do procedimento' })
  valor: number;

  @ApiProperty({ description: 'Data de criação' })
  createdAt: Date;
}
