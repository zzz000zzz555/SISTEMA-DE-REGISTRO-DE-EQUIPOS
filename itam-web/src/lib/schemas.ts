import { z } from "zod";

export const equipoSchema = z.object({
  codigo_patrimonial: z.string().min(3).max(50),
  codigo_barras: z.string().min(3).max(100),
  numero_serie: z.string().max(100).optional().or(z.literal("")),
  id_categoria: z.number().int().positive(),
  id_marca: z.number().int().positive(),
  id_estado: z.number().int().positive(),
  id_ubicacion_actual: z.number().int().positive(),
  direccion_mac: z.string().regex(/^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/).optional().or(z.literal("")).nullable(),
  direccion_ip: z.string().regex(/^(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/).optional().or(z.literal("")).nullable(),
  valor_compra: z.number().nonnegative().optional().nullable(),
});

export const passwordSchema = z.string()
  .min(6, "Mínimo 6 caracteres")
  .regex(/[A-Za-z]/, "Debe contener letras")
  .regex(/[0-9]/, "Debe contener números")
  .regex(/[!@#$%^&*]/, "Debe contener un carácter especial (!@#$%^&*)");

export const rolSchema = z.object({
  nombre_rol: z.string().min(3).max(80),
});
