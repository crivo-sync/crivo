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
}
