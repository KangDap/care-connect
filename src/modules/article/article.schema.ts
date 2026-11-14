import { Errors } from '@/lib/error';
import { z } from 'zod';

const text = (max: number) => z.string().trim().min(1).max(max);
const id = z.number().int().positive().max(2_147_483_647);
const status = z.enum(['DRAFT', 'PUBLISHED']);
const webUrl = z
  .string()
  .trim()
  .max(2048)
  .url()
  .refine((value) => {
    try {
      const url = new URL(value);
      return (
        ['http:', 'https:'].includes(url.protocol) &&
        !url.username &&
        !url.password
      );
    } catch {
      return false;
    }
  }, 'URL must use HTTP or HTTPS without credentials');

export const CREATE_ARTICLE_SCHEMA = z
  .object({
    title: text(255),
    summary: text(1000),
    content: text(100_000),
    categoryId: id,
    imageUrl: webUrl.nullable().optional(),
    ctaText: text(255),
    courseUrl: webUrl,
    status: status.default('DRAFT'),
  })
  .strict();

export const UPDATE_ARTICLE_SCHEMA = CREATE_ARTICLE_SCHEMA.extend({ status })
  .partial()
  .refine(
    (value) => Object.values(value).some((field) => field !== undefined),
    'At least one article field is required',
  );

export const CREATE_ARTICLE_CATEGORY_SCHEMA = z
  .object({
    name: text(100),
    description: z.string().trim().max(1000).nullable().optional(),
  })
  .strict();

export const UPDATE_ARTICLE_CATEGORY_SCHEMA =
  CREATE_ARTICLE_CATEGORY_SCHEMA.partial().refine(
    (value) => Object.values(value).some((field) => field !== undefined),
    'At least one category field is required',
  );

const queryId = z
  .string()
  .regex(/^[1-9]\d*$/)
  .transform(Number)
  .pipe(id);
const listFields = {
  categoryId: queryId.optional(),
  search: z.string().trim().max(255).optional(),
  page: queryId.pipe(z.number().max(1_000_000)).default(1),
  limit: queryId.pipe(z.number().max(100)).default(10),
};
const publicQuerySchema = z.object(listFields);
const adminQuerySchema = publicQuerySchema.extend({
  status: status.optional(),
});

function parse<T>(schema: z.ZodType<T>, payload: unknown): T {
  const result = schema.safeParse(payload);
  if (!result.success) {
    throw Errors.badRequest(
      'Invalid article data',
      result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    );
  }
  return result.data;
}

export class ArticleSchema {
  static validateId(value: string) {
    return parse(queryId, value);
  }
  static validateCreateArticle(payload: unknown) {
    return parse(CREATE_ARTICLE_SCHEMA, payload);
  }
  static validateUpdateArticle(payload: unknown) {
    return parse(UPDATE_ARTICLE_SCHEMA, payload);
  }
  static validateCreateCategory(payload: unknown) {
    return parse(CREATE_ARTICLE_CATEGORY_SCHEMA, payload);
  }
  static validateUpdateCategory(payload: unknown) {
    return parse(UPDATE_ARTICLE_CATEGORY_SCHEMA, payload);
  }
  static validateQuery(params: URLSearchParams, admin = false) {
    return parse(
      admin ? adminQuerySchema : publicQuerySchema,
      Object.fromEntries(params.entries()),
    );
  }
}
