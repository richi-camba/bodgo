import { checkCapacityM3 } from './volume';

export type ManifestLine = {
  productId: string;
  sku: string;
  name: string;
  /** Unidades que la PyME declaró en el envío. */
  declared: number;
  /** Unidades que el bodeguero contó al recibir. */
  received: number;
};

export type LineResult = ManifestLine & {
  /** recibido − declarado. Negativo = faltante, positivo = sobrante. */
  delta: number;
  status: 'ok' | 'short' | 'over';
};

export type DiscrepancyType = 'none' | 'units' | 'volume' | 'both';

export type ReconciliationResult = {
  lines: LineResult[];
  /** Líneas que no calzan. */
  mismatchCount: number;
  declaredUnits: number;
  receivedUnits: number;
  /** Unidades que faltaron (suma de los deltas negativos, en positivo). */
  unitsShort: number;
  /** Unidades de más respecto de lo declarado. */
  unitsOver: number;
  /** Volumen medido por el bodeguero contra la capacidad del contrato. */
  capacity: ReturnType<typeof checkCapacityM3>;
  type: DiscrepancyType;
  /** `true` si hay que abrir una discrepancia y avisar a la PyME. */
  hasDiscrepancy: boolean;
  /** Porcentaje de líneas que calzaron exactamente. */
  matchRate: number;
};

/**
 * Concilia lo que la PyME declaró contra lo que el bodeguero contó y midió.
 *
 * Es el control central del modelo: la plata en custodia no se libera hasta que
 * esta conciliación cierra. Dos cosas pueden fallar por separado y ambas abren
 * discrepancia — que falten (o sobren) unidades, y que lo recibido no quepa en
 * la capacidad contratada.
 *
 * `capacityM3` es la capacidad apilable del contrato, no el volumen del
 * recinto: es el mismo número que el envío guarda congelado al despacharse.
 */
export function reconcileReception(
  manifest: readonly ManifestLine[],
  receivedVolumeM3: number,
  capacityM3: number,
): ReconciliationResult {
  const lines: LineResult[] = manifest.map((line) => {
    const delta = line.received - line.declared;
    return {
      ...line,
      delta,
      status: delta === 0 ? 'ok' : delta < 0 ? 'short' : 'over',
    };
  });

  const mismatchCount = lines.filter((l) => l.status !== 'ok').length;
  const declaredUnits = sum(lines.map((l) => l.declared));
  const receivedUnits = sum(lines.map((l) => l.received));
  const unitsShort = sum(lines.filter((l) => l.delta < 0).map((l) => -l.delta));
  const unitsOver = sum(lines.filter((l) => l.delta > 0).map((l) => l.delta));

  const capacity = checkCapacityM3(receivedVolumeM3, capacityM3);

  const type: DiscrepancyType =
    mismatchCount > 0 && capacity.exceeds
      ? 'both'
      : mismatchCount > 0
        ? 'units'
        : capacity.exceeds
          ? 'volume'
          : 'none';

  return {
    lines,
    mismatchCount,
    declaredUnits,
    receivedUnits,
    unitsShort,
    unitsOver,
    capacity,
    type,
    hasDiscrepancy: type !== 'none',
    matchRate: lines.length === 0 ? 100 : Math.round(((lines.length - mismatchCount) / lines.length) * 100),
  };
}

const sum = (xs: readonly number[]) => xs.reduce((a, b) => a + b, 0);
