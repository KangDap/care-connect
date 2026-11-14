/**
 * Form helpers for the admin article editor: client-side validation that
 * mirrors the backend rules, and payload builders for create/update.
 */
import type {
  ArticleDetail,
  ArticleStatus,
  CreateArticleRequest,
  UpdateArticleRequest,
} from '@/types/article';

export interface ArticleFormValues {
  title: string;
  summary: string;
  content: string;
  categoryId: string; // <select> value; converted to number on submit
  imageUrl: string;
  ctaText: string;
  courseUrl: string;
}

export type ArticleFormErrors = Partial<
  Record<keyof ArticleFormValues, string>
>;

export const ARTICLE_LIMITS = {
  title: 255,
  summary: 1000,
  content: 100_000,
  ctaText: 255,
  url: 2048,
} as const;

export const DEFAULT_CTA_TEXT = 'Pelajari lebih lanjut di Unpad Luhung';

export const emptyArticleForm = (): ArticleFormValues => ({
  title: '',
  summary: '',
  content: '',
  categoryId: '',
  imageUrl: '',
  ctaText: DEFAULT_CTA_TEXT,
  courseUrl: '',
});

export const articleToFormValues = (
  article: ArticleDetail,
): ArticleFormValues => ({
  title: article.title,
  summary: article.summary,
  content: article.content,
  categoryId: String(article.categoryId),
  imageUrl: article.imageUrl ?? '',
  ctaText: article.ctaText,
  courseUrl: article.courseUrl,
});

/** Same URL rules as the backend: absolute http(s), no credentials, max 2048. */
export function isValidWebUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > ARTICLE_LIMITS.url) return false;
  try {
    const url = new URL(trimmed);
    return (
      (url.protocol === 'http:' || url.protocol === 'https:') &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}

export function validateArticleForm(
  values: ArticleFormValues,
): ArticleFormErrors {
  const errors: ArticleFormErrors = {};
  const required = (
    field: 'title' | 'summary' | 'content' | 'ctaText',
    label: string,
    max: number,
  ) => {
    const length = values[field].trim().length;
    if (length === 0) errors[field] = `${label} is required.`;
    else if (length > max)
      errors[field] =
        `${label} must be at most ${max.toLocaleString('en-US')} characters.`;
  };

  required('title', 'Title', ARTICLE_LIMITS.title);
  required('summary', 'Summary', ARTICLE_LIMITS.summary);
  required('content', 'Content', ARTICLE_LIMITS.content);
  required('ctaText', 'Button text', ARTICLE_LIMITS.ctaText);

  if (!/^[1-9]\d*$/.test(values.categoryId)) {
    errors.categoryId = 'Choose a category.';
  }
  if (!values.courseUrl.trim()) {
    errors.courseUrl = 'Course URL is required.';
  } else if (!isValidWebUrl(values.courseUrl)) {
    errors.courseUrl = 'Use a full link starting with http:// or https://.';
  }
  if (values.imageUrl.trim() && !isValidWebUrl(values.imageUrl)) {
    errors.imageUrl = 'Use a full link starting with http:// or https://.';
  }

  return errors;
}

export function buildCreatePayload(
  values: ArticleFormValues,
  status: ArticleStatus,
): CreateArticleRequest {
  const imageUrl = values.imageUrl.trim();
  return {
    title: values.title.trim(),
    summary: values.summary.trim(),
    content: values.content.trim(),
    categoryId: Number(values.categoryId),
    imageUrl: imageUrl || null,
    ctaText: values.ctaText.trim(),
    courseUrl: values.courseUrl.trim(),
    status,
  };
}

/**
 * Only the fields that changed, as the PATCH contract expects. Returns an
 * empty object when nothing changed (the caller should not send it).
 */
export function buildUpdatePayload(
  original: ArticleDetail,
  values: ArticleFormValues,
  status: ArticleStatus,
): UpdateArticleRequest {
  const next = buildCreatePayload(values, status);
  const payload: UpdateArticleRequest = {};

  if (next.title !== original.title) payload.title = next.title;
  if (next.summary !== original.summary) payload.summary = next.summary;
  if (next.content !== original.content) payload.content = next.content;
  if (next.categoryId !== original.categoryId)
    payload.categoryId = next.categoryId;
  if ((next.imageUrl ?? null) !== (original.imageUrl ?? null))
    payload.imageUrl = next.imageUrl ?? null;
  if (next.ctaText !== original.ctaText) payload.ctaText = next.ctaText;
  if (next.courseUrl !== original.courseUrl) payload.courseUrl = next.courseUrl;
  if (status !== original.status) payload.status = status;

  return payload;
}

export const isFormDirty = (a: ArticleFormValues, b: ArticleFormValues) =>
  (Object.keys(a) as (keyof ArticleFormValues)[]).some(
    (key) => a[key] !== b[key],
  );
