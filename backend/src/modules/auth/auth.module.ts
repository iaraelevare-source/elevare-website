import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { User } from '../../database/entities/user.entity';
import { Clinic } from '../../database/entities/clinic.entity';
import { TwoFactorService } from './two-factor.service';
import { TwoFactorController } from './two-factor.controller';

/**
 * Módulo de autenticação
 * Configura JWT, Passport e estratégias de autenticação
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([User, Clinic]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRATION'),
        },
      }),
    }),
  ],
  controllers: [AuthController, TwoFactorController],
  providers: [AuthService, TwoFactorService, JwtStrategy, LocalStrategy],
  exports: [AuthService, TwoFactorService],
})
export class AuthModule {}
