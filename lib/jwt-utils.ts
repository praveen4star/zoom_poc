import { KJUR } from 'jsrsasign';

const ZOOM_API_KEY = process.env.ZOOM_API_KEY || '';
const ZOOM_API_SECRET = process.env.ZOOM_API_SECRET || '';
const ZOOM_SDK_KEY = process.env.ZOOM_SDK_KEY || '';
const ZOOM_SDK_SECRET = process.env.ZOOM_SDK_SECRET || '';

/**
 * Generate JWT token for Zoom REST API authentication
 */
export function generateRestApiToken(): string {
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: ZOOM_API_KEY,
    exp: now + 3600, // 1 hour expiration
    aud: 'zoom',
    iat: now,
  };

  const sHeader = JSON.stringify(header);
  const sPayload = JSON.stringify(payload);

  return KJUR.jws.JWS.sign('HS256', sHeader, sPayload, ZOOM_API_SECRET);
}

/**
 * Generate JWT token for Zoom Video SDK (for joining sessions)
 * Uses ZOOM_SDK_KEY and ZOOM_SDK_SECRET (separate from REST API credentials)
 */
export function generateVideoSDKToken(
  sessionName: string, // Session topic/name (tpc in payload)
  role: number = 0 // 0 = attendee, 1 = host
): string {
  // Validate SDK credentials
  if (!ZOOM_SDK_KEY || !ZOOM_SDK_SECRET) {
    throw new Error(
      'ZOOM_SDK_KEY and ZOOM_SDK_SECRET must be set in environment variables'
    );
  }

  // Calculate timestamps (iat adjusted by -30 seconds as per Zoom docs)
  const iat = Math.floor(Date.now() / 1000) - 30;
  const exp = iat + 60 * 60 * 2; // 2 hours expiration

  const payload = {
    app_key: ZOOM_SDK_KEY,
    tpc: sessionName, // Session topic/name
    role_type: role, // 0 = attendee, 1 = host
    version: 1,
    iat: iat,
    exp: exp,
  };

  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };

  const token = KJUR.jws.JWS.sign(
    'HS256',
    JSON.stringify(header),
    JSON.stringify(payload),
    ZOOM_SDK_SECRET
  );

  // Log token for debugging (remove in production)
  if (process.env.NODE_ENV === 'development') {
    console.log(
      'Generated Video SDK JWT Token Payload:',
      JSON.stringify(payload, null, 2)
    );
  }

  return token;
}
