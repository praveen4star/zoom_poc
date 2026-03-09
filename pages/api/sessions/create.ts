import type { NextApiRequest, NextApiResponse } from 'next';
import { createVideoSession } from '@/lib/zoom-api';
import { sessionStore } from '@/lib/session-store';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { topic, userName, userId, settings } = req.body;

    if (!topic || !userName || !userId) {
      return res.status(400).json({
        error: 'Missing required fields: topic, userName, userId',
      });
    }

    // Create session via Zoom REST API
    const session = await createVideoSession({
      topic,
      type: 1, // Instant session
      settings: settings || {
        host_video: true,
        participant_video: true,
        audio_only: false,
      },
    });

    // Store session ownership for role assignment
    sessionStore.createSession(
      session.session_id,
      userId,
      session.session_name || topic
    );

    return res.status(200).json({
      sessionId: session.session_id,
      sessionName: session.session_name || topic,
      topic: session.session_name,
      creatorUserId: userId,
      createdAt: session.created_at || new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('Error creating session:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to create session';
    return res.status(500).json({
      error: errorMessage,
    });
  }
}
