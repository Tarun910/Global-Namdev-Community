import { getBulletinCategoryIcon, getBulletinCategoryIconClass, getBulletinCategoryLabel } from '../lib/bulletinCategories';
import { Language } from '../lib/languages';

interface BulletinCategoryBadgeProps {
  category: string;
  language: Language;
  iconSize?: string;
  labelClassName?: string;
  showLabel?: boolean;
}

export function BulletinCategoryIcon({
  category,
  iconSize = 'w-4 h-4',
}: Pick<BulletinCategoryBadgeProps, 'category' | 'iconSize'>) {
  const Icon = getBulletinCategoryIcon(category);
  return <Icon className={`${iconSize} ${getBulletinCategoryIconClass(category)}`} />;
}

export default function BulletinCategoryBadge({
  category,
  language,
  iconSize = 'w-4 h-4',
  labelClassName = '',
  showLabel = true,
}: BulletinCategoryBadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${labelClassName}`}>
      <BulletinCategoryIcon category={category} iconSize={iconSize} />
      {showLabel && (
        <span>{getBulletinCategoryLabel(category, language)}</span>
      )}
    </span>
  );
}
