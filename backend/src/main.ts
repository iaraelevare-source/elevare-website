import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

/**
 * Função principal de inicialização da aplicação
 * Configura validação, Swagger e inicia o servidor
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilita CORS para permitir requisições de diferentes origens
  app.enableCors();

  // Configura validação global de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Remove propriedades não definidas nos DTOs
      forbidNonWhitelisted: true, // Retorna erro se propriedades extras forem enviadas
      transform: true, // Transforma automaticamente tipos primitivos
    }),
  );

  // Configura prefixo global para todas as rotas
  app.setGlobalPrefix('api');

  // Configuração do Swagger para documentação da API
  const config = new DocumentBuilder()
    .setTitle('Elevare API')
    .setDescription('API para automação de clínicas de estética')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Autenticação', 'Endpoints de login e registro')
    .addTag('Leads', 'Gerenciamento de leads com scoring automático')
    .addTag('Agendamentos', 'Gerenciamento de agendamentos')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🚀 Servidor rodando em http://localhost:${port}`);
  console.log(`📚 Documentação Swagger em http://localhost:${port}/api/docs`);
}

bootstrap();
