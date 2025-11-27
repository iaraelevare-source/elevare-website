import { IsString, IsNotEmpty, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para completar login com 2FA
 */
export class Complete2FALoginDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Token temporário recebido no login',
  })
  @IsString()
  @IsNotEmpty({ message: 'Token temporário é obrigatório' })
  tempToken: string;

  @ApiProperty({
    example: '123456',
    description: 'Token de 6 dígitos do Google Authenticator',
  })
  @IsString()
  @Length(6, 6, { message: 'Token deve ter 6 dígitos' })
  @IsNotEmpty({ message: 'Token 2FA é obrigatório' })
  token: string;
}
