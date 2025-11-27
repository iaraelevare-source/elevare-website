import { IsEmail, IsNotEmpty, IsString, MinLength, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para login de usuário
 */
export class LoginDto {
  @ApiProperty({ example: 'usuario@clinica.com', description: 'Email do usuário' })
  @IsEmail({}, { message: 'Email inválido' })
  @IsNotEmpty({ message: 'Email é obrigatório' })
  email: string;

  @ApiProperty({ example: 'senha123', description: 'Senha do usuário' })
  @IsString()
  @IsNotEmpty({ message: 'Senha é obrigatória' })
  password: string;
}

/**
 * DTO para registro de novo usuário
 */
export class RegisterDto {
  @ApiProperty({ example: 'usuario@clinica.com', description: 'Email do usuário' })
  @IsEmail({}, { message: 'Email inválido' })
  @IsNotEmpty({ message: 'Email é obrigatório' })
  email: string;

  @ApiProperty({ example: 'senha123', description: 'Senha do usuário (mínimo 6 caracteres)' })
  @IsString()
  @MinLength(6, { message: 'Senha deve ter no mínimo 6 caracteres' })
  @IsNotEmpty({ message: 'Senha é obrigatória' })
  password: string;

  @ApiProperty({ example: 'João Silva', description: 'Nome completo do usuário' })
  @IsString()
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  nome: string;

  @ApiProperty({ example: 'uuid-da-clinica', description: 'ID da clínica' })
  @IsUUID('4', { message: 'ID da clínica inválido' })
  @IsNotEmpty({ message: 'ID da clínica é obrigatório' })
  clinicId: string;
}

/**
 * DTO de resposta de autenticação
 */
export class AuthResponseDto {
  @ApiProperty({ description: 'Token JWT de acesso' })
  access_token: string;

  @ApiProperty({ description: 'Dados do usuário autenticado' })
  user: {
    id: string;
    email: string;
    nome: string;
    role: string;
    clinicId: string;
  };
}
