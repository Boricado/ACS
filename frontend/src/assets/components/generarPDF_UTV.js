// src/utils/generarPDF_UTV.js
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// (opcional) usa tu mismo logo en base64 si quieres
// import { logoBase64 } from "./logo"; // si lo tienes
const fmtCLP = (n) =>
  new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 })
    .format(Math.round(Number(n) || 0));
const fmtNum = (n, d = 1) =>
  new Intl.NumberFormat("es-CL", { minimumFractionDigits: d, maximumFractionDigits: d })
    .format(Number(n) || 0);

const mesLargo = (periodo) => {
  // periodo: "YYYY-MM"
  const [y, m] = periodo.split("-").map(Number);
  const fecha = new Date(y, (m ?? 1) - 1, 1);
  return fecha.toLocaleDateString("es-CL", { month: "long", year: "numeric" });
};

/**
 * trabajadores: [{ nombre, dias_trab, horas_trab, horas_extras, horas_retraso, observacion, horas_acum_trab }]
 * utvAcum: número total de UTV del mes
 * valorUTV: $ por UTV
 */
export const generarPDF_UTV = ({ periodo, trabajadores, utvAcum, valorUTV }) => {
  const doc = new jsPDF("p", "mm", "letter");
  let y = 12;

  // HEADER
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(`PAGO UTV ${mesLargo(periodo).toUpperCase()}`, 14, y);
  y += 6;

  // if (logoBase64) { doc.addImage(logoBase64, 'JPEG', 175, 8, 25, 10); }

  // Cálculos
  // % asistencia = horas_acum_trab / horas_trab   (si horas_trab <= 0 -> 0)
  const rows = trabajadores.map((t, i) => {
    const dias = Number(t.dias_trab) || 0;
    const horasTrab = Number(t.horas_trab) || (dias * 9);
    const horasExtras = Number(t.horas_extras) || 0;
    const horasRetraso = Number(t.horas_retraso) || 0;
    const horasAcum = Number(t.horas_acum_trab) || Math.max(0, horasTrab + horasExtras - horasRetraso);
    const pctAsist = horasTrab > 0 ? (horasAcum / horasTrab) : 0; // 0..∞
    return {
      i: i + 1,
      nombre: t.nombre || "",
      dias,
      horasTrab,
      horasExtras,
      horasRetraso,
      observacion: t.observacion || "",
      horasAcum,
      ratio: pctAsist, // lo usamos para repartir UTV
    };
  });

  const sumRatio = rows.reduce((s, r) => s + (isFinite(r.ratio) ? r.ratio : 0), 0);
  const baseUTV = sumRatio > 0 ? (utvAcum / sumRatio) : (utvAcum / Math.max(rows.length, 1));

  const rowsConUTV = rows.map((r) => {
    const utvTrab = baseUTV * r.ratio;                // reparte proporcional a % asistencia
    const pagoTrab = utvTrab * (Number(valorUTV) || 0);
    return { ...r, utvTrab, pagoTrab };
  });

  const totHorasTrab = rowsConUTV.reduce((s, r) => s + r.horasTrab, 0);
  const totHorasAcum = rowsConUTV.reduce((s, r) => s + r.horasAcum, 0);
  const totUTV = rowsConUTV.reduce((s, r) => s + r.utvTrab, 0);
  const totalPagar = rowsConUTV.reduce((s, r) => s + r.pagoTrab, 0);

  // Resumen superior
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  autoTable(doc, {
    startY: y,
    theme: "grid",
    styles: { fontSize: 9, halign: "center" },
    headStyles: { fillColor: [33, 37, 41] },
    head: [[
      "HORAS ACUM.", "UTV ACUM", "VALOR UTV", "TOTAL A PAGAR"
    ]],
    body: [[
      fmtNum(totHorasAcum, 1),
      fmtNum(utvAcum, 1),
      fmtCLP(valorUTV),
      fmtCLP(totalPagar),
    ]],
  });
  y = doc.lastAutoTable.finalY + 4;

  // Tabla por trabajador
  autoTable(doc, {
    startY: y,
    theme: "grid",
    styles: { fontSize: 8 },
    headStyles: { fillColor: [33, 37, 41], halign: "center" },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },  // #
      1: { cellWidth: 38 },                    // Nombre
      2: { cellWidth: 14, halign: "right" },   // Días
      3: { cellWidth: 18, halign: "right" },   // Horas trab
      4: { cellWidth: 18, halign: "right" },   // Extras
      5: { cellWidth: 22, halign: "right" },   // Retraso/permiso
      6: { cellWidth: 35 },                    // Observación
      7: { cellWidth: 20, halign: "right" },   // Horas acum
      8: { cellWidth: 18, halign: "right" },   // % Asist
      9: { cellWidth: 18, halign: "right" },   // UTV por trab
      10:{ cellWidth: 24, halign: "right" },   // Pago
    },
    head: [[
      "#", "NOMBRE", "DIAS TRAB", "HORAS TRAB", "HORAS EXTRAS",
      "HORAS RETRASO / PERMISO", "OBSERVACIÓN", "HORAS ACUM. TRAB",
      "% HORA ASIST", "UTV POR TRAB", "PAGO UTV"
    ]],
    body: rowsConUTV.map(r => ([
      r.i,
      r.nombre,
      fmtNum(r.dias, 0),
      fmtNum(r.horasTrab, 0),
      fmtNum(r.horasExtras, 1),
      fmtNum(r.horasRetraso, 1),
      r.observacion,
      fmtNum(r.horasAcum, 1),
      fmtNum(r.ratio * 100, 0) + "%",
      fmtNum(r.utvTrab, 1),
      fmtCLP(r.pagoTrab),
    ])),
    foot: [[
      "",
      "TOTALES",
      "",
      fmtNum(totHorasTrab, 0),
      "",
      "",
      "",
      fmtNum(totHorasAcum, 1),
      "",
      fmtNum(totUTV, 1),
      fmtCLP(totalPagar),
    ]],
    footStyles: { fillColor: [245, 245, 245], textColor: [0, 0, 0], fontStyle: "bold" },
  });

  // Guardar
  const nombre = `PAGO_UTV_${periodo}.pdf`;
  doc.save(nombre);
};
