import { Module } from '@nestjs/common';

import { PrismaModule } from '../infrastructure/prisma/prisma.module';
import { TrialGuard } from './trial.guard';

/**
 * `TrialGuard` depende de `PrismaService`, então precisa ser um provider de
 * verdade (o Nest não instancia guards com dependências fora do DI, ao
 * contrário de `JwtAuthGuard`/`RolesGuard`, que não têm nenhuma). Um módulo
 * próprio evita repetir esse provider em cada módulo de feature.
 */
@Module({
  imports: [PrismaModule],
  providers: [TrialGuard],
  exports: [TrialGuard],
})
export class GuardsModule {}
