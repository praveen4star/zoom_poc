/**
 * Initialize Zoom Video SDK client
 * Uses dynamic import to ensure it only runs on the client side
 */
export async function initializeZoomClient() {
  if (typeof window === 'undefined') {
    throw new Error('Zoom Video SDK can only be used on the client side');
  }

  const ZoomVideo = await import('@zoom/videosdk');
  // Handle both default and named exports
  const ZoomVideoModule = ZoomVideo.default || ZoomVideo;
  const client = ZoomVideoModule.createClient();
  return client;
}

/**
 * Initialize Zoom client with proper configuration
 */
export async function initZoomClient() {
  const client = await initializeZoomClient();

  try {
    await client.init('en-US', 'Global', {
      patchJsMedia: true,
    });
    return client;
  } catch (error) {
    console.error('Failed to initialize Zoom client:', error);
    throw error;
  }
}
