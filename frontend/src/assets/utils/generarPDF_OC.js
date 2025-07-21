import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Logo ALUMCE en base64 (usa el nuevo si cambiaste de imagen)
const logoBase64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAqADIDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD1DXL7xPFrEsem+T9kUArlUJ6DPVgeuav+Hb7VJIp/7bMKOGHlbSvI79D9KnvZ7dLmRXtpnIIyyuADwPetC1ji2K8LylOwYnH5GtHUvHlsjNU7S5rsf9rt/wDntH/30KlOSDg4PrS0VmaFFba/H3tRDf8AbAD+tKltfBCG1AM3Y+QBj9au0UAIoIUAnJxyfWilooAx9UttaluQdOureGIqMiWHeQ2evX0xVJrTxYAFTUrMY7/ZuD+Ga3ZL2GKRo2J3DsBUscolBKhgPUjGatVGlay+5Gbppu9397OcFp4uLAHVbID1+yf/AGVSrZ+KRndq9mfQi0xj/wAeroaKftX2X3IXsl3f3s5z7N4nRT5mrWSgD75tsDP0zTY08RrMgk1rTzGrDeRbgZHp97iukZFdSrqGU9iMisqTRSwZVljCk55Rjx/31R7R9l9yH7Jd397NYHIyOlFNRdkar1wAKKzNCvJayPceatwyjqF5x/OrKghQGIJxyQMVkXTMNSYBjjI4z9KsaWSRLkk8igDQooooAKM56VBcn5VHY5BHrVZB5QxH8gPOF4oA0KKB0ooA/9k=';

export const generarPDF_OC = ({ numeroOC, proveedor, rutProveedor, fecha, realizadoPor, clienteNombre, presupuestoNumero, items, totales, comentario }) => {
  const doc = new jsPDF();

  // Insertar logo (proporción ajustada)
  doc.addImage(logoBase64, 'JPEG', 10, 10, 40, 20);

  // Título a la derecha
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(`ORDEN DE COMPRA N° ${numeroOC}`, 200, 18, { align: 'right' });

  // Información de empresa
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

    doc.text(`Realizado por: ${realizadoPor}`, 10, firmasY);

    doc.line(150, firmasY - 2, 200, firmasY - 2); // línea superior centrada
    doc.text('Autorizado', 170, firmasY + 3, { align: 'center' });

  // Guardar PDF con nombre incluyendo proveedor
  const nombreArchivo = `OC_${numeroOC}_${proveedor.replace(/ /g, '_')}.pdf`;
  doc.save(nombreArchivo);
};
