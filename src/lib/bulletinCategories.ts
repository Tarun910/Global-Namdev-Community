import type { LucideIcon } from 'lucide-react';
import {
  Sparkles,
  GraduationCap,
  HeartPulse,
  Landmark,
  Globe2,
  Briefcase,
  Users,
  Megaphone,
  Award,
  CalendarDays,
  Camera,
  BookOpen,
  Leaf,
  Lightbulb,
  Bell,
} from 'lucide-react';
import type { Language } from './languages';

export const BULLETIN_CATEGORIES = [
  {
    id: 'devotion-spirituality',
    icon: Sparkles,
    iconClass: 'text-violet-600',
    labels: {
      en: 'Devotion & Spirituality',
      hi: 'भक्ति एवं आध्यात्म',
      mr: 'भक्ती आणि अध्यात्म',
    },
  },
  {
    id: 'education-career',
    icon: GraduationCap,
    iconClass: 'text-indigo-600',
    labels: {
      en: 'Education & Career',
      hi: 'शिक्षा एवं करियर',
      mr: 'शिक्षण आणि करिअर',
    },
  },
  {
    id: 'health-social-service',
    icon: HeartPulse,
    iconClass: 'text-red-500',
    labels: {
      en: 'Health & Social Service',
      hi: 'स्वास्थ्य एवं समाज सेवा',
      mr: 'आरोग्य आणि समाज सेवा',
    },
  },
  {
    id: 'society-culture',
    icon: Landmark,
    iconClass: 'text-amber-600',
    labels: {
      en: 'Society & Culture',
      hi: 'समाज एवं संस्कृति',
      mr: 'समाज आणि संस्कृती',
    },
  },
  {
    id: 'global-namdev-community',
    icon: Globe2,
    iconClass: 'text-primary',
    labels: {
      en: 'Global Namdev Community',
      hi: 'वैश्विक नामदेव समुदाय',
      mr: 'जागतिक नामदेव समुदाय',
    },
  },
  {
    id: 'employment-business',
    icon: Briefcase,
    iconClass: 'text-slate-700',
    labels: {
      en: 'Employment & Business',
      hi: 'रोजगार एवं व्यवसाय',
      mr: 'रोजगार आणि व्यवसाय',
    },
  },
  {
    id: 'family-women-empowerment',
    icon: Users,
    iconClass: 'text-pink-600',
    labels: {
      en: 'Family & Women Empowerment',
      hi: 'परिवार एवं महिला सशक्तिकरण',
      mr: 'कुटुंब आणि महिला सक्षमीकरण',
    },
  },
  {
    id: 'news-announcements',
    icon: Megaphone,
    iconClass: 'text-primary',
    labels: {
      en: 'News & Announcements',
      hi: 'समाचार एवं घोषणाएँ',
      mr: 'बातम्या आणि घोषणा',
    },
  },
  {
    id: 'honor-achievements',
    icon: Award,
    iconClass: 'text-yellow-600',
    labels: {
      en: 'Honor & Achievements',
      hi: 'सम्मान एवं उपलब्धियाँ',
      mr: 'सन्मान आणि उपलब्धी',
    },
  },
  {
    id: 'events-programs',
    icon: CalendarDays,
    iconClass: 'text-emerald-600',
    labels: {
      en: 'Events & Programs',
      hi: 'कार्यक्रम एवं आयोजन',
      mr: 'कार्यक्रम आणि आयोजन',
    },
  },
  {
    id: 'media-gallery',
    icon: Camera,
    iconClass: 'text-blue-600',
    labels: {
      en: 'Media & Gallery',
      hi: 'मीडिया एवं गैलरी',
      mr: 'मीडिया आणि गॅलरी',
    },
  },
  {
    id: 'literature-publications',
    icon: BookOpen,
    iconClass: 'text-orange-700',
    labels: {
      en: 'Literature & Publications',
      hi: 'साहित्य एवं प्रकाशन',
      mr: 'साहित्य आणि प्रकाशन',
    },
  },
  {
    id: 'environment-awareness',
    icon: Leaf,
    iconClass: 'text-green-600',
    labels: {
      en: 'Environment & Awareness',
      hi: 'पर्यावरण एवं जनजागरूकता',
      mr: 'पर्यावरण आणि जनजागृती',
    },
  },
  {
    id: 'inspiration-personality',
    icon: Lightbulb,
    iconClass: 'text-amber-500',
    labels: {
      en: 'Inspiration & Personality Development',
      hi: 'प्रेरणा एवं व्यक्तित्व विकास',
      mr: 'प्रेरणा आणि व्यक्तिमत्व विकास',
    },
  },
] as const;

export type BulletinCategoryId = (typeof BULLETIN_CATEGORIES)[number]['id'];

export const DEFAULT_BULLETIN_CATEGORY: BulletinCategoryId = 'news-announcements';

const CATEGORY_BY_ID = new Map(BULLETIN_CATEGORIES.map((item) => [item.id, item]));

const LEGACY_CATEGORY_MAP: Record<string, BulletinCategoryId> = {
  announcement: 'news-announcements',
  scholarship: 'education-career',
  'blood-camp': 'health-social-service',
  meeting: 'events-programs',
  event: 'events-programs',
  festival: 'society-culture',
};

type FullLang = 'en' | 'hi' | 'mr';

function resolveLang(language: Language): FullLang {
  if (language === 'en' || language === 'hi' || language === 'mr') return language;
  return 'hi';
}

export function normalizeBulletinCategory(category: string): BulletinCategoryId {
  if (CATEGORY_BY_ID.has(category as BulletinCategoryId)) {
    return category as BulletinCategoryId;
  }
  return LEGACY_CATEGORY_MAP[category] ?? DEFAULT_BULLETIN_CATEGORY;
}

export function getBulletinCategoryDefinition(category: string) {
  return CATEGORY_BY_ID.get(normalizeBulletinCategory(category));
}

export function getBulletinCategoryLabel(category: string, language: Language): string {
  const def = getBulletinCategoryDefinition(category);
  if (!def) return category;
  return def.labels[resolveLang(language)];
}

export function getBulletinCategoryIcon(category: string): LucideIcon {
  return getBulletinCategoryDefinition(category)?.icon ?? Bell;
}

export function getBulletinCategoryIconClass(category: string): string {
  return getBulletinCategoryDefinition(category)?.iconClass ?? 'text-slate-500';
}

export function isBulletinCategoryId(value: string): value is BulletinCategoryId {
  return CATEGORY_BY_ID.has(value as BulletinCategoryId);
}
