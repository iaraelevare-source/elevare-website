import { SetMetadata } from '@nestjs/common';

/**
 * Decorator para exigir consentimento antes de executar ação
 * 
 * Uso:
 * ```typescript
 * @RequireConsent('whatsapp')
 * async sendWhatsAppMessage() {
 *   // Só executa se usuário tiver consentimento ativo para WhatsApp
 * }
 * ```
 */
export const CONSENT_KEY = 'requireConsent';
export const RequireConsent = (type: 'cookie' | 'whatsapp' | 'email' | 'phone' | 'third_party') =>
  SetMetadata(CONSENT_KEY, type);
