import { useCallback, useEffect, useState } from 'react';
import {
  INITIAL_DISCUSSIONS,
  INITIAL_REGISTRATIONS,
  INITIAL_UPDATES,
  loadCommunityUpdates,
} from '../data';
import { CommunityUpdate, ForumDiscussion, Registration } from '../types';
import { isSupabaseConfigured } from '../lib/supabase/client';
import {
  applyBulletinReadState,
  markAllBulletinsRead,
  markBulletinRead,
} from '../lib/supabase/localPrefs';
import * as membersRepo from '../lib/supabase/repositories/members';
import * as updatesRepo from '../lib/supabase/repositories/updates';
import * as forumRepo from '../lib/supabase/repositories/forum';

function loadLocalRegistrations(): Registration[] {
  try {
    const saved = localStorage.getItem('gnc_registrations');
    return saved ? (JSON.parse(saved) as Registration[]) : INITIAL_REGISTRATIONS;
  } catch {
    return INITIAL_REGISTRATIONS;
  }
}

async function seedSupabaseIfEmpty(): Promise<void> {
  const [memberCount, updateCount, forumCount] = await Promise.all([
    membersRepo.countMembers(),
    updatesRepo.countUpdates(),
    forumRepo.countDiscussions(),
  ]);

  const tasks: Promise<void>[] = [];
  if (memberCount === 0) tasks.push(membersRepo.seedMembers(INITIAL_REGISTRATIONS));
  if (updateCount === 0) tasks.push(updatesRepo.seedUpdates(INITIAL_UPDATES));
  if (forumCount === 0) tasks.push(forumRepo.seedForum(INITIAL_DISCUSSIONS));

  if (tasks.length > 0) {
    await Promise.all(tasks);
  }
}

export interface UseCommunityDataResult {
  registrations: Registration[];
  updates: CommunityUpdate[];
  discussions: ForumDiscussion[];
  loading: boolean;
  error: string | null;
  usingSupabase: boolean;
  handlePublishUpdate: (newUpdate: CommunityUpdate) => Promise<void>;
  handleDeleteUpdate: (id: string) => Promise<void>;
  handleUpdateUpdate: (updated: CommunityUpdate) => Promise<void>;
  handleMarkRead: (id: string) => void;
  handleMarkAllUpdatesRead: () => void;
  handleRegisterSubmit: (newReg: Registration) => Promise<void>;
  handleDeleteRegistration: (id: string) => Promise<void>;
  handleUpdateRegistration: (updated: Registration) => Promise<void>;
  handleAddDiscussion: (title: string, content: string, category: string) => Promise<void>;
  handleAddComment: (discussionId: string, text: string) => Promise<void>;
  handleLikeDiscussion: (discussionId: string) => Promise<void>;
  refreshData: () => Promise<void>;
}

