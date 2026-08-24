# Padrão de desenvolvimento — Crivo Sync BE

Guia para criar e manter módulos neste projeto.

Os exemplos usam um recurso fictício `resource` (`Resource`, `ResourceRepository`, …). Ao aplicar, troque pelo nome real no singular — `appointment`, `professional`, `procedure`. Os módulos já existentes em `src/modules/` seguem este padrão e servem como referência viva.

> Este documento descreve o padrão real do código, não um ideal. Se você mudar o padrão, atualize este arquivo no mesmo commit.

---

## 1. Arquitetura em camadas

Cada módulo vive em `src/modules/<recurso-plural>/` e tem três camadas:

```
src/modules/resources/
├── domain/
│   └── repository/
│       └── resource.repository.ts          # tipos + contrato + token DI. ZERO Prisma/Nest aqui
├── application/
│   └── use-cases/
│       ├── create-resource.use-case.ts     # uma regra de negócio por arquivo
│       ├── get-resources.use-case.ts
│       └── ...
├── infrastructure/
│   ├── dtos/                               # entrada (validação) e saída (apresentação)
│   ├── http/
│   │   └── resource.controller.ts          # rotas, guards, mapeamento DTO
│   └── prisma/
│       └── prisma-resource.repository.ts   # implementação do contrato
└── resources.module.ts
```

Pasta do módulo no plural; arquivos no singular.

**Regra de dependência:** `infrastructure` → `application` → `domain`. Nunca o contrário. O `domain` não importa nada de Nest nem de Prisma além dos tipos gerados.

### Por que o repositório é um contrato + token

```ts
// domain/repository/resource.repository.ts
export const RESOURCE_REPOSITORY = 'ResourceRepository';

export type ResourceRepository = {
  findByIdAndTenant(id: string, tenantId: string): Promise<Resource | null>;
  create(data: CreateResourceData): Promise<Resource>;
};
```

```ts
// resources.module.ts
providers: [
  { provide: RESOURCE_REPOSITORY, useClass: PrismaResourceRepository },
  CreateResourceUseCase,
]
```

Os use-cases dependem do **tipo**, não da classe Prisma — trocar de ORM ou testar com um fake não exige tocar em regra de negócio.

> ⚠️ Como `ResourceRepository` é um `type` (apagado em runtime), a injeção precisa do token string + `@Inject`:
> ```ts
> constructor(
>   @Inject(RESOURCE_REPOSITORY)
>   private readonly resourceRepository: ResourceRepository,
> ) {}
> ```
> E o import do tipo usa `type`: `import { RESOURCE_REPOSITORY, type ResourceRepository } from '...'`.

---

## 2. Multi-tenancy — a regra que não se quebra

**Todo dado pertence a um tenant. O `tenantId` sempre vem do token, nunca do cliente.**

```ts
// ✅ certo — tenantId sai do JWT via decorator
async findOne(
  @Param('id', ParseUUIDPipe) id: string,
  @Tenant('tenantId') tenantId: string,
) {
  return this.getResourceById.execute(id, tenantId);
}

// ❌ errado — cliente escolhe o tenant que quer ler
async findOne(@Param('id') id: string, @Query('tenantId') tenantId: string) {}
```

E **toda query filtra por tenant**, inclusive busca por ID:

```ts
// ✅ certo
findByIdAndTenant(id: string, tenantId: string) {
  return this.prisma.resource.findFirst({ where: { id, tenantId } });
}

// ❌ errado — vaza dado entre clínicas para quem adivinhar o UUID
findById(id: string) {
  return this.prisma.resource.findUnique({ where: { id } });
}
```

Recurso de outro tenant retorna **404, não 403** — confirmar que o ID existe já é vazamento de informação.

---

## 3. Guards: ordem importa

```ts
@UseGuards(JwtAuthGuard, TenantContextGuard)               // autenticado
@UseGuards(JwtAuthGuard, TenantContextGuard, RolesGuard)   // + restrito por papel
@Roles(Role.ADMIN)
```

| Guard | Faz |
| --- | --- |
| `JwtAuthGuard` | valida o JWT e confere no banco se o usuário existe e está ativo → `req.user` |
| `TenantContextGuard` | lê `req.user` → `req.tenantContext` (consumido por `@Tenant()`) |
| `RolesGuard` | compara `req.user.role` com `@Roles(...)`; sem `@Roles` deixa passar |

