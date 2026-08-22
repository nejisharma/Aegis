import AsyncStorage from '@react-native-async-storage/async-storage';
import { listSaved, isSaved, saveArticle, removeSaved, savedIds, resetSavedCache, trimForStorage, SAVED_KEY, SAVED_MAX } from '../src/lib/saved';
import type { ArticleResponse, NewsItem } from '../src/api/types';

const news = (n: number): NewsItem => ({
  id: `news-${n}`,
  title: `Story ${n}`,
  link: `https://www.bleepingcomputer.com/news/security/story-${n}/`,
  description: `desc ${n}`,
  pubDate: '2026-08-20T10:00:00Z',
  source: 'BleepingComputer',
  sourceIcon: 'x',
});

const article = (n: number): ArticleResponse => ({
  title: `Story ${n} full`,
  byline: 'Author',
  siteName: 'BleepingComputer',
  excerpt: `excerpt ${n}`,
  textContent: `Paragraph one.\n\nParagraph two for ${n}.`,
  contentHtml: '<p>Paragraph one.</p>',
  length: 40,
  url: `https://www.bleepingcomputer.com/news/security/story-${n}/`,
  fetchedAt: '2026-08-21T00:00:00Z',
});

beforeEach(async () => {
  await AsyncStorage.clear();
  resetSavedCache();
});

describe('trimForStorage', () => {
  it('leaves short text alone', () => {
    expect(trimForStorage('hello')).toBe('hello');
  });
  it('caps long text with an ellipsis at exactly max length', () => {
    const out = trimForStorage('a'.repeat(300), 100);
    expect(out.length).toBe(100);
    expect(out.endsWith('…')).toBe(true);
  });
});

describe('saved store', () => {
  it('starts empty', async () => {
    expect(await listSaved()).toEqual([]);
    expect(await isSaved('news-1')).toBe(false);
  });

  it('saves, lists newest first, persists and removes', async () => {
    await saveArticle(news(1), article(1));
    await saveArticle(news(2), article(2));
    const list = await listSaved();
    expect(list.map((a) => a.id)).toEqual(['news-2', 'news-1']);
    expect(list[1].title).toBe('Story 1 full');
    expect(list[1].byline).toBe('Author');
    expect(await isSaved('news-1')).toBe(true);
    expect([...(await savedIds())].sort()).toEqual(['news-1', 'news-2']);

    const raw = await AsyncStorage.getItem(SAVED_KEY);
    expect(JSON.parse(raw ?? '[]')).toHaveLength(2);

    // survives a cold read
    resetSavedCache();
    expect((await listSaved()).length).toBe(2);

    await removeSaved('news-2');
    expect((await listSaved()).map((a) => a.id)).toEqual(['news-1']);
    expect(await isSaved('news-2')).toBe(false);
  });

  it('re-saving the same id replaces rather than duplicates', async () => {
    await saveArticle(news(1), article(1));
    await saveArticle(news(1), { ...article(1), title: 'Updated' });
    const list = await listSaved();
    expect(list).toHaveLength(1);
    expect(list[0].title).toBe('Updated');
  });

  it('caps at SAVED_MAX dropping the oldest', async () => {
    for (let i = 0; i < SAVED_MAX + 5; i++) await saveArticle(news(i), article(i));
    const list = await listSaved();
    expect(list).toHaveLength(SAVED_MAX);
    expect(list[0].id).toBe(`news-${SAVED_MAX + 4}`);
    expect(await isSaved('news-0')).toBe(false);
    expect(await isSaved('news-4')).toBe(false);
    expect(await isSaved('news-5')).toBe(true);
  });

  it('tolerates corrupt storage', async () => {
    await AsyncStorage.setItem(SAVED_KEY, '{not json');
    expect(await listSaved()).toEqual([]);
  });
});
