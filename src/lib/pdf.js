import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { NOMBRE_APP } from '../config/config'
import { formatearMoneda } from './format'

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

export function nombreArchivoPDF(jornada) {
  const partes = [jornada.nombreReparto || 'reparto', jornada.vendedor].filter(Boolean)
  const base = partes.join('_').replace(/\s+/g, '_')
  return `ventas_${base}_${jornada.fecha}.pdf`
}

export function descargarPDF(doc, filename) {
  doc.save(filename)
}
