import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession, deleteSession } from '@/lib/zoom-api';
import { sessionStore } from '@/lib/session-store';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { sessionId } = req.query;

  if (!sessionId || typeof sessionId !== 'string') {
    return res.status(400).json({ error: 'Invalid session ID' });
  }

  switch (req.method) {
    case 'GET':
      return handleGetSession(sessionId, res);
    case 'DELETE':
      return handleDeleteSession(sessionId, req, res);
    case 'POST':
      return handleCoHostAssignment(sessionId, req, res);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleGetSession(sessionId: string, res: NextApiResponse) {
  try {
    const session = await getSession(sessionId);
    const sessionData = sessionStore.getSession(sessionId);

    return res.status(200).json({
      ...session,
      creatorUserId: sessionData?.creatorUserId,
      coHosts: sessionData ? Array.from(sessionData.coHosts) : [],
    });
  } catch (error: unknown) {
    console.error('Error getting session:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to get session';
    return res.status(500).json({
      error: errorMessage,
    });
  }
}

async function handleDeleteSession(
  sessionId: string,
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Check if user is the host
    if (!sessionStore.isHost(sessionId, userId)) {
      return res.status(403).json({ error: 'Only host can delete session' });
    }

    await deleteSession(sessionId);
    sessionStore.deleteSession(sessionId);

    return res.status(200).json({ message: 'Session deleted successfully' });
  } catch (error: unknown) {
    console.error('Error deleting session:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to delete session';
    return res.status(500).json({
      error: errorMessage,
    });
  }
}

async function handleCoHostAssignment(
  sessionId: string,
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { action, targetUserId, hostUserId } = req.body;

    if (!hostUserId || !targetUserId || !action) {
      return res.status(400).json({
        error: 'Missing required fields: action, targetUserId, hostUserId',
      });
    }

    // Check if requester is the host
    if (!sessionStore.isHost(sessionId, hostUserId)) {
      return res.status(403).json({ error: 'Only host can assign co-hosts' });
    }

    if (action === 'assign') {
      const success = sessionStore.assignCoHost(
        sessionId,
        targetUserId,
        hostUserId
      );
      if (success) {
        return res
          .status(200)
          .json({ message: 'Co-host assigned successfully' });
      }
      return res.status(400).json({ error: 'Failed to assign co-host' });
    } else if (action === 'remove') {
      const success = sessionStore.removeCoHost(
        sessionId,
        targetUserId,
        hostUserId
      );
      if (success) {
        return res
          .status(200)
          .json({ message: 'Co-host removed successfully' });
      }
      return res.status(400).json({ error: 'Failed to remove co-host' });
    } else {
      return res
        .status(400)
        .json({ error: 'Invalid action. Use "assign" or "remove"' });
    }
  } catch (error: unknown) {
    console.error('Error managing co-host:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to manage co-host';
    return res.status(500).json({
      error: errorMessage,
    });
  }
}
