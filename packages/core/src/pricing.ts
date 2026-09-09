import {
  BILLING_DAYS_PER_MONTH,
  HOST_COMMISSION_RATE,
  PLATFORM_COMMISSION_RATE,
} from './constants';

export type ContractQuote = {
  /** m² contratados. */
  m2: number;
  /** Precio mensual por m² de la bodega. */
  pricePerM2: number;
  /** Arriendo antes de comisión. */
  base: number;
  /** Comisión de plataforma (8%). */
  commission: number;
  /** Lo que se cobra a la PyME. */
  total: number;
};

/**
 * Cotiza un contrato mensual.
 *
 * La PyME paga arriendo + 8%. El bodeguero cobra sobre `base`, no sobre
 * `total`: la comisión de plataforma la pone la PyME por encima del arriendo.
 */
export function quoteContract(m2: number, pricePerM2: number): ContractQuote {
  const base = Math.round(m2 * pricePerM2);
  const commission = Math.round(base * PLATFORM_COMMISSION_RATE);
  return { m2, pricePerM2, base, commission, total: base + commission };
}

export type HostPayout = {
  /** Arriendo devengado por el bodeguero en el periodo. */
  gross: number;
  /** Comisión que retiene BodGo (15%). */
  commission: number;
  /** Depósito efectivo al bodeguero. */
  net: number;
};

/** Liquidación de fin de mes al bodeguero. */
export function calculateHostPayout(gross: number): HostPayout {
  const commission = Math.round(gross * HOST_COMMISSION_RATE);
  return { gross: Math.round(gross), commission, net: Math.round(gross) - commission };
}

export type EarlyTermination = {
  /** Arriendo del periodo completo (sin comisión de plataforma). */
  periodBase: number;
  /** Días efectivamente usados. */
  daysUsed: number;
  /** Lo que se le paga al bodeguero por esos días. */
  hostAmount: number;
  /** Lo que se devuelve a la PyME desde la custodia. */
  refund: number;
};

/**
 * Término anticipado de contrato.
 *
 * Se prorratea sobre un mes comercial de 30 días: el bodeguero cobra los días
 * usados y el resto vuelve a la PyME desde la custodia. La comisión de
 * plataforma no entra en el cálculo — el prototipo devuelve sobre `base`.
 */
export function calculateEarlyTermination(periodBase: number, daysUsed: number): EarlyTermination {
  const days = clamp(Math.round(daysUsed), 0, BILLING_DAYS_PER_MONTH);
  const hostAmount = Math.round((periodBase / BILLING_DAYS_PER_MONTH) * days);
  return {
    periodBase: Math.round(periodBase),
    daysUsed: days,
    hostAmount,
    refund: Math.max(0, Math.round(periodBase) - hostAmount),
  };
}

/** Planes de la calculadora pública, alineados al precio "desde" de cada uno. */
export const PRICING_TIERS = [
  { plan: 'Compacta', maxM3: 18, monthlyFor: 170_000, overM3: 14, dailyFor: 6_400 },
  { plan: 'Estándar', maxM3: 23, monthlyFor: 245_000, overM3: 20, dailyFor: 9_100 },
  { plan: 'Amplia', maxM3: Infinity, monthlyFor: 340_000, overM3: 25, dailyFor: 12_700 },
] as const;

export type TierEstimate = {
  m3: number;
  plan: string;
  /** Tarifa de referencia por m³ al mes, redondeada a la centena. */
  ratePerM3: number;
  /** Arriendo mensual estimado, redondeado al millar. */
  monthly: number;
  /** Equivalente diario, redondeado a la centena. */
  daily: number;
};

/** Estimador de la landing: m³ declarados → arriendo mensual de referencia. */
export function estimateByVolume(m3: number): TierEstimate {
  const volume = clamp(m3, 1, 27);
  const tier = PRICING_TIERS.find((t) => volume <= t.maxM3) ?? PRICING_TIERS[2];
  const rate = tier.monthlyFor / tier.overM3;
  const daily = tier.dailyFor / tier.overM3;
  return {
    m3: volume,
    plan: tier.plan,
    ratePerM3: Math.round(rate / 100) * 100,
    monthly: Math.round((volume * rate) / 1000) * 1000,
    daily: Math.round((volume * daily) / 100) * 100,
  };
}

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
