import express from "express";
import nodemailer from "nodemailer";

const router = express.Router();

router.post("/contact", async (req, res) => {
  try {
    const { nombre, email, mensaje } = req.body;

    if (!nombre || !email || !mensaje) {
      return res.status(400).json({ message: "Todos los campos son requeridos" });
    }

    // Configurar transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Configurar email
    const mailOptions = {
      from: process.env.CONTACT_EMAIL,
      to: process.env.CONTACT_EMAIL, // Enviar a nosotros mismos
      subject: `Nuevo mensaje de contacto de ${nombre}`,
      html: `
        <h2>Nuevo mensaje de contacto</h2>
        <p><strong>Nombre:</strong> ${nombre}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Mensaje:</strong></p>
        <p>${mensaje}</p>
      `,
    };

    // Enviar email
    const info = await transporter.sendMail(mailOptions);

    res.status(200).json({ 
      message: "Mensaje enviado exitosamente",
      messageId: info.messageId 
    });
  } catch (error) {
    console.error("Error al enviar email:", error);
    res.status(500).json({ message: "Error al enviar el mensaje" });
  }
});

export default router;