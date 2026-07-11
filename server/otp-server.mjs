/**
 * Standalone OTP API server for production deployments.
 * Run: node server/otp-server.mjs
 */
import http from 'node:http';
import { createOtpMiddleware } from './otp-handler.mjs';

const PORT = Number(process.env.OTP_SERVER_PORT || 8787);
const middleware = createOtpMiddleware();

const server = http.createServer((req, res) => {
  middleware(req, res, () => {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, message: 'Not found.' }));
  });
});

server.listen(PORT, () => {
  const live = Boolean(process.env.MSG91_AUTH_KEY?.trim());
  console.log(`OTP server listening on http://localhost:${PORT}`);
  console.log(live ? 'Mode: LIVE SMS via MSG91' : 'Mode: DEMO (set MSG91_AUTH_KEY for real SMS)');
});
