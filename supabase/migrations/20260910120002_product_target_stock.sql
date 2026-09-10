-- -----------------------------------------------------------------------------
-- Stock objetivo por producto.
--
-- El inventario del prototipo dibuja una barra por SKU, y una barra sin techo
-- no dice nada: 40 unidades es mucho o poco según el producto. El stock
-- objetivo es ese techo, lo pone la PyME y es opcional — sin él la lista
-- muestra el número solo, sin barra ni alerta.
-- -----------------------------------------------------------------------------
alter table public.products
  add column target_stock integer
    check (target_stock is null or target_stock > 0);

comment on column public.products.target_stock is
  'Unidades que la PyME quiere tener en bodega. Referencia de la barra de stock y del aviso de reposición.';
