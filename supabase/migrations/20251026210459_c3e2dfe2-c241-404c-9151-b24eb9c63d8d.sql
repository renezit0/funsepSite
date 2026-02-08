-- Função melhorada para converter texto em HTML com parágrafos corretos
CREATE OR REPLACE FUNCTION convert_text_to_html_v2(text_content TEXT)
RETURNS TEXT AS $$
DECLARE
  html_content TEXT;
  paragraphs TEXT[];
  para TEXT;
  lines TEXT[];
  line TEXT;
  current_para TEXT;
  in_list BOOLEAN := false;
  in_table BOOLEAN := false;
BEGIN
  html_content := '';
  
  -- Dividir por linhas vazias (parágrafos)
  paragraphs := string_to_array(text_content, E'\n\n');
  
  FOREACH para IN ARRAY paragraphs
  LOOP
    para := trim(para);
    IF length(para) = 0 THEN
      CONTINUE;
    END IF;
    
    lines := string_to_array(para, E'\n');
    
    -- Verificar se é uma lista
    IF para ~ '^[✦-]\s+' THEN
      html_content := html_content || '<ul class="my-4 space-y-2">';
      FOREACH line IN ARRAY lines
      LOOP
        line := trim(line);
        IF length(line) > 0 THEN
          line := regexp_replace(line, '^[✦-]\s+', '');
          line := regexp_replace(line, '\*\*([^\*]+)\*\*', '<strong>\1</strong>', 'g');
          html_content := html_content || '<li>' || line || '</li>';
        END IF;
      END LOOP;
      html_content := html_content || '</ul>';
      
    -- Verificar se é uma tabela
    ELSIF para ~ '\|' THEN
      html_content := html_content || '<div class="my-6 flex justify-center"><table class="border-collapse border border-gray-300">';
      
      FOREACH line IN ARRAY lines
      LOOP
        line := trim(line);
        -- Skip separator lines
        IF line ~ '^\|[-:\s\|]+\|$' OR length(line) = 0 THEN
          CONTINUE;
        END IF;
        
        IF line ~ '\|' THEN
          DECLARE
            cells TEXT[];
            cell TEXT;
            is_header BOOLEAN;
          BEGIN
            html_content := html_content || '<tr>';
            cells := regexp_split_to_array(trim(both '|' from line), '\|');
            is_header := (position('Faixa' in line) > 0 OR position('Enfermaria' in line) > 0 OR position('Apartamento' in line) > 0);
            
            FOREACH cell IN ARRAY cells
            LOOP
              cell := trim(cell);
              cell := regexp_replace(cell, '\*\*([^\*]+)\*\*', '<strong>\1</strong>', 'g');
              IF is_header THEN
                html_content := html_content || '<th class="border border-gray-300 px-4 py-2 bg-muted font-semibold">' || cell || '</th>';
              ELSE
                html_content := html_content || '<td class="border border-gray-300 px-4 py-2">' || cell || '</td>';
              END IF;
            END LOOP;
            html_content := html_content || '</tr>';
          END;
        END IF;
      END LOOP;
      
      html_content := html_content || '</table></div>';
      
    -- Parágrafo normal (pode ter múltiplas linhas)
    ELSE
      current_para := '';
      FOREACH line IN ARRAY lines
      LOOP
        line := trim(line);
        IF length(line) > 0 THEN
          IF length(current_para) > 0 THEN
            current_para := current_para || ' ';
          END IF;
          current_para := current_para || line;
        END IF;
      END LOOP;
      
      IF length(current_para) > 0 THEN
        current_para := regexp_replace(current_para, '\*\*([^\*]+)\*\*', '<strong>\1</strong>', 'g');
        html_content := html_content || '<p class="mb-6">' || current_para || '</p>';
      END IF;
    END IF;
  END LOOP;
  
  RETURN html_content;
END;
$$ LANGUAGE plpgsql;

-- Reconverter todos os registros
UPDATE sobre_funsep
SET conteudo = convert_text_to_html_v2(
  regexp_replace(
    regexp_replace(conteudo, '<[^>]+>', '', 'g'),  -- Remove HTML tags
    '&[^;]+;', '', 'g'  -- Remove HTML entities
  )
)
WHERE id IN (
  SELECT id FROM sobre_funsep
);

-- Limpar função antiga
DROP FUNCTION IF EXISTS convert_text_to_html(TEXT);