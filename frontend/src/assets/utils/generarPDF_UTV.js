// frontend/src/assets/utils/generarPDF_UTV.js
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const fmtCLP = (n) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(Math.round(Number(n) || 0));

const pct = (x) => `${Math.round((Number(x) || 0) * 100)}%`;

/**
 * @param {{
 *   periodo: string,
 *   resumen: {
 *     utv: { suma: number, valor: number },
 *     termopanel: { m2: number, valor: number },
 *     instalacion: { m2: number, valor: number },
 *     total: number
 *   },
 *   trabajadores: Array<{
 *     nombre:string, dias_trab:number, horas_trab:number, horas_extras:number,
 *     horas_retraso:number, observacion?:string, horas_acum_trab:number,
 *     pct_asist:number, pago:number
 *   }>
 * }} opts
 */
export function generarPDF_UTV({ periodo, resumen, trabajadores }) {
  const doc = new jsPDF({
    orientation: 'landscape',   // 👈 horizontal
    unit: 'pt',
    format: 'letter',           // 👈 tamaño carta
  });

  const pageW = doc.internal.pageSize.getWidth();

  // Título
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text(`PAGO UTV ${periodo?.toUpperCase?.() || periodo}`, 40, 40);

  // ---------- Resumen (arriba a la derecha)
  const sumRows = [
    ['UTV', '-', Number(resumen?.utv?.suma || 0), fmtCLP(resumen?.utv?.valor)],
    [
      'Termopanel',
      Number(resumen?.termopanel?.m2 || 0),
      '-',
      fmtCLP(resumen?.termopanel?.valor),
    ],
    [
      'Instalación',
      Number(resumen?.instalacion?.m2 || 0),
      '-',
      fmtCLP(resumen?.instalacion?.valor),
    ],
    ['TOTAL A PAGAR', '-', '-', fmtCLP(resumen?.total)],
  ];

  doc.autoTable({
    startY: 60,
    head: [['Sección', 'Cantidad / m²', 'Suma UTV', 'Valor Acumulado']],
    body: sumRows.map((r) => [r[0], String(r[1]), String(r[2]), r[3]]),
    tableWidth: 520,
    margin: { left: pageW - 40 - 520, right: 40 },
    styles: { fontSize: 9, halign: 'right' },
    headStyles: { fillColor: [33, 37, 41], halign: 'center' },
    columnStyles: {
      0: { halign: 'left' },
      1: { halign: 'center' },
      2: { halign: 'center' },
      3: { halign: 'right' },
    },
  });

  // ---------- Tabla de trabajadores
  const head = [
    [
      '#',
      'NOMBRE',
      'DÍAS TRAB',
      'HORAS TRAB',
      'HORAS EXTRAS',
      'HORAS RETRASO / PERMISO',
      'OBSERVACIÓN',
      'HORAS ACUM. TRAB',
      '% HORA ASIST',
      'PAGO',
    ],
  ];

  const body = (trabajadores || []).map((t, i) => [
    i + 1,
    t.nombre || '',
    Number(t.dias_trab) || 0,
    Number(t.horas_trab) || 0,
    Number(t.horas_extras) || 0,
    Number(t.horas_retraso) || 0,
    t.observacion || '',
    Number(t.horas_acum_trab) || 0,
    pct(t.pct_asist),
    fmtCLP(t.pago),
  ]);

  const totHorasTrab = (trabajadores || []).reduce(
    (s, t) => s + (Number(t.horas_trab) || 0),
    0
  );
  const totHorasAcum = (trabajadores || []).reduce(
    (s, t) => s + (Number(t.horas_acum_trab) || 0),
    0
  );
  const totPago = (trabajadores || []).reduce((s, t) => s + (Number(t.pago) || 0), 0);

  doc.autoTable({
    startY: doc.lastAutoTable.finalY + 20,
    head,
    body,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [33, 37, 41], halign: 'center' },
    columnStyles: {
      0: { halign: 'center', cellWidth: 22 },
      1: { halign: 'left', cellWidth: 160 },
      2: { halign: 'center' },
      3: { halign: 'center' },
      4: { halign: 'center' },
      5: { halign: 'center' },
      6: { halign: 'left', cellWidth: 160 },
      7: { halign: 'center' },
      8: { halign: 'center' },
      9: { halign: 'right' },
    },
    foot: [
      [
        { content: 'TOTALES', colSpan: 3 },
        String(totHorasTrab),
        '', // extras
        '', // retraso
        '', // observación
        String(totHorasAcum),
        '', // %
        fmtCLP(totPago),
      ],
    ],
    footStyles: { fillColor: [245, 245, 245], halign: 'right', fontStyle: 'bold' },
  });

  doc.save(`Pago_UTV_${periodo}.pdf`);
}
