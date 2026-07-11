import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CommunityUpdate } from '../types';
import {
  Search, Bell, Calendar, Award, Gift, Heart, Users, Megaphone, CheckCircle2, ArrowRight,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import { Language } from '../lib/languages';
import { getTranslations } from '../lib/translations';
import { bulletinNeedsReadMore, bulletinPreviewText } from '../lib/bulletinPreview';

const BULLETINS_PER_PAGE = 5;

interface UpdatesTabProps {
  updates: CommunityUpdate[];
  language: Language;
  onOpenBulletin: (id: string) => void;
}

export default function UpdatesTab({ updates, language, onOpenBulletin }: UpdatesTabProps) {
  const t = getTranslations(language);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const filters = [
    { label: t.updatesFilterAll, value: 'all' },
    { label: t.updatesFilterAnnounce, value: 'announcement' },
    { label: t.updatesFilterScholar, value: 'scholarship' },
    { label: t.updatesFilterEvents, value: 'meeting' },
    { label: t.updatesFilterBlood, value: 'blood-camp' },
    { label: t.updatesFilterFestival, value: 'festival' },
  ];

  const renderCategoryIcon = (category: string) => {
    switch (category) {
      case 'announcement':
        return <Megaphone className="w-4 h-4 text-primary" />;
      case 'scholarship':
        return <Award className="w-4 h-4 text-indigo-600" />;
      case 'meeting':
      case 'event':
        return <Users className="w-4 h-4 text-emerald-600" />;
      case 'blood-camp':
        return <Heart className="w-4 h-4 text-red-500" />;
      case 'festival':
        return <Gift className="w-4 h-4 text-amber-500" />;
      default:
        return <Bell className="w-4 h-4 text-slate-500" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'announcement': return t.updatesCatAnnouncement;
      case 'scholarship': return t.updatesCatScholarship;
      case 'meeting': return t.updatesCatMeeting;
      case 'blood-camp': return t.updatesCatBlood;
      case 'festival': return t.updatesCatFestival;
      default: return t.updatesCatGeneral;
    }
  };

  const filteredUpdates = useMemo(() => {
    return updates.filter((update) => {
      const matchesSearch =
        update.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        update.message.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesFilter =
        selectedFilter === 'all' ||
        update.category === selectedFilter ||
        (selectedFilter === 'meeting' && update.category === 'event');

      return matchesSearch && matchesFilter;
    });
  }, [updates, searchTerm, selectedFilter]);

  const showFeaturedBanner = searchTerm === '' && selectedFilter === 'all';
  const featuredUpdate = showFeaturedBanner ? updates[0] : null;

  const boardUpdates = useMemo(() => {
    if (!showFeaturedBanner || !featuredUpdate) return filteredUpdates;
    return filteredUpdates.filter((update) => update.id !== featuredUpdate.id);
  }, [filteredUpdates, showFeaturedBanner, featuredUpdate]);

  const totalPages = Math.max(1, Math.ceil(boardUpdates.length / BULLETINS_PER_PAGE));

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedBoardUpdates = useMemo(() => {
    const start = (currentPage - 1) * BULLETINS_PER_PAGE;
    return boardUpdates.slice(start, start + BULLETINS_PER_PAGE);
  }, [boardUpdates, currentPage]);

  const rangeStart = boardUpdates.length === 0 ? 0 : (currentPage - 1) * BULLETINS_PER_PAGE + 1;
  const rangeEnd = Math.min(currentPage * BULLETINS_PER_PAGE, boardUpdates.length);

  const goToPage = (page: number) => {
    const nextPage = Math.min(Math.max(page, 1), totalPages);
    setCurrentPage(nextPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-8 py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-6">
        <div className="relative w-full md:max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t.updatesSearchPh}
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-slate-400 shadow-sm transition-all"
          />
        </div>

        <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
          {filters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setSelectedFilter(filter.value)}
              className={`px-3.5 py-1.5 rounded-full font-geist text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedFilter === filter.value
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {showFeaturedBanner && featuredUpdate && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm hover:shadow-md transition-all p-6 md:p-8 grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch min-h-[220px]"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full pointer-events-none" />

          <div className="md:col-span-8 flex flex-col space-y-4 min-h-0">
            <span className="px-3 py-1 bg-orange-50 text-primary font-geist text-[10px] font-bold tracking-wider uppercase rounded-full border border-orange-100 w-fit">
              {t.updatesLatestBulletin}
            </span>
            <h2 className="font-sans text-xl md:text-2xl font-bold text-slate-950 leading-tight line-clamp-2">
              {featuredUpdate.title}
            </h2>
            <p className="text-slate-600 font-sans text-xs leading-relaxed max-w-2xl line-clamp-4">
              {bulletinPreviewText(featuredUpdate.message)}
            </p>
            {featuredUpdate.imageUrl && (
              <div className="w-full max-w-md h-44 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden">
                <img
                  src={featuredUpdate.imageUrl}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="max-w-full max-h-full w-auto h-auto object-contain"
                />
              </div>
            )}
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
              <Calendar className="w-3.5 h-3.5" />
              <span>{t.updatesPublishedOn} {featuredUpdate.time}</span>
            </div>
            {bulletinNeedsReadMore(featuredUpdate.message) && (
              <button
                type="button"
                onClick={() => onOpenBulletin(featuredUpdate.id)}
                className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-orange-600 transition-colors cursor-pointer w-fit"
              >
                {t.updatesReadMore}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="md:col-span-4 flex justify-end items-start">
            <div className="w-full md:w-auto p-4 bg-slate-50 rounded-2xl border border-slate-200/60 text-center md:text-right space-y-1">
              <p className="text-[10px] font-geist text-slate-400 font-bold uppercase tracking-wider">{t.updatesStatusLabel}</p>
              <span className="inline-flex items-center gap-1 text-emerald-600 font-geist text-xs font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {t.updatesVerifiedCircular}
              </span>
            </div>
          </div>
        </motion.div>
      )}

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 border-b border-slate-100 pb-2">
          <h3 className="font-sans text-lg font-bold text-slate-950">
            {t.updatesBoardTitle}
          </h3>
          {boardUpdates.length > 0 && (
            <p className="text-[10px] text-slate-400 font-medium">
              {t.updatesShowingRange
                .replace('{start}', String(rangeStart))
                .replace('{end}', String(rangeEnd))
                .replace('{total}', String(boardUpdates.length))}
            </p>
          )}
        </div>

        <AnimatePresence mode="popLayout">
          {boardUpdates.length > 0 ? (
            <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
              {paginatedBoardUpdates.map((update) => {
                const hasImage = Boolean(update.imageUrl);
                const showReadMore = bulletinNeedsReadMore(update.message);

                return (
                <motion.div
                  key={update.id}
                  layout
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col w-full h-[300px]"
                >
                  <div className="flex items-start gap-3 shrink-0">
                    <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                      {renderCategoryIcon(update.category)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <span className="px-2 py-0.5 bg-slate-50 border border-slate-200/50 text-slate-500 text-[9px] font-bold rounded uppercase tracking-wider">
                          {getCategoryLabel(update.category)}
                        </span>
                        <span className="text-slate-400 font-geist text-[10px] shrink-0">
                          {update.time}
                        </span>
                      </div>
                      <h4 className="font-sans text-sm font-bold text-slate-950 line-clamp-2 mt-1.5 leading-snug min-h-[2.5rem]">
                        {update.title}
                      </h4>
                    </div>
                  </div>

                  {hasImage && (
                    <div className="w-full h-28 mt-3 shrink-0 rounded-xl border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center">
                      <img
                        src={update.imageUrl}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}

                  <p className="text-slate-600 font-sans text-xs leading-relaxed line-clamp-3 mt-3 flex-1 min-h-0">
                    {bulletinPreviewText(update.message)}
                  </p>

                  <div className="shrink-0 h-7 mt-1 flex items-center">
                    {showReadMore && (
                      <button
                        type="button"
                        onClick={() => onOpenBulletin(update.id)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:text-orange-600 transition-colors cursor-pointer"
                      >
                        {t.updatesReadMore}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </motion.div>
              );
              })}
            </div>

            {totalPages > 1 && (
              <nav
                className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2"
                aria-label="Bulletin pagination"
              >
                <p className="text-[10px] text-slate-400 font-medium order-2 sm:order-1">
                  {t.updatesPageOf
                    .replace('{current}', String(currentPage))
                    .replace('{total}', String(totalPages))}
                </p>

                <div className="flex items-center gap-1.5 order-1 sm:order-2">
                  <button
                    type="button"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    {t.updatesPrevPage}
                  </button>

                  <div className="hidden sm:flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                      <button
                        key={page}
                        type="button"
                        onClick={() => goToPage(page)}
                        className={`min-w-[2.25rem] h-9 px-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                          page === currentPage
                            ? 'bg-primary text-white shadow-sm'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                        aria-current={page === currentPage ? 'page' : undefined}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <span className="sm:hidden text-xs font-bold text-slate-500 px-2">
                    {currentPage} / {totalPages}
                  </span>

                  <button
                    type="button"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  >
                    {t.updatesNextPage}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </nav>
            )}
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-16 flex flex-col items-center text-center space-y-4 bg-slate-50 rounded-3xl border border-dashed border-slate-200"
            >
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                <Bell className="w-8 h-8 stroke-1" />
              </div>
              <div>
                <h4 className="font-sans text-base font-bold text-slate-900">{t.updatesNoResults}</h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">{t.updatesNoResultsSub}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
