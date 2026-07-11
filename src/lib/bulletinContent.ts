export type BulletinBlock =
  | { type: 'heading'; text: string; level: 2 | 3 }
  | { type: 'paragraph'; text: string }
  | { type: 'bullet-list'; items: string[] }
  | { type: 'numbered-list'; items: string[] }
  | { type: 'key-values'; items: { label: string; value: string }[] };

const BULLET_RE = /^[-*•]\s+/;
const NUMBERED_RE = /^\d+[.)]\s+/;
const HEADING_RE = /^#{1,3}\s+/;
const KEY_VALUE_RE = /^([^:]{2,48}):\s*(.+)$/;

function stripBullet(line: string): string {
  return line.replace(BULLET_RE, '').replace(NUMBERED_RE, '').trim();
}

function isBulletLine(line: string): boolean {
  return BULLET_RE.test(line.trim());
}

function isNumberedLine(line: string): boolean {
  return NUMBERED_RE.test(line.trim());
}

function isKeyValueLine(line: string): boolean {
  return KEY_VALUE_RE.test(line.trim());
}

function parseKeyValue(line: string): { label: string; value: string } | null {
  const match = line.trim().match(KEY_VALUE_RE);
  if (!match) return null;
  return { label: match[1].trim(), value: match[2].trim() };
}

function parseHeadingLine(line: string): { level: 2 | 3; text: string } | null {
  const trimmed = line.trim();
  const match = trimmed.match(/^(#{1,3})\s+(.+)$/);
  if (match) {
    return { level: match[1].length >= 3 ? 3 : 2, text: match[2].trim() };
  }
  if (trimmed.length <= 64 && trimmed.endsWith(':') && !trimmed.includes('http')) {
    return { level: 3, text: trimmed.replace(/:$/, '').trim() };
  }
  return null;
}

function splitIntoSentences(text: string): string[] {
  const parts = text
    .trim()
    .match(/[^.!?]+(?:[.!?]+|$)/g)
    ?.map((part) => part.trim())
    .filter(Boolean);
  return parts && parts.length > 0 ? parts : [text.trim()];
}

function chunkSentences(sentences: string[], size: number): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < sentences.length; i += size) {
    chunks.push(sentences.slice(i, i + size).join(' '));
  }
  return chunks;
}

function classifyLineGroup(lines: string[]): BulletinBlock[] {
  const trimmedLines = lines.map((line) => line.trim()).filter(Boolean);
  if (trimmedLines.length === 0) return [];

  if (trimmedLines.every(isBulletLine)) {
    return [{ type: 'bullet-list', items: trimmedLines.map(stripBullet) }];
  }

  if (trimmedLines.every(isNumberedLine)) {
    return [{ type: 'numbered-list', items: trimmedLines.map(stripBullet) }];
  }

  if (trimmedLines.length >= 2 && trimmedLines.every(isKeyValueLine)) {
    const items = trimmedLines
      .map(parseKeyValue)
      .filter((item): item is { label: string; value: string } => Boolean(item));
    if (items.length === trimmedLines.length) {
      return [{ type: 'key-values', items }];
    }
  }

  if (trimmedLines.length === 1) {
    const heading = parseHeadingLine(trimmedLines[0]);
    if (heading) {
      return [{ type: 'heading', level: heading.level, text: heading.text }];
    }

    const text = trimmedLines[0];
    if (text.length > 220 && !text.includes('\n')) {
      const sentences = splitIntoSentences(text);
      if (sentences.length >= 3) {
        return chunkSentences(sentences, 2).map((chunk) => ({
          type: 'paragraph' as const,
          text: chunk,
        }));
      }
    }

    return [{ type: 'paragraph', text }];
  }

  return trimmedLines.map((line) => {
    const heading = parseHeadingLine(line);
    if (heading) {
      return { type: 'heading' as const, level: heading.level, text: heading.text };
    }
    return { type: 'paragraph' as const, text: line };
  });
}

/** Turn plain bulletin text into structured blocks for readable article layout. */
export function parseBulletinMessage(message: string): BulletinBlock[] {
  const normalized = message.replace(/\r\n/g, '\n').trim();
  if (!normalized) return [];

  const sections = normalized.split(/\n{2,}/);
  const blocks: BulletinBlock[] = [];

  for (const section of sections) {
    const lines = section.split('\n').map((line) => line.trimEnd());
    blocks.push(...classifyLineGroup(lines));
  }

  if (blocks.length === 0) {
    return [{ type: 'paragraph', text: normalized }];
  }

  return blocks;
}

export const URL_INLINE_RE = /((?:https?:\/\/|www\.)[^\s<]+[^\s<.,;:!?)}\]"'])/gi;

export const EMAIL_INLINE_RE = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;

export const BOLD_INLINE_RE = /\*\*(.+?)\*\*/g;
