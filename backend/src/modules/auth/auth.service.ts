import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../../database/entities/user.entity';
import { Clinic } from '../../database/entities/clinic.entity';
import { RegisterDto, AuthResponseDto } from './dto/auth.dto';

/**
 * Service de autenticação
 * Gerencia login, registro e validação de usuários
 */
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Clinic)
    private clinicRepository: Repository<Clinic>,
    private jwtService: JwtService,
  ) {}

  /**
   * Valida as credenciais do usuário (email e senha)
   * @param email - Email do usuário
   * @param password - Senha do usuário
   * @returns Dados do usuário se válido, null caso contrário
   */
  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['clinic'],
    });

    if (!user || !user.ativo) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    const { password: _, ...result } = user;
    return result;
  }

  /**
   * Realiza o login do usuário e gera o token JWT
   * @param user - Dados do usuário autenticado
   * @returns Token JWT e dados do usuário
   */
  async login(user: any): Promise<AuthResponseDto> {
    const payload = { email: user.email, sub: user.id, role: user.role };
    
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        nome: user.nome,
        role: user.role,
        clinicId: user.clinicId,
      },
    };
  }

  /**
   * Registra um novo usuário no sistema
   * @param registerDto - Dados do usuário a ser registrado
   * @returns Token JWT e dados do usuário criado
   */
  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    // Verifica se o email já está em uso
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email já cadastrado');
    }

    // Verifica se a clínica existe
    const clinic = await this.clinicRepository.findOne({
      where: { id: registerDto.clinicId },
    });

    if (!clinic) {
      throw new UnauthorizedException('Clínica não encontrada');
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Cria o novo usuário
    const user = this.userRepository.create({
      email: registerDto.email,
      password: hashedPassword,
      nome: registerDto.nome,
      clinicId: registerDto.clinicId,
      role: 'atendente', // Role padrão
      ativo: true,
    });

    await this.userRepository.save(user);

    // Retorna o token JWT
    return this.login(user);
  }
}