> ⚠️ **Isso precisa ser guard, não middleware.** O pipeline do Nest é Middleware → Guards → Interceptors → Pipes → Handler. Middleware roda *antes* dos guards, então jamais enxergaria o `req.user` que o `JwtAuthGuard` produz. Já erramos isso uma vez.

Rota pública é exceção e merece comentário explicando o porquê.

### Ordem de registro de controllers importa quando os prefixos colidem

Se dois controllers compartilham prefixo (ex.: `@Controller('users')` com
rota `PATCH :id`, e um `@Controller('users/me')` separado com `PATCH /`), o
Nest resolve por **ordem de registro no array `controllers: [...]` do
módulo**, não por especificidade de path. `PATCH /users/me` bate em
`PATCH /users/:id` (com `id = "me"`) se `UserController` estiver listado
antes de `MeController` — o `me` nunca chega a ser tratado pelo controller
certo, e o erro que aparece (`"uuid is expected"`) não aponta pra causa real.

Isso aconteceu de verdade ao criar `MeController` (`/users/me`, sem
`@Roles`, endpoints de "minha própria conta") ao lado de `UserController`
(`/users`, `@Roles(ADMIN)` de classe inteira, gestão de terceiros) — o fix
foi só inverter a ordem: `controllers: [MeController, UserController]`, com
um comentário no módulo explicando o porquê (não é óbvio revisitando o
arquivo sem esse contexto). Regra prática: **o controller com o path mais
específico sempre entra primeiro** no array.

---

## 4. DTOs

**Entrada** (`create-*.dto.ts`) valida com `class-validator` e sanitiza texto livre:

```ts
export class CreateResourceDto {
  @ApiProperty({ example: 'Nome do recurso' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @SanitizeText()          // remove HTML/script de campo livre
  name!: string;

  @ApiPropertyOptional({ example: '11122233344' })
  @IsOptional()
  @Length(11, 11)
  @Matches(/^\d{11}$/)
  document?: string;
}
```

Update herda de create com `PartialType`:

```ts
export class UpdateResourceDto extends PartialType(CreateResourceDto) {}
```

**Armadilha:** `@Max`/`@Min` valem para **valor numérico**, não para tamanho de string. Para "campo tem N dígitos" use `@Length(n, n)`.

**Saída** (`*-response.dto.ts`) sempre com mapeamento explícito:

```ts
static fromEntity(resource: Resource): ResourceResponseDto {
  return { id: resource.id, name: resource.name /* ... */ };
}
```

Isso não é burocracia: é o que garante que campo sensível (hash de senha, token, dado interno) nunca vaze quando alguém adicionar uma coluna nova ao model. Nunca devolva a entidade do Prisma direto.

### Listagem paginada

Use os utilitários compartilhados em `src/shared/dtos/`:

```ts
@Get()
async findAll(
  @Tenant('tenantId') tenantId: string,
  @Query() query: PaginationQueryDto,   // page, perPage, search — com defaults
) {
  const { data, total } = await this.getResources.execute({ tenantId, ...query });

  return paginated(data.map(ResourceResponseDto.fromEntity), {
    page: query.page,
    perPage: query.perPage,
    total,
  });
}
```

Resposta: `{ data: [...], meta: { page, perPage, total, totalPages } }`.

---

## 5. Use-cases

Um arquivo por operação, nome no imperativo, sufixo `.use-case.ts` (singular).

```ts
@Injectable()
export class CreateResourceUseCase {
  constructor(
    @Inject(RESOURCE_REPOSITORY)
    private readonly resourceRepository: ResourceRepository,
  ) {}

  async execute(input: CreateResourceInput) {
    if (input.document) {
      const existing = await this.resourceRepository.findByDocumentAndTenant(
        input.document,
        input.tenantId,
      );

      if (existing) {
        throw new ConflictException('Já existe um registro com este documento nesta clínica.');
      }
    }

    return this.resourceRepository.create({ ...input });
  }
}
```

- Regra de negócio mora aqui, não no controller nem no repository
- Exceções HTTP do Nest (`NotFoundException`, `ConflictException`, `ForbiddenException`) — o filtro global cuida do resto
- Mensagens de erro voltadas ao usuário em **português**; nomes de código em inglês

