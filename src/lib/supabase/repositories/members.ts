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

export interface MemberLoginRow {
  member_id: string;
  community_id: string;
  full_name: string;
}

export async function verifyMemberLogin(
  identifier: string,
  password: string,
  dialCode: string,
): Promise<MemberLoginRow | null> {
  const { data, error } = await getSupabaseClient().rpc('verify_member_login', {
    p_identifier: identifier,
    p_password: password,
    p_dial_code: dialCode,
  });

  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return row ? (row as MemberLoginRow) : null;
}

export async function setMemberPasswordOnRegister(
  memberId: string,
  dialCode: string,
  mobile: string,
  password: string,
): Promise<boolean> {
  const { data, error } = await getSupabaseClient().rpc('set_member_password_on_register', {
    p_member_id: memberId,
    p_dial_code: dialCode,
    p_mobile: mobile,
    p_password: password,
  });

  if (error) throw error;
  return Boolean(data);
}

export async function resetMemberPassword(params: {
  dialCode: string;
  mobile: string;
  dobOrAge: string;
  fathersName: string;
  communityId: string;
  newPassword: string;
}): Promise<boolean> {
  const { data, error } = await getSupabaseClient().rpc('reset_member_password', {
    p_dial_code: params.dialCode,
    p_mobile: params.mobile,
    p_dob_or_age: params.dobOrAge,
    p_fathers_name: params.fathersName,
    p_community_id: params.communityId,
    p_new_password: params.newPassword,
  });

  if (error) throw error;
  return Boolean(data);
}

export async function memberHasPassword(memberId: string): Promise<boolean> {
  const { data, error } = await getSupabaseClient()
    .from('members')
    .select('id')
    .eq('id', memberId)
    .not('password_hash', 'is', null)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}
