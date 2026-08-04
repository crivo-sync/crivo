import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { CloudinaryService } from 'src/shared/infrastructure/cloudinary/cloudinary.service';
import {
  TENANT_REPOSITORY,
  type TenantRepository,
} from '../../domain/repository/tenant.repository';

export type UpdateTenantLogoInput = {
  tenantId: string;
  fileBuffer: Buffer;
};

@Injectable()
export class UpdateTenantLogoUseCase {
  constructor(
    @Inject(TENANT_REPOSITORY)
    private readonly tenantRepository: TenantRepository,
    private readonly cloudinary: CloudinaryService,
  ) {}

  async execute(input: UpdateTenantLogoInput) {
    const tenant = await this.tenantRepository.findById(input.tenantId);

    if (!tenant) {
      throw new NotFoundException('Tenant not found.');
    }

    // `crop: 'limit'` só reduz o que passa de 512px e preserva a proporção —
    // ao contrário do avatar, um logo não pode ser cortado em quadrado.
    const result = await this.cloudinary.uploadImage(
      input.fileBuffer,
      `crivo/tenants/${input.tenantId}`,
      'logo',
      [{ width: 512, height: 512, crop: 'limit' }],
    );

    return this.tenantRepository.update(input.tenantId, {
      logoUrl: result.secure_url,
    });
  }
}
