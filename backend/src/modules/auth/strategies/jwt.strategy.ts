import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../../database/entities/user.entity';

/**
 * Estratégia JWT para autenticação
 * Valida o token JWT e retorna os dados do usuário
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  /**
   * Valida o payload do token JWT e retorna o usuário
   * @param payload - Payload decodificado do token JWT
   * @returns Dados do usuário autenticado
   */
  async validate(payload: any) {
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
      relations: ['clinic'],
    });

    if (!user || !user.ativo) {
      throw new UnauthorizedException('Usuário não autorizado');
    }

    return {
      id: user.id,
      email: user.email,
      nome: user.nome,
      role: user.role,
      clinicId: user.clinicId,
    };
  }
}
