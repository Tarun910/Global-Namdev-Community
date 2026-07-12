import {
  isValidAdminPassword,
  isValidAdminUsername,
  isValidBulletinMessage,
  isValidBulletinTitle,
  isValidDobOrAge,
  isValidForumComment,
  isValidForumContent,
  isValidForumTitle,
  isValidVerifyQuery,
} from './formValidation';
import { isValidLocalMobile } from './demoAuth';

export function validateAdminLoginFields(username: string, password: string): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!username.trim()) {
    errors.username = 'Username is required';
  } else if (!isValidAdminUsername(username)) {
    errors.username = 'Username must be 3–32 characters (letters, numbers, . _ -)';
  }

  if (!password) {
    errors.password = 'Password is required';
  } else if (!isValidAdminPassword(password)) {
    errors.password = 'Password must be at least 6 characters';
  }

  return errors;
}

export function validateAddAdminFields(
  username: string,
  password: string,
  passwordConfirm: string
): Record<string, string> {
  const errors = validateAdminLoginFields(username, password);

  if (!passwordConfirm) {
    errors.passwordConfirm = 'Please confirm the password';
  } else if (password !== passwordConfirm) {
    errors.passwordConfirm = 'Passwords do not match';
  }

  return errors;
}

export function validateBulletinFields(title: string, message: string): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!title.trim()) {
    errors.bulletinTitle = 'Title is required';
  } else if (!isValidBulletinTitle(title)) {
    errors.bulletinTitle = 'Title must be 3–120 characters';
  }

  if (!message.trim()) {
    errors.bulletinMessage = 'Message is required';
  } else if (!isValidBulletinMessage(message)) {
    errors.bulletinMessage = 'Message must be 10–2000 characters';
  }

  return errors;
}

export function validateForumThreadFields(title: string, content: string): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!title.trim()) {
    errors.title = 'Title is required';
  } else if (!isValidForumTitle(title)) {
    errors.title = 'Title must be 5–120 characters';
  }

  if (!content.trim()) {
    errors.content = 'Content is required';
  } else if (!isValidForumContent(content)) {
    errors.content = 'Content must be 10–5000 characters';
  }

  return errors;
}

export function validateForumCommentField(text: string): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!text.trim()) {
    errors.comment = 'Comment cannot be empty';
  } else if (!isValidForumComment(text)) {
    errors.comment = 'Comment must be 2–1000 characters';
  }

  return errors;
}

export function validateVerifyQueryField(query: string): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!query.trim()) {
    errors.searchQuery = 'Enter a Community ID or mobile number';
  } else if (!isValidVerifyQuery(query)) {
    errors.searchQuery = 'Enter a valid Community ID (GNC-YYYY-XXXXXX) or mobile number';
  }

  return errors;
}

export function validateMemberPasswordFields(
  password: string,
  passwordConfirm: string,
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!password) {
    errors.password = 'Password is required';
  } else if (!isValidAdminPassword(password)) {
    errors.password = 'Password must be at least 6 characters';
  }

  if (!passwordConfirm) {
    errors.passwordConfirm = 'Please confirm your password';
  } else if (password !== passwordConfirm) {
    errors.passwordConfirm = 'Passwords do not match';
  }

  return errors;
}

export function validateMemberLoginPasswordField(password: string): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!password) {
    errors.password = 'Password is required';
  } else if (!isValidAdminPassword(password)) {
    errors.password = 'Password must be at least 6 characters';
  }

  return errors;
}

export function validateForgotPasswordFields(
  mobile: string,
  dobOrAge: string,
  fathersName: string,
  communityId: string,
  password: string,
  passwordConfirm: string,
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!isValidLocalMobile(mobile)) {
    errors.mobile = 'Enter a valid mobile number';
  }

  if (!dobOrAge.trim()) {
    errors.dobOrAge = 'Date of birth is required';
  } else if (!isValidDobOrAge(dobOrAge)) {
    errors.dobOrAge = 'Pick a valid date of birth';
  }

  if (!fathersName.trim()) {
    errors.fathersName = "Father's name is required";
  }

  if (!communityId.trim()) {
    errors.communityId = 'Member ID is required';
  }

  Object.assign(errors, validateMemberPasswordFields(password, passwordConfirm));
  return errors;
}
