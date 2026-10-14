// Catálogo de productos Doña Sol, agrupado por categoría para el selector.
// Cada producto tiene su precio de venta cargado (según lista de precios).
// precio: null significa que todavía no tenemos un precio fijo para ese producto;
// en ese caso el vendedor lo carga a mano al agregarlo a la venta.
export const CATEGORIAS_PRODUCTOS = [
  {
    categoria: 'Industrial',
    productos: [
      { nombre: 'Limpiador Multiuso 5L', precio: 350 },
      { nombre: 'Limpiador Multiuso 10L', precio: 350 },
      { nombre: 'Limpia Vidrios 2L', precio: 300 },
      { nombre: 'Lavandina 10L', precio: 350 },
      { nombre: 'Envases 10L', precio: 100 },
      { nombre: 'Limpiador Líquido 5L', precio: 300 },
      { nombre: 'Limpiador Líquido 10L', precio: 500 },
      { nombre: 'Limpiador Cremoso 750gr', precio: 120 },
      { nombre: 'Alcohol en Gel 1L', precio: 220 },
      { nombre: 'Alcohol en Gel 5L', precio: 950 },
      { nombre: 'Desodorante Bactericida 10L', precio: 550 },
      { nombre: 'Desodorante Económico 10L', precio: 500 },
      { nombre: 'Shampoo para Manos 5L', precio: 550 },
      { nombre: 'Detergente Líquido 10L', precio: 450 },
      { nombre: 'Detergente Líquido ECO 10L', precio: 400 },
      { nombre: 'Detergente Grueso 10L', precio: 820 },
      { nombre: 'Detergente Incoloro 10L', precio: 450 },
      { nombre: 'Suavizante 5L', precio: 400 },
      { nombre: 'Suavizante 10L', precio: 700 },
      { nombre: 'Vinagre 5L', precio: 170 },
      { nombre: 'Vinagre 10L', precio: 300 },
      { nombre: 'Espuma Controlada 5L', precio: 500 },
      { nombre: 'Espuma Controlada 10L', precio: 900 },
      { nombre: 'Jabón p/Lavarropas Dúo 5L', precio: 700 },
      { nombre: 'Jabón p/Lavarropas Dúo 10L', precio: 1250 },
      { nombre: 'Cera al Agua 5L', precio: 650 },
      { nombre: 'Desengrasante 5L', precio: 650 },
      { nombre: 'Alcohol Líquido 1L', precio: 200 },
      { nombre: 'Alcohol Líquido 5L', precio: 650 },
      { nombre: 'Alcohol Líquido 10L', precio: 1000 },
      { nombre: 'Soda Cáustica 5L', precio: 500 },
      { nombre: 'Soda Cáustica 10L', precio: 900 },
      { nombre: 'Hipoclorito de Sodio 10L', precio: 400 },
      { nombre: 'Perfumador 1/2L', precio: 300 },
      { nombre: 'Perfumador 1L', precio: 400 },
      { nombre: 'Emulsión Neumáticos 5L', precio: 450 },
      { nombre: 'Emulsión Plásticos 5L', precio: 750 },
      { nombre: 'Limpiador Multiuso Cítrico 5L', precio: 300 },
      { nombre: 'Limpiador Multiuso Cítrico 10L', precio: 500 },
      { nombre: 'Esencia Desodorante 2L', precio: 300 },
    ],
  },
  {
    categoria: 'Textil',
    productos: [
      { nombre: 'Rejillas (6 unid.)', precio: 300 },
      { nombre: 'Paños de Piso (6 unid.)', precio: 500 },
      { nombre: 'Paños de Piso (25 unid.)', precio: 1500 },
      { nombre: 'Franelas (6 unid.)', precio: 280 },
      { nombre: 'Microfibras (5 unid.)', precio: 280 },
      { nombre: 'Guantes Negros (10 pares)', precio: null },
      { nombre: 'Guantes Amarillos (10 pares)', precio: null },
    ],
  },
  {
    categoria: 'Papeles',
    productos: [
      { nombre: 'Jumbo 200 (funda 6 rollos)', precio: null },
      { nombre: 'Toalla Intercalada 20x23 (caja 4800 u.)', precio: null },
      { nombre: 'Servilleta de Bocadillo (caja 6000 u.)', precio: null },
      { nombre: 'Rollo Cocina 200 Hojas (funda 12 rollos)', precio: null },
      { nombre: 'Servilleta de Mesa 30x29,5 (36 paq. x 50)', precio: null },
      { nombre: 'Servilletas de Mesa 22x21 (72 paq. x 50)', precio: null },
      { nombre: 'Papel Higiénico Doble Hoja (funda 64 rollos x 30m)', precio: null },
      { nombre: 'Papel Higiénico Jumbo 500 (funda 8 rollos)', precio: null },
    ],
  },
]

export const PRODUCTOS = CATEGORIAS_PRODUCTOS.flatMap((c) => c.productos)

const MAPA_PRECIOS = new Map(PRODUCTOS.map((p) => [p.nombre, p.precio]))

export function obtenerPrecio(nombreProducto) {
  return MAPA_PRECIOS.get(nombreProducto) ?? null
}
