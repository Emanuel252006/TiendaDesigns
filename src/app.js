import express from "express";
import dotenv from "dotenv";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import cors from "cors";
import fileUpload from "express-fileupload";
import authRouter from "./router/authRouter.js";
import userRouter from "./router/userRouter.js";
import productRoutes from "./router/productRoutes.js";
import tallasRouter from "./router/tallaRoutes.js";
import productTallaRoutes from "./router/productTallaRoutes.js";
import carruselRoutes from "./router/carruselRoutes.js";
import contactRouter from "./router/contactRouter.js";
import cartRoutes from "./router/cartRoutes.js";
import checkoutRoutes from "./router/checkoutRoutes.js";
import paymentRoutes from "./router/paymentRoutes.js";
import payuRoutes from "./router/payuRoutes.js";
import orderRoutes from "./router/orderRoutes.js";
import testRoutes from "./router/testRoutes.js";

import { fileURLToPath } from "url";
import path from "path";

// 1. Cargamos variables de entorno
dotenv.config();

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 2. Middlewares
app.use(
  cors({
    origin: [
      'http://localhost:5173',
      process.env.FRONTEND_URL || 'http://localhost:5173'
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(morgan("dev"));
app.use(cookieParser());
app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: '/tmp/',
  createParentPath: true
}));

// 3. Carpetas estáticas
const IMAGES_DIR = path.join(__dirname, "../images");
const INVOICES_DIR = path.join(__dirname, "../invoices");
console.log("Static images folder:", IMAGES_DIR);
console.log("Static invoices folder:", INVOICES_DIR);
app.use("/images", express.static(IMAGES_DIR));
app.use("/invoices", express.static(INVOICES_DIR));

// 4. Rutas de la API
app.use("/api/tallas", tallasRouter);
app.use("/api/productTalla", productTallaRoutes);
app.use("/api/carrusel", carruselRoutes);
app.use("/api", contactRouter);
app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/payu", payuRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/test", testRoutes);

// 5. Handler genérico de errores
app.use((err, req, res, next) => {
  console.error("❌ Internal Server Error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// 6. Exportamos la app como default
export default app;