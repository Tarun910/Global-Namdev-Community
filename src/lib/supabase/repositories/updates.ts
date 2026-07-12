import { CommunityUpdate } from '../../../types';
import { getSupabaseClient } from '../client';
import {
  communityUpdateToRow,
  updateRowToCommunityUpdate,
  UpdateRow,
} from '../mappers';

function sortUpdatesNewestFirst(updates: CommunityUpdate[]): CommunityUpdate[] {
  return [...updates].sort((left, right) => {
    const rightTime = Date.parse(right.time);
    const leftTime = Date.parse(left.time);
    const rightValue = Number.isNaN(rightTime) ? 0 : rightTime;
    const leftValue = Number.isNaN(leftTime) ? 0 : leftTime;
    return rightValue - leftValue;
  });
}

export async function fetchUpdates(): Promise<CommunityUpdate[]> {
  const { data, error } = await getSupabaseClient()
    .from('community_updates')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return sortUpdatesNewestFirst((data as UpdateRow[]).map(updateRowToCommunityUpdate));
}

export async function insertUpdate(update: CommunityUpdate): Promise<CommunityUpdate> {
  const row = communityUpdateToRow(update);
  const { data, error } = await getSupabaseClient()
    .from('community_updates')
    .insert(row)
    .select('*')
    .single();

  if (error) throw error;
  return updateRowToCommunityUpdate(data as UpdateRow);
}

export async function updateCommunityUpdate(update: CommunityUpdate): Promise<CommunityUpdate> {
  const row = communityUpdateToRow(update);
  const { data, error } = await getSupabaseClient()
    .from('community_updates')
    .update(row)
    .eq('id', update.id)
    .select('*')
    .single();

  if (error) throw error;
  return updateRowToCommunityUpdate(data as UpdateRow);
}

export async function deleteUpdate(id: string): Promise<void> {
  const { error } = await getSupabaseClient()
    .from('community_updates')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
