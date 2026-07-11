export const BULLETIN_MESSAGE_PREVIEW_CHARS = 140;

export function bulletinNeedsReadMore(message: string): boolean {
  return message.trim().length > BULLETIN_MESSAGE_PREVIEW_CHARS;
}

export function bulletinPreviewText(message: string): string {
  const trimmed = message.trim();
  if (trimmed.length <= BULLETIN_MESSAGE_PREVIEW_CHARS) return trimmed;
  return `${trimmed.slice(0, BULLETIN_MESSAGE_PREVIEW_CHARS).trimEnd()}…`;
}
