import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';

/**
 * Estratégia Local para autenticação com email e senha
 * Utilizada no endpoint de login
 */
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'email', // Define email como campo de username
      passwordField: 'password',
    });
  }

  /**
   * Valida as credenciais do usuário
   * @param email - Email do usuário
   * @param password - Senha do usuário
   * @returns Dados do usuário autenticado
   */
  async validate(email: string, password: string): Promise<any> {
    const user = await this.authService.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }
    return user;
  }
}
