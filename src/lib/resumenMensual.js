import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import { COMISION_PORCENTAJE, VENDEDORES } from '../config/config'

export const SIN_VENDEDOR = 'Sin vendedor'

// Las ventas de una jornada finalizada no cambian, así que se cachean.
const cacheVentas = new Map()

export async function leerVentasDeJornadas(jornadas) {
  return Promise.all(
    jornadas.map(async (j) => {
      if (!cacheVentas.has(j.id)) {
        const snap = await getDocs(collection(db, 'jornadas', j.id, 'ventas'))
        cacheVentas.set(
          j.id,
          snap.docs.map((d) => d.data())
        )
      }
      return cacheVentas.get(j.id)
    })
  )
}

export function comision(total) {
  return (total * COMISION_PORCENTAJE) / 100
}

// `jornadas`: todas las jornadas finalizadas del mes (incluidas las que se
// sacaron de la lista con "Eliminar"). `ventasPorJornada`: mismo orden.
export function calcularResumen(jornadas, ventasPorJornada) {
  const porVendedor = new Map(VENDEDORES.map((v) => [v, { total: 0, jornadas: 0 }]))
  jornadas.forEach((j) => {
    const v = j.vendedor || SIN_VENDEDOR
    const actual = porVendedor.get(v) ?? { total: 0, jornadas: 0 }
    porVendedor.set(v, { total: actual.total + (j.totalFinal ?? 0), jornadas: actual.jornadas + 1 })
  })
  const vendedores = [...porVendedor].map(([nombre, { total, jornadas: cantidad }]) => ({
    nombre,
    total,
    jornadas: cantidad,
    comision: nombre === SIN_VENDEDOR ? null : comision(total),
  }))

  const porProducto = new Map()
  ventasPorJornada.flat().forEach((v) => {
    ;(v.items ?? []).forEach((it) => {
      const cantidad = Number(it.cantidad) || 0
      const monto = cantidad * (Number(it.precioUnitario) || 0)
      const actual = porProducto.get(it.producto) ?? { cantidad: 0, monto: 0 }
      porProducto.set(it.producto, { cantidad: actual.cantidad + cantidad, monto: actual.monto + monto })
    })
  })
  const productos = [...porProducto]
    .map(([producto, datos]) => ({ producto, ...datos }))
    .sort((a, b) => b.monto - a.monto || b.cantidad - a.cantidad || a.producto.localeCompare(b.producto))

  return {
    vendedores,
    productos,
    totalMes: vendedores.reduce((acc, v) => acc + v.total, 0),
    comisionMes: vendedores.reduce((acc, v) => acc + (v.comision ?? 0), 0),
    unidades: productos.reduce((acc, p) => acc + p.cantidad, 0),
    montoProductos: productos.reduce((acc, p) => acc + p.monto, 0),
  }
}
