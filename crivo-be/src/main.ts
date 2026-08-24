import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Logger } from 'nestjs-pino';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { BadRequestException, ValidationPipe } from '@nestjs/common';

import { AppModule } from './app.module';
import { translateValidationErrors } from './shared/validation/validation-messages';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
    // O webhook do Stripe precisa dos bytes crus do corpo para validar a
    // assinatura HMAC — o corpo reserializado como JSON não bate byte a
    // byte. Isso expõe `req.rawBody` em toda requisição sem exigir
    // middleware dedicado (ver StripeWebhookController).
    rawBody: true,
  });

  const logger = app.get(Logger);

  app.useLogger(logger);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      // O produto é PT-BR: o erro de validação chega direto na tela do usuário.
      exceptionFactory: (errors) =>
        new BadRequestException(translateValidationErrors(errors)),
    }),
  );

  const port = process.env.PORT ?? 3333;
  const isProduction = process.env.NODE_ENV === 'production';

  /**
   * CORS: o front (Vercel) e a API (Railway) ficam em domínios diferentes,
   * então sem isto **toda** chamada do navegador é bloqueada. Em
   * desenvolvimento é tudo `localhost` e o problema não aparece.
   *
   * A lista vem de `CORS_ORIGINS` (separada por vírgula) em vez de `*`
   * porque a API usa `Authorization: Bearer` com dados de saúde — liberar
   * qualquer origem deixaria qualquer site chamar a API com o token da
   * clínica. Em dev, sem a variável, libera geral para não atrapalhar.
   */
  const corsOrigins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: corsOrigins.length > 0 ? corsOrigins : !isProduction,
    credentials: true,
  });

  const swaggerBuilder = new DocumentBuilder()
    .setTitle('Crivo Sync API')
    .setDescription(
      [
        'Plataforma de gestão para clínicas de estética e odontologia.',
        '',
        '**Autenticação:** faça login em `POST /auth/login`, copie o `accessToken`',
        'e informe-o no botão **Authorize** acima. O token expira em 15 minutos —',
        'use `POST /auth/refresh` para renovar sem refazer o login.',
        '',
        '**Isolamento por clínica:** todos os dados são filtrados pela clínica do',
        'usuário autenticado. O identificador da clínica vem sempre do token,',
        'nunca da requisição.',
      ].join('\n'),
    )
    .setVersion('1.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'Cole aqui o accessToken retornado por POST /auth/login',
    });

  const config = swaggerBuilder.build();

  /**
   * `/docs` fica **fora do ar em produção**: a página lista todas as rotas,
   * schemas e exemplos da API — um mapa pronto para quem quiser sondar o
   * sistema. Em dev é a principal ferramenta de trabalho, então continua
   * ligada lá. Para reativar num ambiente publicado (staging), defina
   * `SWAGGER_ENABLED=true`.
   */
  const swaggerEnabled = process.env.SWAGGER_ENABLED
    ? process.env.SWAGGER_ENABLED === 'true'
    : !isProduction;

  if (swaggerEnabled) {
    const doc = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, doc);
  }

  /**
   * `0.0.0.0` e não o default (`localhost`): plataformas de container
   * (Railway, Render, Fly) roteiam o tráfego de fora para dentro do
   * container — ligado só em `localhost`, a app sobe, o healthcheck falha e
   * o deploy fica reiniciando sem explicação óbvia.
   */
  await app.listen(port, '0.0.0.0');

  logger.log(`🚀 Application is running on port ${port}`);
  if (swaggerEnabled) logger.log(`📚 API Documentation available at /docs`);
}
bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
