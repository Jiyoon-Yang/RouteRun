import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const TYPE_LABELS: Record<string, string> = {
  bug: '버그 신고',
  inconvenience: '불편함',
  suggestion: '기능 건의',
};

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
  const REPORT_EMAIL_TO = Deno.env.get('REPORT_EMAIL_TO');

  if (!RESEND_API_KEY || !REPORT_EMAIL_TO) {
    console.error('[send-report-email] 환경변수 누락');
    return new Response('Server configuration error', { status: 500 });
  }

  let body: { userId?: string; type?: string; content?: string; createdAt?: string };
  try {
    body = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const { userId, type, content, createdAt } = body;
  const typeLabel = TYPE_LABELS[type ?? ''] ?? type ?? '알 수 없음';
  const date = createdAt ? new Date(createdAt).toLocaleString('ko-KR') : '-';

  const html = `
    <h2>[제보] ${typeLabel}</h2>
    <table style="border-collapse:collapse;width:100%;max-width:600px">
      <tr><td style="padding:8px;font-weight:bold;width:100px">유형</td><td style="padding:8px">${typeLabel}</td></tr>
      <tr style="background:#f7f7f7"><td style="padding:8px;font-weight:bold">제보자 ID</td><td style="padding:8px;font-family:monospace;font-size:12px">${userId ?? '-'}</td></tr>
      <tr><td style="padding:8px;font-weight:bold">접수 시각</td><td style="padding:8px">${date}</td></tr>
      <tr style="background:#f7f7f7"><td style="padding:8px;font-weight:bold;vertical-align:top">내용</td><td style="padding:8px;white-space:pre-wrap">${content ?? ''}</td></tr>
    </table>
  `;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'RunningCourse <noreply@runningcourse.app>',
      to: [REPORT_EMAIL_TO],
      subject: `[제보] ${typeLabel}`,
      html,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('[send-report-email] Resend 오류:', err);
    return new Response('Email send failed', { status: 500 });
  }

  return new Response('OK', { status: 200 });
});
