import express from "express";
import nodemailer from "nodemailer";

const router = express.Router();

router.post("/contact", async (req, res) => {
  console.log("📩 POST /api/contact body:", req.body);

  // Verifica que tus ENV estén cargadas
  console.log(
    "🔑 SMTP config:",
    process.env.SMTP_HOST,
    process.env.SMTP_PORT,
    process.env.SMTP_USER ? "OK" : "NO_USER",
    process.env.SMTP_PASS ? "OK" : "NO_PASS",
    "DESTINO:", process.env.CONTACT_EMAIL
  );

  const { firstName, lastName, email, message } = req.body;
  if (!firstName || !lastName || !email || !message) {
    console.warn("⚠️ Falta algún campo en el formulario");
    return res
      .status(400)
      .json({ error: "Todos los campos son obligatorios" });
  }

  let transporter;
  try {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      // Para pruebas locales con certificados auto-firmados
      tls: { rejectUnauthorized: false },
    });
    console.log("✔ Transporter listo");
  } catch (err) {
    console.error("❌ Error creando transporter:", err);
    return res
      .status(500)
      .json({ error: "No se pudo configurar el transporter", details: err.message });
  }

  const mailOptions = {
    from: `"Web Tienda" <${process.env.SMTP_USER}>`,
    to: process.env.CONTACT_EMAIL,
    subject: "Nuevo mensaje de formulario de contacto",
    text: `
De: ${firstName} ${lastName} <${email}>

Mensaje:
${message}
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✔ Email enviado, messageId:", info.messageId);
    res.json({ success: true, messageId: info.messageId });
  } catch (err) {
    console.error("❌ Error enviando correo:", err);
    res
      .status(500)
      .json({ error: "No se pudo enviar el correo", details: err.message });
  }
});

export default router;