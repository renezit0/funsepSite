-- Criar foreign key para estabelecer relação entre caddep.parent e tabgrpar.codigo
ALTER TABLE caddep 
ADD CONSTRAINT fk_caddep_parent_tabgrpar 
FOREIGN KEY (parent) REFERENCES tabgrpar(codigo);