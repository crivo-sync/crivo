import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Logger } from 'nestjs-pino';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  const logger = app.get(Logger);

  app.useLogger(logger);

  const port = process.env.PORT ?? 3333;

  const swaggerBuilder = new DocumentBuilder()
    .setTitle('Crivo')
    .setDescription(
      'Crivo API para gerenciamento whitelabel de estética e odontologia',
    )
    .setVersion('1.0')
    .addBearerAuth();

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
