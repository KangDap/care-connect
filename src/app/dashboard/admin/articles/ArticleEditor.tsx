'use client';

import { ArticleView } from '@/components/article/article-view';
import { Badge } from '@/components/badge';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Input } from '@/components/input';
import { Toast } from '@/components/toast';
import {
  articleKeys,
  createArticle,
  getAdminArticle,
  getAdminArticleCategories,
  getArticleErrorMessage,
  isArticleApiError,
  updateArticle,
} from '@/lib/api/articles';
import {
  ARTICLE_LIMITS,
  type ArticleFormErrors,
  type ArticleFormValues,
  articleToFormValues,
  buildCreatePayload,
  buildUpdatePayload,
  emptyArticleForm,
  isFormDirty,
  isValidWebUrl,
  validateArticleForm,
} from '@/lib/article-form';
import type { ArticleDetail, ArticleStatus } from '@/types/article';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Eye, Loader2, PenLine } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';

type ToastState = { show: boolean; msg: string; type: 'success' | 'error' };

const FieldError = ({ message }: { message?: string }) =>
  message ? (
    <p className="mt-1 text-xs font-bold text-red-500" role="alert">
      {message}
    </p>
  ) : null;

const CharCount = ({ value, max }: { value: string; max: number }) => (
  <span
    className={`text-[11px] font-bold ${value.trim().length > max ? 'text-red-500' : 'text-[#8ea087]'}`}
  >
    {value.trim().length.toLocaleString('en-US')}/{max.toLocaleString('en-US')}
  </span>
);

