import express from 'express';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import cors from 'cors';

import authRouter from './router/authRouter.js';
import userRouter from './router/userRouter.js';
import productRoutes from './router/productRoutes.js';
import tallasRouter from './router/tallaRoutes.js';
import productTallaRoutes from './router/productTallaRoutes.js';

import { fileURLToPath } from 'url';
import path from 'path';


const app = express();


const __dirname = path.dirname(fileURLToPath(import.meta.url));


app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());
app.use(morgan('dev'));
app.use(cookieParser());


app.use('/images', express.static(path.join(__dirname, '../images')));
app.use('/api/tallas', tallasRouter);
app.use('/api/productTalla', productTallaRoutes);


app.use('/api', authRouter);
app.use('/api', userRouter);
app.use('/api/products', productRoutes);

export default app;