// src/app.js
import express from 'express';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import cors from 'cors';

import authRouter    from './router/authRouter.js';  
import userRouter    from './router/userRouter.js';
import productRoutes from './router/productRoutes.js'; // ← agregado

import { fileURLToPath } from 'url';  
import path             from 'path';  

const app = express();

app.use(cors({
  origin:      'http://localhost:5173',
  credentials: true,
}));

const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(express.json());
app.use(morgan('dev'));
app.use(cookieParser());

app.use('/api',           authRouter);
app.use('/api',           userRouter);
app.use('/api/products',  productRoutes);               // ← agregado

export default app;