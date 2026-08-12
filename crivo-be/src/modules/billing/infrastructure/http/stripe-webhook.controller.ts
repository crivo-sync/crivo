import {
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Request } from 'express';

import { HandleStripeWebhookUseCase } from '../../application/use-cases/handle-stripe-webhook.use-case';

/**
 * Sem nenhum guard de propósito: o Stripe não tem como logar como usuário
 * do Crivo. A única credencial aqui é a assinatura HMAC, verificada dentro
 * do use-case a partir de `req.rawBody` (ver `main.ts` → `rawBody: true`).
 */
@ApiExcludeController()
@Controller('billing/webhook')
export class StripeWebhookController {
  constructor(
    private readonly handleStripeWebhook: HandleStripeWebhookUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async handle(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ): Promise<void> {
    if (!req.rawBody) {
      throw new Error(
        'Missing raw body — is `rawBody: true` set in NestFactory.create?',
      );
    }

    await this.handleStripeWebhook.execute({
      rawBody: req.rawBody,
      signature,
    });
  }
}
