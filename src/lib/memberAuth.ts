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
  if (usingSupabase) {
    return membersRepo.memberHasPassword(member.id);
  }
  return memberHasLocalPassword(member.id);
}

export async function setMemberPasswordAfterRegister(
  member: Registration,
  password: string,
  usingSupabase = isSupabaseConfigured(),
): Promise<boolean> {
  const dialCode = member.mobileCountryCode ?? '+91';
  if (usingSupabase) {
    return membersRepo.setMemberPasswordOnRegister(
      member.id,
      dialCode,
      member.mobileNumber,
      password,
    );
  }

  await setLocalMemberPassword(member.id, password);
  return true;
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

  if (usingSupabase) {
    const loginId = isCommunityIdIdentifier(identifier)
      ? identifier.trim()
      : normalizeMobile(identifier);
    const loginDial = isCommunityIdIdentifier(identifier) ? '+91' : dialCode;
    const verified = await membersRepo.verifyMemberLogin(loginId, password, loginDial);
    if (!verified || verified.member_id !== member.id) return null;
    return { member };
  }

  const passwordOk = await verifyLocalMemberPassword(member.id, password);
  if (!passwordOk) return null;
  return { member };
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

  if (usingSupabase) {
    return membersRepo.resetMemberPassword({
      dialCode: params.dialCode,
      mobile: params.mobile,
      dobOrAge: params.dobOrAge,
      fathersName: params.fathersName,
      communityId: params.communityId,
      newPassword: params.newPassword,
    });
  }

  await setLocalMemberPassword(member.id, params.newPassword);
  return true;
}