export function useCommunityData(): UseCommunityDataResult {
  const usingSupabase = isSupabaseConfigured();

  const [registrations, setRegistrations] = useState<Registration[]>(() =>
    usingSupabase ? [] : loadLocalRegistrations()
  );
  const [updates, setUpdates] = useState<CommunityUpdate[]>(() =>
    usingSupabase ? [] : loadCommunityUpdates()
  );
  const [discussions, setDiscussions] = useState<ForumDiscussion[]>(() =>
    usingSupabase ? [] : INITIAL_DISCUSSIONS
  );
  const [loading, setLoading] = useState(usingSupabase);
  const [error, setError] = useState<string | null>(null);

  const refreshData = useCallback(async () => {
    if (!usingSupabase) return;

    setLoading(true);
    setError(null);

    try {
      await seedSupabaseIfEmpty();

      const [members, communityUpdates, forumDiscussions] = await Promise.all([
        membersRepo.fetchMembers(),
        updatesRepo.fetchUpdates(),
        forumRepo.fetchDiscussions(),
      ]);

      setRegistrations(members);
      setUpdates(applyBulletinReadState(communityUpdates));
      setDiscussions(forumDiscussions);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load community data.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [usingSupabase]);

  useEffect(() => {
    if (usingSupabase) {
      void refreshData();
    }
  }, [usingSupabase, refreshData]);

  useEffect(() => {
    if (!usingSupabase) {
      localStorage.setItem('gnc_registrations', JSON.stringify(registrations));
    }
  }, [registrations, usingSupabase]);

  useEffect(() => {
    if (!usingSupabase) {
      localStorage.setItem('gnc_updates', JSON.stringify(updates));
    }
  }, [updates, usingSupabase]);

  const handlePublishUpdate = useCallback(
    async (newUpdate: CommunityUpdate) => {
      const update = { ...newUpdate, isRead: false };

      if (usingSupabase) {
        const saved = await updatesRepo.insertUpdate(update);
        setUpdates((prev) => [{ ...saved, isRead: false }, ...prev]);
        return;
      }

      setUpdates((prev) => [update, ...prev]);
    },
    [usingSupabase]
  );

  const handleDeleteUpdate = useCallback(
    async (id: string) => {
      if (usingSupabase) {
        await updatesRepo.deleteUpdate(id);
      }
      setUpdates((prev) => prev.filter((update) => update.id !== id));
    },
    [usingSupabase]
  );

  const handleUpdateUpdate = useCallback(
    async (updated: CommunityUpdate) => {
      if (usingSupabase) {
        const saved = await updatesRepo.updateCommunityUpdate(updated);
        setUpdates((prev) =>
          prev.map((update) =>
            update.id === saved.id ? { ...saved, isRead: update.isRead } : update
          )
        );
        return;
      }

      setUpdates((prev) => prev.map((update) => (update.id === updated.id ? updated : update)));
    },
    [usingSupabase]
  );

  const handleMarkRead = useCallback((id: string) => {
    markBulletinRead(id);
    setUpdates((prev) => prev.map((update) => (update.id === id ? { ...update, isRead: true } : update)));
  }, []);

  const handleMarkAllUpdatesRead = useCallback(() => {
    setUpdates((prev) => {
      if (!prev.some((update) => !update.isRead)) return prev;
      markAllBulletinsRead(prev.map((update) => update.id));
      return prev.map((update) => ({ ...update, isRead: true }));
    });
  }, []);

  const handleRegisterSubmit = useCallback(
    async (newReg: Registration) => {
      if (usingSupabase) {
        const saved = await membersRepo.insertMember(newReg);
        setRegistrations((prev) => [saved, ...prev]);
      } else {
        setRegistrations((prev) => [newReg, ...prev]);
      }

      const notification: CommunityUpdate = {
        id: `reg-notif-${Date.now()}`,
        category: 'announcement',
        title: 'New Member Registered!',
        message: `Hearty welcome to ${newReg.fullName} from ${newReg.city}, ${newReg.state} as a verified member of the GNC member directory.`,
        time: 'Just now',
        isRead: false,
      };

      await handlePublishUpdate(notification);
    },
    [usingSupabase, handlePublishUpdate]
  );

  const handleDeleteRegistration = useCallback(
    async (id: string) => {
      if (usingSupabase) {
        await membersRepo.deleteMember(id);
      }
      setRegistrations((prev) => prev.filter((registration) => registration.id !== id));
    },
    [usingSupabase]
  );

  const handleUpdateRegistration = useCallback(
    async (updated: Registration) => {
      if (usingSupabase) {
        const saved = await membersRepo.updateMember(updated);
        setRegistrations((prev) =>
          prev.map((registration) => (registration.id === saved.id ? saved : registration))
        );
        return;
      }

      setRegistrations((prev) =>
        prev.map((registration) => (registration.id === updated.id ? updated : registration))
      );
    },
    [usingSupabase]
  );

  const handleAddDiscussion = useCallback(
    async (title: string, content: string, category: string) => {
      const newThread: ForumDiscussion = {
        id: `disc-${Date.now()}`,
        author: 'Member',
        authorRole: 'Verified Resident',
        title,
        content,
        time: 'Just now',
        category,
        likes: 0,
        replies: [],
      };

      if (usingSupabase) {
        await forumRepo.insertDiscussion(newThread);
      }

      setDiscussions((prev) => [newThread, ...prev]);
    },
    [usingSupabase]
  );

  const handleAddComment = useCallback(
    async (discussionId: string, text: string) => {
      const comment = {
        id: `c-${Date.now()}`,
        author: 'Member',
        text,
        time: 'Just now',
      };

      if (usingSupabase) {
        await forumRepo.insertComment(discussionId, comment);
      }

      setDiscussions((prev) =>
        prev.map((discussion) => {
          if (discussion.id !== discussionId) return discussion;
          return {
            ...discussion,
            replies: [...discussion.replies, comment],
          };
        })
      );
    },
    [usingSupabase]
  );

  const handleLikeDiscussion = useCallback(
    async (discussionId: string) => {
      let nextHasLiked = false;
      let nextLikes = 0;

      setDiscussions((prev) =>
        prev.map((discussion) => {
          if (discussion.id !== discussionId) return discussion;
          nextHasLiked = !discussion.hasLiked;
          nextLikes = nextHasLiked ? discussion.likes + 1 : discussion.likes - 1;
          return {
            ...discussion,
            hasLiked: nextHasLiked,
            likes: nextLikes,
          };
        })
      );

      if (usingSupabase) {
        try {
          const likes = await forumRepo.toggleDiscussionLike(discussionId, !nextHasLiked);
          setDiscussions((prev) =>
            prev.map((discussion) =>
              discussion.id === discussionId
                ? { ...discussion, likes, hasLiked: nextHasLiked }
                : discussion
            )
          );
        } catch {
          setDiscussions((prev) =>
            prev.map((discussion) => {
              if (discussion.id !== discussionId) return discussion;
              return {
                ...discussion,
                hasLiked: !nextHasLiked,
                likes: discussion.hasLiked ? discussion.likes + 1 : discussion.likes - 1,
              };
            })
          );
        }
      }
    },
    [usingSupabase]
  );

  return {
    registrations,
    updates,
    discussions,
    loading,
    error,
    usingSupabase,
    handlePublishUpdate,
    handleDeleteUpdate,
    handleUpdateUpdate,
    handleMarkRead,
    handleMarkAllUpdatesRead,
    handleRegisterSubmit,
    handleDeleteRegistration,
    handleUpdateRegistration,
    handleAddDiscussion,
    handleAddComment,
    handleLikeDiscussion,
    refreshData,
  };
}
