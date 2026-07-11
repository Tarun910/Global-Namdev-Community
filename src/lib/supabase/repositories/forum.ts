import { ForumDiscussion } from '../../../types';
import { getSupabaseClient } from '../client';
import { getForumClientId } from '../localPrefs';
import {
  buildForumDiscussion,
  CommentRow,
  DiscussionRow,
} from '../mappers';

export async function fetchDiscussions(): Promise<ForumDiscussion[]> {
  const clientId = getForumClientId();
  const supabase = getSupabaseClient();

  const [discussionsResult, commentsResult, likesResult] = await Promise.all([
    supabase.from('forum_discussions').select('*').order('created_at', { ascending: false }),
    supabase.from('forum_comments').select('*').order('created_at', { ascending: true }),
    supabase.from('forum_likes').select('discussion_id').eq('client_id', clientId),
  ]);

  if (discussionsResult.error) throw discussionsResult.error;
  if (commentsResult.error) throw commentsResult.error;
  if (likesResult.error) throw likesResult.error;

  const likedIds = new Set(
    (likesResult.data ?? []).map((row) => row.discussion_id as string)
  );

  return (discussionsResult.data as DiscussionRow[]).map((row) =>
    buildForumDiscussion(row, commentsResult.data as CommentRow[], likedIds)
  );
}

export async function insertDiscussion(discussion: ForumDiscussion): Promise<ForumDiscussion> {
  const { error } = await getSupabaseClient().from('forum_discussions').insert({
    id: discussion.id,
    author: discussion.author,
    author_role: discussion.authorRole,
    title: discussion.title,
    content: discussion.content,
    time_label: discussion.time,
    category: discussion.category,
    likes_count: discussion.likes,
  });

  if (error) throw error;
  return discussion;
}

export async function insertComment(
  discussionId: string,
  comment: ForumDiscussion['replies'][number]
): Promise<void> {
  const { error } = await getSupabaseClient().from('forum_comments').insert({
    id: comment.id,
    discussion_id: discussionId,
    author: comment.author,
    text: comment.text,
    time_label: comment.time,
  });

  if (error) throw error;
}

export async function toggleDiscussionLike(
  discussionId: string,
  hasLiked: boolean
): Promise<number> {
  const clientId = getForumClientId();
  const supabase = getSupabaseClient();

  if (hasLiked) {
    const { error: deleteError } = await supabase
      .from('forum_likes')
      .delete()
      .eq('discussion_id', discussionId)
      .eq('client_id', clientId);

    if (deleteError) throw deleteError;
  } else {
    const { error: insertError } = await supabase.from('forum_likes').insert({
      discussion_id: discussionId,
      client_id: clientId,
    });

    if (insertError) throw insertError;
  }

  const { data: discussion, error: fetchError } = await supabase
    .from('forum_discussions')
    .select('likes_count')
    .eq('id', discussionId)
    .single();

  if (fetchError) throw fetchError;

  const nextLikes = hasLiked
    ? Math.max(0, (discussion.likes_count as number) - 1)
    : (discussion.likes_count as number) + 1;

  const { error: updateError } = await supabase
    .from('forum_discussions')
    .update({ likes_count: nextLikes })
    .eq('id', discussionId);

  if (updateError) throw updateError;

  return nextLikes;
}

export async function countDiscussions(): Promise<number> {
  const { count, error } = await getSupabaseClient()
    .from('forum_discussions')
    .select('*', { count: 'exact', head: true });

  if (error) throw error;
  return count ?? 0;
}

export async function seedForum(discussions: ForumDiscussion[]): Promise<void> {
  if (discussions.length === 0) return;
  const supabase = getSupabaseClient();

  const discussionRows = discussions.map((discussion) => ({
    id: discussion.id,
    author: discussion.author,
    author_role: discussion.authorRole,
    title: discussion.title,
    content: discussion.content,
    time_label: discussion.time,
    category: discussion.category,
    likes_count: discussion.likes,
  }));

  const { error: discussionError } = await supabase
    .from('forum_discussions')
    .insert(discussionRows);

  if (discussionError) throw discussionError;

  const commentRows = discussions.flatMap((discussion) =>
    discussion.replies.map((reply) => ({
      id: reply.id,
      discussion_id: discussion.id,
      author: reply.author,
      text: reply.text,
      time_label: reply.time,
    }))
  );

  if (commentRows.length > 0) {
    const { error: commentError } = await supabase.from('forum_comments').insert(commentRows);
    if (commentError) throw commentError;
  }
}
