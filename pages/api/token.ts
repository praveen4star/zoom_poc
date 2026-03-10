import type { NextApiRequest, NextApiResponse } from 'next';
import { generateVideoSDKToken } from '@/lib/jwt-utils';
import { sessionStore } from '@/lib/session-store';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { sessionId, userName, userId, role: clientRole } = req.body;

    if (!sessionId || !userName || !userId) {
      return res.status(400).json({
        error: 'Missing required fields: sessionId, userName, userId',
      });
    }

    // Validate SDK credentials (separate from REST API credentials)
    if (!process.env.ZOOM_SDK_KEY || !process.env.ZOOM_SDK_SECRET) {
      return res.status(500).json({
        error:
          'ZOOM_SDK_KEY and ZOOM_SDK_SECRET must be set in environment variables',
      });
    }

    // Get session name from session store or use sessionId as fallback
    const sessionData = sessionStore.getSession(sessionId);
    const sessionName = sessionData?.sessionName || sessionId;

    // Determine user role
    // 1. Check session store first (authoritative)
    // 2. Fall back to client-provided role (needed when in-memory store is cleared by HMR)
    let role = 0; // Default to attendee

    if (sessionData) {
      // Session store has data — use it as the source of truth
      if (sessionStore.isHost(sessionId, userId)) {
        role = 1; // Host
      } else if (sessionStore.isCoHost(sessionId, userId)) {
        role = 0; // Co-host
      }
    } else if (
      typeof clientRole === 'number' &&
      (clientRole === 0 || clientRole === 1)
    ) {
      // Session store empty (e.g. HMR cleared it) — trust the client hint
      role = clientRole;
      console.warn(
        `Session ${sessionId} not found in store — using client-provided role: ${role}`
      );
    }

    // Log for debugging
    console.log('Generating Video SDK token for:', {
      sessionId,
      sessionName,
      userName,
      userId,
      role,
      sdkKey: process.env.ZOOM_SDK_KEY?.substring(0, 10) + '...',
    });

    // Generate JWT token with role
    // Note: Video SDK token uses sessionName (tpc) not sessionId
    const token = generateVideoSDKToken(sessionName, role);

    return res.status(200).json({
      token,
      role,
      sessionId,
      sessionName,
      userName,
    });
  } catch (error: unknown) {
    console.error('Error generating token:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to generate token';
    return res.status(500).json({
      error: errorMessage,
    });
  }
}
