-- Função para converter texto simples em HTML formatado
CREATE OR REPLACE FUNCTION convert_text_to_html(text_content TEXT)
RETURNS TEXT AS $$
DECLARE
  html_content TEXT;
  line TEXT;
  lines TEXT[];
  in_list BOOLEAN := false;
  in_table BOOLEAN := false;
  table_html TEXT := '';
BEGIN
  html_content := '';
  lines := string_to_array(text_content, E'\n');
  
  FOREACH line IN ARRAY lines
  LOOP
    -- Convert bold markdown **text** to <strong>text</strong>
    line := regexp_replace(line, '\*\*([^\*]+)\*\*', '<strong>\1</strong>', 'g');
    
    -- Handle list items starting with ✦ or -
    IF line ~ '^[✦-]\s+' THEN
      IF NOT in_list THEN
        html_content := html_content || '<ul>';
        in_list := true;
      END IF;
      line := regexp_replace(line, '^[✦-]\s+', '');
      html_content := html_content || '<li>' || line || '</li>';
    ELSE
      IF in_list THEN
        html_content := html_content || '</ul>';
        in_list := false;
      END IF;
      
      -- Handle table rows (lines with |)
      IF line ~ '\|' THEN
        IF NOT in_table THEN
          html_content := html_content || '<table class="min-w-full border-collapse border border-gray-300">';
          in_table := true;
        END IF;
        
        -- Skip separator lines like |---|---|
        IF line !~ '^\s*\|[-:\s\|]+\|\s*$' THEN
          html_content := html_content || '<tr>';
          
          -- Split by | and create cells
          DECLARE
            cells TEXT[];
            cell TEXT;
            is_header BOOLEAN;
          BEGIN
            cells := string_to_array(trim(both '|' from line), '|');
            is_header := (position('<strong>' in line) > 0 OR position('Faixa' in line) > 0);
            
            FOREACH cell IN ARRAY cells
            LOOP
              cell := trim(cell);
              IF is_header THEN
                html_content := html_content || '<th class="border border-gray-300 px-4 py-2 bg-gray-100">' || cell || '</th>';
              ELSE
                html_content := html_content || '<td class="border border-gray-300 px-4 py-2">' || cell || '</td>';
              END IF;
            END LOOP;
          END;
          
          html_content := html_content || '</tr>';
        END IF;
      ELSE
        IF in_table THEN
          html_content := html_content || '</table>';
          in_table := false;
        END IF;
        
        -- Regular paragraph
        IF length(trim(line)) > 0 THEN
          html_content := html_content || '<p>' || line || '</p>';
        END IF;
      END IF;
    END IF;
  END LOOP;
  
  -- Close any open tags
  IF in_list THEN
    html_content := html_content || '</ul>';
  END IF;
  IF in_table THEN
    html_content := html_content || '</table>';
  END IF;
  
  RETURN html_content;
END;
$$ LANGUAGE plpgsql;

-- Atualizar todos os registros da tabela sobre_funsep
UPDATE sobre_funsep
SET conteudo = convert_text_to_html(conteudo)
WHERE conteudo NOT LIKE '%<p>%' 
  AND conteudo NOT LIKE '%<strong>%'
  AND conteudo NOT LIKE '%<ul>%';

-- Limpar a função auxiliar (opcional, manter se quiser reutilizar)
-- DROP FUNCTION convert_text_to_html(TEXT);