### Status HTTP

| Situação | Status |
| --- | --- |
| Criado | 201 (padrão do `@Post`) |
| Atualizado / listado | 200 |
| Removido | 204 — `@HttpCode(HttpStatus.NO_CONTENT)` |
| Validação falhou | 400 (automático do `ValidationPipe`) |
| Sem token / token inválido | 401 |
| Papel insuficiente | 403 |
| Não existe **ou é de outro tenant** | 404 |
| Conflito de chave natural | 409 |

---

## 6. Prisma

- **Driver adapter é obrigatório** (v7): `new PrismaClient({ adapter: new PrismaPg({ connectionString }) })`. Sem isso o boot quebra.
- `@@map` para nomes de tabela em snake_case plural (`resources`), `@map` para colunas (`tenant_id`).
- Índice em `tenantId` em toda tabela multi-tenant.
- Unicidade por tenant é **composta**: `@@unique([tenantId, document])` — nunca `@unique` global num campo que é de negócio da clínica, senão um tenant impede o cadastro no outro.
- `findMany` + `count` na mesma listagem vão dentro de `$transaction([...])` para page e total serem consistentes.

### Migrations

`prisma migrate dev` **não funciona neste ambiente** (é interativo). Use:

```bash
npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma \
  --script -o prisma/migrations/<timestamp>_<nome>/migration.sql
npx prisma migrate deploy
npx prisma generate
```

> ⚠️ **O timestamp precisa ser maior que o da última migration.** O Prisma ordena por nome; `migrate dev` carimba em UTC e `date` local carimba 3h atrás. Isso já causou um bug onde `migrate deploy` funcionava no banco de dev mas quebrava em banco novo. Sempre teste `migrate deploy` num banco descartável antes de confiar.

---

## 7. Configuração

```ts
// ❌ o generic é só anotação — o valor continua string
expiresIn: config.get<number>('JWT_EXPIRES_IN_SECONDS')

// ✅
expiresIn: Number(config.get('JWT_EXPIRES_IN_SECONDS') ?? 900)
```

`ConfigService.get<T>()` **não converte tipo**. Passar a string `"900"` para o `jsonwebtoken` fez ele interpretar como milissegundos e emitir token já expirado (`iat === exp`). Sempre converta explicitamente quando o valor alimentar cálculo ou opção tipada.

---

## 8. Checklist para um módulo novo

1. `domain/repository/<recurso>.repository.ts` — tipos, contrato, token
2. `infrastructure/prisma/prisma-<recurso>.repository.ts` — implementação, **toda query com `tenantId`**
3. `application/use-cases/*.use-case.ts` — um por operação
4. `infrastructure/dtos/` — create, update (`PartialType`), response com `fromEntity`
5. `infrastructure/http/<recurso>.controller.ts` — guards, `@ApiTags`/`@ApiBearerAuth`, `ParseUUIDPipe` nos ids
6. `<recursos>.module.ts` — importar `PrismaModule`, registrar repositório via token + todos os use-cases
7. Registrar o módulo no `app.module.ts`
8. `npx tsc --noEmit` + `npx eslint src --ext .ts`
9. Testar com os dois tenants do seed e **confirmar que um não enxerga o outro**
10. Atualizar a tabela de endpoints do `README.md`

---

## 9. Convenções

| Item | Padrão |
| --- | --- |
| Pasta do módulo | plural: `resources/` |
| Arquivo | kebab-case singular com sufixo de papel: `create-resource.use-case.ts` |
| Classe | PascalCase batendo com o arquivo: `CreateResourceUseCase` |
| Token DI | SCREAMING_SNAKE: `RESOURCE_REPOSITORY` |
| Rota | plural em kebab-case: `/resources`, `/auth/logout-all` |
| Tag Swagger | plural capitalizado, batendo com o recurso: `Resources` |
| Código (nomes, tipos) | inglês |
| Mensagem ao usuário final | português |
| Comentário | só quando explica **por quê**, nunca o que o código já diz |

Antes de dar por pronto: `npx tsc --noEmit` e `npx eslint src --ext .ts` limpos. O Prettier roda em cima do código — não brigue com a formatação dele.
