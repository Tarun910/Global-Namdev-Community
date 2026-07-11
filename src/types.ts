export interface Registration {
  id: string; // Internal UUID
  communityId: string; // e.g. GNC-2026-000113 (sequential)
  fullName: string;
  fathersName: string;
  mothersName?: string;
  gender: 'Male' | 'Female' | 'Other';
  dobOrAge: string;
  mobileNumber: string;
  mobileCountryCode?: string;
  email?: string;
  gotra?: string;
  education: string;
  occupation: string;
  country: string;
  state: string;
  district: string;
  city: string;
  village?: string;
  relationship: 'Self' | 'Father' | 'Mother' | 'Brother' | 'Sister' | 'Son' | 'Daughter' | 'Grandfather' | 'Grandmother' | 'Other';
  registrationDate: string; // e.g., 2026-07-10
  isVerified: boolean;
  photoUrl?: string; // base64 or URL — demo local storage
}

export interface CommunityUpdate {
  id: string;
  category: 'event' | 'announcement' | 'scholarship' | 'blood-camp' | 'meeting' | 'festival';
  title: string;
  message: string;
  time: string;
  isRead?: boolean;
  isImportant?: boolean;
  imageUrl?: string;
}

export interface DiscussionComment {
  id: string;
  author: string;
  text: string;
  time: string;
}

export interface ForumDiscussion {
  id: string;
  author: string;
  authorRole: string;
  title: string;
  content: string;
  time: string;
  category: string;
  likes: number;
  hasLiked?: boolean;
  replies: DiscussionComment[];
}

