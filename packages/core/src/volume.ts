import { GROSS_HEIGHT_M, USABLE_STACK_HEIGHT_M } from './constants';

/**
 * Volumen del recinto: lo que mide el espacio de piso a techo.
 * Sirve para mostrar el tamaño de la bodega y para derivar el precio por m³.
 */
export function grossVolumeM3(m2: number): number {
  return round1(m2 * GROSS_HEIGHT_M);
}

/**
 * Capacidad contratable: lo que realmente se puede apilar sin riesgo.
 * Es el número contra el que se valida un envío. 12 m² → 21,6 m³.
 */
export function usableCapacityM3(m2: number): number {
  return round1(m2 * USABLE_STACK_HEIGHT_M);
}

/** Precio por m³ al mes, derivado del precio por m² y la altura del recinto. */
export function pricePerM3(pricePerM2: number): number {
  return Math.round(pricePerM2 / GROSS_HEIGHT_M / 500) * 500;
}

export type VolumeLine = { unitVolumeM3: number; quantity: number };

/** Volumen total de un envío: suma de volumen unitario × cantidad. */
export function shipmentVolumeM3(lines: readonly VolumeLine[]): number {
  const total = lines.reduce((sum, l) => sum + l.unitVolumeM3 * l.quantity, 0);
  return round2(total);
}

export type CapacityCheck = {
  /** Volumen del envío, en m³. */
  volumeM3: number;
  /** Capacidad apilable del contrato, en m³. */
  capacityM3: number;
  /** Porcentaje de la capacidad que ocupa el envío (puede pasar de 100). */
  percentUsed: number;
  /** `true` si el envío no cabe en lo contratado. */
  exceeds: boolean;
  /** m³ por sobre la capacidad. 0 si cabe. */
  excessM3: number;
};

/**
 * Contrasta el volumen de un envío contra una capacidad ya expresada en m³.
 *
 * Un envío que excede no se bloquea: se puede despachar igual, con la
 * advertencia de que el bodeguero puede rechazar el excedente al recibir. Eso
 * queda registrado como discrepancia de volumen.
 */
export function checkCapacityM3(volumeM3: number, capacityM3: number): CapacityCheck {
  const excess = volumeM3 - capacityM3;
  return {
    volumeM3: round2(volumeM3),
    capacityM3: round2(capacityM3),
    percentUsed: capacityM3 > 0 ? Math.round((volumeM3 / capacityM3) * 100) : 0,
    // Tolerancia de 5 litros: por debajo de eso la diferencia es ruido de
    // redondeo, no un exceso real que valga abrir una discrepancia.
    exceeds: excess > 0.005,
    excessM3: excess > 0 ? round2(excess) : 0,
  };
}

/** Igual que `checkCapacityM3`, pero partiendo de los m² contratados. */
export function checkCapacity(volumeM3: number, contractedM2: number): CapacityCheck {
  return checkCapacityM3(volumeM3, usableCapacityM3(contractedM2));
}

const round1 = (n: number) => Math.round(n * 10) / 10;
const round2 = (n: number) => Math.round(n * 100) / 100;
