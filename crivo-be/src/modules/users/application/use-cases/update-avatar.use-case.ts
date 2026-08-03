import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { CloudinaryService } from 'src/shared/infrastructure/cloudinary/cloudinary.service';
import {
  USER_MANAGEMENT_REPOSITORY,
  type UserManagementRepository,
} from '../../domain/repository/user.repository';

export type UpdateAvatarInput = {
  userId: string;
  tenantId: string;
  fileBuffer: Buffer;
};

@Injectable()
export class UpdateAvatarUseCase {
  constructor(
    @Inject(USER_MANAGEMENT_REPOSITORY)
    private readonly userRepository: UserManagementRepository,
    private readonly cloudinary: CloudinaryService,
  ) {}

  async execute(input: UpdateAvatarInput) {
    const user = await this.userRepository.findByIdAndTenant(
      input.userId,
      input.tenantId,
    );

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    // public_id fixo por usuário: uma troca de avatar sobrescreve a anterior
    // no Cloudinary (`overwrite: true` no service), sem acumular lixo órfão.
    const result = await this.cloudinary.uploadImage(
      input.fileBuffer,
      'crivo/avatars',
      input.userId,
    );

    return this.userRepository.update(input.userId, {
      avatarUrl: result.secure_url,
    });
  }
}
