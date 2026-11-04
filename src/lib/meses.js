// Utilidades para agrupar jornadas por mes a partir de `fecha` (YYYY-MM-DD).

export function mesDe(fecha) {
  return fecha?.slice(0, 7) ?? ''
}

export function mesActual() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function nombreMes(mes) {
  const [anio, m] = mes.split('-').map(Number)
  const texto = new Date(anio, m - 1, 1).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

// "2026-11-03" -> "03/11/2026"
export function fechaCorta(fecha) {
  if (!fecha) return ''
  const [anio, mes, dia] = fecha.split('-')
  return `${dia}/${mes}/${anio}`
}
