'use client';

import { Alert } from '@/components/alert';
import { Button } from '@/components/button';
import { Input } from '@/components/input';
import { Modal } from '@/components/modal';
import { Table } from '@/components/table';
import { Toast } from '@/components/toast';
import {
  articleKeys,
  createArticleCategory,
  deleteArticleCategory,
  getAdminArticleCategories,
  getArticleErrorMessage,
  isArticleApiError,
  updateArticleCategory,
} from '@/lib/api/articles';
import { formatArticleDate } from '@/lib/article-content';
import type { ArticleCategory } from '@/types/article';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';

type ToastState = { show: boolean; msg: string; type: 'success' | 'error' };
type FormState = { name: string; description: string };

const NAME_MAX = 100;
const DESCRIPTION_MAX = 1000;

export function ArticleCategoriesPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const search = (searchParams.get('search') || '').trim().toLowerCase();
  const queryClient = useQueryClient();

  const [toast, setToast] = useState<ToastState>({
    show: false,
    msg: '',
    type: 'success',
  });
  const [editing, setEditing] = useState<ArticleCategory | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>({ name: '', description: '' });
  const [formError, setFormError] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<ArticleCategory | null>(null);

  const categoriesQuery = useQuery({
    queryKey: articleKeys.categories,
    queryFn: getAdminArticleCategories,
  });

  useEffect(() => {
    const error = categoriesQuery.error;
    if (isArticleApiError(error) && error.status === 401) router.push('/login');
  }, [categoriesQuery.error, router]);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: articleKeys.categories });
    // Articles embed the category object, so their cached copies are stale too.
    queryClient.invalidateQueries({ queryKey: articleKeys.all });
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditing(null);
    setFormError(null);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const name = form.name.trim();
      const description = form.description.trim();
      if (!editing) {
        return createArticleCategory({
          name,
          description: description || null,
        });
      }
      const payload: { name?: string; description?: string | null } = {};
      if (name !== editing.name) payload.name = name;
      if ((description || null) !== editing.description) {
        payload.description = description || null;
      }
      if (Object.keys(payload).length === 0) return null;
      return updateArticleCategory(editing.id, payload);
    },
    onSuccess: (saved) => {
      closeForm();
      if (!saved) return;
      setToast({
        show: true,
        msg: editing ? 'Category updated.' : 'Category created.',
        type: 'success',
      });
      refresh();
    },
    onError: (error) => {
      if (isArticleApiError(error) && error.code === 'CONFLICT') {
        setFormError('A category with this name already exists.');
        return;
      }
      if (isArticleApiError(error) && error.code === 'NOT_FOUND') {
        closeForm();
        refresh();
      }
      setFormError(
        getArticleErrorMessage(error, 'Failed to save the category.'),
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteArticleCategory(id),
    onSuccess: () => {
      setToDelete(null);
      setToast({ show: true, msg: 'Category deleted.', type: 'success' });
      refresh();
    },
    onError: (error) => {
      setToDelete(null);
      const message =
        isArticleApiError(error) && error.code === 'CONFLICT'
          ? 'This category is still used by articles. Move or delete those articles first.'
          : getArticleErrorMessage(error, 'Failed to delete the category.');
      setToast({ show: true, msg: message, type: 'error' });
      refresh();
    },
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', description: '' });
    setFormError(null);
    setIsFormOpen(true);
  };

  const openEdit = (category: ArticleCategory) => {
    setEditing(category);
    setForm({
      name: category.name,
      description: category.description ?? '',
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  const submitForm = (event: React.FormEvent) => {
    event.preventDefault();
    const name = form.name.trim();
    if (!name) return setFormError('Name is required.');
    if (name.length > NAME_MAX)
      return setFormError(`Name must be at most ${NAME_MAX} characters.`);
    if (form.description.trim().length > DESCRIPTION_MAX)
      return setFormError(
        `Description must be at most ${DESCRIPTION_MAX} characters.`,
      );
    setFormError(null);
    saveMutation.mutate();
  };

  const categories = useMemo(() => {
    const list = categoriesQuery.data ?? [];
    if (!search) return list;
    return list.filter((category) =>
      [category.name, category.description].some((value) =>
        (value ?? '').toLowerCase().includes(search),
      ),
    );
  }, [categoriesQuery.data, search]);

  return (
    <div className="space-y-6">
      <Toast
        show={toast.show}
        msg={toast.msg}
        type={toast.type}
        onClose={() => setToast((prev) => ({ ...prev, show: false }))}
      />
      <Alert
        isOpen={toDelete !== null}
        onClose={() => setToDelete(null)}
        onConfirm={() => toDelete && deleteMutation.mutate(toDelete.id)}
        title="Delete Category?"
        description="A category can only be deleted when no article uses it."
        type="danger"
        confirmText={
          deleteMutation.isPending ? 'Deleting...' : 'Delete Category'
        }
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium text-[#8ea087]">
          Group articles by topic, for example Stress Management.
        </p>
        <Button
          onClick={openCreate}
          className="h-11 w-full shrink-0 whitespace-nowrap rounded-xl px-4 py-0 text-xs font-black uppercase tracking-[0.08em] sm:w-auto"
        >
          <Plus size={16} className="shrink-0" />
          New Category
        </Button>
      </div>

      {categoriesQuery.isLoading ? (
        <div className="py-16 text-center">
          <Loader2 className="mb-3 inline-block h-7 w-7 animate-spin text-[#193c1f]" />
          <p className="text-sm font-bold text-[#8ea087]">
            Loading categories...
          </p>
        </div>
      ) : categoriesQuery.isError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="mb-4 text-sm font-bold text-red-600">
            {getArticleErrorMessage(
              categoriesQuery.error,
              'Failed to load categories.',
            )}
          </p>
          <Button
            variant="outline"
            className="mx-auto"
            onClick={() => categoriesQuery.refetch()}
          >
            Try Again
          </Button>
        </div>
      ) : (
        <Table
          data={categories}
          keyExtractor={(category) => category.id}
          minWidth="min-w-[700px]"
          emptyMessage={
            search
              ? 'No categories match your search.'
              : 'No categories yet. Create the first one.'
          }
          columns={[
            {
              header: 'Name',
              cell: (category) => (
                <span className="font-bold text-[#193c1f]" data-no-translate>
                  {category.name}
                </span>
              ),
            },
            {
              header: 'Description',
              cell: (category) => (
                <span
                  className="line-clamp-2 max-w-[420px] text-gray-500"
                  data-no-translate
                >
                  {category.description || '-'}
                </span>
              ),
            },
            {
              header: 'Last Updated',
              className: 'whitespace-nowrap text-xs text-gray-500 md:text-sm',
              cell: (category) => formatArticleDate(category.updatedAt),
            },
            {
              header: 'Actions',
              headerClassName: 'text-right',
              className: 'text-right whitespace-nowrap',
              cell: (category) => (
                <div className="flex items-center justify-end gap-1">
                  <button
                    type="button"
                    title="Edit"
                    aria-label="Edit"
                    onClick={() => openEdit(category)}
                    className="rounded-xl p-2 text-[#8ea087] hover:bg-[#f7f3ed] hover:text-[#193c1f]"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    title="Delete"
                    aria-label="Delete"
                    onClick={() => setToDelete(category)}
                    className="rounded-xl p-2 text-red-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ),
            },
          ]}
        />
      )}

      <Modal
        isOpen={isFormOpen}
        onClose={closeForm}
        title={editing ? 'Edit Category' : 'New Category'}
      >
        <form onSubmit={submitForm} className="space-y-5" noValidate>
          <Input
            label="Name"
            value={form.name}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="e.g. Stress Management"
            maxLength={NAME_MAX + 20}
            autoFocus
          />
          <Input
            type="textarea"
            label="Description (optional)"
            rows={3}
            value={form.description}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, description: e.target.value }))
            }
          />
          {formError && (
            <p className="text-xs font-bold text-red-500" role="alert">
              {formError}
            </p>
          )}
          <Button
            type="submit"
            loading={saveMutation.isPending}
            className="w-full"
          >
            {editing ? 'Save Changes' : 'Create Category'}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
