import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Nome muito curto").max(100),
  email: z.string().email("Email inválido"),
  password: z
    .string()
    .min(8, "Senha deve ter pelo menos 8 caracteres")
    .max(128),
});

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1),
});

export const transactionSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]),
  amount: z.number().positive(),
  occurredAt: z.string().datetime(),
  description: z.string().max(255).optional(),
  categoryId: z.number().nullable().optional(),
  walletId: z.number(),
});

export const categorySchema = z.object({
  name: z.string().min(2, "Nome muito curto"),
  icon: z.string().optional(),
});
