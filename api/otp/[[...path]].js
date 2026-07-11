import {
  getOtpPublicConfig,
  resendOtp,
  sendOtp,
  verifyOtp,
  verifyWidgetAccessToken,
} from '../../server/otp-handler.mjs';

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function getAction(req) {
  const segments = req.query.path;
  if (!segments) return '';
  return Array.isArray(segments) ? segments.join('/') : String(segments);
}

export default async function handler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  const action = getAction(req);

  try {
    if (req.method === 'GET' && (action === '' || action === 'config')) {
      res.status(200).json(getOtpPublicConfig());
      return;
    }

    if (req.method === 'GET' && action === 'status') {
      const config = getOtpPublicConfig();
      res.status(200).json({ live: config.live, mode: config.mode });
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).json({ success: false, message: 'Method not allowed.' });
      return;
    }

    const body = req.body ?? {};

    if (action === 'send') {
      res.status(200).json(await sendOtp(body));
      return;
    }

    if (action === 'verify-token') {
      res.status(200).json(await verifyWidgetAccessToken(body));
      return;
    }

    if (action === 'verify') {
      res.status(200).json(await verifyOtp(body));
      return;
    }

    if (action === 'resend') {
      res.status(200).json(await resendOtp(body));
      return;
    }

    res.status(404).json({ success: false, message: 'Not found.' });
  } catch (error) {
    console.error('[OTP] Vercel handler error:', error);
    res.status(500).json({ success: false, message: 'Server error. Try again.' });
  }
}
