import { ApiProperty } from '@nestjs/swagger';

export class PaginationMetaDto {
  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  perPage!: number;

  @ApiProperty({ example: 42 })
  total!: number;

  @ApiProperty({ example: 3 })
  totalPages!: number;
}

export type PaginatedResponse<T> = {
  data: T[];
  meta: PaginationMetaDto;
};

export function paginated<T>(
  data: T[],
  { page, perPage, total }: { page: number; perPage: number; total: number },
): PaginatedResponse<T> {
  return {
    data,
    meta: {
      page,
      perPage,
      total,
      totalPages: Math.ceil(total / perPage),
    },
  };
}
