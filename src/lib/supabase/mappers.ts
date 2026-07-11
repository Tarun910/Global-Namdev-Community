import {
  CommunityUpdate,
  DiscussionComment,
  ForumDiscussion,
  Registration,
} from '../../types';

export interface MemberRow {
  id: string;
  community_id: string;
  full_name: string;
  fathers_name: string;
  mothers_name: string | null;
  gender: Registration['gender'];
  dob_or_age: string;
  mobile_number: string;
  mobile_country_code: string | null;
  email: string | null;
  gotra: string | null;
  education: string;
  occupation: string;
  country: string;
  state: string;
  district: string;
  city: string;
  village: string | null;
  relationship: Registration['relationship'];
  registration_date: string;
  is_verified: boolean;
  photo_url: string | null;
}

export interface UpdateRow {
  id: string;
  category: CommunityUpdate['category'];
  title: string;
  message: string;
  time_label: string;
  is_important: boolean | null;
  image_url: string | null;
}

export interface DiscussionRow {
  id: string;
  author: string;
  author_role: string;
  title: string;
  content: string;
  time_label: string;
  category: string;
  likes_count: number;
}

export interface CommentRow {
  id: string;
  discussion_id: string;
  author: string;
  text: string;
  time_label: string;
}

export function memberRowToRegistration(row: MemberRow): Registration {
  return {
    id: row.id,
    communityId: row.community_id,
    fullName: row.full_name,
    fathersName: row.fathers_name,
    mothersName: row.mothers_name ?? undefined,
    gender: row.gender,
    dobOrAge: row.dob_or_age,
    mobileNumber: row.mobile_number,
    mobileCountryCode: row.mobile_country_code ?? undefined,
    email: row.email ?? undefined,
    gotra: row.gotra ?? undefined,
    education: row.education,
    occupation: row.occupation,
    country: row.country,
    state: row.state,
    district: row.district,
    city: row.city,
    village: row.village ?? undefined,
    relationship: row.relationship,
    registrationDate: row.registration_date,
    isVerified: row.is_verified,
    photoUrl: row.photo_url ?? undefined,
  };
}

export function registrationToMemberRow(registration: Registration): MemberRow {
  return {
    id: registration.id,
    community_id: registration.communityId,
    full_name: registration.fullName,
    fathers_name: registration.fathersName,
    mothers_name: registration.mothersName ?? null,
    gender: registration.gender,
    dob_or_age: registration.dobOrAge,
    mobile_number: registration.mobileNumber,
    mobile_country_code: registration.mobileCountryCode ?? '+91',
    email: registration.email ?? null,
    gotra: registration.gotra ?? null,
    education: registration.education,
    occupation: registration.occupation,
    country: registration.country,
    state: registration.state,
    district: registration.district,
    city: registration.city,
    village: registration.village ?? null,
    relationship: registration.relationship,
    registration_date: registration.registrationDate,
    is_verified: registration.isVerified,
    photo_url: registration.photoUrl ?? null,
  };
}

export function updateRowToCommunityUpdate(row: UpdateRow): CommunityUpdate {
  return {
    id: row.id,
    category: row.category,
    title: row.title,
    message: row.message,
    time: row.time_label,
    isImportant: row.is_important ?? undefined,
    imageUrl: row.image_url ?? undefined,
  };
}

export function communityUpdateToRow(update: CommunityUpdate): UpdateRow {
  return {
    id: update.id,
    category: update.category,
    title: update.title,
    message: update.message,
    time_label: update.time,
    is_important: update.isImportant ?? false,
    image_url: update.imageUrl ?? null,
  };
}

export function commentRowToDiscussionComment(row: CommentRow): DiscussionComment {
  return {
    id: row.id,
    author: row.author,
    text: row.text,
    time: row.time_label,
  };
}

export function buildForumDiscussion(
  row: DiscussionRow,
  comments: CommentRow[],
  likedDiscussionIds: Set<string>
): ForumDiscussion {
  return {
    id: row.id,
    author: row.author,
    authorRole: row.author_role,
    title: row.title,
    content: row.content,
    time: row.time_label,
    category: row.category,
    likes: row.likes_count,
    hasLiked: likedDiscussionIds.has(row.id),
    replies: comments
      .filter((comment) => comment.discussion_id === row.id)
      .map(commentRowToDiscussionComment),
  };
}
