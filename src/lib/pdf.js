import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { COMISION_PORCENTAJE, NOMBRE_APP } from '../config/config'
import { formatearMoneda } from './format'
import { fechaCorta, nombreMes } from './meses'
import { SIN_VENDEDOR } from './resumenMensual'

export function generarPDF(jornada, ventas) {
  const doc = new jsPDF()
  const total = ventas.reduce((acc, v) => acc + (v.total ?? 0), 0)

  doc.setFontSize(16)
  doc.text(NOMBRE_APP, 14, 18)

  doc.setFontSize(11)
  let y = 27
  doc.text(`Fecha: ${jornada.fecha}`, 14, y)
  if (jornada.nombreReparto) {
    y += 6
    doc.text(`Reparto: ${jornada.nombreReparto}`, 14, y)
  }
  if (jornada.vendedor) {
    y += 6
    doc.text(`Vendedor: ${jornada.vendedor}`, 14, y)
  }

  autoTable(doc, {
    startY: y + 6,
    head: [['Cliente', 'Productos', 'Total venta']],
    body: ventas.map((v) => [
      v.cliente,
      (v.items ?? []).map((i) => `${i.producto} x${i.cantidad}`).join('\n'),
      `$${formatearMoneda(v.total ?? 0)}`,
    ]),
    foot: [['', 'TOTAL GENERAL', `$${formatearMoneda(total)}`]],
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59] },
    footStyles: { fillColor: [226, 232, 240], textColor: [15, 23, 42], fontStyle: 'bold' },
  })

  const cantidadPorProducto = {}
  ventas.forEach((v) => {
    ;(v.items ?? []).forEach((it) => {
      cantidadPorProducto[it.producto] = (cantidadPorProducto[it.producto] ?? 0) + it.cantidad
    })
  })

  const filasResumen = Object.entries(cantidadPorProducto)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([producto, cantidad]) => [producto, String(cantidad)])

  if (filasResumen.length > 0) {
    const resumenY = doc.lastAutoTable.finalY + 12
    doc.setFontSize(13)
    doc.text('Resumen por producto', 14, resumenY)

    autoTable(doc, {
      startY: resumenY + 4,
      head: [['Producto', 'Cantidad']],
      body: filasResumen,
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59] },
    })
  }

  return doc
}

const COLOR_ENCABEZADO = [30, 41, 59]
const ESTILO_PIE = { fillColor: [226, 232, 240], textColor: [15, 23, 42], fontStyle: 'bold' }
const der = (content) => ({ content, styles: { halign: 'right' } })
const plata = (valor) => `$${formatearMoneda(valor ?? 0)}`

// Resumen del mes para imprimir: ventas por vendedor con comisión, productos
// vendidos (cantidad y plata) y todas las jornadas finalizadas del mes.
export function generarPDFMensual(mes, jornadas, resumen) {
  const doc = new jsPDF()
  const altoPagina = doc.internal.pageSize.getHeight()
  const porcentaje = COMISION_PORCENTAJE.toLocaleString('es-AR')

  doc.setFontSize(16)
  doc.text(NOMBRE_APP, 14, 18)
  doc.setFontSize(13)
  doc.text(`Resumen mensual · ${nombreMes(mes)}`, 14, 26)
  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text(`Generado el ${new Date().toLocaleDateString('es-AR')}`, 14, 32)
  doc.setTextColor(0)
  doc.setFontSize(11)
  doc.text(
    `Total vendido: ${plata(resumen.totalMes)}   ·   Jornadas: ${jornadas.length}   ·   Unidades: ${resumen.unidades.toLocaleString('es-AR')}`,
    14,
    40
  )

  function titulo(texto, y) {
    let inicio = y
    if (inicio + 24 > altoPagina - 15) {
      doc.addPage()
      inicio = 20
    }
    doc.setFontSize(13)
    doc.text(texto, 14, inicio)
    return inicio + 4
  }

  autoTable(doc, {
    startY: titulo('Ventas por vendedor', 52),
    head: [['Vendedor', der('Jornadas'), der('Total vendido'), der(`Comisión (${porcentaje}%)`)]],
    body: resumen.vendedores.map((v) => [
      v.nombre,
      der(String(v.jornadas)),
      der(plata(v.total)),
      der(v.comision == null ? '—' : plata(v.comision)),
    ]),
    foot: [['Total', der(String(jornadas.length)), der(plata(resumen.totalMes)), der(plata(resumen.comisionMes))]],
    theme: 'grid',
    headStyles: { fillColor: COLOR_ENCABEZADO },
    footStyles: ESTILO_PIE,
  })

  autoTable(doc, {
    startY: titulo('Productos vendidos', doc.lastAutoTable.finalY + 12),
    head: [['Producto', der('Cantidad'), der('Total')]],
    body: resumen.productos.map((p) => [p.producto, der(p.cantidad.toLocaleString('es-AR')), der(plata(p.monto))]),
    foot: [['Total', der(resumen.unidades.toLocaleString('es-AR')), der(plata(resumen.montoProductos))]],
    theme: 'grid',
    headStyles: { fillColor: COLOR_ENCABEZADO },
    footStyles: ESTILO_PIE,
  })

  autoTable(doc, {
    startY: titulo('Jornadas del mes', doc.lastAutoTable.finalY + 12),
    head: [['Fecha', 'Reparto', 'Vendedor', der('Total')]],
    body: jornadas.map((j) => [
      fechaCorta(j.fecha),
      j.nombreReparto || 'Reparto sin nombre',
      j.vendedor || SIN_VENDEDOR,
      der(plata(j.totalFinal)),
    ]),
    foot: [['', '', 'Total', der(plata(resumen.totalMes))]],
    theme: 'grid',
    headStyles: { fillColor: COLOR_ENCABEZADO },
    footStyles: ESTILO_PIE,
  })

  const paginas = doc.getNumberOfPages()
  for (let i = 1; i <= paginas; i++) {
    doc.setPage(i)
    doc.setFontSize(9)
    doc.setTextColor(120)
    doc.text(`${nombreMes(mes)} · Página ${i} de ${paginas}`, 14, altoPagina - 8)
  }
  doc.setTextColor(0)

  return doc
}

export function nombreArchivoPDFMensual(mes) {
  return `resumen_ventas_${mes}.pdf`
}

export function nombreArchivoPDF(jornada) {
  const partes = [jornada.nombreReparto || 'reparto', jornada.vendedor].filter(Boolean)
  const base = partes.join('_').replace(/\s+/g, '_')
  return `ventas_${base}_${jornada.fecha}.pdf`
}

export function descargarPDF(doc, filename) {
  doc.save(filename)
}
