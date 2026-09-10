import type { Metadata } from 'next';
import Link from 'next/link';
import { ButtonLink } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { EmptyState, PageHeader, Stat } from '@/components/ui/stat';
import { ProductCard, type ProductRow } from '@/components/app/product-row';
import { createClient } from '@/lib/supabase/server';
import { formatNumber, stockStatus } from '@bodgo/core';
import { InventoryControls } from './controls';
import { NewProductForm } from './new-product-form';

export const metadata: Metadata = { title: 'Mi inventario' };

type Search = { q?: string; bodega?: string; cat?: string };

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const [{ data: products }, { data: inventory }] = await Promise.all([
    supabase
      .from('products')
      .select('id, name, sku, category, unit_volume_m3, target_stock')
      .eq('active', true)
      .order('name'),
    supabase
      .from('inventory')
      .select('product_id, quantity, position_label, warehouses(comuna)'),
  ]);

  type Lugar = { comuna: string; qty: number; position: string | null };
  const porProducto = new Map<string, Lugar[]>();

  for (const fila of inventory ?? []) {
    const lugares = porProducto.get(fila.product_id) ?? [];
    lugares.push({
      comuna: fila.warehouses?.comuna ?? 'Bodega',
      qty: fila.quantity,
      position: fila.position_label,
    });
    porProducto.set(fila.product_id, lugares);
  }

  const comunas = [...new Set((inventory ?? []).map((f) => f.warehouses?.comuna).filter(Boolean))]
    .sort() as string[];
  const categorias = [...new Set((products ?? []).map((p) => p.category).filter(Boolean))]
    .sort() as string[];

  const texto = params.q?.trim().toLowerCase();

  // Filtrar por bodega cambia lo que significa la cifra: pasa a ser el stock
  // en ese espacio, y bajo el SKU se lee la posición en vez de la categoría.
  const filas: ProductRow[] = (products ?? [])
    .filter((p) => !params.cat || p.category === params.cat)
    .filter(
      (p) =>
        !texto ||
        p.name.toLowerCase().includes(texto) ||
        p.sku.toLowerCase().includes(texto),
    )
    .map((p) => {
      const lugares = porProducto.get(p.id) ?? [];
      const enBodega = params.bodega ? lugares.filter((l) => l.comuna === params.bodega) : lugares;
      const stock = enBodega.reduce((s, l) => s + l.qty, 0);

      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        category: p.category,
        targetStock: p.target_stock,
        stock,
        detalle: params.bodega
          ? enBodega[0]?.position
            ? `Posición ${enBodega[0].position}`
            : params.bodega
          : (p.category ?? 'Sin categoría'),
        bodegas: lugares.length,
      };
    })
    .filter((f) => !params.bodega || f.stock > 0 || (porProducto.get(f.id) ?? []).some((l) => l.comuna === params.bodega));

  const unidades = filas.reduce((s, f) => s + f.stock, 0);
  const reponer = filas.filter((f) => ['agotado', 'bajo'].includes(stockStatus(f.stock, f.targetStock)));
  const hayFiltros = Boolean(texto || params.bodega || params.cat);

  return (
    <div className="space-y-4">
      <PageHeader title="Mi inventario" subtitle="Stock en tiempo real · multibodega" />

      <InventoryControls comunas={comunas} categorias={categorias} />

      {products?.length ? (
        <>
          <div className="grid grid-cols-2 gap-2.5">
            <Stat
              orden="etiqueta-primero"
              value={formatNumber(filas.length)}
              label="SKUs activos"
            />
            <Stat
              orden="etiqueta-primero"
              value={formatNumber(unidades)}
              label={params.bodega ? `Unidades en ${params.bodega}` : 'Unidades guardadas'}
            />
          </div>

          {reponer.length ? (
            <p className="flex items-center gap-2.5 rounded-[12px] bg-warning-50 px-3.5 py-3 text-[12px] font-semibold text-warning-700">
              <span className="shrink-0">
                <Icon name="discrepancias" size={16} />
              </span>
              {reponer.length === 1
                ? '1 producto necesita reposición'
                : `${reponer.length} productos necesitan reposición`}
            </p>
          ) : null}
        </>
      ) : null}

      {!products?.length ? (
        <EmptyState
          icon="inventario"
          title="Tu catálogo está vacío"
          body="Crea tus productos con su SKU y su volumen unitario. El volumen es lo que nos permite avisarte si un envío no cabe en el espacio que contrataste."
        />
      ) : filas.length === 0 ? (
        <EmptyState
          icon="sinResultados"
          title="Sin resultados"
          body="Prueba con otro nombre o SKU, o cambia los filtros de bodega y categoría."
          action={
            hayFiltros ? (
              <ButtonLink href="/app/inventario" variant="secondary" size="sm">
                Limpiar filtros
              </ButtonLink>
            ) : undefined
          }
        />
      ) : (
        <ul className="space-y-2.5">
          {filas.map((f) => (
            <li key={f.id}>
              <ProductCard producto={f} />
            </li>
          ))}
        </ul>
      )}

      {/* ------------------------------------------------------- acciones */}
      <NewProductForm
        secundario={
          <Link
            href="/app/inventario/importar"
            className="flex items-center justify-center gap-2 rounded-[14px] border-[1.5px] border-brand-600 bg-white p-3.5 text-[14px] font-bold text-brand-600 transition-colors hover:bg-brand-50"
          >
            <Icon name="exportar" size={18} className="rotate-180" />
            Carga masiva
          </Link>
        }
      />

      <Link
        href="/app/despachos/nuevo"
        className="flex items-center gap-3 rounded-[14px] bg-navy-800 p-3.5 text-white transition-colors hover:bg-navy-950"
      >
        <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[11px] bg-white/15">
          <Icon name="envios" size={20} />
        </span>
        <span className="flex-1">
          <span className="block text-[15px] font-bold">Enviar mercancía a bodega</span>
          <span className="mt-px block text-[12px] text-white/70">
            Declara el manifiesto y avisa al bodeguero
          </span>
        </span>
        <span aria-hidden className="text-white/70">
          <Icon name="siguiente" size={16} />
        </span>
      </Link>
    </div>
  );
}
