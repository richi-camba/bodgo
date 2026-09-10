import { describe, expect, it } from 'vitest';
import { CSV_MAX_ROWS } from '../constants';
import { csvSummary, parseProductCsv } from '../csv';

const cabecera = 'nombre;sku;categoria;volumen_m3;stock_objetivo';

describe('parseProductCsv', () => {
  it('lee el formato que exporta Excel en español: punto y coma y coma decimal', () => {
    const { filas, error } = parseProductCsv(
      [cabecera, 'Polera algodón;SKU-1;Moda;0,0035;200'].join('\n'),
    );

    expect(error).toBeNull();
    expect(filas).toHaveLength(1);
    expect(filas[0]).toMatchObject({
      name: 'Polera algodón',
      sku: 'SKU-1',
      category: 'Moda',
      unitVolumeM3: 0.0035,
      targetStock: 200,
      estado: 'nueva',
    });
  });

  it('también lee coma como separador', () => {
    const { filas } = parseProductCsv('nombre,sku\nGorro,SKU-9');
    expect(filas[0]?.sku).toBe('SKU-9');
  });

  it('no parte los nombres que llevan coma adentro', () => {
    const { filas } = parseProductCsv('nombre,sku\n"Set 3 velas, aroma lavanda",SKU-7');
    expect(filas[0]?.name).toBe('Set 3 velas, aroma lavanda');
  });

  it('se traga el BOM de Excel sin perder la primera columna', () => {
    const { filas, error } = parseProductCsv('﻿nombre;sku\nGorro;SKU-3');
    expect(error).toBeNull();
    expect(filas[0]?.name).toBe('Gorro');
  });

  it('acepta las columnas en cualquier orden y con tildes o mayúsculas', () => {
    const { filas } = parseProductCsv('SKU;Categoría;Nombre\nSKU-4;Hogar;Vela');
    expect(filas[0]).toMatchObject({ sku: 'SKU-4', name: 'Vela', category: 'Hogar' });
  });

  it('marca la fila sin SKU y la deja fuera', () => {
    const { filas } = parseProductCsv([cabecera, 'Gorro;;Moda;0,001;10'].join('\n'));
    expect(filas[0]?.estado).toBe('error');
    expect(filas[0]?.motivo).toBe('Sin SKU');
  });

  it('marca el SKU repetido dentro del mismo archivo', () => {
    const { filas } = parseProductCsv(
      [cabecera, 'Gorro;SKU-5;;;', 'Otro gorro;SKU-5;;;'].join('\n'),
    );
    expect(filas[0]?.estado).toBe('nueva');
    expect(filas[1]?.estado).toBe('error');
    expect(filas[1]?.motivo).toBe('SKU repetido en el archivo');
  });

  it('distingue lo que se crea de lo que se actualiza', () => {
    const { filas } = parseProductCsv([cabecera, 'Gorro;SKU-6;;;'].join('\n'), {
      skusExistentes: ['SKU-6'],
    });
    expect(filas[0]?.estado).toBe('actualiza');
  });

  it('numera la línea del archivo para poder corregirla', () => {
    const { filas } = parseProductCsv([cabecera, 'A;SKU-A;;;', 'B;;;;'].join('\n'));
    expect(filas[1]?.linea).toBe(3);
  });

  it('exige nombre y sku, y lo dice antes de leer nada', () => {
    const { error, filas } = parseProductCsv('stock;bodega\n10;Providencia');
    expect(error).toMatch(/nombre/);
    expect(filas).toHaveLength(0);
  });

  it('avisa qué columnas del archivo no usa', () => {
    const { ignoradas } = parseProductCsv('nombre;sku;stock;bodega\nGorro;SKU-8;10;Providencia');
    expect(ignoradas).toEqual(['stock', 'bodega']);
  });

  it('rechaza el archivo entero si pasa del tope de filas', () => {
    const muchas = Array.from({ length: CSV_MAX_ROWS + 1 }, (_, i) => `P${i};SKU-${i};;;`);
    const { error } = parseProductCsv([cabecera, ...muchas].join('\n'));
    expect(error).toMatch(String(CSV_MAX_ROWS));
  });

  it('rechaza un volumen que no cabe en ninguna microbodega', () => {
    const { filas } = parseProductCsv([cabecera, 'Container;SKU-X;;9;'].join('\n'));
    expect(filas[0]?.estado).toBe('error');
  });

  it('sin volumen usa el mínimo y lo deja dicho', () => {
    const { filas } = parseProductCsv([cabecera, 'Gorro;SKU-Y;;;'].join('\n'));
    expect(filas[0]?.unitVolumeM3).toBe(0.01);
    expect(filas[0]?.motivo).toMatch(/0,01/);
  });
});

describe('csvSummary', () => {
  it('cuenta qué va a pasar con el archivo', () => {
    const { filas } = parseProductCsv(
      [cabecera, 'A;SKU-A;;;', 'B;SKU-B;;;', 'C;;;;'].join('\n'),
      { skusExistentes: ['SKU-B'] },
    );

    expect(csvSummary(filas)).toEqual({
      nuevas: 1,
      actualiza: 1,
      errores: 1,
      importables: 2,
    });
  });
});
