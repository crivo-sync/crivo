import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  v2 as cloudinary,
  type TransformationOptions,
  type UploadApiResponse,
} from 'cloudinary';

/**
 * Recorte quadrado centrado no rosto — serve para foto de perfil, mas
 * destruiria um logo (corta um wordmark largo e procura um rosto que não
 * existe). Por isso a transformação é parâmetro, não constante do service.
 */
const AVATAR_TRANSFORMATION: TransformationOptions = [
  { width: 512, height: 512, crop: 'fill', gravity: 'face' },
];

@Injectable()
export class CloudinaryService {
  constructor(config: ConfigService) {
    cloudinary.config({
      cloud_name: config.getOrThrow<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: config.getOrThrow<string>('CLOUDINARY_API_KEY'),
      api_secret: config.getOrThrow<string>('CLOUDINARY_API_SECRET'),
    });
  }

  /**
   * Sobrescreve sempre o mesmo `public_id` (`folder/publicId`) — evita
   * acumular avatares antigos órfãos no Cloudinary a cada troca de foto.
   */
  async uploadImage(
    buffer: Buffer,
    folder: string,
    publicId: string,
    transformation: TransformationOptions = AVATAR_TRANSFORMATION,
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          public_id: publicId,
          overwrite: true,
          resource_type: 'image',
          transformation,
        },
        (error, result) => {
          if (error || !result) {
            reject(
              new Error(
                error?.message ?? 'Cloudinary upload failed with no result.',
              ),
            );
            return;
          }
          resolve(result);
        },
      );
      stream.end(buffer);
    });
  }

  /**
   * Upload de imagem **privada** — a URL devolvida pelo Cloudinary não abre
   * sozinha, só com assinatura válida (ver `signedUrl`).
   *
   * Existe separado de `uploadImage` porque a diferença não é de opção, é de
   * natureza: avatar e logo são públicos de propósito (aparecem na tela de
   * login, no site). Foto clínica é dado sensível de saúde — uma URL pública
   * dela vaza para qualquer um com o link, sem login, para sempre.
   *
   * `type: 'authenticated'` em vez de `'private'`: os dois exigem assinatura
   * para a entrega, mas `authenticated` permite transformação assinada (o
   * thumbnail), enquanto `private` só serve o original.
   */
  async uploadPrivateImage(
    buffer: Buffer,
    folder: string,
    publicId: string,
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          public_id: publicId,
          overwrite: true,
          resource_type: 'image',
          type: 'authenticated',
          // Sem transformação no upload: foto clínica é prova de resultado,
          // e recortar ou comprimir o original destrói o que ela documenta.
        },
        (error, result) => {
          if (error || !result) {
            reject(
              new Error(
                error?.message ?? 'Cloudinary upload failed with no result.',
              ),
            );
            return;
          }
          resolve(result);
        },
      );
      stream.end(buffer);
    });
  }

  /**
   * URL temporária para uma imagem `authenticated`.
   *
   * Expira (`expires_at`) porque link de foto clínica não pode ser
   * permanente: ele acaba em histórico de navegador, print e conversa de
   * WhatsApp. Quem precisar de novo pede outra à API, já autenticado.
   */
  signedUrl(
    publicId: string,
    options: {
      expiresInSeconds?: number;
      transformation?: TransformationOptions;
    } = {},
  ): string {
    const expiresIn = options.expiresInSeconds ?? 300;

    return cloudinary.url(publicId, {
      type: 'authenticated',
      resource_type: 'image',
      sign_url: true,
      secure: true,
      expires_at: Math.floor(Date.now() / 1000) + expiresIn,
      ...(options.transformation
        ? { transformation: options.transformation }
        : {}),
    });
  }

  /** Remove a imagem privada — usado quando a foto é excluída da ficha. */
  async destroyPrivateImage(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: 'image',
      type: 'authenticated',
    });
  }
}
