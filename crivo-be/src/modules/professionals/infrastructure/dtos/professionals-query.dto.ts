import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

import { PaginationQueryDto } from 'src/shared/dtos/pagination-query.dto';

export class ProfessionalsQueryDto extends PaginationQueryDto {
  /**
   * Esconde os desativados.
   *
   * Padrão `false` (inclui inativos) porque a **tela de Profissionais
   * precisa mostrá-los**: é lá que a clínica vê quem desativou ao resolver
   * o excedente do plano e reativa depois de um upgrade. Quem monta agenda
   * passa `true` — oferecer um profissional desativado no dropdown marca
   * paciente com quem não vai estar lá.
   */
  @ApiPropertyOptional({
    default: false,
    description: 'Retorna apenas profissionais ativos',
  })
  @IsOptional()
  // Query string chega como texto: sem isto, "false" (string não-vazia)
  // vira `true` e o filtro faria o oposto do pedido.
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  onlyActive?: boolean;
}
