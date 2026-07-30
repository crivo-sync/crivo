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

  const swaggerBuilder = new DocumentBuilder()
    .setTitle('Crivo API')
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

  const doc = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, doc);

  await app.listen(port);

  logger.log(`🚀 Application is running on: http://localhost:${port}`);
  logger.log(
    `📚 API Documentation available at: http://localhost:${port}/docs`,
  );
}
bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
