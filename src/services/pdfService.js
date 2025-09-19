import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const PDFService = {
  // Generar factura en PDF
  async generateInvoice(orderData) {
    return new Promise((resolve, reject) => {
      try {
        // Crear directorio de facturas si no existe
        const invoicesDir = path.join(__dirname, '../../invoices');
        if (!fs.existsSync(invoicesDir)) {
          fs.mkdirSync(invoicesDir, { recursive: true });
        }

        const fileName = `factura_${orderData.OrdenID}_${Date.now()}.pdf`;
        const filePath = path.join(invoicesDir, fileName);
        
        const doc = new PDFDocument({ margin: 50 });

        // Pipe PDF a archivo
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // Encabezado
        doc.fontSize(24)
           .text('TiendaDesigns', { align: 'center' })
           .fontSize(16)
           .text('FACTURA', { align: 'center' })
           .moveDown();

        // Información de la orden
        doc.fontSize(12)
           .text(`Orden #: ${orderData.OrdenID}`)
           .text(`Fecha: ${new Date(orderData.FechaOrden).toLocaleDateString('es-CO')}`)
           .text(`Estado: ${orderData.Estado}`)
           .moveDown();

        // Información del cliente
        doc.fontSize(14)
           .text('INFORMACIÓN DEL CLIENTE')
           .fontSize(12)
           .text(`Nombre: ${orderData.NombreUsuario}`)
           .text(`Email: ${orderData.Correo}`)
           .text(`Dirección: ${orderData.Direccion}`)
           .text(`Ciudad: ${orderData.Ciudad}`)
           .text(`País: ${orderData.Pais}`)
           .text(`Código Postal: ${orderData.CodigoPostal}`)
           .moveDown();

        // Tabla de productos
        doc.fontSize(14)
           .text('PRODUCTOS')
           .moveDown();

        // Encabezados de tabla
        const tableTop = doc.y;
        doc.fontSize(10)
           .text('Producto', 50, tableTop)
           .text('Talla', 250, tableTop)
           .text('Cantidad', 320, tableTop)
           .text('Precio Unit.', 400, tableTop)
           .text('Total', 500, tableTop);

        // Línea separadora
        doc.moveTo(50, tableTop + 20)
           .lineTo(550, tableTop + 20)
           .stroke();

        let yPosition = tableTop + 30;
        let subtotal = 0;

        // Productos
        orderData.items.forEach((item, index) => {
          const itemTotal = item.Cantidad * item.Precio;
          subtotal += itemTotal;

          doc.fontSize(10)
             .text(item.NombreProducto, 50, yPosition)
             .text(item.NombreTalla || 'N/A', 250, yPosition)
             .text(item.Cantidad.toString(), 320, yPosition)
             .text(`$${item.Precio.toLocaleString()}`, 400, yPosition)
             .text(`$${itemTotal.toLocaleString()}`, 500, yPosition);

          yPosition += 20;

          // Nueva página si es necesario
          if (yPosition > 700 && index < orderData.items.length - 1) {
            doc.addPage();
            yPosition = 50;
          }
        });

        // Línea separadora final
        doc.moveTo(50, yPosition)
           .lineTo(550, yPosition)
           .stroke();

        yPosition += 20;

        // Totales
            const shipping = 0; // Envío gratis
    const total = subtotal + shipping; // Total igual al subtotal

        doc.fontSize(12)
           .text(`Subtotal: $${subtotal.toLocaleString()}`, 400, yPosition)
           .text(`Envío: GRATIS`, 400, yPosition + 20)
           .fontSize(14)
           .text(`TOTAL: $${total.toLocaleString()}`, 400, yPosition + 40);

        // Pie de página
        doc.fontSize(10)
           .text('Gracias por tu compra', { align: 'center' })
           .text('Para consultas: contacto@tiendadesigns.com', { align: 'center' });

        // Finalizar PDF
        doc.end();

        stream.on('finish', () => {
          resolve({
            fileName,
            filePath,
            url: `/invoices/${fileName}`
          });
        });

        stream.on('error', reject);

      } catch (error) {
        reject(error);
      }
    });
  }
}; 