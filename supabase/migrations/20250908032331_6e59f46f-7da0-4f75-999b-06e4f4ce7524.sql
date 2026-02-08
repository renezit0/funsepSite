-- Adicionar foreign key entre mgumrrapg.evento e tabbeneficios.codigo
-- para permitir join entre as tabelas

-- Primeiro, vamos garantir que todos os eventos em mgumrrapg tenham correspondência em tabbeneficios
-- Para procedimentos sem correspondência, vamos manter o comportamento atual (mostrar o código)

ALTER TABLE mgumrrapg 
ADD CONSTRAINT fk_mgumrrapg_evento_tabbeneficios 
FOREIGN KEY (evento) 
REFERENCES tabbeneficios(codigo) 
NOT VALID;

-- Validar a constraint apenas para novos registros
-- Registros existentes sem correspondência continuarão funcionando
-- pois usamos NOT VALID