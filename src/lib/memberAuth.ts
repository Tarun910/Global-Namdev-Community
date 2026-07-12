import { Registration } from '../types';
import { findRegistrationByMobile, normalizeMobile } from './demoAuth';
import { isSupabaseConfigured } from './supabase/client';
import * as membersRepo from './supabase/repositories/members';
import {
  memberHasLocalPassword,
  setLocalMemberPassword,
  verifyLocalMemberPassword,
} from './memberPasswordStore';

export interface MemberLoginResult {
  member: Registration;
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

export function isCommunityIdIdentifier(value: string): boolean {
  return /^GNC-/i.test(value.trim());
}

export function findRegistrationByIdentifier(
  registrations: Registration[],
  identifier: string,
  dialCode = '+91',
): Registration | undefined {
  const trimmed = identifier.trim();
  if (isCommunityIdIdentifier(trimmed)) {
    return registrations.find(
      (registration) => registration.communityId.toUpperCase() === trimmed.toUpperCase(),
    );
  }

  return findRegistrationByMobile(registrations, dialCode, trimmed);
}

export async function memberHasPassword(
  member: Registration,
  usingSupabase = isSupabaseConfigured(),
): Promise<boolean> {
  if (memberHasLocalPassword(member.id)) return true;

  if (usingSupabase) {
    return membersRepo.memberHasPassword(member.id);
  }

  return false;
}

export async function setMemberPasswordAfterRegister(
  member: Registration,
  password: string,
  usingSupabase = isSupabaseConfigured(),
): Promise<boolean> {
  const trimmedPassword = password.trim();
  if (trimmedPassword.length < 6) return false;

  await setLocalMemberPassword(member.id, trimmedPassword);

  if (!usingSupabase) return true;

  const dialCode = member.mobileCountryCode ?? '+91';
  const mobile = normalizeMobile(member.mobileNumber);

  let savedToSupabase = false;
  try {
    savedToSupabase = await membersRepo.setMemberPasswordOnRegister(
      member.id,
      dialCode,
      mobile,
      trimmedPassword,
    );
  } catch {
    savedToSupabase = false;
  }

  if (!savedToSupabase) {
    try {
      savedToSupabase = await membersRepo.setMemberPasswordDirect(member.id, trimmedPassword);
    } catch {
      savedToSupabase = false;
    }
  }

  return savedToSupabase || memberHasLocalPassword(member.id);
}

async function verifySupabaseMemberPassword(
  member: Registration,
  identifier: string,
  password: string,
  dialCode: string,
): Promise<boolean> {
  const loginId = isCommunityIdIdentifier(identifier)
    ? identifier.trim()
    : normalizeMobile(identifier);
  const loginDial = isCommunityIdIdentifier(identifier) ? '+91' : dialCode;

  try {
    const verified = await membersRepo.verifyMemberLogin(loginId, password, loginDial);
    if (verified?.member_id === member.id) return true;
  } catch {
    // RPC may be missing if migration 003 was not applied yet.
  }

  try {
    return await membersRepo.verifyMemberPasswordDirect(member.id, password);
  } catch {
    return false;
  }
}

export async function authenticateMemberWithPassword(
  registrations: Registration[],
  identifier: string,
  password: string,
  dialCode = '+91',
  usingSupabase = isSupabaseConfigured(),
): Promise<MemberLoginResult | null> {
  const member = findRegistrationByIdentifier(registrations, identifier, dialCode);
  if (!member) return null;

  const trimmedPassword = password.trim();
  if (trimmedPassword.length < 6) return null;

  if (usingSupabase) {
    const supabaseOk = await verifySupabaseMemberPassword(
      member,
      identifier,
      trimmedPassword,
      dialCode,
    );
    if (supabaseOk) return { member };
  }

  const localOk = await verifyLocalMemberPassword(member.id, trimmedPassword);
  if (localOk) return { member };

  return null;
}

export async function resetMemberPassword(
  registrations: Registration[],
  params: {
    dialCode: string;
    mobile: string;
    dobOrAge: string;
    fathersName: string;
    communityId: string;
    newPassword: string;
  },
  usingSupabase = isSupabaseConfigured(),
): Promise<boolean> {
  const member = findRegistrationByMobile(registrations, params.dialCode, params.mobile);
  if (!member) return false;

  const dobMatch = normalizeText(member.dobOrAge) === normalizeText(params.dobOrAge);
  const fatherMatch = normalizeText(member.fathersName) === normalizeText(params.fathersName);
  const idMatch =
    !params.communityId.trim() ||
    member.communityId.toUpperCase() === params.communityId.trim().toUpperCase();

  if (!dobMatch || !fatherMatch || !idMatch) return false;

  const trimmedPassword = params.newPassword.trim();
  if (trimmedPassword.length < 6) return false;

  await setLocalMemberPassword(member.id, trimmedPassword);

  if (usingSupabase) {
    let ok = false;
    try {
      ok = await membersRepo.resetMemberPassword({
        dialCode: params.dialCode,
        mobile: normalizeMobile(params.mobile),
        dobOrAge: params.dobOrAge,
        fathersName: params.fathersName,
        communityId: params.communityId,
        newPassword: trimmedPassword,
      });
    } catch {
      ok = false;
    }

    if (!ok) {
      try {
        ok = await membersRepo.setMemberPasswordDirect(member.id, trimmedPassword);
      } catch {
        ok = false;
      }
    }

    return ok || memberHasLocalPassword(member.id);
  }

  return true;
}
