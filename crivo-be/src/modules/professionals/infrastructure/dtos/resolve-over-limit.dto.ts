import { ApiProperty } from '@nestjs/swagger';
import { ArrayUnique, IsArray, IsUUID } from 'class-validator';

export class ResolveOverLimitDto {
  /**
   * Quem **continua ativo** — não quem sai. Ver o porquê em
   * `ResolveOverLimitUseCase`: lista de "quem sai" chega defasada se alguém
   * mexeu na equipe em outra aba, e a clínica sairia daqui ainda acima do
   * teto achando que resolveu.
   *
   * Array vazio é válido de propósito: é como a clínica desativa todo mundo
   * (caso raro, mas legítimo — ela pode querer recomeçar do zero).
   */
  @ApiProperty({
    type: [String],
    description:
      'IDs dos profissionais que continuam ativos. Todos os demais são desativados.',
  })
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  keepProfessionalIds!: string[];
}
