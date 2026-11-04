import { useEffect, useState } from 'react'
import { collection, doc, getDocs, onSnapshot, orderBy, query, writeBatch } from 'firebase/firestore'
import './App.css'
import { authReady, db } from './firebase'
import { ADMIN_PIN } from './config/config'
import { descargarPDF, generarPDF, nombreArchivoPDF } from './lib/pdf'
import { formatearMoneda } from './lib/format'
import ResumenMensual from './components/ResumenMensual'

const STORAGE_KEY = 'rv_admin_ok'

export default function Admin() {
  const [autenticado, setAutenticado] = useState(() => localStorage.getItem(STORAGE_KEY) === '1')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [jornadas, setJornadas] = useState(null)
  const [descargando, setDescargando] = useState(null)
  const [eliminando, setEliminando] = useState(null)

  useEffect(() => {
    if (!autenticado) return
    let unsub
    let cancelado = false
    authReady.then(() => {
      if (cancelado) return
      unsub = onSnapshot(collection(db, 'jornadas'), (snap) => {
        const finalizadas = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((j) => j.finalizado)
          .sort((a, b) => (b.finalizadoEn?.toMillis?.() ?? 0) - (a.finalizadoEn?.toMillis?.() ?? 0))
        setJornadas(finalizadas)
      })
    })
    return () => {
      cancelado = true
      unsub?.()
    }
  }, [autenticado])

  function handlePin(e) {
    e.preventDefault()
    if (pin === ADMIN_PIN) {
      localStorage.setItem(STORAGE_KEY, '1')
      setAutenticado(true)
      setError('')
    } else {
      setError('PIN incorrecto.')
      setPin('')
    }
  }

  async function handleDescargar(jornada) {
    setDescargando(jornada.id)
    try {
      const snap = await getDocs(query(collection(db, 'jornadas', jornada.id, 'ventas'), orderBy('creadoEn', 'asc')))
      const ventas = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      const doc = generarPDF(jornada, ventas)
      descargarPDF(doc, nombreArchivoPDF(jornada))
    } finally {
      setDescargando(null)
    }
  }

  async function handleEliminar(jornada) {
    const confirmado = window.confirm(
      `¿Eliminar para siempre la jornada de ${jornada.nombreReparto || 'reparto sin nombre'}${jornada.vendedor ? ` (${jornada.vendedor})` : ''} del ${jornada.fecha} (Total $${formatearMoneda(jornada.totalFinal ?? 0)})? No se puede deshacer.`
    )
    if (!confirmado) return

    setEliminando(jornada.id)
    try {
      const snap = await getDocs(collection(db, 'jornadas', jornada.id, 'ventas'))
      const batch = writeBatch(db)
      snap.docs.forEach((d) => batch.delete(d.ref))
      batch.delete(doc(db, 'jornadas', jornada.id))
      await batch.commit()
    } finally {
      setEliminando(null)
    }
  }

  if (!autenticado) {
    return (
      <div className="pantalla-centrada">
        <form className="tarjeta" onSubmit={handlePin}>
          <h1>Panel de ventas</h1>
          <label htmlFor="pin">PIN de acceso</label>
          <input
            id="pin"
            type="password"
            inputMode="numeric"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            autoFocus
          />
          {error && <p className="subtexto texto-error">{error}</p>}
          <button type="submit" className="boton-primario">
            Entrar
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="contenedor-app">
      <header className="encabezado">
        <h1>Panel de ventas</h1>
      </header>

      <main className="contenido">
        {jornadas === null && <p className="subtexto centrado">Cargando…</p>}
        {jornadas !== null && jornadas.length === 0 && (
          <p className="subtexto centrado">Todavía no hay jornadas finalizadas.</p>
        )}
        {jornadas !== null && <ResumenMensual jornadas={jornadas} />}
        {jornadas?.length > 0 && <h2 className="titulo-seccion">Jornadas</h2>}
        {jornadas?.map((j) => (
          <div key={j.id} className="tarjeta">
            <h2>{j.nombreReparto || 'Reparto sin nombre'}</h2>
            <p className="subtexto">
              {j.fecha}
              {j.vendedor ? ` · ${j.vendedor}` : ''}
            </p>
            <p className="total-jornada-admin">${formatearMoneda(j.totalFinal ?? 0)}</p>
            <div className="fila-campos">
              <button
                type="button"
                className="boton-secundario"
                disabled={descargando === j.id}
                onClick={() => handleDescargar(j)}
              >
                {descargando === j.id ? 'Generando…' : 'Descargar PDF'}
              </button>
              <button
                type="button"
                className="boton-peligro"
                disabled={eliminando === j.id}
                onClick={() => handleEliminar(j)}
              >
                {eliminando === j.id ? 'Eliminando…' : 'Eliminar jornada'}
              </button>
            </div>
          </div>
        ))}
      </main>
    </div>
  )
}
