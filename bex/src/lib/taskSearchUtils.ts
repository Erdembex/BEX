import { TaskCategory } from '@/types';
import { mapCategoryToBackendSkill } from '@/features/listing/listingsApi';
import type { EnrichedTask } from '@/features/data';
import { matchesSearch } from '@/lib/taskUtils';

const CATEGORY_ALIASES: Record<TaskCategory, string[]> = {
  design: ['tasarım', 'tasarim', 'design', 'grafik', 'logo', 'görsel', 'gorsel'],
  development: ['yazılım', 'yazilim', 'development', 'web', 'kod', 'software'],
  marketing: ['pazarlama', 'marketing', 'sosyal medya', 'reklam', 'seo'],
  content: ['içerik', 'icerik', 'content', 'yazar', 'metin', 'blog'],
  photography: ['fotoğraf', 'fotograf', 'photography', 'foto', 'çekim', 'cekim'],
  video: ['video', 'montaj', 'kurgu'],
  translation: ['çeviri', 'ceviri', 'translation', 'tercüme', 'tercume'],
  consulting: ['danışmanlık', 'danismanlik', 'consulting', 'danışman', 'danisman'],
  other: ['diğer', 'diger', 'other'],
};

export type TaskSearchParams = {
  q?: string;
  skills?: string[];
};

function normalizeSearchText(value: string): string {
  return value.trim().toLocaleLowerCase('tr-TR');
}

function matchCategories(query: string): TaskCategory[] {
  const normalized = normalizeSearchText(query);
  if (!normalized) return [];

  const matched = new Set<TaskCategory>();
  for (const [category, aliases] of Object.entries(CATEGORY_ALIASES) as [TaskCategory, string[]][]) {
    const labelMatch = aliases.some(
      (alias) => normalized === alias || normalized.includes(alias)
    );
    if (labelMatch) matched.add(category);
  }
  return [...matched];
}

function isCategoryOnlyQuery(query: string, categories: TaskCategory[]): boolean {
  const normalized = normalizeSearchText(query);
  if (!normalized || categories.length !== 1) return false;
  const aliases = CATEGORY_ALIASES[categories[0]];
  return aliases.some((alias) => normalized === alias);
}

/** API'ye gönderilecek arama parametreleri — kategori kelimeleri skill filtresine çevrilir. */
export function resolveTaskSearchParams(query: string): TaskSearchParams {
  const trimmed = query.trim();
  if (!trimmed) return {};

  const categories = matchCategories(trimmed);
  if (categories.length === 0) return { q: trimmed };

  const skills = [...new Set(categories.map(mapCategoryToBackendSkill))];
  if (isCategoryOnlyQuery(trimmed, categories)) {
    return { skills };
  }

  return { q: trimmed, skills };
}

export function matchesEnrichedTaskSearch(
  task: EnrichedTask,
  query: string,
  categoryLabels: Record<TaskCategory, string>
): boolean {
  const q = normalizeSearchText(query);
  if (!q) return true;

  const categoryLabel = categoryLabels[task.category]?.toLocaleLowerCase('tr-TR') ?? '';
  const reward = task.rewardDescription?.toLocaleLowerCase('tr-TR') ?? '';

  if (matchesSearch(task.title, task.description ?? '', q)) return true;
  if (task.businessName.toLocaleLowerCase('tr-TR').includes(q)) return true;
  if (categoryLabel.includes(q) || q.includes(categoryLabel)) return true;
  if (reward.includes(q)) return true;

  const aliases = CATEGORY_ALIASES[task.category] ?? [];
  if (aliases.some((alias) => q.includes(alias) || alias.includes(q))) return true;

  return false;
}
