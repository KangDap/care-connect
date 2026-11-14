import { z } from 'zod';

export const classifyItemSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  text: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
});

export const classifyInputSchema = z.object({
  text: z.string().optional(),
  items: z.array(classifyItemSchema).optional(),
  reportIds: z.array(z.union([z.string(), z.number()])).optional(),
  consultationIds: z.array(z.union([z.string(), z.number()])).optional(),
});

export type ClassifyInputSchemaType = z.infer<typeof classifyInputSchema>;

export const statisticalAnalysisQuerySchema = z.object({
  period: z
    .enum(['1w', '1m', '3m', '6m', '1y', 'all'])
    .optional()
    .default('1m'),
  sampleSize: z.coerce.number().int().min(1).max(100).optional().default(10),
});

export type StatisticalAnalysisQuerySchemaType = z.infer<
  typeof statisticalAnalysisQuerySchema
>;
