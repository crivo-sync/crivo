-- Fecha a lacuna que `appointments_blocking_slot_unique` deixou aberta: aquele
-- índice só barra o MESMO `starts_at`; duas consultas que apenas se cruzam
-- (10:00–11:00 gravada enquanto outra grava 10:30–11:30) ainda passavam
-- juntas pela checagem em memória (`findOverlapping`) e o banco aceitava as
-- duas, porque `starts_at` era diferente em cada uma.
--
-- `EXCLUDE ... USING gist` é a única forma do Postgres recusar de fato
-- qualquer sobreposição de intervalo no INSERT/UPDATE, não só duplicata
-- exata — e o Prisma não tem como declarar isso no schema.prisma, por isso
-- este SQL é escrito à mão.
--
-- `btree_gist` habilita índice GiST sobre `uuid`/enum (tipos discretos),
-- necessário para combinar `tenant_id`/`professional_id`/`status` com o
-- range de tempo dentro do mesmo índice.
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- `tsrange(starts_at, ends_at, '[)')`: intervalo fechado no início, aberto no
-- fim — mesma semântica do `findOverlapping` em código (`startsAt < fimB` E
-- `endsAt > inicioB`), onde encostar (10:00 termina / 10:00 começa) não é
-- conflito. Sem o `'[)'` explícito o Postgres usaria `'[]'` (fechado nos
-- dois lados) e passaria a recusar consultas encostadas, que são válidas.
--
-- Só participa quem ocupa a agenda (`status =`, não `IN`, porque `EXCLUDE`
-- não aceita a mesma sintaxe de lista do `WHERE` de índice parcial — por
-- isso três cláusulas `WITH =`, uma por status bloqueante, todas ANDed pelo
-- exclusion constraint).
ALTER TABLE "appointments"
ADD CONSTRAINT "appointments_no_overlap_per_professional"
EXCLUDE USING gist (
  "tenant_id" WITH =,
  "professional_id" WITH =,
  tsrange("starts_at", "ends_at", '[)') WITH &&
)
WHERE (
  "status" IN ('SCHEDULED', 'CONFIRMED', 'COMPLETED')
);
