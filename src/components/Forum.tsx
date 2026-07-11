import { useState, FormEvent } from 'react';
import { Heart, MessageSquare, Plus, User, ArrowLeft, Send, Sparkles, AlertCircle } from 'lucide-react';
import { ForumDiscussion } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Language } from '../lib/languages';
import { getTranslations, TranslationStrings } from '../lib/translations';

interface ForumProps {
  discussions: ForumDiscussion[];
  onAddDiscussion: (title: string, content: string, category: string) => void;
  onAddComment: (discussionId: string, text: string) => void;
  onLikeDiscussion: (discussionId: string) => void;
  userName: string;
  language: Language;
}

const FORUM_CATEGORIES = [
  { value: 'General', labelKey: 'forumCatGeneral' as const },
  { value: 'Heritage Preservation', labelKey: 'forumCatHeritage' as const },
  { value: 'Career Growth', labelKey: 'forumCatCareer' as const },
  { value: 'Events', labelKey: 'forumCatEvents' as const },
];

function categoryLabel(category: string, t: TranslationStrings) {
  const match = FORUM_CATEGORIES.find((item) => item.value === category);
  return match ? t[match.labelKey] : category;
}

export default function Forum({
  discussions,
  onAddDiscussion,
  onAddComment,
  onLikeDiscussion,
  userName,
  language,
}: ForumProps) {
  const t = getTranslations(language);
  const [activeDiscussionId, setActiveDiscussionId] = useState<string | null>(null);
  const [isCreatingThread, setIsCreatingThread] = useState(false);
  
  // New thread form states
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('General');

  // New comment text state
  const [commentText, setCommentText] = useState('');

  // Get active discussion
  const activeDiscussion = discussions.find(d => d.id === activeDiscussionId);

  // Handle Thread Submission
  const handleCreateThread = (e: FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    onAddDiscussion(newTitle, newContent, newCategory);
    
    // Reset and close
    setNewTitle('');
    setNewContent('');
    setNewCategory('General');
    setIsCreatingThread(false);
  };

  // Handle Comment Submission
  const handleCreateComment = (e: FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !activeDiscussionId) return;

    onAddComment(activeDiscussionId, commentText);
    setCommentText('');
  };

  return (
    <div className="space-y-8">
      {/* Back button and page header if viewing thread */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/60 pb-4">
        {activeDiscussionId ? (
          <button
            onClick={() => setActiveDiscussionId(null)}
            className="flex items-center gap-2 text-primary font-geist text-sm font-semibold hover:opacity-80 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            {t.forumBackToList}
          </button>
        ) : (
          <div className="space-y-1">
            <h3 className="font-sans text-2xl font-bold text-slate-900">
              {t.forumTitle}
            </h3>
            <p className="font-sans text-xs text-slate-600">
              {t.forumSub}
            </p>
          </div>
        )}

        {!activeDiscussionId && !isCreatingThread && (
          <button
            onClick={() => setIsCreatingThread(true)}
            className="px-4 py-2 bg-primary text-white font-geist text-xs font-bold rounded-lg shadow-sm hover:opacity-90 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            {t.forumNewDiscussion}
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {/* VIEW 1: Creating New Thread */}
        {isCreatingThread ? (
          <motion.div
            key="create-thread"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="glass-card p-6 space-y-4 shadow-sm border border-slate-200/60"
          >
            <div className="flex items-center justify-between">
              <h4 className="font-sans text-base font-bold text-slate-900 flex items-center gap-1.5">
                <Sparkles className="text-primary w-4 h-4" />
                {t.forumStartThread}
              </h4>
              <button
                type="button"
                onClick={() => setIsCreatingThread(false)}
                className="text-xs text-slate-500 hover:text-slate-700 font-semibold cursor-pointer"
              >
                {t.forumCancel}
              </button>
            </div>

            <form onSubmit={handleCreateThread} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {t.forumCategoryLabel}
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer shadow-sm"
                >
                  {FORUM_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {t[cat.labelKey]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {t.forumThreadTitle}
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder={t.forumThreadTitlePh}
                  required
                  className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-slate-400 shadow-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {t.forumYourMessage}
                </label>
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder={t.forumMessagePh}
                  required
                  rows={5}
                  className="w-full bg-white border border-slate-200 rounded-lg p-3 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary resize-none placeholder:text-slate-400 shadow-sm"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingThread(false)}
                  className="px-4 py-2 bg-slate-50 border border-slate-200 text-slate-700 rounded-lg font-geist text-xs font-semibold hover:bg-slate-100 transition-all cursor-pointer"
                >
                  {t.forumBack}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary text-white rounded-lg font-geist text-xs font-bold hover:opacity-90 transition-all cursor-pointer"
                >
                  {t.forumPostDiscussion}
                </button>
              </div>
            </form>
          </motion.div>
        ) : activeDiscussion ? (
          /* VIEW 2: Active Discussion Detail & Comment List */
          <motion.div
            key="thread-detail"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Primary Thread Post */}
            <div className="glass-card p-6 space-y-4 shadow-sm border border-slate-200/60">
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xs">
                    {activeDiscussion.author[0].toUpperCase()}
                  </div>
                  <div>
                    <span className="font-bold text-slate-800">{activeDiscussion.author}</span>
                    {activeDiscussion.authorRole && (
                      <span className="text-slate-500 block text-[10px]">{activeDiscussion.authorRole}</span>
                    )}
                  </div>
                </div>
                <span className="text-slate-400 font-medium">{activeDiscussion.time}</span>
              </div>

              <div className="space-y-2">
                <span className="px-2.5 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded uppercase tracking-wider">
                  {categoryLabel(activeDiscussion.category, t)}
                </span>
                <h4 className="font-sans text-lg font-bold text-slate-900 leading-snug">
                  {activeDiscussion.title}
                </h4>
                <p className="font-sans text-xs text-slate-600 leading-relaxed">
                  {activeDiscussion.content}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-150 flex items-center gap-4">
                <button
                  onClick={() => onLikeDiscussion(activeDiscussion.id)}
                  className={`flex items-center gap-1.5 text-xs font-medium cursor-pointer transition-colors ${
                    activeDiscussion.hasLiked 
                      ? 'text-primary font-bold' 
                      : 'text-slate-500 hover:text-primary'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${activeDiscussion.hasLiked ? 'fill-primary text-primary' : ''}`} />
                  <span>{activeDiscussion.likes} {t.forumLikes}</span>
                </button>
                <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                  <MessageSquare className="w-4 h-4" />
                  <span>{activeDiscussion.replies.length} {t.forumComments}</span>
                </span>
              </div>
            </div>

            {/* Comment Feed */}
            <div className="space-y-3">
              <h5 className="font-sans text-xs font-bold text-slate-800 uppercase tracking-wider">
                {t.forumResponses} ({activeDiscussion.replies.length})
              </h5>

              {activeDiscussion.replies.length > 0 ? (
                <div className="space-y-3 pl-4 border-l-2 border-slate-200">
                  {activeDiscussion.replies.map((reply) => (
                    <div key={reply.id} className="bg-slate-50/50 border border-slate-200/60 rounded-xl p-4 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white font-bold text-[10px]">
                            {reply.author[0].toUpperCase()}
                          </div>
                          <span className="font-bold text-slate-800">{reply.author}</span>
                        </div>
                        <span className="text-slate-400">{reply.time}</span>
                      </div>
                      <p className="font-sans text-xs text-slate-600 leading-relaxed">
                        {reply.text}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-slate-50/50 border border-dashed border-slate-200 rounded-xl">
                  <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="font-sans text-xs text-slate-500 font-medium">{t.forumNoComments}</p>
                </div>
              )}
            </div>

            {/* Post comment input */}
            <form onSubmit={handleCreateComment} className="glass-card p-4 flex gap-3 shadow-sm border border-slate-200/60">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xs shrink-0 select-none">
                {userName[0].toUpperCase()}
              </div>
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={t.forumCommentPh}
                  required
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-slate-400 shadow-sm"
                />
                <button
                  type="submit"
                  className="p-2 bg-primary text-white rounded-lg hover:opacity-90 active:scale-95 transition-all cursor-pointer animate-none"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </motion.div>
        ) : (
          /* VIEW 3: List of All Threads */
          <motion.div
            key="threads-list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {discussions.map((discussion) => (
              <div
                key={discussion.id}
                onClick={() => setActiveDiscussionId(discussion.id)}
                className="glass-card p-5 hover:bg-white border border-slate-200/60 hover:border-primary/20 rounded-2xl hover:shadow-md transition-all cursor-pointer group space-y-3"
              >
                <div className="flex justify-between items-start text-xs">
                  <span className="px-2 py-0.5 bg-slate-50 text-slate-600 text-[9px] font-bold rounded uppercase tracking-wider border border-slate-200/85 shadow-sm">
                    {categoryLabel(discussion.category, t)}
                  </span>
                  <span className="text-slate-400 font-medium">{discussion.time}</span>
                </div>

                <div className="space-y-1">
                  <h4 className="font-sans text-base font-bold text-slate-900 group-hover:text-primary transition-colors leading-snug">
                    {discussion.title}
                  </h4>
                  <p className="font-sans text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {discussion.content}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-150 flex justify-between items-center text-xs text-slate-500 font-medium">
                  <div className="flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-white font-bold text-[9px] shrink-0">
                      {discussion.author[0].toUpperCase()}
                    </span>
                    <span>{t.forumStartedBy} <strong className="text-slate-800 font-semibold">{discussion.author}</strong></span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Heart className={`w-3.5 h-3.5 ${discussion.hasLiked ? 'fill-primary text-primary' : ''}`} />
                      {discussion.likes}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5" />
                      {discussion.replies.length}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
