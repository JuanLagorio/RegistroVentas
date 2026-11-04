import { useEffect, useMemo, useRef, useState } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import { COMISION_PORCENTAJE, VENDEDORES } from '../config/config'
import { formatearMoneda } from '../lib/format'

const SIN_VENDEDOR = 'Sin vendedor'
const PORCENTAJE_TEXTO = COMISION_PORCENTAJE.toLocaleString('es-AR')

function mesDe(fecha) {
  return fecha?.slice(0, 7) ?? ''
}

function mesActual() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function nombreMes(mes) {
  const [anio, m] = mes.split('-').map(Number)
  const texto = new Date(anio, m - 1, 1).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

function comision(total) {
  return (total * COMISION_PORCENTAJE) / 100
}

// Recibe solo jornadas finalizadas. Los totales por vendedor salen de
// `totalFinal` de cada jornada; las cantidades por producto requieren leer las
// ventas de cada jornada del mes (se cachean, porque una jornada finalizada no
// cambia).
export default function ResumenMensual({ jornadas }) {
  const [mes, setMes] = useState(mesActual)
  const cacheVentas = useRef(new Map())
  const [productos, setProductos] = useState({ clave: null, filas: [], error: false })

  const meses = useMemo(() => {
    const set = new Set(jornadas.map((j) => mesDe(j.fecha)).filter(Boolean))
    set.add(mesActual())
    return [...set].sort().reverse()
  }, [jornadas])

  const jornadasDelMes = useMemo(() => jornadas.filter((j) => mesDe(j.fecha) === mes), [jornadas, mes])
  const clave = `${mes}|${jornadasDelMes.map((j) => j.id).join(',')}`

  const vendedores = useMemo(() => {
    const totales = new Map(VENDEDORES.map((v) => [v, 0]))
    jornadasDelMes.forEach((j) => {
      const v = j.vendedor || SIN_VENDEDOR
      totales.set(v, (totales.get(v) ?? 0) + (j.totalFinal ?? 0))
    })
    return [...totales].map(([nombre, total]) => ({
      nombre,
      total,
      comision: nombre === SIN_VENDEDOR ? null : comision(total),
    }))
  }, [jornadasDelMes])

  const totalMes = vendedores.reduce((acc, v) => acc + v.total, 0)
  const comisionMes = vendedores.reduce((acc, v) => acc + (v.comision ?? 0), 0)

  useEffect(() => {
    let cancelado = false
    Promise.all(
      jornadasDelMes.map(async (j) => {
        if (!cacheVentas.current.has(j.id)) {
          const snap = await getDocs(collection(db, 'jornadas', j.id, 'ventas'))
          cacheVentas.current.set(
            j.id,
            snap.docs.map((d) => d.data())
          )
        }
        return cacheVentas.current.get(j.id)
      })
    )
      .then((listas) => {
        if (cancelado) return
        const cantidades = new Map()
        listas.flat().forEach((v) => {
          ;(v.items ?? []).forEach((it) => {
            cantidades.set(it.producto, (cantidades.get(it.producto) ?? 0) + (Number(it.cantidad) || 0))
          })
        })
        const filas = [...cantidades].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        setProductos({ clave, filas, error: false })
      })
      .catch((err) => {
        console.error('Error al leer las ventas del mes:', err)
        if (!cancelado) setProductos({ clave, filas: [], error: true })
      })
    return () => {
      cancelado = true
    }
  }, [clave, jornadasDelMes])

  const cargandoProductos = productos.clave !== clave

  return (
    <>
      <section className="tarjeta">
        <h2>Resumen del mes</h2>
        <div className="campo">
          <label htmlFor="mes">Mes</label>
          <select id="mes" value={mes} onChange={(e) => setMes(e.target.value)}>
            {meses.map((m) => (
              <option key={m} value={m}>
                {nombreMes(m)}
              </option>
            ))}
          </select>
        </div>
        <p className="subtexto">
          {jornadasDelMes.length} jornada{jornadasDelMes.length === 1 ? '' : 's'} finalizada
          {jornadasDelMes.length === 1 ? '' : 's'}
        </p>

        <h3>Ventas por vendedor</h3>
        <table className="tabla">
          <thead>
            <tr>
              <th>Vendedor</th>
              <th className="num">Total</th>
              <th className="num">Comisión ({PORCENTAJE_TEXTO}%)</th>
            </tr>
          </thead>
          <tbody>
            {vendedores.map((v) => (
              <tr key={v.nombre}>
                <td>{v.nombre}</td>
                <td className="num">${formatearMoneda(v.total)}</td>
                <td className="num comision">{v.comision == null ? '—' : `$${formatearMoneda(v.comision)}`}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td>Total</td>
              <td className="num">${formatearMoneda(totalMes)}</td>
              <td className="num comision">${formatearMoneda(comisionMes)}</td>
            </tr>
          </tfoot>
        </table>
      </section>

      <section className="tarjeta">
        <h2>Productos vendidos · {nombreMes(mes)}</h2>
        {cargandoProductos && <p className="subtexto centrado">Cargando…</p>}
        {!cargandoProductos && productos.error && (
          <p className="subtexto texto-error">No se pudieron cargar las ventas del mes.</p>
        )}
        {!cargandoProductos && !productos.error && productos.filas.length === 0 && (
          <p className="subtexto centrado">No hay ventas en este mes.</p>
        )}
        {!cargandoProductos && productos.filas.length > 0 && (
          <table className="tabla">
            <thead>
              <tr>
                <th>Producto</th>
                <th className="num">Cantidad</th>
              </tr>
            </thead>
            <tbody>
              {productos.filas.map(([producto, cantidad]) => (
                <tr key={producto}>
                  <td>{producto}</td>
                  <td className="num">{cantidad}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  )
}
