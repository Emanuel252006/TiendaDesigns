import { z } from 'zod';

export const createProductSchema = z.object({
  NombreProducto: z.string().min(1, 'Nombre requerido'),
  Descripcion:    z.string().optional(),
  Precio:         z.union([z.string(), z.number()]).transform((val) => {
    const num = parseFloat(val);
    if (isNaN(num) || num < 0) {
      throw new Error('Precio debe ser un número válido mayor o igual a 0');
    }
    return num;
  }),
  Stock:          z.number().int().min(0, 'Stock no puede ser negativo').optional(),
  Imagen:         z.string().optional(),
});

export const updateProductSchema = createProductSchema.partial();