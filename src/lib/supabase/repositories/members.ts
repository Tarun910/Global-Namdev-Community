import { Registration } from '../../../types';
import { getSupabaseClient } from '../client';
import { memberRowToRegistration, registrationToMemberRow, MemberRow } from '../mappers';

export async function fetchMembers(): Promise<Registration[]> {
  const { data, error } = await getSupabaseClient()
    .from('members')
    .select('*')
    .order('registration_date', { ascending: false });

  if (error) throw error;
  return (data as MemberRow[]).map(memberRowToRegistration);
}

export async function insertMember(registration: Registration): Promise<Registration> {
  const row = registrationToMemberRow(registration);
  const { data, error } = await getSupabaseClient()
    .from('members')
    .insert(row)
    .select('*')
    .single();

  if (error) throw error;
  return memberRowToRegistration(data as MemberRow);
}

export async function updateMember(registration: Registration): Promise<Registration> {
  const row = registrationToMemberRow(registration);
  const { data, error } = await getSupabaseClient()
    .from('members')
    .update({
      ...row,
      updated_at: new Date().toISOString(),
    })
    .eq('id', registration.id)
    .select('*')
    .single();

  if (error) throw error;
  return memberRowToRegistration(data as MemberRow);
}

export async function deleteMember(id: string): Promise<void> {
  const { error } = await getSupabaseClient().from('members').delete().eq('id', id);
  if (error) throw error;
}

export async function countMembers(): Promise<number> {
  const { count, error } = await getSupabaseClient()
    .from('members')
    .select('*', { count: 'exact', head: true });

  if (error) throw error;
  return count ?? 0;
}

export async function seedMembers(registrations: Registration[]): Promise<void> {
  if (registrations.length === 0) return;
  const rows = registrations.map(registrationToMemberRow);
  const { error } = await getSupabaseClient().from('members').insert(rows);
  if (error) throw error;
}
