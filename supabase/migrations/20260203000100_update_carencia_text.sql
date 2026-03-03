-- Update carência text to clarify 30-day rule
UPDATE sobre_funsep
SET conteudo = replace(
  conteudo,
  '30 dias após o primeiro desconto (primeiro dia do mês seguinte)',
  '30 dias após o primeiro desconto (ex.: 1º desconto em janeiro, uso a partir de 1º de março)'
)
WHERE slug = 'carencia';
