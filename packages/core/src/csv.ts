/**
 * Lectura del CSV de catálogo.
 *
 * Vive acá y no en la pantalla porque lo corren los dos lados: el navegador
 * para la previsualización y el servidor para importar de verdad. Si cada uno
 * tuviera su parser, lo que se revisa y lo que se guarda podrían no coincidir.
 */

import { CSV_MAX_ROWS } from './constants';

/** Columnas que entiende el archivo. El resto se ignoran sin quejarse. */
export const CSV_COLUMNS = ['nombre', 'sku', 'categoria', 'volumen_m3', 'stock_objetivo'] as const;

export type CsvRowState = 'nueva' | 'actualiza' | 'error';

export type CsvRow = {
  /** Número de línea en el archivo, contando la cabecera. Para poder corregirla. */
  linea: number;
  name: string;
  sku: string;
  category: string | null;
  unitVolumeM3: number;
  targetStock: number | null;
  estado: CsvRowState;
  /** Por qué la fila no sirve, o qué va a pasar con ella. */
  motivo: string | null;
};

export type CsvParse = {
  filas: CsvRow[];
  /** Columnas del archivo que no usamos, para avisarlo en la revisión. */
  ignoradas: string[];
  /** Error que impide leer el archivo completo. */
  error: string | null;
};

/** Volumen por defecto, el mismo que la columna de la base. */
const VOLUMEN_POR_DEFECTO = 0.01;

/**
 * Parte una línea de CSV respetando comillas.
 *
 * Un nombre de producto con coma dentro —«Set 3 velas, aroma lavanda»— es
 * normal, y partir por el separador a secas lo rompería en dos columnas.
 */
function partirLinea(linea: string, sep: string): string[] {
  const salida: string[] = [];
  let actual = '';
  let entreComillas = false;

  for (let i = 0; i < linea.length; i++) {
    const c = linea[i];

    if (entreComillas) {
      if (c === '"') {
        if (linea[i + 1] === '"') {
          actual += '"';
          i++;
        } else {
          entreComillas = false;
        }
      } else {
        actual += c;
      }
      continue;
    }

    if (c === '"') entreComillas = true;
    else if (c === sep) {
      salida.push(actual.trim());
      actual = '';
    } else actual += c;
  }

  salida.push(actual.trim());
  return salida;
}

/** Sin tildes, sin espacios y en minúscula, para reconocer la cabecera. */
function normalizar(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
}

/** Acepta coma decimal: es lo que escribe Excel en español. */
function aNumero(valor: string): number | null {
  if (!valor) return null;
  const n = Number(valor.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

const ALIAS: Record<string, string> = {
  nombre: 'nombre',
  producto: 'nombre',
  name: 'nombre',
  sku: 'sku',
  codigo: 'sku',
  categoria: 'categoria',
  category: 'categoria',
  volumen_m3: 'volumen_m3',
  volumen: 'volumen_m3',
  volumen_unitario: 'volumen_m3',
  volumen_unitario_m3: 'volumen_m3',
  stock_objetivo: 'stock_objetivo',
  objetivo: 'stock_objetivo',
};

export function parseProductCsv(
  texto: string,
  opciones: { skusExistentes?: string[] } = {},
): CsvParse {
  const existentes = new Set((opciones.skusExistentes ?? []).map((s) => s.toUpperCase()));

  // El BOM que agrega Excel se cuela en el nombre de la primera columna.
  const limpio = texto.replace(/^﻿/, '').replace(/\r\n?/g, '\n');
  const lineas = limpio.split('\n').filter((l) => l.trim().length > 0);

  if (lineas.length === 0) return { filas: [], ignoradas: [], error: 'El archivo está vacío.' };

  // Punto y coma primero: es lo que exporta Excel en español.
  const cabeceraCruda = lineas[0]!;
  const sep = cabeceraCruda.includes(';') ? ';' : ',';

  const cabecera = partirLinea(cabeceraCruda, sep).map(normalizar);
  const columnas = cabecera.map((c) => ALIAS[c] ?? null);

  const iNombre = columnas.indexOf('nombre');
  const iSku = columnas.indexOf('sku');

  if (iNombre === -1 || iSku === -1) {
    return {
      filas: [],
      ignoradas: [],
      error: 'El archivo necesita al menos las columnas «nombre» y «sku». Descarga la plantilla.',
    };
  }

  const cuerpo = lineas.slice(1);
  if (cuerpo.length > CSV_MAX_ROWS) {
    return {
      filas: [],
      ignoradas: [],
      error: `El archivo trae ${cuerpo.length} filas y el máximo son ${CSV_MAX_ROWS}. Pártelo en varios.`,
    };
  }

  const iCategoria = columnas.indexOf('categoria');
  const iVolumen = columnas.indexOf('volumen_m3');
  const iObjetivo = columnas.indexOf('stock_objetivo');

  const ignoradas = cabecera.filter((c, i) => c.length > 0 && columnas[i] === null);
  const vistos = new Set<string>();

  const filas: CsvRow[] = cuerpo.map((linea, i) => {
    const celdas = partirLinea(linea, sep);
    const name = (celdas[iNombre] ?? '').trim();
    const sku = (celdas[iSku] ?? '').trim().toUpperCase();
    const volumenCrudo = iVolumen >= 0 ? aNumero(celdas[iVolumen] ?? '') : null;
    const objetivoCrudo = iObjetivo >= 0 ? aNumero(celdas[iObjetivo] ?? '') : null;

    const base = {
      linea: i + 2,
      name,
      sku,
      category: iCategoria >= 0 ? (celdas[iCategoria] || '').trim() || null : null,
      unitVolumeM3: volumenCrudo ?? VOLUMEN_POR_DEFECTO,
      targetStock: objetivoCrudo && objetivoCrudo > 0 ? Math.round(objetivoCrudo) : null,
    };

    const malo = (motivo: string): CsvRow => ({ ...base, estado: 'error', motivo });

    if (!sku) return malo('Sin SKU');
    if (!name) return malo('Sin nombre');
    if (vistos.has(sku)) return malo('SKU repetido en el archivo');
    if (volumenCrudo != null && (volumenCrudo < 0 || volumenCrudo > 5)) {
      return malo('Volumen fuera de rango');
    }

    vistos.add(sku);

    return {
      ...base,
      estado: existentes.has(sku) ? 'actualiza' : 'nueva',
      motivo:
        volumenCrudo == null && iVolumen >= 0
          ? 'Sin volumen: queda en 0,01 m³'
          : iVolumen === -1
            ? 'Sin columna de volumen: queda en 0,01 m³'
            : null,
    };
  });

  return { filas, ignoradas, error: null };
}

/** Cuántas filas van a entrar, cuántas se actualizan y cuántas quedan fuera. */
export function csvSummary(filas: CsvRow[]) {
  return {
    nuevas: filas.filter((f) => f.estado === 'nueva').length,
    actualiza: filas.filter((f) => f.estado === 'actualiza').length,
    errores: filas.filter((f) => f.estado === 'error').length,
    importables: filas.filter((f) => f.estado !== 'error').length,
  };
}

/** Plantilla de ejemplo para descargar. */
export const CSV_TEMPLATE = [
  'nombre;sku;categoria;volumen_m3;stock_objetivo',
  'Polera algodón talla M;SKU-0876;Moda y accesorios;0,0035;200',
  'Botella térmica 750 ml;SKU-0099;Hogar y decoración;0,0042;120',
].join('\r\n');
