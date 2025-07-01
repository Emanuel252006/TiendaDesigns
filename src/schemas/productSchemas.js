import { z } from 'zod';

export const createProductSchema = z.object({
  NombreProducto: z.string().min(1, 'Nombre requerido'),
  Descripcion:    z.string().optional(),
  Precio:         z.number().min(0, 'Precio no puede ser negativo'),
  Stock:          z.number().int().min(0, 'Stock no puede ser negativo'),
  Imagen:         z.string().url('URL inválida').optional(),
});

export const updateProductSchema = createProductSchema.partial();