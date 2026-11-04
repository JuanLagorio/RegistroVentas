import { useEffect, useMemo, useState } from 'react'
import { collection, doc, getDocs, onSnapshot, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore'
import './App.css'
import { authReady, db } from './firebase'
import { ADMIN_PIN, COMISION_PORCENTAJE } from './config/config'
import { descargarPDF, generarPDF, generarPDFMensual, nombreArchivoPDF, nombreArchivoPDFMensual } from './lib/pdf'
import { formatearMoneda } from './lib/format'
import { mesActual, mesDe, nombreMes } from './lib/meses'
import { calcularResumen, leerVentasDeJornadas } from './lib/resumenMensual'
import ListaJornadas from './components/ListaJornadas'
import PantallaLogin from './components/PantallaLogin'
import logo from './assets/logo-donasol.jpg'

const STORAGE_KEY = 'rv_admin_ok'
const PORCENTAJE_TEXTO = COMISION_PORCENTAJE.toLocaleString('es-AR')

export default function Admin() {
  const [autenticado, setAutenticado] = useState(() => localStorage.getItem(STORAGE_KEY) === '1')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [jornadas, setJornadas] = useState(null)
  const [descargando, setDescargando] = useState(null)
  const [eliminando, setEliminando] = useState(null)
  const [mes, setMes] = useState(mesActual)
  const [generandoMes, setGenerandoMes] = useState(false)
  const [errorMes, setErrorMes] = useState('')

  useEffect(() => {
    if (!autenticado) return
    let unsub
    let cancelado = false
    authReady.then(() => {
      if (cancelado) return
      unsub = onSnapshot(collection(db, 'jornadas'), (snap) => {
        const finalizadas = snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((j) => j.finalizado)
        setJornadas(finalizadas)
      })
    })
    return () => {
      cancelado = true
      unsub?.()
    }
  }, [autenticado])

  const meses = useMemo(() => {
    const set = new Set((jornadas ?? []).map((j) => mesDe(j.fecha)).filter(Boolean))
    set.add(mesActual())
    return [...set].sort().reverse()
  }, [jornadas])

  // Todas las jornadas finalizadas del mes, incluidas las eliminadas de la
  // lista: siguen contando para el resumen mensual.
  const jornadasDelMes = useMemo(
    () =>
      (jornadas ?? [])
        .filter((j) => mesDe(j.fecha) === mes)
        .sort(
          (a, b) =>
            (b.fecha ?? '').localeCompare(a.fecha ?? '') ||
            (b.finalizadoEn?.toMillis?.() ?? 0) - (a.finalizadoEn?.toMillis?.() ?? 0)
        ),
    [jornadas, mes]
  )
  const jornadasVisibles = jornadasDelMes.filter((j) => !j.eliminada)
  const cantidadEliminadas = jornadasDelMes.length - jornadasVisibles.length
  const totalMes = jornadasDelMes.reduce((acc, j) => acc + (j.totalFinal ?? 0), 0)

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

  async function handlePDFMensual() {
    setGenerandoMes(true)
    setErrorMes('')
    try {
      const ventas = await leerVentasDeJornadas(jornadasDelMes)
      const resumen = calcularResumen(jornadasDelMes, ventas)
      const pdf = generarPDFMensual(mes, jornadasDelMes, resumen)
      descargarPDF(pdf, nombreArchivoPDFMensual(mes))
    } catch (err) {
      console.error('Error al generar el resumen mensual:', err)
      setErrorMes('No se pudo generar el PDF del mes. Probá de nuevo.')
    } finally {
      setGenerandoMes(false)
    }
  }

  // "Eliminar" saca la jornada de la lista pero conserva sus datos, para que
  // siga figurando en el resumen del mes.
  async function handleEliminar(jornada) {
    const confirmado = window.confirm(
      `¿Eliminar de la lista la jornada de ${jornada.nombreReparto || 'reparto sin nombre'}${jornada.vendedor ? ` (${jornada.vendedor})` : ''} del ${jornada.fecha} (Total $${formatearMoneda(jornada.totalFinal ?? 0)})? Va a seguir figurando en el resumen del mes.`
    )
    if (!confirmado) return

    setEliminando(jornada.id)
    try {
      await updateDoc(doc(db, 'jornadas', jornada.id), { eliminada: true, eliminadaEn: serverTimestamp() })
    } finally {
      setEliminando(null)
    }
  }

  if (!autenticado) {
    return (
      <PantallaLogin>
        <form className="tarjeta login-tarjeta" onSubmit={handlePin}>
          <div className="login-saludo">
            <p className="login-fecha">Administración</p>
            <h1>Panel de ventas</h1>
            <p className="subtexto">Ingresá el PIN para ver las jornadas y descargar los PDFs.</p>
          </div>
          <div>
            <label htmlFor="pin">PIN de acceso</label>
            <input
              id="pin"
              className="input-pin"
              type="password"
              inputMode="numeric"
              autoComplete="off"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              autoFocus
            />
          </div>
          {error && <p className="subtexto texto-error">{error}</p>}
          <button type="submit" className="boton-login" disabled={!pin}>
            Entrar
          </button>
        </form>
      </PantallaLogin>
    )
  }

  return (
    <div className="admin">
      <header className="admin-encabezado">
        <div className="admin-barra">
          <div className="admin-marca">
            <img src={logo} alt="Doña Sol" className="admin-logo" width="293" height="215" />
            <div>
              <h1>Panel de ventas</h1>
              <span className="subtexto">Doña Sol · Administración</span>
            </div>
          </div>

          <label className="admin-mes-campo">
            <span>Mes</span>
            <select className="admin-mes" value={mes} onChange={(e) => setMes(e.target.value)}>
              {meses.map((m) => (
                <option key={m} value={m}>
                  {nombreMes(m)}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      <main className="admin-contenido">
        {jornadas === null ? (
          <p className="subtexto centrado">Cargando…</p>
        ) : (
          <div className="admin-seccion">
            <section className="panel panel-resumen">
              <div className="panel-resumen-texto">
                <p className="login-fecha">Resumen mensual</p>
                <h2>{nombreMes(mes)}</h2>
                <p className="subtexto">
                  {jornadasDelMes.length} jornada{jornadasDelMes.length === 1 ? '' : 's'} · Total $
                  {formatearMoneda(totalMes)}
                  {cantidadEliminadas > 0 &&
                    ` · incluye ${cantidadEliminadas} eliminada${cantidadEliminadas === 1 ? '' : 's'} de la lista`}
                </p>
                <p className="subtexto">
                  PDF para imprimir con las ventas por vendedor y su comisión ({PORCENTAJE_TEXTO}%) y los productos
                  vendidos con su cantidad y total.
                </p>
                {errorMes && <p className="subtexto texto-error">{errorMes}</p>}
              </div>
              <button
                type="button"
                className="boton-login boton-pdf-mes"
                disabled={generandoMes || jornadasDelMes.length === 0}
                onClick={handlePDFMensual}
              >
                {generandoMes ? 'Generando…' : 'Descargar resumen del mes (PDF)'}
              </button>
            </section>

            <ListaJornadas
              mes={mes}
              jornadas={jornadasVisibles}
              descargando={descargando}
              eliminando={eliminando}
              onDescargar={handleDescargar}
              onEliminar={handleEliminar}
            />
          </div>
        )}
      </main>
    </div>
  )
}
