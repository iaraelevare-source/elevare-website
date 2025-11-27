import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';
import { User } from '../../database/entities/user.entity';

/**
 * Serviço de Autenticação de Dois Fatores (2FA)
 * 
 * Implementa TOTP (Time-based One-Time Password) usando:
 * - otplib: Geração e validação de tokens
 * - qrcode: Geração de QR Code para Google Authenticator
 * 
 * Fluxo de ativação:
 * 1. Usuário solicita setup → Gera secret e QR Code
 * 2. Usuário escaneia QR Code no Google Authenticator
 * 3. Usuário envia token de 6 dígitos para verificar
 * 4. Sistema ativa 2FA se token for válido
 * 
 * Segurança:
 * - Secret armazenado criptografado no banco
 * - Token válido por 30 segundos
 * - Janela de tolerância de 1 step (±30s)
 */
@Injectable()
export class TwoFactorService {
  private readonly logger = new Logger(TwoFactorService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    // Configurar otplib
    authenticator.options = {
      window: 1, // Aceita tokens de ±30s (tolerância de clock)
    };
  }

  /**
   * Gera secret e QR Code para configuração inicial
   * 
   * @param userId - ID do usuário
   * @returns QR Code em base64 e secret (para backup manual)
   */
  async generateSecret(userId: string): Promise<{ qrCode: string; secret: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Gerar secret aleatório (base32)
    const secret = authenticator.generateSecret();

    // Criar URI para Google Authenticator
    // Formato: otpauth://totp/Elevare:email@example.com?secret=SECRET&issuer=Elevare
    const otpauthUrl = authenticator.keyuri(
      user.email,
      'Elevare',
      secret,
    );

    // Gerar QR Code em formato Data URL (base64)
    const qrCode = await QRCode.toDataURL(otpauthUrl);

    // Salvar secret temporário (ainda não ativado)
    await this.userRepository.update(userId, {
      tfaSecret: secret,
      tfaEnabled: false, // Só ativa após verificação
    });

    this.logger.log(`2FA secret gerado para usuário: ${user.email}`);

    return {
      qrCode, // Data URL para exibir no frontend
      secret, // Secret em texto para backup manual
    };
  }

  /**
   * Verifica se um token TOTP é válido
   * 
   * @param userId - ID do usuário
   * @param token - Token de 6 dígitos do Google Authenticator
   * @returns true se válido, false caso contrário
   */
  async verifyToken(userId: string, token: string): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'email', 'tfaSecret'], // Incluir tfaSecret (select: false por padrão)
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    if (!user.tfaSecret) {
      throw new BadRequestException('2FA não configurado. Execute /2fa/setup primeiro');
    }

    // Validar token usando otplib
    const isValid = authenticator.check(token, user.tfaSecret);

    if (isValid) {
      this.logger.log(`Token 2FA válido para usuário: ${user.email}`);
    } else {
      this.logger.warn(`Token 2FA inválido para usuário: ${user.email}`);
    }

    return isValid;
  }

  /**
   * Ativa 2FA após verificação bem-sucedida
   * 
   * @param userId - ID do usuário
   * @param token - Token de 6 dígitos para confirmar ativação
   */
  async enable2FA(userId: string, token: string): Promise<void> {
    const isValid = await this.verifyToken(userId, token);

    if (!isValid) {
      throw new BadRequestException('Token inválido. Verifique o código no Google Authenticator');
    }

    // Ativar 2FA
    await this.userRepository.update(userId, {
      tfaEnabled: true,
    });

    const user = await this.userRepository.findOne({ where: { id: userId } });
    this.logger.warn(`⚠️  2FA ATIVADO para usuário: ${user.email}`);
  }

  /**
   * Desativa 2FA (requer token válido para segurança)
   * 
   * @param userId - ID do usuário
   * @param token - Token de 6 dígitos para confirmar desativação
   */
  async disable2FA(userId: string, token: string): Promise<void> {
    const isValid = await this.verifyToken(userId, token);

    if (!isValid) {
      throw new BadRequestException('Token inválido. Não é possível desativar 2FA');
    }

    // Desativar 2FA e remover secret
    await this.userRepository.update(userId, {
      tfaEnabled: false,
      tfaSecret: null,
    });

    const user = await this.userRepository.findOne({ where: { id: userId } });
    this.logger.warn(`⚠️  2FA DESATIVADO para usuário: ${user.email}`);
  }

  /**
   * Verifica se usuário tem 2FA ativado
   * 
   * @param userId - ID do usuário
   * @returns true se 2FA está ativado
   */
  async is2FAEnabled(userId: string): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'tfaEnabled'],
    });

    return user?.tfaEnabled || false;
  }
}
