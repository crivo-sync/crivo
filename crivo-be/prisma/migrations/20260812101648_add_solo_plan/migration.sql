-- Plano de entrada (R$ 79). O Básico começava em R$ 149 enquanto a
-- concorrência entra em R$ 39 — perdíamos a primeira comparação que o
-- cliente faz, mesmo sendo mais baratos no meio da tabela. Ver ROADMAP,
-- "Modelo de preço deles".
--
-- Mesmo escopo do Básico, para quem atende sozinho: o upgrade natural é
-- contratar o 2º profissional.
INSERT INTO "plans" (
  "id", "key", "name", "price_in_cents", "max_professionals",
  "has_prediction", "has_ai_messages", "has_waitlist", "has_dashboard",
  "has_medical_records", "stripe_product_id", "stripe_price_id",
  "is_active", "createdAt", "updatedAt"
) VALUES (
  gen_random_uuid()::text, 'SOLO', 'Solo', 7900, 1,
  false, false, false, false,
  false, 'prod_V3jU0Bb4kjEMD0', 'price_1U3c1H64chrm4OaKBTF77AJ1',
  true, NOW(), NOW()
);
