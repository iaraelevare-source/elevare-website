import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { TwoFactorService } from './two-factor.service';
import { LoginDto, RegisterDto, AuthResponseDto } from './dto/auth.dto';
import { Complete2FALoginDto } from './dto/two-factor.dto';

/**
 * Controller de autenticação
 * Gerencia endpoints de login e registro
 */
@ApiTags('Autenticação')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private twoFactorService: TwoFactorService,
  ) {}

  /**
   * Endpoint de login
   * Autentica o usuário com email e senha
   */
  @Post('login')
  @UseGuards(AuthGuard('local'))
  @ApiOperation({ summary: 'Login de usuário' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Login realizado com sucesso', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
  async login(@Request() req): Promise<AuthResponseDto> {
    return this.authService.login(req.user);
  }

  /**
   * Endpoint de registro
   * Cria um novo usuário no sistema
   */
  @Post('register')
  @ApiOperation({ summary: 'Registro de novo usuário' })
  @ApiResponse({ status: 201, description: 'Usuário criado com sucesso', type: AuthResponseDto })
  @ApiResponse({ status: 409, description: 'Email já cadastrado' })
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(registerDto);
  }

  /**
   * Endpoint para completar login com 2FA
   * Valida o token do Google Authenticator e retorna JWT final
   */
  @Post('login/2fa')
  @ApiOperation({ summary: 'Completar login com 2FA' })
  @ApiBody({ type: Complete2FALoginDto })
  @ApiResponse({ status: 200, description: 'Login 2FA completado', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Token 2FA inválido' })
  async complete2FALogin(@Body() dto: Complete2FALoginDto): Promise<AuthResponseDto> {
    // Decodificar token temporário
    const decoded = this.authService['jwtService'].verify(dto.tempToken);
    
    if (!decoded.is2FATemp) {
      throw new Error('Token inválido');
    }

    // Validar token 2FA
    const isValid = await this.twoFactorService.verifyToken(decoded.sub, dto.token);
    
    if (!isValid) {
      throw new Error('Token 2FA inválido');
    }

    // Gerar JWT final
    const payload = { email: decoded.email, sub: decoded.sub, role: decoded.role };
    const access_token = this.authService['jwtService'].sign(payload);

    // Buscar dados do usuário
    const user = await this.authService['userRepository'].findOne({
      where: { id: decoded.sub },
    });

    // Atualizar lastLoginAt
    await this.authService['userRepository'].update(decoded.sub, {
      lastLoginAt: new Date(),
    });

    return {
      access_token,
      user: {
        id: user.id,
        email: user.email,
        nome: user.nome,
        role: user.role,
        clinicId: user.clinicId,
      },
    };
  }
}