/** Create/edit form. `articleId` null means create mode. */
export function ArticleEditor({ articleId }: { articleId: number | null }) {
  const isEdit = articleId !== null;
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const [view, setView] = useState<'write' | 'preview'>(
    searchParams.get('view') === 'preview' ? 'preview' : 'write',
  );
  const [values, setValues] = useState<ArticleFormValues>(emptyArticleForm);
  const [initialValues, setInitialValues] =
    useState<ArticleFormValues>(emptyArticleForm);
  const [loadedId, setLoadedId] = useState<number | null>(null);
  const [errors, setErrors] = useState<ArticleFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const savedParam = searchParams.get('saved');
  const [toast, setToast] = useState<ToastState>(() =>
    savedParam === 'PUBLISHED' || savedParam === 'DRAFT'
      ? {
          show: true,
          msg:
            savedParam === 'PUBLISHED'
              ? 'Article created and published.'
              : 'Article created as draft.',
          type: 'success',
        }
      : { show: false, msg: '', type: 'success' },
  );
  const [imageFailed, setImageFailed] = useState(false);

  const categoriesQuery = useQuery({
    queryKey: articleKeys.categories,
    queryFn: getAdminArticleCategories,
  });
  const articleQuery = useQuery({
    queryKey: articleKeys.adminDetail(articleId ?? 0),
    queryFn: () => getAdminArticle(articleId as number),
    enabled: isEdit,
    retry: (count, error) =>
      !(isArticleApiError(error) && error.status < 500) && count < 2,
  });
  const article = articleQuery.data;

  // Fill the form once the article is loaded (or reloaded after saving).
  if (article && loadedId !== article.id) {
    const formValues = articleToFormValues(article);
    setValues(formValues);
    setInitialValues(formValues);
    setLoadedId(article.id);
  }

  const dirty = isFormDirty(values, initialValues);

  // Warn before leaving the page with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  useEffect(() => {
    const error = articleQuery.error ?? categoriesQuery.error;
    if (isArticleApiError(error) && error.status === 401) router.push('/login');
  }, [articleQuery.error, categoriesQuery.error, router]);

  const categories = useMemo(
    () => categoriesQuery.data ?? [],
    [categoriesQuery.data],
  );
  const categoryName =
    categories.find((c) => String(c.id) === values.categoryId)?.name ??
    article?.category.name ??
    '';

  const setField =
    (field: keyof ArticleFormValues) =>
    (
      event: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => {
      const value = event.target.value;
      setValues((prev) => ({ ...prev, [field]: value }));
      if (field === 'imageUrl') setImageFailed(false);
      if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

  const saveMutation = useMutation({
    mutationFn: async (
      status: ArticleStatus,
    ): Promise<ArticleDetail | null> => {
      if (!isEdit) return createArticle(buildCreatePayload(values, status));
      const payload = buildUpdatePayload(
        article as ArticleDetail,
        values,
        status,
      );
      if (Object.keys(payload).length === 0) return null;
      return updateArticle(articleId as number, payload);
    },
    onSuccess: (saved, status) => {
      if (!saved) {
        setToast({ show: true, msg: 'No changes to save.', type: 'success' });
        return;
      }
      queryClient.invalidateQueries({ queryKey: articleKeys.all });
      queryClient.setQueryData(articleKeys.adminDetail(saved.id), saved);
      const formValues = articleToFormValues(saved);
      setValues(formValues);
      setInitialValues(formValues);
      setLoadedId(saved.id);
      setToast({
        show: true,
        msg:
          status === 'PUBLISHED'
            ? 'Article saved and published.'
            : 'Article saved as draft.',
        type: 'success',
      });
      if (!isEdit) {
        router.replace(
          `/dashboard/admin/articles/${saved.id}/edit?saved=${saved.status}`,
        );
      }
    },
    onError: (error) => {
      if (isArticleApiError(error)) {
        if (error.status === 401) {
          router.push('/login');
          return;
        }
        const fieldErrors = error.fieldErrors();
        const known = Object.keys(emptyArticleForm());
        const mapped: ArticleFormErrors = {};
        Object.entries(fieldErrors).forEach(([field, message]) => {
          if (known.includes(field)) {
            mapped[field as keyof ArticleFormValues] = message;
          }
        });
        setErrors(mapped);
        if (error.code === 'CONFLICT' || error.code === 'NOT_FOUND') {
          // The chosen category may have been deleted meanwhile.
          queryClient.invalidateQueries({ queryKey: articleKeys.categories });
        }
      }
      const message = getArticleErrorMessage(
        error,
        'Failed to save the article.',
      );
      setFormError(message);
      setToast({ show: true, msg: message, type: 'error' });
    },
  });

  const submit = (status: ArticleStatus) => {
    setFormError(null);
    const validation = validateArticleForm(values);
    setErrors(validation);
    if (Object.keys(validation).length > 0) {
      setView('write');
      setFormError('Please fix the highlighted fields.');
      return;
    }
    saveMutation.mutate(status);
  };

  // --- Loading / error states for edit mode ---
  if (isEdit && articleQuery.isLoading) {
    return (
      <div className="py-16 text-center">
        <Loader2 className="mb-3 inline-block h-7 w-7 animate-spin text-[#193c1f]" />
        <p className="text-sm font-bold text-[#8ea087]">Loading article...</p>
      </div>
    );
  }
  if (isEdit && (articleQuery.isError || !article)) {
    const notFound =
      isArticleApiError(articleQuery.error) &&
      articleQuery.error.status === 404;
    return (
      <Card className="mx-auto max-w-xl p-10 text-center">
        <p className="mb-6 font-bold text-[#193c1f]">
          {notFound
            ? 'Article not found. It may have been deleted.'
            : getArticleErrorMessage(
                articleQuery.error,
                'Failed to load the article.',
              )}
        </p>
        <Link href="/dashboard/admin/articles">
          <Button variant="outline" className="mx-auto">
            Back to Articles
          </Button>
        </Link>
      </Card>
    );
  }

  const currentStatus: ArticleStatus = article?.status ?? 'DRAFT';
  const saving = saveMutation.isPending;
  const pendingStatus = saveMutation.variables;
  const noCategories = categoriesQuery.isSuccess && categories.length === 0;

  return (
    <div className="space-y-6">
      <Toast
        show={toast.show}
        msg={toast.msg}
        type={toast.type}
        onClose={() => setToast((prev) => ({ ...prev, show: false }))}
      />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Link
            href="/dashboard/admin/articles"
            className="mb-2 inline-flex items-center gap-1 text-xs font-bold text-[#8ea087] no-underline hover:text-[#193c1f]"
          >
            <ArrowLeft size={14} /> Back to Articles
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-black text-[#193c1f] sm:text-[32px]">
              {isEdit ? 'Edit Article' : 'New Article'}
            </h1>
            {isEdit && (
              <Badge
                status={currentStatus === 'PUBLISHED' ? 'SUCCESS' : 'DEFAULT'}
              >
                {currentStatus === 'PUBLISHED' ? 'Published' : 'Draft'}
              </Badge>
            )}
            {dirty && (
              <span className="text-xs font-bold text-[#d1b698]">
                Unsaved changes
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          {currentStatus === 'PUBLISHED' ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => submit('DRAFT')}
                loading={saving && pendingStatus === 'DRAFT'}
                disabled={saving}
                className="h-11 whitespace-nowrap rounded-xl px-4 py-0 text-xs font-black uppercase tracking-[0.08em]"
              >
                Move to Draft
              </Button>
              <Button
                type="button"
                onClick={() => submit('PUBLISHED')}
                loading={saving && pendingStatus === 'PUBLISHED'}
                disabled={saving}
                className="h-11 whitespace-nowrap rounded-xl px-4 py-0 text-xs font-black uppercase tracking-[0.08em]"
              >
                Save Changes
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => submit('DRAFT')}
                loading={saving && pendingStatus === 'DRAFT'}
                disabled={saving}
                className="h-11 whitespace-nowrap rounded-xl px-4 py-0 text-xs font-black uppercase tracking-[0.08em]"
              >
                Save Draft
              </Button>
              <Button
                type="button"
                onClick={() => submit('PUBLISHED')}
                loading={saving && pendingStatus === 'PUBLISHED'}
                disabled={saving}
                className="h-11 whitespace-nowrap rounded-xl px-4 py-0 text-xs font-black uppercase tracking-[0.08em]"
              >
                Publish
              </Button>
            </>
          )}
        </div>
      </div>

      {formError && (
        <div
          className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-600"
          role="alert"
        >
          {formError}
        </div>
      )}

      {noCategories && (
        <div className="rounded-2xl border border-[#d1b698] bg-[#ede4d8] p-4 text-sm font-medium text-[#193c1f]">
          You need at least one category before saving an article.{' '}
          <Link
            href="/dashboard/admin/articles/categories"
            className="font-bold underline"
          >
            Create a category
          </Link>
        </div>
      )}

      <div
        className="flex w-fit gap-1 rounded-2xl border border-[#d0d5cb] bg-white p-1"
        role="tablist"
      >
        {(
          [
            { key: 'write', label: 'Write', icon: PenLine },
            { key: 'preview', label: 'Preview', icon: Eye },
          ] as const
        ).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={view === key}
            onClick={() => setView(key)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black uppercase tracking-[0.08em] transition-all ${
              view === key
                ? 'bg-[#193c1f] text-[#f7f3ed]'
                : 'text-[#8ea087] hover:text-[#193c1f]'
            }`}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {view === 'preview' ? (
        <Card className="p-6 md:p-10">
          <p className="mb-8 rounded-xl bg-[#f7f3ed] px-4 py-2 text-center text-xs font-bold text-[#8ea087]">
            Preview. This is how readers will see the article.
          </p>
          <ArticleView
            preview
            article={{
              title: values.title,
              summary: values.summary,
              content: values.content,
              categoryName,
              imageUrl: values.imageUrl.trim() || null,
              ctaText: values.ctaText,
              courseUrl: values.courseUrl.trim(),
              publishedAt: article?.publishedAt ?? null,
            }}
          />
        </Card>
      ) : (
        <form
          className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]"
          onSubmit={(e) => {
            e.preventDefault();
            submit(currentStatus);
          }}
          noValidate
        >
          <Card className="space-y-6 p-6 md:p-8">
            <div>
              <Input
                label="Title"
                value={values.title}
                onChange={setField('title')}
                placeholder="e.g. Recognizing Burnout Before It Is Too Late"
                maxLength={ARTICLE_LIMITS.title + 50}
                aria-invalid={Boolean(errors.title)}
              />
              <div className="mt-1 flex justify-between">
                <FieldError message={errors.title} />
                <span className="ml-auto">
                  <CharCount value={values.title} max={ARTICLE_LIMITS.title} />
                </span>
              </div>
            </div>

            <div>
              <Input
                type="textarea"
                label="Summary"
                rows={3}
                value={values.summary}
                onChange={setField('summary')}
                placeholder="Two or three sentences shown on the article card."
                aria-invalid={Boolean(errors.summary)}
              />
              <div className="mt-1 flex justify-between">
                <FieldError message={errors.summary} />
                <span className="ml-auto">
                  <CharCount
                    value={values.summary}
                    max={ARTICLE_LIMITS.summary}
                  />
                </span>
              </div>
            </div>

            <div>
              <Input
                type="textarea"
                label="Content"
                rows={18}
                value={values.content}
                onChange={setField('content')}
                placeholder={
                  'Write the article here.\n\n## Sub-heading\nParagraph text...\n\n- Bullet point'
                }
                className="font-mono text-[13px] leading-6"
                aria-invalid={Boolean(errors.content)}
              />
              <div className="mt-1 flex justify-between gap-4">
                <div>
                  <FieldError message={errors.content} />
                  <p className="text-[11px] text-[#8ea087]">
                    Formatting: start a line with &quot;## &quot; for a
                    sub-heading, &quot;- &quot; for a bullet point. Leave an
                    empty line between paragraphs.
                  </p>
                </div>
                <span className="shrink-0">
                  <CharCount
                    value={values.content}
                    max={ARTICLE_LIMITS.content}
                  />
                </span>
              </div>
            </div>
          </Card>

          <div className="space-y-6">
            <Card className="space-y-5 p-6">
              <h2 className="text-sm font-black uppercase tracking-[0.12em] text-[#193c1f]">
                Details
              </h2>
              <div>
                <Input
                  type="select"
                  label="Category"
                  value={values.categoryId}
                  onChange={setField('categoryId')}
                  disabled={categoriesQuery.isLoading}
                  aria-invalid={Boolean(errors.categoryId)}
                >
                  <option value="">
                    {categoriesQuery.isLoading
                      ? 'Loading...'
                      : 'Select a category'}
                  </option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </Input>
                <FieldError message={errors.categoryId} />
                <Link
                  href="/dashboard/admin/articles/categories"
                  className="mt-1 inline-block text-[11px] font-bold text-[#8ea087] underline hover:text-[#193c1f]"
                >
                  Manage categories
                </Link>
              </div>

              <div>
                <Input
                  type="url"
                  label="Image URL (optional)"
                  value={values.imageUrl}
                  onChange={setField('imageUrl')}
                  placeholder="https://..."
                  aria-invalid={Boolean(errors.imageUrl)}
                />
                <FieldError message={errors.imageUrl} />
                {isValidWebUrl(values.imageUrl) && (
                  <div className="relative mt-3 aspect-[16/9] overflow-hidden rounded-2xl border border-[#d0d5cb] bg-[#f7f3ed]">
                    {imageFailed ? (
                      <p className="flex h-full items-center justify-center p-4 text-center text-xs font-bold text-red-500">
                        The image could not be loaded. Check the link.
                      </p>
                    ) : (
                      <Image
                        src={values.imageUrl.trim()}
                        alt="Image preview"
                        fill
                        className="object-cover"
                        onError={() => setImageFailed(true)}
                        unoptimized
                      />
                    )}
                  </div>
                )}
              </div>
            </Card>

            <Card className="space-y-5 p-6">
              <h2 className="text-sm font-black uppercase tracking-[0.12em] text-[#193c1f]">
                Unpad Luhung Course
              </h2>
              <div>
                <Input
                  label="Button text"
                  value={values.ctaText}
                  onChange={setField('ctaText')}
                  aria-invalid={Boolean(errors.ctaText)}
                />
                <FieldError message={errors.ctaText} />
              </div>
              <div>
                <Input
                  type="url"
                  label="Course URL"
                  value={values.courseUrl}
                  onChange={setField('courseUrl')}
                  placeholder="https://luhung.unpad.ac.id/..."
                  aria-invalid={Boolean(errors.courseUrl)}
                />
                <FieldError message={errors.courseUrl} />
                <p className="mt-1 text-[11px] text-[#8ea087]">
                  Opens in a new tab at the end of the article.
                </p>
              </div>
            </Card>
          </div>
        </form>
      )}
    </div>
  );
}
