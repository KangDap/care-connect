import {
  formatArticleDate,
  getReadingTime,
  getTableOfContents,
  isSafeExternalUrl,
  parseArticleContent,
} from '@/lib/article-content';
import { describe, expect, it } from 'vitest';

describe('parseArticleContent', { tags: ['frontend'] }, () => {
  it('splits paragraphs on blank lines and keeps single line breaks', () => {
    const blocks = parseArticleContent(
      'Line one\nLine two\n\nSecond paragraph',
    );
    expect(blocks).toEqual([
      { type: 'paragraph', text: 'Line one\nLine two' },
      { type: 'paragraph', text: 'Second paragraph' },
    ]);
  });

  it('recognizes headings and bullet lists', () => {
    const blocks = parseArticleContent(
      '## Tanda Burnout\n- Lelah\n* Sulit fokus\n### Detail\nTeks',
    );
    expect(blocks).toEqual([
      {
        type: 'heading',
        level: 2,
        text: 'Tanda Burnout',
        id: 'tanda-burnout',
      },
      { type: 'list', items: ['Lelah', 'Sulit fokus'] },
      { type: 'heading', level: 3, text: 'Detail', id: 'detail' },
      { type: 'paragraph', text: 'Teks' },
    ]);
  });

  it('gives duplicate headings unique ids', () => {
    const toc = getTableOfContents(
      parseArticleContent('## Tips\n\n## Tips\n\n## Tips'),
    );
    expect(toc.map((item) => item.id)).toEqual(['tips', 'tips-2', 'tips-3']);
  });

  it('treats HTML as plain text', () => {
    const blocks = parseArticleContent('<script>alert(1)</script>');
    expect(blocks).toEqual([
      { type: 'paragraph', text: '<script>alert(1)</script>' },
    ]);
  });

  it('handles CRLF and empty content', () => {
    expect(parseArticleContent('A\r\n\r\nB')).toHaveLength(2);
    expect(parseArticleContent('')).toEqual([]);
  });

  it('only lists level-2 headings in the table of contents', () => {
    const toc = getTableOfContents(
      parseArticleContent('## Satu\n### Kecil\n## Dua'),
    );
    expect(toc).toEqual([
      { id: 'satu', text: 'Satu' },
      { id: 'dua', text: 'Dua' },
    ]);
  });
});

describe('article display helpers', { tags: ['frontend'] }, () => {
  it('estimates reading time with a minimum of one minute', () => {
    expect(getReadingTime('')).toBe(1);
    expect(getReadingTime('kata '.repeat(450))).toBe(3);
  });

  it('formats dates and guards invalid values', () => {
    expect(formatArticleDate(null)).toBe('-');
    expect(formatArticleDate('not-a-date')).toBe('-');
    expect(formatArticleDate('2026-10-17T03:00:00.000Z')).toMatch(/2026/);
  });

  it('only accepts http and https URLs', () => {
    expect(isSafeExternalUrl('https://luhung.unpad.ac.id/course')).toBe(true);
    expect(isSafeExternalUrl('javascript:alert(1)')).toBe(false);
    expect(isSafeExternalUrl('/relative')).toBe(false);
    expect(isSafeExternalUrl(null)).toBe(false);
  });
});
