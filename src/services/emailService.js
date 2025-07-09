import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Envía un código de verificación al correo del usuario
 * @param {string} to - Correo destino
 * @param {string} code - Código de verificación
 * @returns {Promise}
 */
export async function sendVerificationCode(to, code) {
  const mailOptions = {
    from: `TiendaDesigns <${process.env.CONTACT_EMAIL}>`,
    to,
    subject: 'Código de verificación - TiendaDesigns',
    html: `<p>Tu código de verificación es: <b>${code}</b></p><p>Si no solicitaste este registro, ignora este correo.</p>`
  };
  return transporter.sendMail(mailOptions);
} 