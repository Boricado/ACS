import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Logo ALUMCE en base64
const logoBase64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQk...'; // ← pega aquí completo si lo cortas

export const generarPDF_OC = ({ numeroOC, proveedor, rutProveedor, fecha, realizadoPor, clienteNombre, presupuestoNumero, items, totales, comentario }) => {
  const doc = new jsPDF();

  // Insertar logo
  doc.addImage(logoBase64, 'JPEG', 10, 10, 40, 15); // más proporcionado

  // Título
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(`ORDEN DE COMPRA N° ${numeroOC}`, 150, 18, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('ALUMCE - Ruta D-43 N°4815, Pan de Azúcar, Coquimbo', 10, 35);
  doc.text('RUT: 76.136.919-9', 10, 40);
  doc.text('Mail: adquisiciones@alumce.cl', 10, 45);

  // Proveedor
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('PROVEEDOR', 10, 60);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Nombre: ${proveedor}`, 10, 65);
  doc.text(`RUT: ${rutProveedor}`, 10, 70);

  // Tabla de ítems
  autoTable(doc, {
    startY: 80,
    head: [['Código', 'Producto', 'Cantidad', 'Precio Unitario', 'Total']],
    body: items.map(i => [
      i.codigo,
      i.producto,
      i.cantidad,
      `$${parseInt(i.precio_unitario).toLocaleString()}`,
      `$${(i.cantidad * i.precio_unitario).toLocaleString()}`
    ]),
    styles: { fontSize: 9 },
  });

  const finalY = doc.previousAutoTable.finalY;

  // Totales a la derecha
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`TOTAL NETO: $${totales.neto.toLocaleString()}`, 200, finalY + 10, { align: 'right' });
  doc.text(`IVA 19%: $${totales.iva.toLocaleString()}`, 200, finalY + 17, { align: 'right' });
  doc.text(`TOTAL: $${totales.total.toLocaleString()}`, 200, finalY + 24, { align: 'right' });

  // Cliente y presupuesto
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Cliente: ${clienteNombre}`, 10, finalY + 35);
  doc.text(`Presupuesto: ${presupuestoNumero}`, 10, finalY + 41);

  // Comentario (si hay)
  if (comentario?.trim()) {
    doc.setFont('helvetica', 'bold');
    doc.text('Comentario:', 10, finalY + 50);
    doc.setFont('helvetica', 'normal');
    doc.text(doc.splitTextToSize(comentario, 180), 10, finalY + 56);
  }

  // Firmas
  doc.setFontSize(10);
  const firmasY = finalY + 80;
  doc.text('', 10, firmasY);
  doc.text('Realizado por', 10, firmasY + 5);
  doc.text(realizadoPor, 10, firmasY + 10);

  doc.text('_________________________', 150, firmasY);
  doc.text('Autorizado por', 150, firmasY + 5);

  // Descargar
  doc.save(`OC_${numeroOC}.pdf`);
};
