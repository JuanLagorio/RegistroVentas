import { useMemo, useState } from 'react'
import './App.css'
import NuevaJornada from './components/NuevaJornada'
import VentaForm from './components/VentaForm'
import VentasList from './components/VentasList'
import ResumenFinal from './components/ResumenFinal'
import { useJornada } from './lib/useJornada'
import { formatearMoneda } from './lib/format'

export default function App() {
  const { cargando, jornada, ventas, crearJornada, agregarVenta, eliminarVenta, finalizarJornada, nuevaJornada } =
    useJornada()
  const [finalizando, setFinalizando] = useState(false)
  const [resumen, setResumen] = useState(null) // { jornada, ventas, total }

  const total = useMemo(() => ventas.reduce((acc, v) => acc + (v.total ?? 0), 0), [ventas])

  async function handleFinalizar() {
    if (ventas.length === 0) {
      alert('Agregá al menos una venta antes de finalizar.')
      return
    }
    if (!window.confirm(`¿Finalizar la jornada con un total de $${formatearMoneda(total)}? No vas a poder agregar más ventas.`)) {
      return
    }
    setFinalizando(true)
    try {
      const datosJornada = jornada
      const datosVentas = ventas
      await finalizarJornada(total)
      setResumen({ jornada: datosJornada, ventas: datosVentas, total })
    } finally {
      setFinalizando(false)
    }
  }

  function handleNuevaJornada() {
    setResumen(null)
    nuevaJornada()
  }

  if (cargando) {
    return (
      <div className="pantalla-centrada">
        <p className="subtexto">Cargando…</p>
      </div>
    )
  }

  if (resumen) {
    return (
      <ResumenFinal
        jornada={resumen.jornada}
        ventas={resumen.ventas}
        total={resumen.total}
        onNuevaJornada={handleNuevaJornada}
      />
    )
  }

  if (!jornada) {
    return <NuevaJornada onCrear={crearJornada} />
  }

  return (
    <div className="contenedor-app">
      <header className="encabezado">
        <div>
          <h1>{jornada.nombreReparto || 'Jornada de ventas'}</h1>
          <span className="subtexto">
            {jornada.fecha}
            {jornada.vendedor ? ` · ${jornada.vendedor}` : ''}
          </span>
        </div>
        <div className="total-barra">
          <span>Total</span>
          <strong>${formatearMoneda(total)}</strong>
        </div>
      </header>

      <main className="contenido">
        <VentaForm onAgregar={agregarVenta} />
        <section className="tarjeta">
          <h2>Ventas de hoy</h2>
          <VentasList ventas={ventas} onEliminar={eliminarVenta} />
        </section>
      </main>

      <footer className="pie">
        <button type="button" className="boton-finalizar" onClick={handleFinalizar} disabled={finalizando}>
          {finalizando ? 'Finalizando…' : 'Finalizar Jornada'}
        </button>
      </footer>
    </div>
  )
}
