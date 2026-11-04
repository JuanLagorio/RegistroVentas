import { useCallback, useEffect, useState } from 'react'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { authReady, db } from '../firebase'

const STORAGE_KEY = 'rv_jornada_id'

function hoyISO() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function useJornada() {
  const [cargando, setCargando] = useState(true)
  const [jornadaId, setJornadaId] = useState(null)
  const [jornada, setJornada] = useState(null)
  const [ventas, setVentas] = useState([])

  // Al montar: esperar autenticación y retomar la jornada activa si existe.
  useEffect(() => {
    let cancelado = false
    authReady.then(async () => {
      if (cancelado) return
      const idGuardado = localStorage.getItem(STORAGE_KEY)
      if (!idGuardado) {
        setCargando(false)
        return
      }
      try {
        const snap = await getDoc(doc(db, 'jornadas', idGuardado))
        if (!cancelado) {
          if (snap.exists() && !snap.data().finalizado) {
            setJornadaId(idGuardado)
          } else {
            localStorage.removeItem(STORAGE_KEY)
          }
          setCargando(false)
        }
      } catch (err) {
        console.error('Error al retomar la jornada:', err)
        if (!cancelado) setCargando(false)
      }
    })
    return () => {
      cancelado = true
    }
  }, [])

  // Suscripción en vivo a la jornada activa y sus ventas.
  useEffect(() => {
    if (!jornadaId) {
      setJornada(null)
      setVentas([])
      return
    }
    const unsubJornada = onSnapshot(doc(db, 'jornadas', jornadaId), (snap) => {
      if (snap.exists()) {
        setJornada({ id: snap.id, ...snap.data() })
      }
    })
    const q = query(collection(db, 'jornadas', jornadaId, 'ventas'), orderBy('creadoEn', 'asc'))
    const unsubVentas = onSnapshot(q, (snap) => {
      setVentas(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return () => {
      unsubJornada()
      unsubVentas()
    }
  }, [jornadaId])

  const crearJornada = useCallback(async ({ nombreReparto, vendedor }) => {
    await authReady
    const ref = await addDoc(collection(db, 'jornadas'), {
      fecha: hoyISO(),
      nombreReparto: nombreReparto || '',
      vendedor: vendedor || '',
      finalizado: false,
      creadoEn: serverTimestamp(),
    })
    localStorage.setItem(STORAGE_KEY, ref.id)
    setJornadaId(ref.id)
  }, [])

  const agregarVenta = useCallback(
    async (venta) => {
      if (!jornadaId) return
      await addDoc(collection(db, 'jornadas', jornadaId, 'ventas'), {
        ...venta,
        creadoEn: serverTimestamp(),
      })
    },
    [jornadaId]
  )

  const eliminarVenta = useCallback(
    async (ventaId) => {
      if (!jornadaId) return
      await deleteDoc(doc(db, 'jornadas', jornadaId, 'ventas', ventaId))
    },
    [jornadaId]
  )

  const finalizarJornada = useCallback(
    async (total) => {
      if (!jornadaId) return
      await updateDoc(doc(db, 'jornadas', jornadaId), {
        finalizado: true,
        finalizadoEn: serverTimestamp(),
        totalFinal: total,
      })
      localStorage.removeItem(STORAGE_KEY)
    },
    [jornadaId]
  )

  const nuevaJornada = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setJornadaId(null)
    setJornada(null)
    setVentas([])
  }, [])

  return {
    cargando,
    jornada,
    ventas,
    crearJornada,
    agregarVenta,
    eliminarVenta,
    finalizarJornada,
    nuevaJornada,
  }
}
