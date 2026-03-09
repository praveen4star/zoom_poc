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
    const { sessionId, userName, userId } = req.body;

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
    let role = 0; // Default to attendee

    if (sessionStore.isHost(sessionId, userId)) {
      role = 1; // Host
    } else if (sessionStore.isCoHost(sessionId, userId)) {
      role = 0; // Co-host uses role 0 (attendee) - Zoom Video SDK doesn't have separate co-host role
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
