import { jsPDF } from 'jspdf';
import { Registration } from '../types';

const CARD_WIDTH = 640;
const CARD_HEIGHT = 400;

export function renderCommunityIdCardCanvas(member: Registration): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const gradient = ctx.createLinearGradient(0, 0, CARD_WIDTH, CARD_HEIGHT);
  gradient.addColorStop(0, '#ea580c');
  gradient.addColorStop(0.5, '#f97316');
  gradient.addColorStop(1, '#f59e0b');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.lineWidth = 8;
  ctx.strokeRect(14, 14, CARD_WIDTH - 28, CARD_HEIGHT - 28);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 16px Inter, sans-serif';
  ctx.fillText('Global Namdev Community', 40, 50);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.font = '11px Inter, sans-serif';
  ctx.fillText('Community Identity Credential', 40, 70);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.fillRect(CARD_WIDTH - 130, 32, 90, 26);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 10px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('VERIFIED', CARD_WIDTH - 85, 49);
  ctx.textAlign = 'left';

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(40, 88);
  ctx.lineTo(CARD_WIDTH - 40, 88);
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.font = '11px Inter, sans-serif';
  ctx.fillText('MEMBER NAME', CARD_WIDTH / 2, 175);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 26px Inter, sans-serif';
  const nameLines = wrapCanvasText(ctx, member.fullName, CARD_WIDTH - 120);
  nameLines.slice(0, 2).forEach((line, index) => {
    ctx.fillText(line, CARD_WIDTH / 2, 200 + index * 32);
  });

  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.font = '11px Inter, sans-serif';
  ctx.fillText('COMMUNITY ID', CARD_WIDTH / 2, 300);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 20px monospace';
  const idLines = wrapCanvasText(ctx, member.communityId, CARD_WIDTH - 80, 'bold 20px monospace');
  idLines.slice(0, 2).forEach((line, index) => {
    ctx.fillText(line, CARD_WIDTH / 2, 332 + index * 26);
  });

  return canvas;
}

function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  font = ctx.font
): string[] {
  ctx.font = font;
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';

  words.forEach((word) => {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  });

  if (current) lines.push(current);
  return lines.length ? lines : [text];
}

export function downloadIdCardPng(member: Registration): void {
  const canvas = renderCommunityIdCardCanvas(member);
  const link = document.createElement('a');
  link.download = `GNC_ID_${member.communityId}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

export function downloadIdCardPdf(member: Registration): void {
  const canvas = renderCommunityIdCardCanvas(member);
  const imgData = canvas.toDataURL('image/png');
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'px',
    format: [CARD_WIDTH, CARD_HEIGHT],
  });
  doc.addImage(imgData, 'PNG', 0, 0, CARD_WIDTH, CARD_HEIGHT);
  doc.save(`GNC_ID_${member.communityId}.pdf`);
}
