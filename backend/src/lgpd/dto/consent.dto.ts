import { IsString, IsBoolean, IsOptional, IsEnum, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO para registro de consentimento
 */
export class RecordConsentDto {
  @ApiPropertyOptional({ description: 'ID do usuário (opcional para leads não cadastrados)' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({ 
    description: 'Tipo de consentimento',
    enum: ['cookie', 'whatsapp', 'email', 'phone', 'third_party'],
  })
  @IsEnum(['cookie', 'whatsapp', 'email', 'phone', 'third_party'])
  type: 'cookie' | 'whatsapp' | 'email' | 'phone' | 'third_party';

  @ApiProperty({ description: 'Finalidade específica do tratamento' })
  @IsString()
  purpose: string;

  @ApiProperty({ description: 'Consentimento foi concedido?' })
  @IsBoolean()
  granted: boolean;

  @ApiPropertyOptional({ description: 'Session ID para leads temporários' })
  @IsOptional()
  @IsString()
  sessionId?: string;

  @ApiPropertyOptional({ description: 'Metadados adicionais' })
  @IsOptional()
  @IsObject()
  metadata?: any;
}

/**
 * DTO para revogação de consentimento
 */
export class RevokeConsentDto {
  @ApiProperty({ 
    description: 'Tipo de consentimento a revogar',
    enum: ['cookie', 'whatsapp', 'email', 'phone', 'third_party'],
  })
  @IsEnum(['cookie', 'whatsapp', 'email', 'phone', 'third_party'])
  type: 'cookie' | 'whatsapp' | 'email' | 'phone' | 'third_party';
}

/**
 * DTO de resposta para exportação de dados
 */
export class ExportUserDataDto {
  @ApiProperty({ description: 'Dados do usuário' })
  user: any;

  @ApiProperty({ description: 'Lista de consentimentos' })
  consents: any[];

  @ApiProperty({ description: 'Total de leads' })
  totalLeads: number;

  @ApiProperty({ description: 'Total de agendamentos' })
  totalAppointments: number;

  @ApiProperty({ description: 'Dias de retenção de dados' })
  dataRetentionDays: number;

  @ApiProperty({ description: 'Data de exportação' })
  exportedAt: string;
}
