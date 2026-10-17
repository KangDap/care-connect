/**
 * Helpers for displaying article content.
 *
 * The backend stores `content` as plain text and does not define a rich text
 * format. To support sub-headings and a table of contents without rendering
 * raw HTML, the frontend understands a small, safe subset:
 *
 *   ## Sub-heading         -> section heading (listed in the table of contents)
 *   ### Smaller heading    -> minor heading
 *   - item / * item        -> bullet list
 *   blank line             -> new paragraph
 *
 * Everything else is shown as text, with single line breaks preserved.
 */

export type ArticleBlock =
  | { type: 'heading'; level: 2 | 3; text: string; id: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: string[] };

export interface TocItem {
  id: string;
  text: string;
}

const slugify = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60) || 'section';

export function parseArticleContent(content: string): ArticleBlock[] {
  const lines = (content ?? '').replace(/\r\n?/g, '\n').split('\n');
  const blocks: ArticleBlock[] = [];
  const usedIds = new Map<string, number>();
  let paragraph: string[] = [];
  let list: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push({ type: 'paragraph', text: paragraph.join('\n') });
      paragraph = [];
    }
  };
  const flushList = () => {
    if (list.length) {
      blocks.push({ type: 'list', items: list });
      list = [];
    }
  };
  const uniqueId = (text: string) => {
    const base = slugify(text);
    const count = usedIds.get(base) ?? 0;
    usedIds.set(base, count + 1);
    return count === 0 ? base : `${base}-${count + 1}`;
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    if (!trimmed) {
      flushParagraph();
      flushList();
      continue;
    }

    const heading = /^(#{2,3})\s+(.+)$/.exec(trimmed);
    if (heading) {
      flushParagraph();
      flushList();
      const text = heading[2].trim();
      blocks.push({
        type: 'heading',
        level: heading[1].length === 2 ? 2 : 3,
        text,
        id: uniqueId(text),
      });
      continue;
    }

    const bullet = /^[-*]\s+(.+)$/.exec(trimmed);
    if (bullet) {
      flushParagraph();
      list.push(bullet[1].trim());
      continue;
    }

    flushList();
    paragraph.push(trimmed);
  }

  flushParagraph();
  flushList();
  return blocks;
}

export const getTableOfContents = (blocks: ArticleBlock[]): TocItem[] =>
  blocks.flatMap((block) =>
    block.type === 'heading' && block.level === 2
      ? [{ id: block.id, text: block.text }]
      : [],
  );

/** Estimated reading time in minutes, assuming ~200 words per minute. */
export function getReadingTime(...texts: (string | null | undefined)[]) {
  const words = texts
    .filter(Boolean)
    .join(' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

export function formatArticleDate(value: string | null | undefined) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

/** True for absolute http(s) URLs, the only scheme the backend accepts. */
export function isSafeExternalUrl(value: string | null | undefined) {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}
