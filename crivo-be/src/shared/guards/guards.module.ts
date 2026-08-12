import { Module } from '@nestjs/common';

import { PrismaModule } from '../infrastructure/prisma/prisma.module';
import { TrialGuard } from './trial.guard';
import { PlanFeatureGuard } from './plan-feature.guard';

/**
 * `TrialGuard`/`PlanFeatureGuard` dependem de `PrismaService`, então
 * precisam ser providers de verdade (o Nest não instancia guards com
 * dependências fora do DI, ao contrário de `JwtAuthGuard`/`RolesGuard`, que
 * não têm nenhuma). Um módulo próprio evita repetir esses providers em cada
 * módulo de feature.
 */
@Module({
  imports: [PrismaModule],
  providers: [TrialGuard, PlanFeatureGuard],
  exports: [TrialGuard, PlanFeatureGuard],
})
export class GuardsModule {}
