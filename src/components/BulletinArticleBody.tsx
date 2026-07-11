import { Fragment, ReactNode } from 'react';

export type BulletinBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'bullet-list'; items: string[] }
  | { type: 'numbered-list'; items: string[] }
  | { type: 'subheading'; text: string }
  | { type: 'callout'; label: string; value: string };

const BULLET_RE = /^[-•*–—]\s+/;
const NUMBERED_RE = /^\d+[.)]\s+/;
const SUBHEADING_RE = /^#{1,3}\s+/;
const KEY_VALUE_RE = /^[^:\n]{2,48}:\s+\S/;

function isBulletLine(line: string): boolean {
  return BULLET_RE.test(line);
}

function isNumberedLine(line: string): boolean {
  return NUMBERED_RE.test(line);
}

function isSubheadingLine(line: string): boolean {
  return SUBHEADING_RE.test(line) || (line.length <= 72 && line.endsWith(':') && !line.includes('http'));
}

function isKeyValueLine(line: string): boolean {
  return KEY_VALUE_RE.test(line);
}

function stripBullet(line: string): string {
  return line.replace(BULLET_RE, '').trim();
}

function stripNumber(line: string): string {
  return line.replace(NUMBERED_RE, '').trim();
}

function stripSubheading(line: string): string {
  return line.replace(SUBHEADING_RE, '').replace(/:$/, '').trim();
}

/** Split plain bulletin text into structured blocks for article layout. */
export function parseBulletinMessage(message: string): BulletinBlock[] {
  const normalized = message.replace(/\r\n/g, '\n').trim();
  if (!normalized) return [];

  const chunks = normalized.split(/\n{2,}/);
  const blocks: BulletinBlock[] = [];

  for (const chunk of chunks) {
    const lines = chunk
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length === 0) continue;

    if (lines.every(isBulletLine)) {
      blocks.push({ type: 'bullet-list', items: lines.map(stripBullet) });
      continue;
    }

    if (lines.every(isNumberedLine)) {
      blocks.push({ type: 'numbered-list', items: lines.map(stripNumber) });
      continue;
    }

    if (lines.length === 1 && isSubheadingLine(lines[0])) {
      blocks.push({ type: 'subheading', text: stripSubheading(lines[0]) });
      continue;
    }

    if (lines.length >= 2 && lines.every(isKeyValueLine)) {
      for (const line of lines) {
        const colonIndex = line.indexOf(':');
        blocks.push({
          type: 'callout',
          label: line.slice(0, colonIndex).trim(),
          value: line.slice(colonIndex + 1).trim(),
        });
      }
      continue;
    }

    blocks.push({ type: 'paragraph', text: lines.join('\n') });
  }

  if (blocks.length === 0) {
    blocks.push({ type: 'paragraph', text: normalized });
  }

  return blocks;
}

const URL_RE = /(https?:\/\/[^\s<]+[^\s<.,;:!?'"')\]}>])/g;
const BOLD_RE = /\*\*(.+?)\*\*/g;

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let remaining = text;
  let partIndex = 0;

  while (remaining.length > 0) {
    const boldMatch = remaining.match(BOLD_RE);
    const urlMatch = remaining.match(URL_RE);

    const boldIndex = boldMatch?.index ?? Infinity;
    const urlIndex = urlMatch?.index ?? Infinity;
    const nextIndex = Math.min(boldIndex, urlIndex);

    if (nextIndex === Infinity) {
      nodes.push(remaining);
      break;
    }

    if (nextIndex > 0) {
      nodes.push(remaining.slice(0, nextIndex));
    }

    if (urlIndex <= boldIndex && urlMatch) {
      nodes.push(
        <a
          key={`${keyPrefix}-url-${partIndex++}`}
          href={urlMatch[0]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary font-semibold underline underline-offset-2 hover:text-orange-600 break-all"
        >
          {urlMatch[0]}
        </a>
      );
      remaining = remaining.slice(urlIndex + urlMatch[0].length);
      continue;
    }

    if (boldMatch) {
      nodes.push(
        <strong key={`${keyPrefix}-bold-${partIndex++}`} className="font-bold text-slate-900">
          {boldMatch[1]}
        </strong>
      );
      remaining = remaining.slice(boldIndex + boldMatch[0].length);
      continue;
    }

    break;
  }

  return nodes;
}

function renderParagraphLines(text: string, keyPrefix: string): ReactNode {
  const lines = text.split('\n');

  return lines.map((line, index) => (
    <Fragment key={`${keyPrefix}-line-${index}`}>
      {index > 0 && <br />}
      {renderInline(line, `${keyPrefix}-${index}`)}
    </Fragment>
  ));
}

interface BulletinArticleBodyProps {
  message: string;
}

export default function BulletinArticleBody({ message }: BulletinArticleBodyProps) {
  const blocks = parseBulletinMessage(message);

  return (
    <div className="bulletin-article-body space-y-6">
      {blocks.map((block, index) => {
        const key = `block-${index}`;

        if (block.type === 'subheading') {
          return (
            <h2
              key={key}
              className="font-sans text-base md:text-lg font-bold text-slate-900 pt-1 border-b border-slate-100 pb-2"
            >
              {block.text}
            </h2>
          );
        }

        if (block.type === 'callout') {
          return (
            <div
              key={key}
              className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 py-2.5 px-4 rounded-xl bg-orange-50/70 border border-orange-100/80"
            >
              <span className="font-geist text-[11px] font-bold uppercase tracking-wider text-primary shrink-0">
                {block.label}
              </span>
              <span className="text-sm text-slate-700 leading-relaxed">
                {renderInline(block.value, key)}
              </span>
            </div>
          );
        }

        if (block.type === 'bullet-list') {
          return (
            <ul key={key} className="space-y-2.5 pl-1">
              {block.items.map((item, itemIndex) => (
                <li key={`${key}-${itemIndex}`} className="flex gap-3 text-sm text-slate-700 leading-relaxed">
                  <span className="mt-2 w-1.5 h-1.5 rounded-full bg-primary shrink-0" aria-hidden />
                  <span>{renderInline(item, `${key}-${itemIndex}`)}</span>
                </li>
              ))}
            </ul>
          );
        }

        if (block.type === 'numbered-list') {
          return (
            <ol key={key} className="space-y-2.5 counter-reset-none list-none pl-1">
              {block.items.map((item, itemIndex) => (
                <li key={`${key}-${itemIndex}`} className="flex gap-3 text-sm text-slate-700 leading-relaxed">
                  <span className="font-geist text-[11px] font-bold text-primary bg-orange-50 border border-orange-100 w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    {itemIndex + 1}
                  </span>
                  <span className="flex-1 pt-0.5">{renderInline(item, `${key}-${itemIndex}`)}</span>
                </li>
              ))}
            </ol>
          );
        }

        const isLead = index === 0;

        return (
          <p
            key={key}
            className={`text-slate-700 leading-[1.8] ${
              isLead
                ? 'text-base md:text-[17px] text-slate-800'
                : 'text-sm md:text-[15px]'
            }`}
          >
            {renderParagraphLines(block.text, key)}
          </p>
        );
      })}
    </div>
  );
}
