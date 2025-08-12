// frontend/src/utils/generarPDF_UTV.js
import jsPDF from "jspdf";
import "jspdf-autotable";

const fmtCLP = (n) =>
  new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 })
    .format(Math.round(Number(n) || 0));

const fmtNum = (n) =>
  new Intl.NumberFormat("es-CL", { maximumFractionDigits: 1 }).format(Number(n) || 0);

const mesNombre = (periodo /* YYYY-MM */) => {
  const [y, m] = periodo.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString("es-CL", { month: "long", year: "numeric" }).toUpperCase();
};

export const generarPDF_UTV = ({ periodo, resumen, trabajadores }) => {
  // Carta vertical
  const doc = new jsPDF({ unit: "pt", format: "letter", orientation: "portrait" }); // 612x792
  const margin = 28;

  // Título
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(`PAGO UTV ${mesNombre(periodo)}`, margin, 48);

  // === Resumen compacto arriba a la derecha ===
  const resumenRows = [
    ["UTV", "-", fmtNum(resumen?.utv?.sumaUTV || 0), fmtCLP(resumen?.utv?.valor || 0)],
    [
      "Termopanel",
      fmtNum(resumen?.termopanel?.m2 || 0),
      "-",
      fmtCLP(resumen?.termopanel?.valor || 0),
    ],
    [
      "Instalación",
      fmtNum(resumen?.instalacion?.m2 || 0),
      "-",
      fmtCLP(resumen?.instalacion?.valor || 0),
    ],
    [
      { content: "TOTAL A PAGAR", styles: { fontStyle: "bold" } },
      { content: "-", styles: { fontStyle: "bold" } },
      { content: "-", styles: { fontStyle: "bold" } },
      { content: fmtCLP(resumen?.total || 0), styles: { fontStyle: "bold" } },
    ],
  ];

  doc.autoTable({
    head: [["Sección", "Cantidad / m²", "Suma UTV", "Valor Acumulado"]],
    body: resumenRows,
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: [33, 37, 41], textColor: 255 },
    startY: 24,
    tableWidth: 340,
    margin: { left: 612 - 340 - margin }, // pegado a la derecha
  });

  // Posición de inicio para la tabla grande
  const startY = Math.max(110, doc.lastAutoTable.finalY + 10);

  // === Tabla principal por trabajador ===
  const head = [
    [
      "#",
      "NOMBRE",
      "DÍAS\nTRAB",
      "HORAS\nTRAB",
      "HORAS\nEXTRAS",
      "HORAS\nRETRASO / PERMISO",
      "OBSERVACIÓN",
      "HORAS\nACUM. TRAB",
      "% HORA\nASIST",
      "PAGO",
    ],
  ];

  const body = trabajadores.map((t, idx) => [
    idx + 1,
    t.nombre || "",
    fmtNum(t.dias_trab || 0),
    fmtNum(t.horas_trab || 0),
    fmtNum(t.horas_extras || 0),
    fmtNum(t.horas_retraso || 0),
    t.observacion || "",
    fmtNum(t.horas_acum_trab || 0),
    `${fmtNum(((t.pct_asist || 0) * 100))}%`,
    fmtCLP(t.pago || 0),
  ]);

  const totHorasAcum = trabajadores.reduce((s, t) => s + (Number(t.horas_acum_trab) || 0), 0);
  const totHorasTrab = trabajadores.reduce((s, t) => s + (Number(t.horas_trab) || 0), 0);
  const totPago = trabajadores.reduce((s, t) => s + (Number(t.pago) || 0), 0);

  body.push([
    { content: "TOTALES", colSpan: 2, styles: { fontStyle: "bold" } },
    "",
    fmtNum(totHorasTrab),
    "",
    "",
    "",
    fmtNum(totHorasAcum),
    "",
    fmtCLP(totPago),
  ]);

  doc.autoTable({
    head,
    body,
    startY,
    styles: { fontSize: 9, cellPadding: 4, lineColor: [220, 220, 220], lineWidth: 0.5 },
    headStyles: { fillColor: [33, 37, 41], textColor: 255 },
    theme: "grid",
    margin: { left: margin, right: margin },
    didParseCell: (data) => {
      if (data.row.index === body.length - 1) data.cell.styles.fontStyle = "bold";
    },
  });

  doc.save(`pago_utv_${periodo}.pdf`);
};
