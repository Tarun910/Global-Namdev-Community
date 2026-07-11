import bcrypt from 'bcryptjs';
import { getSupabaseClient } from '../client';
import { AdminDirectoryEntry } from '../../adminAuth';

interface RpcResult {
  ok: boolean;
  error?: string;
}

interface AdminUserRow {
  id: string;
  username: string;
  is_super_admin: boolean;
  created_at: string;
  password_hash?: string;
}

function isCryptRpcError(message: string): boolean {
  return message.includes('crypt') || message.includes('gen_salt');
}

async function verifyAdminLoginFallback(
  username: string,
  password: string
): Promise<{ id: string; username: string; isSuperAdmin: boolean } | null> {
  const { data, error } = await getSupabaseClient()
    .from('admin_users')
    .select('id, username, is_super_admin, password_hash')
    .ilike('username', username.trim())
    .maybeSingle();

  if (error || !data?.password_hash) return null;

  const matches = bcrypt.compareSync(password.trim(), data.password_hash);
  if (!matches) return null;

  return {
    id: data.id,
    username: data.username,
    isSuperAdmin: data.is_super_admin,
  };
}

export async function verifyAdminLogin(
  username: string,
  password: string
): Promise<{ id: string; username: string; isSuperAdmin: boolean } | null> {
  const { data, error } = await getSupabaseClient().rpc('verify_admin_login', {
    p_username: username,
    p_password: password,
  });

  if (error) {
    if (isCryptRpcError(error.message)) {
      return verifyAdminLoginFallback(username, password);
    }
    throw error;
  }

  const rows = data as { id: string; username: string; is_super_admin: boolean }[] | null;
  const match = rows?.[0];
  if (!match) return null;

  return {
    id: match.id,
    username: match.username,
    isSuperAdmin: match.is_super_admin,
  };
}

export async function fetchAdminDirectory(): Promise<AdminDirectoryEntry[]> {
  const { data, error } = await getSupabaseClient()
    .from('admin_users')
    .select('id, username, is_super_admin, created_at')
    .order('created_at', { ascending: true });

  if (error) throw error;

  return (data as AdminUserRow[]).map((row) => ({
    id: row.id,
    username: row.username,
    isSuperAdmin: row.is_super_admin,
    createdAt: row.created_at,
  }));
}

export async function createAdminAccount(
  requesterUsername: string,
  newUsername: string,
  newPassword: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data, error } = await getSupabaseClient().rpc('create_admin_account', {
    p_requester_username: requesterUsername,
    p_new_username: newUsername,
    p_new_password: newPassword,
  });

  if (error) {
    if (!isCryptRpcError(error.message)) throw error;

    const requester = await getSupabaseClient()
      .from('admin_users')
      .select('username, is_super_admin')
      .ilike('username', requesterUsername.trim())
      .maybeSingle();

    if (!requester.data?.is_super_admin) {
      return { ok: false, error: 'Only the super admin can add other admins.' };
    }

    const trimmedUsername = newUsername.trim();
    const trimmedPassword = newPassword.trim();

    if (trimmedUsername.length < 3) {
      return { ok: false, error: 'Username must be at least 3 characters.' };
    }
    if (trimmedPassword.length < 6) {
      return { ok: false, error: 'Password must be at least 6 characters.' };
    }

    const { error: insertError } = await getSupabaseClient().from('admin_users').insert({
      username: trimmedUsername,
      password_hash: bcrypt.hashSync(trimmedPassword, 10),
      is_super_admin: false,
      created_by: requester.data.username,
    });

    if (insertError) {
      return { ok: false, error: insertError.message };
    }

    return { ok: true };
  }

  const result = data as RpcResult;
  if (!result.ok) {
    return { ok: false, error: result.error ?? 'Failed to create admin account.' };
  }

  return { ok: true };
}

export async function removeAdminAccount(
  requesterUsername: string,
  adminId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data, error } = await getSupabaseClient().rpc('remove_admin_account', {
    p_requester_username: requesterUsername,
    p_admin_id: adminId,
  });

  if (error) {
    if (!isCryptRpcError(error.message)) throw error;

    const requester = await getSupabaseClient()
      .from('admin_users')
      .select('is_super_admin')
      .ilike('username', requesterUsername.trim())
      .maybeSingle();

    if (!requester.data?.is_super_admin) {
      return { ok: false, error: 'Only the super admin can remove other admins.' };
    }

    const target = await getSupabaseClient()
      .from('admin_users')
      .select('is_super_admin')
      .eq('id', adminId)
      .maybeSingle();

    if (!target.data) {
      return { ok: false, error: 'Admin account not found.' };
    }
    if (target.data.is_super_admin) {
      return { ok: false, error: 'The super admin account cannot be removed.' };
    }

    const { error: deleteError } = await getSupabaseClient()
      .from('admin_users')
      .delete()
      .eq('id', adminId);

    if (deleteError) {
      return { ok: false, error: deleteError.message };
    }

    return { ok: true };
  }

  const result = data as RpcResult;
  if (!result.ok) {
    return { ok: false, error: result.error ?? 'Failed to remove admin account.' };
  }

  return { ok: true };
}
